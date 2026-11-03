import { useLogger } from '@/components/LoggerProvider';
import type { FeedbackResponse } from '@/lib/tutor/schema';

export type ShownFeedback =
  | { kind: 'tutor'; feedback: FeedbackResponse }
  /** Control condition only. */
  | { kind: 'expert'; text: string }
  /** Control revision: the expert answer is already shown above, so nothing new to show. */
  | { kind: 'saved' };

export function FeedbackCard({ shown, round }: { shown: ShownFeedback; round: number }) {
  if (shown.kind === 'saved') {
    return <p className="text-sm font-semibold text-ok">✓ Revision saved.</p>;
  }
  if (shown.kind === 'expert') {
    return (
      <div className="rounded-xl border-2 border-ok/40 bg-ok/5 p-3">
        <p className="mb-1 font-display font-bold text-ok">Expert answer</p>
        <p className="whitespace-pre-line">{shown.text}</p>
        <p className="mt-2 text-xs text-muted">Compare it with yours. If yours misses something, rewrite it in your own words.</p>
      </div>
    );
  }
  return <TutorCard feedback={shown.feedback} round={round} />;
}

function TutorCard({ feedback: f, round }: { feedback: FeedbackResponse; round: number }) {
  // Only the team sees which tutor answered; for participants both look the same.
  const { debug } = useLogger();
  // The closing reply is the last one: no question, the remaining idea is stated plainly.
  const closing = f.mode === 'closing';
  return (
    <div className="space-y-1.5 rounded-xl border-2 border-cobalt/30 bg-cobalt-soft p-3">
      <div className="flex items-center justify-between">
        <p className="font-display font-bold text-cobalt">{closing ? 'Tutor, final feedback' : `Tutor, round ${round}`}</p>
        {debug && f.source === 'mock' && <span className="rounded bg-card px-1.5 text-[10px] text-muted">offline tutor</span>}
      </div>
      <p><span aria-hidden className="text-ok">✓ </span><strong>What works:</strong> {f.correct}</p>
      <p><span aria-hidden className="text-miss">! </span><strong>{closing ? 'Keep in mind:' : "What's missing:"}</strong> {f.missing}</p>
      {!closing && f.question && <p><span aria-hidden className="text-cobalt">? </span><strong>Try this:</strong> {f.question}</p>}
    </div>
  );
}
