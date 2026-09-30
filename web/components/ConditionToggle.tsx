'use client';

import type { Condition } from '@/lib/condition';

const OPTIONS: { id: Condition; label: string }[] = [
  { id: 'ai', label: 'AI tutor' },
  { id: 'control', label: 'Expert answer' },
];

export function ConditionToggle({ value, onChange }: { value: Condition; onChange: (c: Condition) => void }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-slate-500">Demo condition</span>
      <div className="flex rounded-lg border border-slate-300 p-0.5" role="radiogroup" aria-label="Condition">
        {OPTIONS.map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={value === o.id}
            onClick={() => onChange(o.id)}
            className={`rounded-md px-2 py-1 ${value === o.id ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
