'use client';

import { useId } from 'react';
import { buttonClass } from '@/components/ui';
import { EXPLANATION_MAX, EXPLANATION_MIN } from '@/lib/tutor/schema';

export function ExplanationBox({ value, onChange, onSubmit, pending, label }: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  pending: boolean;
  label: string;
}) {
  const id = useId();
  const len = value.trim().length;
  const valid = len >= EXPLANATION_MIN && len <= EXPLANATION_MAX;
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block font-medium">{label}</label>
      <textarea
        id={id}
        rows={4}
        maxLength={EXPLANATION_MAX}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="In your own words…"
        className="w-full rounded-lg border border-line bg-card p-2.5 focus:border-cobalt focus:outline-none"
      />
      <div className="flex items-center justify-between text-xs text-muted">
        <span>{len < EXPLANATION_MIN ? `At least ${EXPLANATION_MIN} characters` : `${len}/${EXPLANATION_MAX}`}</span>
        <button type="button" className={buttonClass} disabled={!valid || pending} onClick={onSubmit}>
          {pending ? 'Reading…' : 'Submit'}
        </button>
      </div>
    </div>
  );
}
