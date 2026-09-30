'use client';

import { buttonClass } from '@/components/ui';
import { EXPLANATION_MAX, EXPLANATION_MIN } from '@/lib/tutor/schema';

export function ExplanationBox({ value, onChange, onSubmit, pending, label }: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  pending: boolean;
  label: string;
}) {
  const len = value.trim().length;
  const valid = len >= EXPLANATION_MIN && len <= EXPLANATION_MAX;
  return (
    <div className="space-y-2">
      <label htmlFor="explanation" className="block font-medium">{label}</label>
      <textarea
        id="explanation"
        rows={4}
        maxLength={EXPLANATION_MAX}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="In your own words…"
        className="w-full rounded-lg border border-slate-300 p-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
      />
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{len < EXPLANATION_MIN ? `At least ${EXPLANATION_MIN} characters` : `${len}/${EXPLANATION_MAX}`}</span>
        <button type="button" className={buttonClass} disabled={!valid || pending} onClick={onSubmit}>
          {pending ? 'Thinking…' : 'Submit'}
        </button>
      </div>
    </div>
  );
}
