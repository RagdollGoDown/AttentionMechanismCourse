'use client';

import { useState } from 'react';
import { useLogger } from '@/components/LoggerProvider';
import { buttonClass, secondaryButtonClass } from '@/components/ui';
import type { StepProps } from '@/components/steps/types';
import { HOOK } from '@/content/steps';
import { displayWord } from '@/lib/tiles';

/** "What does model mean?" alone, then inside each sentence. */
export function Hook({ onDone }: StepProps) {
  const logger = useLogger();
  const [answers, setAnswers] = useState<string[]>([]);
  const round = answers.length;
  const finished = round >= HOOK.rounds.length;
  const context = HOOK.rounds[Math.min(round, HOOK.rounds.length - 1)];

  function answer(option: string) {
    logger.log('hook_answer', { round: round + 1, context: context?.join(' ') ?? 'model', answer: option });
    setAnswers([...answers, option]);
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-8 py-6 text-center sm:py-10">
      <ol className="flex gap-2" aria-label="Rounds">
        {HOOK.rounds.map((_, i) => (
          <li key={i} className={`h-2 w-10 rounded-full ${i < round ? 'bg-cobalt' : i === round ? 'bg-cobalt/40' : 'bg-line'}`} />
        ))}
      </ol>

      {!finished ? (
        <>
          <div className="flex min-h-24 flex-wrap items-center justify-center gap-2" key={round}>
            {(context ?? ['model']).map((w, i) => (
              <span key={i} className={`tile px-3 py-2 text-[clamp(1rem,3.5vw,1.6rem)] ${w === 'model' ? 'tile-focus' : ''}`}>
                {context ? displayWord(w, i) : w}
              </span>
            ))}
          </div>
          <h2 className="font-display text-3xl font-bold tracking-tight">{HOOK.question}</h2>
          <div className="grid w-full gap-2 sm:grid-cols-2">
            {HOOK.options.map((o) => (
              <button key={o} type="button" className={`${secondaryButtonClass} justify-start py-3 text-left text-base`} onClick={() => answer(o)}>
                {o}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <ul className="w-full space-y-2 text-left">
            {HOOK.rounds.map((ctx, i) => (
              <li key={i} className="flex flex-wrap items-baseline justify-between gap-2 rounded-xl border border-line bg-card px-4 py-3">
                <span className="font-display font-semibold">{ctx ? `"${displayWord(ctx.join(' '), 0)}"` : '"model"'}</span>
                <span className="text-muted">{answers[i]}</span>
              </li>
            ))}
          </ul>
          <div className="space-y-1 text-lg">
            {HOOK.outro.map((p) => <p key={p}>{p}</p>)}
          </div>
          <button type="button" className={buttonClass} onClick={onDone}>{HOOK.cta}</button>
        </>
      )}
    </div>
  );
}
