'use client';

import { ConditionToggle } from '@/components/ConditionToggle';
import { Trophy } from '@/components/Trophy';
import { useTrophy } from '@/components/TrophyProvider';
import { secondaryButtonClass } from '@/components/ui';
import { CHAPTERS, type StepId } from '@/content/steps';
import type { Condition } from '@/lib/condition';

export function Header({ condition, onConditionChange, step, onOpenLog, debug = false }: {
  condition: Condition;
  onConditionChange: (c: Condition) => void;
  step: StepId;
  onOpenLog: () => void;
  /** The condition switch and log viewer are for the team only: participants must not change condition. */
  debug?: boolean;
}) {
  const { pieces, total, latest } = useTrophy();
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
          <div className="relative flex items-center gap-2">
            <Trophy won={pieces.length} total={total} className="size-9" />
            <span className="font-display text-sm font-bold tabular-nums">
              {pieces.length}/{total}
              <span className="sr-only"> trophy pieces</span>
            </span>
            {latest && (
              <div
                key={latest.id}
                role="status"
                className="piece-toast pointer-events-none fixed inset-x-0 top-[18vh] z-40 mx-auto flex w-[min(22rem,90vw)] flex-col items-center gap-2 rounded-3xl border-4 border-xp bg-card px-6 py-5 text-center text-ink shadow-2xl"
              >
                <Trophy won={pieces.length} total={total} className="size-24" tone="light" />
                <p className="font-display text-2xl font-bold">Trophy piece won!</p>
                <p className="text-lg font-semibold">{latest.title}</p>
                <p className="rounded-full bg-xp/25 px-3 py-0.5 text-sm font-bold tabular-nums">{pieces.length} of {total} pieces</p>
              </div>
            )}
          </div>

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
