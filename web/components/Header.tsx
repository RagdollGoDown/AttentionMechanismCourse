'use client';

import { ConditionToggle } from '@/components/ConditionToggle';
import { useGame } from '@/components/GameProvider';
import { secondaryButtonClass } from '@/components/ui';
import { BADGES, CHAPTERS, XP_PER_LEVEL, type BadgeId, type StepId } from '@/content/steps';
import type { Condition } from '@/lib/condition';

export function Header({ condition, onConditionChange, step, onOpenLog }: {
  condition: Condition;
  onConditionChange: (c: Condition) => void;
  step: StepId;
  onOpenLog: () => void;
}) {
  const { xp, level, levelXp, badges, toast } = useGame();
  const current = CHAPTERS.findIndex((c) => c.steps.includes(step));
  return (
    <header className="z-10 bg-ink text-white shadow-md sm:sticky sm:top-0">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5">
        <p className="font-display text-lg font-bold tracking-tight">
          Attention <span className="tile inline-block px-1.5 py-0.5 text-base">Lab</span>
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
          <div className="hidden gap-1 sm:flex" aria-label="Badges">
            {(Object.keys(BADGES) as BadgeId[]).map((id) => {
              const earned = badges.includes(id);
              return (
                <span
                  key={id}
                  title={`${BADGES[id].title}: ${BADGES[id].goal}${earned ? '' : ' (not earned yet)'}`}
                  className={`grid size-7 place-items-center rounded-md text-sm ${earned ? 'tile' : 'border border-white/25 text-white/30'}`}
                >
                  {BADGES[id].icon}
                </span>
              );
            })}
          </div>

          <div className="relative w-32 sm:w-40">
            <div className="flex items-baseline justify-between text-xs">
              <span className="font-display font-bold">Level {level}</span>
              <span className="tabular-nums text-white/70">{xp} XP</span>
            </div>
            <div
              className="mt-1 h-2 overflow-hidden rounded-full bg-white/15"
              role="progressbar"
              aria-label="XP to next level"
              aria-valuemin={0}
              aria-valuemax={XP_PER_LEVEL}
              aria-valuenow={levelXp}
            >
              <div className="h-full rounded-full bg-xp transition-[width] duration-700 ease-out" style={{ width: `${(levelXp / XP_PER_LEVEL) * 100}%` }} />
            </div>
            {toast && (
              <span key={toast.id} className="xp-toast pointer-events-none absolute -bottom-6 right-0 font-display text-sm font-bold text-xp" aria-live="polite">
                +{toast.amount} XP
              </span>
            )}
          </div>

          <details className="relative">
            <summary className="cursor-pointer list-none rounded-md px-2 py-1 text-xs text-white/70 hover:bg-white/10">Demo</summary>
            <div className="absolute right-0 mt-2 w-64 space-y-3 rounded-xl border border-line bg-card p-3 text-ink shadow-xl">
              <ConditionToggle value={condition} onChange={onConditionChange} />
              <button type="button" className={`${secondaryButtonClass} w-full`} onClick={onOpenLog}>Session log</button>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
