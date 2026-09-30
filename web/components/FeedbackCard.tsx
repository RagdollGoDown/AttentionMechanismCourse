import type { FeedbackResponse } from '@/lib/tutor/schema';

export type ShownFeedback = { kind: 'tutor'; feedback: FeedbackResponse } | { kind: 'expert'; text: string };

export function FeedbackCard({ shown, round }: { shown: ShownFeedback; round: number }) {
  if (shown.kind === 'expert') {
    return (
      <div className="rounded-xl border-2 border-ok/40 bg-ok/5 p-3">
        <p className="mb-1 font-display font-bold text-ok">Expert answer</p>
        <p>{shown.text}</p>
        <p className="mt-2 text-xs text-muted">Compare it with yours. Then revise if you want.</p>
      </div>
    );
  }
  const f = shown.feedback;
  return (
    <div className="space-y-1.5 rounded-xl border-2 border-cobalt/30 bg-cobalt-soft p-3">
      <div className="flex items-center justify-between">
        <p className="font-display font-bold text-cobalt">Tutor, round {round}</p>
        {f.source === 'mock' && <span className="rounded bg-card px-1.5 text-[10px] text-muted">offline tutor</span>}
      </div>
      <p><span aria-hidden className="text-ok">✓ </span><strong>What works:</strong> {f.correct}</p>
      <p><span aria-hidden className="text-miss">! </span><strong>{"What's missing:"}</strong> {f.missing}</p>
      <p><span aria-hidden className="text-cobalt">? </span><strong>Try this:</strong> {f.question}</p>
    </div>
  );
}
