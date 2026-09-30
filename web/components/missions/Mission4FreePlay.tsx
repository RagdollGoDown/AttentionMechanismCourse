'use client';

import { useState } from 'react';
import { useLogger } from '@/components/LoggerProvider';
import { MissionShell } from '@/components/MissionShell';
import { Playground } from '@/components/Playground';
import { buttonClass, secondaryButtonClass } from '@/components/ui';
import type { MissionViewProps } from '@/components/missions/types';
import { FREE_PLAY_TEXT, MISSION_TITLES } from '@/content/missions';
import { BUILDER_ENDINGS, BUILDER_OPENERS, FOCUS, buildSentenceTiles } from '@/content/sentences';
import { resolveFocus, type Tile } from '@/lib/tiles';

const selectClass = 'w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm';

export function Mission4FreePlay({ step, onDone }: MissionViewProps) {
  const logger = useLogger();
  const [opener, setOpener] = useState(0);
  const [ending, setEnding] = useState(0);
  const [removed, setRemoved] = useState<string[]>([]);
  const [focusKey, setFocusKey] = useState(FOCUS);

  const tiles = buildSentenceTiles(opener, ending).filter((t) => !removed.includes(t.key));
  const focus = resolveFocus(tiles, focusKey, FOCUS);

  function changeOpener(i: number) {
    setOpener(i);
    setRemoved([]);
    logger.log('swap_word', { slot: 'opener', to: BUILDER_OPENERS[i].join(' ') });
  }
  function changeEnding(i: number) {
    setEnding(i);
    setRemoved([]);
    logger.log('swap_word', { slot: 'ending', to: BUILDER_ENDINGS[i].join(' ') });
  }
  function remove(tile: Tile) {
    setRemoved([...removed, tile.key]);
    logger.log('remove_word', { word: tile.word });
  }
  function reset() {
    setRemoved([]);
    logger.log('restore_word', { all: true });
  }
  function focusOn(tile: Tile) {
    setFocusKey(tile.key);
    logger.log('focus_word', { word: tile.word });
  }

  const panel = (
    <div className="space-y-4 text-sm">
      <p>{FREE_PLAY_TEXT.intro}</p>
      <label className="block space-y-1">
        <span className="text-xs font-medium text-slate-500">After …</span>
        <select className={selectClass} value={opener} onChange={(e) => changeOpener(Number(e.target.value))}>
          {BUILDER_OPENERS.map((o, i) => <option key={i} value={i}>{o.join(' ')}</option>)}
        </select>
      </label>
      <label className="block space-y-1">
        <span className="text-xs font-medium text-slate-500">… the model …</span>
        <select className={selectClass} value={ending} onChange={(e) => changeEnding(Number(e.target.value))}>
          {BUILDER_ENDINGS.map((o, i) => <option key={i} value={i}>{o.join(' ')}</option>)}
        </select>
      </label>
      <button type="button" className={secondaryButtonClass} onClick={reset} disabled={removed.length === 0}>
        Restore removed words
      </button>
      <div>
        <p className="mb-1 font-medium">Try this</p>
        <ul className="list-disc space-y-1 pl-5 text-slate-600">
          {FREE_PLAY_TEXT.challenges.map((c) => <li key={c}>{c}</li>)}
        </ul>
      </div>
      <button type="button" className={buttonClass} onClick={onDone}>Finish</button>
    </div>
  );

  return (
    <MissionShell
      step={step}
      title={MISSION_TITLES.free}
      panel={panel}
      stage={<Playground tiles={tiles} focusKey={focus} showWeights onTileClick={focusOn} onRemove={remove} />}
    />
  );
}
