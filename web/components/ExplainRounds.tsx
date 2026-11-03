'use client';

import { useId, useState } from 'react';
import { ExplanationBox } from '@/components/ExplanationBox';
import { FeedbackCard, type ShownFeedback } from '@/components/FeedbackCard';
import { useLogger } from '@/components/LoggerProvider';
import { useSaved } from '@/components/SavedAnswers';
import { buttonClass } from '@/components/ui';
import type { ExplainTask } from '@/content/missions';
import type { Condition } from '@/lib/condition';
import { EXPLANATION_MIN, PART_MAX, type FeedbackResponse, type Mode } from '@/lib/tutor/schema';

const MAX_ROUNDS = 2;
const PART_MIN = 3;

interface Round {
  explanation: string;
  /** Formula task: the answer per box. */
  parts?: Record<string, string>;
  shown: ShownFeedback;
}

/** One labelled box per formula part. */
function PartBoxes({ task, values, onChange }: { task: ExplainTask; values: Record<string, string>; onChange: (v: Record<string, string>) => void }) {
  const id = useId();
  return (
    <div className="space-y-3">
      {task.parts!.map((p) => (
        <div key={p.id} className="flex gap-3">
          <span className="tile grid h-10 min-w-14 shrink-0 place-items-center px-2 text-base">{p.label}</span>
          <div className="flex-1 space-y-1">
            <label htmlFor={`${id}-${p.id}`} className="block text-sm font-semibold">{p.prompt}</label>
            <textarea
              id={`${id}-${p.id}`}
              rows={2}
              maxLength={PART_MAX}
              value={values[p.id] ?? ''}
              onChange={(e) => onChange({ ...values, [p.id]: e.target.value })}
              className="w-full rounded-lg border border-line bg-card p-2 text-sm focus:border-cobalt focus:outline-none"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Write → feedback → optional revision. The only part that differs between conditions:
 * - control: the fixed expert answer after the first attempt;
 * - AI: the tutor's adaptive feedback only, never the expert answer. Round 1 gets a formative reply
 *   (a question back to the playground). The last reply is a closing one that states the remaining idea:
 *   on the revision, or, when the learner skips it, on request ("I'm done").
 * With `maxRounds={1}` there is no revision: one reply (AI: closing, control: the expert answer), then on.
 * Once the learner moves on, the answers lock: going back (or redoing the experiment) shows them read-only.
 */
export function ExplainRounds({ task, condition, onDone, doneLabel = 'Continue', maxRounds = MAX_ROUNDS, prediction }: {
  task: ExplainTask;
  condition: Condition;
  onDone: () => void;
  doneLabel?: string;
  maxRounds?: 1 | 2;
  /** What the learner predicted, for the tutor (two contexts). */
  prediction?: string;
}) {
  const logger = useLogger();
  const [draft, setDraft] = useState('');
  const [partDrafts, setPartDrafts] = useState<Record<string, string>>({});
  const [rounds, setRounds] = useSaved<Round[]>('rounds', []);
  const [closed, setClosed] = useSaved('closed', false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** AI condition, learner skipped the revision: the closing reply on their round-1 explanation. */
  const [closing, setClosing] = useSaved<FeedbackResponse | null>('closing', null);

  const parts = task.parts
    ? Object.fromEntries(task.parts.map((p) => [p.id, (partDrafts[p.id] ?? '').trim()]))
    : undefined;
  const explanation = task.parts
    ? task.parts.map((p) => `${p.label}: ${parts![p.id]}`).join('\n')
    : draft.trim();
  const partsReady = !task.parts || task.parts.every((p) => parts![p.id].length >= PART_MIN);

  async function submit() {
    const round = rounds.length + 1;
    logger.log('explanation_submit', { round, text: explanation, ...(parts ? { parts } : {}) });

    if (condition === 'control') {
      // The expert answer is the same whatever was written: show it once, keep it visible above the revision.
      const first = rounds.length === 0;
      setRounds([...rounds, { explanation, shown: first ? { kind: 'expert', text: task.expertAnswer } : { kind: 'saved' } }]);
      logger.log('feedback_received', { round, source: first ? 'expert' : 'none' });
      return;
    }

    const feedback = await askTutor(explanation, round, round === maxRounds ? 'closing' : 'formative', parts);
    if (feedback) setRounds([...rounds, { explanation, parts, shown: { kind: 'tutor', feedback } }]);
  }

  /** AI condition: one tutor call. Null (and an error message) when it failed. */
  async function askTutor(text: string, round: number, mode: Mode, partsSent?: Record<string, string>): Promise<FeedbackResponse | null> {
    setPending(true);
    setError(null);
    try {
      const prev = rounds.at(-1);
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          missionId: task.id,
          explanation: text,
          round,
          mode,
          parts: partsSent,
          prediction,
          previous: prev && prev.shown.kind === 'tutor' ? { explanation: prev.explanation, feedback: prev.shown.feedback } : undefined,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const feedback = (await res.json()) as FeedbackResponse;
      logger.log('feedback_received', { round, ...feedback });
      return feedback;
    } catch (err) {
      setError('The tutor did not answer. Try again.');
      logger.log('feedback_received', { round, mode, source: 'error', error: String(err) });
      return null;
    } finally {
      setPending(false);
    }
  }

  /** AI condition, after round 1: the learner skips the revision and gets the closing reply instead. */
  async function skipRevision() {
    const last = rounds.at(-1)!;
    logger.log('revision_skipped', { round: rounds.length });
    const feedback = await askTutor(last.explanation, rounds.length, 'closing', last.parts);
    if (feedback) setClosing(feedback);
  }

  // AI condition: the task ends with a closing reply (on the revision, or requested by skipping it).
  const lastShown = rounds.at(-1)?.shown;
  const aiFinished = closing !== null || (lastShown?.kind === 'tutor' && lastShown.feedback.mode === 'closing');
  const canWrite = !closed && rounds.length < maxRounds && !aiFinished;
  const mustClose = condition === 'ai' && !aiFinished && !closed;
  function done() {
    setClosed(true);
    onDone();
  }
  return (
    <div className="space-y-4">
      <p className="font-display text-lg font-semibold leading-snug">{task.explainPrompt}</p>
      {rounds.map((r, i) => (
        <div key={i} className="space-y-2">
          <blockquote className="whitespace-pre-line border-l-4 border-line pl-3 italic text-muted">{r.explanation}</blockquote>
          <FeedbackCard shown={r.shown} round={i + 1} />
        </div>
      ))}
      {canWrite && rounds.length > 0 && task.parts && <p className="font-semibold">Revise it (optional)</p>}
      {canWrite && (task.parts ? (
        <>
          <PartBoxes task={task} values={partDrafts} onChange={setPartDrafts} />
          <div className="flex justify-end">
            <button
              type="button"
              className={buttonClass}
              disabled={!partsReady || explanation.length < EXPLANATION_MIN || pending}
              onClick={submit}
            >
              {pending ? 'Reading…' : 'Submit'}
            </button>
          </div>
        </>
      ) : (
        <ExplanationBox value={draft} onChange={setDraft} onSubmit={submit} pending={pending} label={rounds.length === 0 ? 'Your explanation' : 'Revise it (optional)'} />
      ))}
      {closing && <FeedbackCard shown={{ kind: 'tutor', feedback: closing }} round={rounds.length} />}
      {error && <p className="text-miss">{error}</p>}
      {rounds.length > 0 && (mustClose
        ? <button type="button" className={buttonClass} disabled={pending} onClick={skipRevision}>{pending ? 'Reading…' : "I'm done"}</button>
        : <button type="button" className={buttonClass} onClick={done}>{doneLabel}</button>)}
      {/* If the tutor keeps failing, the learner must still be able to move on. */}
      {mustClose && error && <button type="button" className={buttonClass} onClick={done}>{doneLabel}</button>}
    </div>
  );
}
