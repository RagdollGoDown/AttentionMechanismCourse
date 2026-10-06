'use client';

import { useId, useState } from 'react';
import { ExplanationBox } from '@/components/ExplanationBox';
import { FeedbackCard, type ShownFeedback } from '@/components/FeedbackCard';
import { useLogger } from '@/components/LoggerProvider';
import { useSaved } from '@/components/SavedAnswers';
import { buttonClass } from '@/components/ui';
import type { ExplainTask } from '@/content/missions';
import type { Condition } from '@/lib/condition';
import { EXPLANATION_MIN, PART_MAX, type FeedbackResponse } from '@/lib/tutor/schema';

const MAX_ROUNDS = 2;
const PART_MIN = 3;

interface Round {
  explanation: string;
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
 * the AI tutor's adaptive feedback, or the fixed expert answer.
 * Once the learner moves on, the answers lock: going back (or redoing the experiment) shows them read-only.
 */
export function ExplainRounds({ task, condition, onDone, doneLabel = 'Continue' }: {
  task: ExplainTask;
  condition: Condition;
  onDone: () => void;
  doneLabel?: string;
}) {
  const logger = useLogger();
  const [draft, setDraft] = useState('');
  const [partDrafts, setPartDrafts] = useState<Record<string, string>>({});
  const [rounds, setRounds] = useSaved<Round[]>('rounds', []);
  const [closed, setClosed] = useSaved('closed', false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setRounds([...rounds, { explanation, shown: { kind: 'expert', text: task.expertAnswer } }]);
      logger.log('feedback_received', { round, source: 'expert' });
      return;
    }

    setPending(true);
    setError(null);
    try {
      const prev = rounds.at(-1);
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          missionId: task.id,
          explanation,
          round,
          parts,
          previous: prev && prev.shown.kind === 'tutor' ? { explanation: prev.explanation, feedback: prev.shown.feedback } : undefined,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const feedback = (await res.json()) as FeedbackResponse;
      setRounds([...rounds, { explanation, shown: { kind: 'tutor', feedback } }]);
      logger.log('feedback_received', { round, ...feedback });
    } catch (err) {
      setError('The tutor did not answer. Try again.');
      logger.log('feedback_received', { round, source: 'error', error: String(err) });
    } finally {
      setPending(false);
    }
  }

  const canWrite = !closed && rounds.length < MAX_ROUNDS;
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
      {error && <p className="text-miss">{error}</p>}
      {rounds.length > 0 && <button type="button" className={buttonClass} onClick={done}>{doneLabel}</button>}
    </div>
  );
}
