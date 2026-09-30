'use client';

import { useState } from 'react';
import { useLogger } from '@/components/LoggerProvider';
import { MeaningMap } from '@/components/MeaningMap';
import { MissionShell } from '@/components/MissionShell';
import { buttonClass, secondaryButtonClass } from '@/components/ui';
import type { MissionViewProps } from '@/components/missions/types';
import { EMBEDDINGS_TEXT, MISSION_TITLES, QUICK_CHECK, quickCheckAnswer } from '@/content/missions';
import { EMBEDDINGS } from '@/content/vectors';
import { dot } from '@/lib/attention';

export function Mission0Embeddings({ step, onDone }: MissionViewProps) {
  const logger = useLogger();
  const [selected, setSelected] = useState<string[]>([]);
  const [answer, setAnswer] = useState<number | null>(null);
  const correct = quickCheckAnswer();

  function select(word: string) {
    const adding = !selected.includes(word);
    const next = adding ? [...selected, word].slice(-2) : selected.filter((w) => w !== word);
    setSelected(next);
    if (adding && next.length === 2) {
      logger.log('map_pair_select', { a: next[0], b: next[1], similarity: dot(EMBEDDINGS[next[0]], EMBEDDINGS[next[1]]) });
    }
  }
  function answerCheck(i: number) {
    if (answer !== null) return;
    setAnswer(i);
    logger.log('quick_check_answer', { choice: QUICK_CHECK.pairs[i].join('–'), correct: i === correct });
  }
  function skip() {
    logger.log('skip', { mission: 'embeddings' });
    onDone();
  }

  const sim = selected.length === 2 ? dot(EMBEDDINGS[selected[0]], EMBEDDINGS[selected[1]]) : null;

  const panel = (
    <div className="space-y-4 text-sm">
      <button type="button" onClick={skip} className="text-xs text-slate-500 underline hover:text-slate-700">
        I already know embeddings → skip
      </button>
      {EMBEDDINGS_TEXT.intro.map((p) => <p key={p}>{p}</p>)}
      <div className="rounded-lg bg-slate-50 p-3">
        <p className="font-medium">{EMBEDDINGS_TEXT.pickPrompt}</p>
        {sim === null ? (
          <p className="mt-1 text-slate-500">Selected: {selected.join(', ') || 'none'}</p>
        ) : (
          <p className="mt-1">
            Similarity of <strong>{selected[0]}</strong> and <strong>{selected[1]}</strong>:{' '}
            <span className="text-lg font-semibold tabular-nums text-amber-600">{sim.toFixed(1)}</span>
          </p>
        )}
        <p className="mt-1 text-xs text-slate-500">{EMBEDDINGS_TEXT.caption}</p>
      </div>
      <div className="space-y-2">
        <p className="font-medium">{QUICK_CHECK.prompt}</p>
        <div className="grid grid-cols-2 gap-2">
          {QUICK_CHECK.pairs.map((pair, i) => {
            const state = answer === null ? '' : i === correct ? 'border-emerald-500 bg-emerald-50' : i === answer ? 'border-red-400 bg-red-50' : 'opacity-60';
            return (
              <button key={pair.join()} type="button" disabled={answer !== null} onClick={() => answerCheck(i)} className={`${secondaryButtonClass} ${state}`}>
                {pair[0]} – {pair[1]}
              </button>
            );
          })}
        </div>
        {answer !== null && (
          <p className={answer === correct ? 'text-emerald-700' : 'text-red-700'}>
            {answer === correct ? '✓ Right. ' : '✗ Not quite. '}
            {QUICK_CHECK.reason}
          </p>
        )}
      </div>
      {answer !== null && (
        <>
          <p className="rounded-lg border border-indigo-200 bg-indigo-50 p-3 font-medium text-indigo-900">{EMBEDDINGS_TEXT.punchline}</p>
          <button type="button" className={buttonClass} onClick={onDone}>Let’s find out →</button>
        </>
      )}
    </div>
  );

  return <MissionShell step={step} title={MISSION_TITLES.embeddings} panel={panel} stage={<MeaningMap selected={selected} onSelect={select} />} />;
}
