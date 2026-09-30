'use client';

import type { ReactNode } from 'react';
import { useGame } from '@/components/GameProvider';
import { useLogger } from '@/components/LoggerProvider';
import { buttonClass, secondaryButtonClass } from '@/components/ui';
import { BADGES, END_TEXT, TEST_PLACEHOLDER, WELCOME, WHY, type BadgeId } from '@/content/steps';
import { downloadLog } from '@/lib/download';
import type { StepProps } from '@/components/steps/types';

function Centered({ children }: { children: ReactNode }) {
  return <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 py-6 text-center sm:py-12">{children}</div>;
}

/** Floating word tiles: the lesson's cast, with "model" in the middle. */
function TileRow({ words }: { words: string[] }) {
  return (
    <div className="flex flex-wrap justify-center gap-2" aria-hidden>
      {words.map((w, i) => (
        <span
          key={i}
          className={`tile px-3 py-2 text-lg sm:text-2xl ${w === 'model' ? 'tile-focus' : ''}`}
          style={{ transform: `rotate(${((i * 37) % 7) - 3}deg)` }}
        >
          {w}
        </span>
      ))}
    </div>
  );
}

export function Welcome({ onDone }: StepProps) {
  return (
    <Centered>
      <TileRow words={['runway', 'model', 'training']} />
      <h1 className="font-display text-[clamp(2rem,6vw,3.5rem)] font-extrabold leading-[1.05] tracking-tight text-balance">{WELCOME.title}</h1>
      <div className="max-w-lg space-y-2 text-lg text-pretty text-muted">
        {WELCOME.body.map((p) => <p key={p}>{p}</p>)}
      </div>
      <button type="button" className={`${buttonClass} px-8 py-3 text-base`} onClick={onDone}>{WELCOME.cta}</button>
    </Centered>
  );
}

export function Why({ onDone }: StepProps) {
  return (
    <Centered>
      <h2 className="font-display text-4xl font-bold tracking-tight">{WHY.title}</h2>
      <div className="max-w-lg space-y-2 text-lg text-pretty">
        {WHY.body.map((p) => <p key={p}>{p}</p>)}
      </div>
      <ul className="grid w-full gap-3 sm:grid-cols-3">
        {(Object.keys(BADGES) as BadgeId[]).map((id) => (
          <li key={id} className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-card p-4">
            <span className="tile grid size-12 place-items-center text-2xl">{BADGES[id].icon}</span>
            <p className="font-display font-bold">{BADGES[id].title}</p>
            <p className="text-sm text-muted">{BADGES[id].goal}</p>
          </li>
        ))}
      </ul>
      <button type="button" className={buttonClass} onClick={onDone}>{WHY.cta}</button>
    </Centered>
  );
}

export function TestPlaceholder({ which, onDone }: StepProps & { which: 'pretest' | 'posttest' }) {
  const t = TEST_PLACEHOLDER[which];
  return (
    <Centered>
      <h2 className="font-display text-3xl font-bold">{t.title}</h2>
      <p className="max-w-md text-muted">{t.body}</p>
      <button type="button" className={buttonClass} onClick={onDone}>{t.cta}</button>
    </Centered>
  );
}

export function End() {
  const logger = useLogger();
  const { xp, level, badges } = useGame();
  return (
    <Centered>
      <h2 className="font-display text-4xl font-bold tracking-tight">{END_TEXT.title}</h2>
      <p className="text-lg text-muted">{END_TEXT.body}</p>
      <p className="font-display text-2xl font-bold">
        <span className="tabular-nums">{xp} XP</span>, level {level}
      </p>
      <ul className="flex gap-3">
        {badges.map((id) => (
          <li key={id} className="flex flex-col items-center gap-1">
            <span className="tile grid size-14 place-items-center text-2xl">{BADGES[id].icon}</span>
            <span className="text-sm font-semibold">{BADGES[id].title}</span>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap justify-center gap-3">
        <button type="button" className={buttonClass} onClick={() => downloadLog(logger)}>{END_TEXT.download}</button>
        <button type="button" className={secondaryButtonClass} onClick={() => window.location.reload()}>{END_TEXT.restart}</button>
      </div>
    </Centered>
  );
}
