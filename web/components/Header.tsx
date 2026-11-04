'use client';

import { ConditionToggle } from '@/components/ConditionToggle';
import { useGifts } from '@/components/GiftProvider';
import { secondaryButtonClass } from '@/components/ui';
import { CHAPTERS, type StepId } from '@/content/steps';
import type { Condition } from '@/lib/condition';

/** A paw print: the gift counter's icon. */
function Paw() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 text-tile" fill="currentColor" aria-hidden>
      <ellipse cx="12" cy="16" rx="5" ry="4.2" /><circle cx="5.5" cy="10.5" r="2.2" /><circle cx="9.5" cy="6.5" r="2.2" /><circle cx="14.5" cy="6.5" r="2.2" /><circle cx="18.5" cy="10.5" r="2.2" />
    </svg>
  );
}

export function Header({ condition, onConditionChange, step, onOpenLog, debug = false }: {
  condition: Condition;
  onConditionChange: (c: Condition) => void;
  step: StepId;
  onOpenLog: () => void;
  /** The condition switch and log viewer are for the team only: participants must not change condition. */
  debug?: boolean;
}) {
  const { gifts, total } = useGifts();
  const current = CHAPTERS.findIndex((c) => c.steps.includes(step));
  return (
    <header className="relative z-10 bg-ink text-white shadow-md sm:sticky sm:top-0">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5">
        <p className="font-display text-lg font-bold tracking-tight">
          Attention <span className="tile inline-block px-1.5 py-0.5 text-base">Seekers</span>
        </p>

        <ol className="order-3 flex w-full gap-1 overflow-x-auto sm:order-none sm:w-auto" aria-label="Chapters">
          {CHAPTERS.map((c, i) => (
            <li
              key={c.title}
              aria-current={i === current ? 'step' : undefined}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${
                i === current ? 'bg-white font-semibold text-ink' : i < current ? 'text-tile' : 'text-white/50'
              }`}
            >
              <span aria-hidden>{i < current ? '✓' : i + 1}</span>
              {c.title}
            </li>
          ))}
        </ol>

        <div className="ml-auto flex items-center gap-3">
          <p className="flex items-center gap-1.5 font-display text-sm font-bold tabular-nums" title="Gifts for Byte">
            <Paw />
            {gifts.length}/{total}
            <span className="sr-only"> gifts for Byte</span>
          </p>

          {debug && <details className="relative">
            <summary className="cursor-pointer list-none rounded-md px-2 py-1 text-xs text-white/70 hover:bg-white/10">Demo</summary>
            <div className="absolute right-0 mt-2 w-64 space-y-3 rounded-xl border border-line bg-card p-3 text-ink shadow-xl">
              <ConditionToggle value={condition} onChange={onConditionChange} />
              <button type="button" className={`${secondaryButtonClass} w-full`} onClick={onOpenLog}>Session log</button>
            </div>
          </details>}
        </div>
      </div>
    </header>
  );
}
