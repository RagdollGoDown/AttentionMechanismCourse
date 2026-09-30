'use client';

import { ConditionToggle } from '@/components/ConditionToggle';
import { secondaryButtonClass } from '@/components/ui';
import { MISSION_TITLES, type MissionId } from '@/content/missions';
import type { Condition } from '@/lib/condition';

export function Header({ condition, onConditionChange, missions, currentIndex, onOpenLog }: {
  condition: Condition;
  onConditionChange: (c: Condition) => void;
  missions: MissionId[];
  currentIndex: number;
  onOpenLog: () => void;
}) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div>
          <h1 className="text-lg font-semibold">Attention Playground</h1>
          <ol className="mt-1 flex gap-1.5" aria-label="Progress">
            {missions.map((id, i) => (
              <li
                key={id}
                title={MISSION_TITLES[id]}
                className={`h-1.5 w-8 rounded-full ${i < currentIndex ? 'bg-indigo-300' : i === currentIndex ? 'bg-indigo-600' : 'bg-slate-200'}`}
              />
            ))}
          </ol>
        </div>
        <div className="flex items-center gap-3">
          <ConditionToggle value={condition} onChange={onConditionChange} />
          <button type="button" className={secondaryButtonClass} onClick={onOpenLog}>
            Session log
          </button>
        </div>
      </div>
    </header>
  );
}
