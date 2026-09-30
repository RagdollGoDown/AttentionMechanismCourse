'use client';

import { useState } from 'react';
import { useGame } from '@/components/GameProvider';
import { useLogger } from '@/components/LoggerProvider';
import { MissionShell } from '@/components/MissionShell';
import { Playground } from '@/components/Playground';
import { buttonClass, noteClass, secondaryButtonClass } from '@/components/ui';
import type { StepProps } from '@/components/steps/types';
import { FOCUS, SENTENCE_A } from '@/content/sentences';
import { LAB_TITLES, SOFTMAX_TEXT, XP, softmaxCheckAnswer } from '@/content/steps';
import { softmax } from '@/lib/attention';
import { toTiles, weightsFor } from '@/lib/tiles';

const TILES = toTiles(SENTENCE_A);
const FOCUS_KEY = String(SENTENCE_A.indexOf(FOCUS));
const PLAIN = softmax(weightsFor(TILES, FOCUS_KEY).scores);

export function Softmax({ onDone }: StepProps) {
  const logger = useLogger();
  const { award, earnBadge } = useGame();
  const [answer, setAnswer] = useState<number | null>(null);
  const correct = softmaxCheckAnswer();

  function pick(option: number) {
    if (answer !== null) return;
    setAnswer(option);
    logger.log('check_answer', { check: 'softmax_3_words', choice: option, correct: option === correct });
    award(XP.prediction, 'softmax:check');
    earnBadge('calculator');
  }

  const panel = (
    <div className="space-y-4">
      <p>{SOFTMAX_TEXT.intro}</p>
      <ul className="space-y-1">
        {SOFTMAX_TEXT.why.map((p) => <li key={p} className="flex gap-2"><span aria-hidden className="text-ok">✓</span>{p}</li>)}
      </ul>
      <p className={noteClass}>{SOFTMAX_TEXT.gap}</p>

      <div className="space-y-2 rounded-xl border-2 border-xp/60 p-3">
        <p className="font-semibold">{SOFTMAX_TEXT.checkPrompt}</p>
        <p className="font-display text-sm tabular-nums text-muted">{SOFTMAX_TEXT.hint}</p>
        <div className="grid grid-cols-4 gap-2">
          {SOFTMAX_TEXT.options.map((o) => {
            const state = answer === null ? '' : o === correct ? 'border-ok bg-ok/10' : o === answer ? 'border-miss bg-miss/10' : 'opacity-50';
            return (
              <button key={o} type="button" disabled={answer !== null} onClick={() => pick(o)} className={`${secondaryButtonClass} ${state} disabled:opacity-100`}>
                {o} %
              </button>
            );
          })}
        </div>
        {answer !== null && <p className="font-display tabular-nums">{SOFTMAX_TEXT.solution}</p>}
      </div>
      {answer !== null && <button type="button" className={buttonClass} onClick={onDone}>Finish the lab</button>}
    </div>
  );

  const stage = (
    <div className="flex w-full flex-col gap-8">
      <p className="text-sm font-semibold text-muted">{SOFTMAX_TEXT.compare}</p>
      <div className="space-y-2">
        <p className="text-sm font-semibold">eˢ ÷ sum, on the match scores</p>
        <Playground tiles={TILES} focusKey={FOCUS_KEY} showWeights weights={PLAIN} />
      </div>
      <div className="space-y-2">
        <p className="text-sm font-semibold">The real bars</p>
        <Playground tiles={TILES} focusKey={FOCUS_KEY} showWeights showScores={false} />
      </div>
    </div>
  );

  return <MissionShell title={LAB_TITLES.softmax} panel={panel} stage={stage} />;
}
