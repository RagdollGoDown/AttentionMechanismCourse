'use client';

import type { ReactNode } from 'react';
import { Trophy } from '@/components/Trophy';
import { useTrophy } from '@/components/TrophyProvider';
import { useLogger } from '@/components/LoggerProvider';
import { buttonClass, secondaryButtonClass } from '@/components/ui';
import { END_TEXT, GOALS, TROPHY_PIECES, WELCOME, WHY } from '@/content/steps';
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
      <div className="flex w-full flex-col items-center gap-5 rounded-2xl border border-line bg-card p-5 sm:flex-row sm:text-left">
        <Trophy won={0} total={TROPHY_PIECES.length} tone="light" className="size-24 shrink-0" />
        <div>
          <p className="mb-2 font-display text-lg font-bold">By the end, you can:</p>
          <ul className="space-y-1.5">
            {GOALS.map((g) => <li key={g} className="flex gap-2"><span aria-hidden className="text-ok">✓</span>{g}</li>)}
          </ul>
        </div>
      </div>
      <button type="button" className={buttonClass} onClick={onDone}>{WHY.cta}</button>
    </Centered>
  );
}

export function End() {
  const logger = useLogger();
  const { pieces, total } = useTrophy();
  return (
    <Centered>
      <Trophy won={pieces.length} total={total} tone="light" className="size-40 drop-shadow-[0_8px_24px_rgb(255_176_32/0.45)]" />
      <h2 className="font-display text-[clamp(2rem,5vw,3rem)] font-extrabold leading-tight tracking-tight text-balance">{END_TEXT.title}</h2>
      <p className="max-w-lg text-lg text-pretty text-muted">{END_TEXT.body}</p>
      <div className="w-full max-w-md rounded-2xl border border-line bg-card p-4 text-left">
        <p className="mb-2 font-display font-bold">{END_TEXT.goalsTitle}</p>
        <ul className="space-y-1.5">
          {GOALS.map((g) => <li key={g} className="flex gap-2"><span aria-hidden className="text-ok">✓</span>{g}</li>)}
        </ul>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <button type="button" className={buttonClass} onClick={() => downloadLog(logger)}>{END_TEXT.download}</button>
        <button type="button" className={secondaryButtonClass} onClick={() => window.location.reload()}>{END_TEXT.restart}</button>
      </div>
    </Centered>
  );
}
