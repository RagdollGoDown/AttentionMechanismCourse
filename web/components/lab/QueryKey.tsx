'use client';

import { useState } from 'react';
import { useGame } from '@/components/GameProvider';
import { useLogger } from '@/components/LoggerProvider';
import { MeaningMap } from '@/components/MeaningMap';
import { MissionShell } from '@/components/MissionShell';
import { Playground } from '@/components/Playground';
import { DotBreakdown } from '@/components/steps/Vectors';
import { buttonClass, noteClass } from '@/components/ui';
import type { StepProps } from '@/components/steps/types';
import { FOCUS, SENTENCE_A } from '@/content/sentences';
import { LAB_TITLES, QK_TEXT, XP } from '@/content/steps';
import { EMBEDDINGS } from '@/content/vectors';
import { dot } from '@/lib/attention';
import { toTiles, topKey } from '@/lib/tiles';

const WORDS = [...new Set(SENTENCE_A)];
const TILES = toTiles(SENTENCE_A);
const FOCUS_KEY = String(SENTENCE_A.indexOf(FOCUS));
const BEST = TILES.find((t) => t.key === topKey(TILES, FOCUS_KEY))!.word;
const LABELS = { [FOCUS]: 'model (query)' };

export function QueryKey({ onDone }: StepProps) {
  const logger = useLogger();
  const { award } = useGame();
  const [picked, setPicked] = useState<string | null>(null);
  const [found, setFound] = useState(false);

  function select(word: string) {
    setPicked(word);
    logger.log('qk_select', { word, score: dot(EMBEDDINGS[FOCUS], EMBEDDINGS[word]) });
    award(XP.explore, `qk:${word}`);
    if (word === BEST) setFound(true);
  }

  const panel = (
    <div className="space-y-4">
      <div className="space-y-1.5">{QK_TEXT.intro.map((p) => <p key={p}>{p}</p>)}</div>
      <p className="font-semibold">{QK_TEXT.task}</p>
      <div className={noteClass}>
        {picked ? (
          <>
            <p className="mb-1 text-sm text-muted">Query of &quot;model&quot; · key of &quot;{picked}&quot;</p>
            <DotBreakdown a={FOCUS} b={picked} />
          </>
        ) : (
          <p className="text-sm text-muted">No word picked yet.</p>
        )}
      </div>
      {found && (
        <>
          <p className="font-semibold text-ok">{QK_TEXT.found}</p>
          <p className="text-sm text-muted">{QK_TEXT.toy}</p>
          <button type="button" className={buttonClass} onClick={onDone}>Next experiment</button>
        </>
      )}
    </div>
  );

  const stage = (
    <div className="flex w-full flex-col items-center gap-6">
      <MeaningMap words={WORDS} selected={picked ? [FOCUS, picked] : []} onSelect={select} labels={LABELS} />
      <Playground tiles={TILES} focusKey={FOCUS_KEY} showWeights={found} selectedKey={TILES.find((t) => t.word === picked)?.key ?? null} />
    </div>
  );

  return <MissionShell title={LAB_TITLES.qk} panel={panel} stage={stage} />;
}
