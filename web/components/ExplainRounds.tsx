'use client';

import { useState } from 'react';
import { ExplanationBox } from '@/components/ExplanationBox';
import { FeedbackCard, type ShownFeedback } from '@/components/FeedbackCard';
import { useGame } from '@/components/GameProvider';
import { useLogger } from '@/components/LoggerProvider';
import { buttonClass } from '@/components/ui';
import type { ExplainTask } from '@/content/missions';
import { XP } from '@/content/steps';
import type { Condition } from '@/lib/condition';
import type { FeedbackResponse } from '@/lib/tutor/schema';

const MAX_ROUNDS = 2;

interface Round {
  explanation: string;
  shown: ShownFeedback;
}

/**
 * Write → feedback → optional revision. The only part that differs between conditions:
 * the AI tutor's adaptive feedback, or the fixed expert answer.
 */
export function ExplainRounds({ task, condition, onDone, doneLabel = 'Continue' }: {
  task: ExplainTask;
  condition: Condition;
  onDone: () => void;
  doneLabel?: string;
}) {
  const logger = useLogger();
  const { award } = useGame();
  const [draft, setDraft] = useState('');
  const [rounds, setRounds] = useState<Round[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const explanation = draft.trim();
    const round = rounds.length + 1;
    logger.log('explanation_submit', { round, text: explanation });

    if (condition === 'control') {
      setRounds([...rounds, { explanation, shown: { kind: 'expert', text: task.expertAnswer } }]);
      logger.log('feedback_received', { round, source: 'expert' });
      award(round === 1 ? XP.explanation : XP.revision, `${task.id}:explain:${round}`);
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
          previous: prev && prev.shown.kind === 'tutor' ? { explanation: prev.explanation, feedback: prev.shown.feedback } : undefined,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const feedback = (await res.json()) as FeedbackResponse;
      setRounds([...rounds, { explanation, shown: { kind: 'tutor', feedback } }]);
      logger.log('feedback_received', { round, ...feedback });
      award(round === 1 ? XP.explanation : XP.revision, `${task.id}:explain:${round}`);
    } catch (err) {
      setError('The tutor did not answer. Try again.');
      logger.log('feedback_received', { round, source: 'error', error: String(err) });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="font-display text-lg font-semibold leading-snug">{task.explainPrompt}</p>
      {rounds.map((r, i) => (
        <div key={i} className="space-y-2">
          <blockquote className="border-l-4 border-line pl-3 italic text-muted">{r.explanation}</blockquote>
          <FeedbackCard shown={r.shown} round={i + 1} />
        </div>
      ))}
      {rounds.length < MAX_ROUNDS && (
        <ExplanationBox
          value={draft}
          onChange={setDraft}
          onSubmit={submit}
          pending={pending}
          label={rounds.length === 0 ? 'Your explanation' : `Revise it (optional, +${XP.revision} XP)`}
        />
      )}
      {error && <p className="text-miss">{error}</p>}
      {rounds.length > 0 && <button type="button" className={buttonClass} onClick={onDone}>{doneLabel}</button>}
    </div>
  );
}
