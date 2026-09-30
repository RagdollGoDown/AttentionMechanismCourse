'use client';

import { useState } from 'react';
import { useGame } from '@/components/GameProvider';
import { useLogger } from '@/components/LoggerProvider';
import { MeaningMap } from '@/components/MeaningMap';
import { MissionShell } from '@/components/MissionShell';
import { buttonClass, noteClass, secondaryButtonClass } from '@/components/ui';
import type { StepProps } from '@/components/steps/types';
import { QUICK_CHECK, VECTORS_TEXT, XP, quickCheckAnswer } from '@/content/steps';
import { EMBEDDINGS, MAP_WORDS } from '@/content/vectors';
import { dot } from '@/lib/attention';

/** "a × b + c × d = result", with each vector's two numbers spelled out. */
export function DotBreakdown({ a, b }: { a: string; b: string }) {
  const [x, y] = [EMBEDDINGS[a], EMBEDDINGS[b]];
  return (
    <div className="space-y-1">
      <p className="text-sm">
        <strong>{a}</strong> = ({x[0]}, {x[1]}) · <strong>{b}</strong> = ({y[0]}, {y[1]})
      </p>
      <p className="font-display text-lg tabular-nums">
        {x[0]} × {y[0]} + {x[1]} × {y[1]} = <span className="font-bold text-cobalt">{dot(x, y).toFixed(2)}</span>
      </p>
    </div>
  );
}

export function Vectors({ onDone }: StepProps) {
  const logger = useLogger();
  const { award } = useGame();
  const [selected, setSelected] = useState<string[]>([]);
  const [answer, setAnswer] = useState<number | null>(null);
  const correct = quickCheckAnswer();

  function select(word: string) {
    const adding = !selected.includes(word);
    const next = adding ? [...selected, word].slice(-2) : selected.filter((w) => w !== word);
    setSelected(next);
    if (adding && next.length === 2) {
      logger.log('map_pair_select', { a: next[0], b: next[1], dot: dot(EMBEDDINGS[next[0]], EMBEDDINGS[next[1]]) });
      award(XP.explore, 'vectors:pair');
    }
  }
  function answerCheck(i: number) {
    if (answer !== null) return;
    setAnswer(i);
    logger.log('quick_check_answer', { choice: QUICK_CHECK.pairs[i].join('–'), correct: i === correct });
    award(XP.prediction, 'vectors:check');
  }
  function skip() {
    logger.log('skip', { step: 'vectors' });
    onDone();
  }

  const panel = (
    <div className="space-y-4">
      {VECTORS_TEXT.intro.map((p) => <p key={p}>{p}</p>)}
      <div className={`${noteClass} space-y-2`}>
        <p className="font-semibold">{VECTORS_TEXT.pickPrompt}</p>
        <p className="text-sm text-muted">{VECTORS_TEXT.dotRule}</p>
        {selected.length === 2 ? <DotBreakdown a={selected[0]} b={selected[1]} /> : <p className="text-sm text-muted">Picked: {selected.join(', ') || 'none yet'}</p>}
        <p className="text-xs text-muted">{VECTORS_TEXT.caption}</p>
      </div>
      <div className="space-y-2">
        <p className="font-semibold">{QUICK_CHECK.prompt}</p>
        <div className="grid grid-cols-2 gap-2">
          {QUICK_CHECK.pairs.map((pair, i) => {
            const state = answer === null ? '' : i === correct ? 'border-ok bg-ok/10' : i === answer ? 'border-miss bg-miss/10' : 'opacity-50';
            return (
              <button key={pair.join()} type="button" disabled={answer !== null} onClick={() => answerCheck(i)} className={`${secondaryButtonClass} ${state} disabled:opacity-100`}>
                {pair[0]} – {pair[1]}
              </button>
            );
          })}
        </div>
        {answer !== null && (
          <p className={answer === correct ? 'text-ok' : 'text-miss'}>
            {answer === correct ? 'Right. ' : 'Not this one. '}
            {QUICK_CHECK.reason}
          </p>
        )}
      </div>
      {answer !== null ? (
        <>
          <p className="rounded-xl border-2 border-cobalt/30 bg-cobalt-soft p-3 font-semibold">{VECTORS_TEXT.punchline}</p>
          <button type="button" className={buttonClass} onClick={onDone}>{VECTORS_TEXT.cta}</button>
        </>
      ) : (
        <button type="button" onClick={skip} className="text-sm text-muted underline hover:text-ink">{VECTORS_TEXT.skip}</button>
      )}
    </div>
  );

  return <MissionShell title={VECTORS_TEXT.title} panel={panel} stage={<MeaningMap words={MAP_WORDS} selected={selected} onSelect={select} />} />;
}
