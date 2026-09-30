import type { FeedbackResponse } from '@/lib/tutor/schema';

export type ShownFeedback = { kind: 'tutor'; feedback: FeedbackResponse } | { kind: 'expert'; text: string };

export function FeedbackCard({ shown, round }: { shown: ShownFeedback; round: number }) {
  if (shown.kind === 'expert') {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
        <p className="mb-1 font-semibold text-emerald-800">Expert explanation</p>
        <p>{shown.text}</p>
        <p className="mt-2 text-xs text-emerald-800">Compare it with yours, then revise if you want.</p>
      </div>
    );
  }
  const f = shown.feedback;
  return (
    <div className="space-y-1.5 rounded-lg border border-indigo-200 bg-indigo-50 p-3">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-indigo-800">Tutor · round {round}</p>
        {f.source === 'mock' && <span className="rounded bg-slate-200 px-1.5 text-[10px] uppercase text-slate-600">offline tutor</span>}
      </div>
      <p><span aria-hidden>✓ </span><strong>What works:</strong> {f.correct}</p>
      <p><span aria-hidden>→ </span><strong>What’s missing:</strong> {f.missing}</p>
      <p><span aria-hidden>? </span><strong>Try this:</strong> {f.question}</p>
    </div>
  );
}
