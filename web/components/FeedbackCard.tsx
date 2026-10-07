import { useLogger } from '@/components/LoggerProvider';
import type { FeedbackResponse } from '@/lib/tutor/schema';

export type ShownFeedback =
  | { kind: 'tutor'; feedback: FeedbackResponse }
  /** `final`: shown after the last round (AI condition), so there is nothing left to revise. */
  | { kind: 'expert'; text: string; final?: boolean };

export function FeedbackCard({ shown, round }: { shown: ShownFeedback; round: number }) {
  if (shown.kind === 'expert') {
    return (
      <div className="rounded-xl border-2 border-ok/40 bg-ok/5 p-3">
        <p className="mb-1 font-display font-bold text-ok">Expert answer</p>
        <p className="whitespace-pre-line">{shown.text}</p>
        <p className="mt-2 text-xs text-muted">{shown.final ? 'Compare it with yours.' : 'Compare it with yours. Then revise if you want.'}</p>
      </div>
    );
  }
  return <TutorCard feedback={shown.feedback} round={round} />;
}

function TutorCard({ feedback: f, round }: { feedback: FeedbackResponse; round: number }) {
  // Only the team sees which tutor answered; for participants both look the same.
  const { debug } = useLogger();
  return (
    <div className="space-y-1.5 rounded-xl border-2 border-cobalt/30 bg-cobalt-soft p-3">
      <div className="flex items-center justify-between">
        <p className="font-display font-bold text-cobalt">Tutor, round {round}</p>
        {debug && f.source === 'mock' && <span className="rounded bg-card px-1.5 text-[10px] text-muted">offline tutor</span>}
      </div>
      <p><span aria-hidden className="text-ok">✓ </span><strong>What works:</strong> {f.correct}</p>
      <p><span aria-hidden className="text-miss">! </span><strong>{"What's missing:"}</strong> {f.missing}</p>
      <p><span aria-hidden className="text-cobalt">? </span><strong>Try this:</strong> {f.question}</p>
    </div>
  );
}
