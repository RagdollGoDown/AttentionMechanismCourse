'use client';

import { useState } from 'react';
import { useLogger } from '@/components/LoggerProvider';
import { MissionShell } from '@/components/MissionShell';
import { Playground, type Bubble } from '@/components/Playground';
import { ResultBanner } from '@/components/ResultBanner';
import { buttonClass } from '@/components/ui';
import type { StepProps } from '@/components/steps/types';
import { FOCUS, SENTENCE_A } from '@/content/sentences';
import { LAB_TITLES, QK_TEXT } from '@/content/steps';
import { EMBEDDINGS } from '@/content/vectors';
import { dot } from '@/lib/attention';
import { toTiles, topKey, type Tile } from '@/lib/tiles';

const TILES = toTiles(SENTENCE_A);
const FOCUS_KEY = String(SENTENCE_A.indexOf(FOCUS));
const WORDS = [...new Set(SENTENCE_A.filter((w) => w !== FOCUS))];
const BEST = TILES.find((t) => t.key === topKey(TILES, FOCUS_KEY))!.word;
const match = (w: string) => dot(EMBEDDINGS[FOCUS], EMBEDDINGS[w]);
const DIMS = ['fashion', 'machine learning'];

/** Query of "model" next to the key of one word, multiplied number by number. */
function MatchCard({ word }: { word: string }) {
  const q = EMBEDDINGS[FOCUS];
  const k = EMBEDDINGS[word];
  return (
    <div className="bubble-in w-full max-w-md rounded-2xl border-2 border-line bg-card p-4" key={word}>
      <table className="w-full text-sm tabular-nums">
        <thead>
          <tr className="text-left text-muted">
            <th className="pb-1 font-semibold" />
            <th className="pb-1 font-semibold text-cobalt">query of &quot;model&quot;</th>
            <th className="pb-1 font-semibold" />
            <th className="pb-1 font-semibold text-ink">key of &quot;{word}&quot;</th>
            <th className="pb-1 font-semibold" />
          </tr>
        </thead>
        <tbody>
          {DIMS.map((d, i) => (
            <tr key={d}>
              <td className="py-0.5 pr-2 text-muted">{d}</td>
              <td className="font-display font-bold text-cobalt">{q[i]}</td>
              <td className="px-1 text-center text-muted">×</td>
              <td className="font-display font-bold">{k[i]}</td>
              <td className="whitespace-nowrap text-right">= {(q[i] * k[i]).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 flex items-baseline justify-between border-t border-line pt-2">
        <span className="font-semibold">match score (add them up)</span>
        <span className="font-display text-2xl font-bold tabular-nums text-cobalt">{match(word).toFixed(1)}</span>
      </p>
    </div>
  );
}

export function QueryKey({ onDone }: StepProps) {
  const logger = useLogger();
  const [checked, setChecked] = useState<string[]>([]);
  const current = checked.at(-1) ?? null;
  const allChecked = WORDS.every((w) => checked.includes(w));

  function ask(tile: Tile) {
    logger.log('qk_select', { word: tile.word, score: match(tile.word) });
    setChecked([...checked.filter((w) => w !== tile.word), tile.word]);
  }

  const bubbles: Bubble[] = [
    { key: FOCUS_KEY, text: QK_TEXT.query, span: 3, tone: 'query' },
    ...TILES.filter((t) => checked.includes(t.word)).map((t) => ({
      key: t.key,
      text: QK_TEXT.keySays(EMBEDDINGS[t.word][0], EMBEDDINGS[t.word][1]),
      tone: 'key' as const,
    })),
  ];
  const board = [...checked].sort((a, b) => match(b) - match(a));

  const panel = (
    <div className="space-y-4">
      <div className="space-y-1.5">{QK_TEXT.intro.map((p) => <p key={p}>{p}</p>)}</div>
      <p className="font-semibold">{QK_TEXT.task} ({checked.length}/{WORDS.length})</p>
      {board.length > 0 && (
        <div>
          <p className="mb-1 text-sm font-semibold text-muted">{QK_TEXT.leaderboard}</p>
          <ol className="space-y-1">
            {board.map((w, i) => (
              <li key={w} className={`flex items-center justify-between rounded-lg px-3 py-1.5 ${allChecked && i === 0 ? 'bg-ok font-bold text-white' : 'bg-page'}`}>
                <span>{i + 1}. {w}</span>
                <span className="font-display font-bold tabular-nums">{match(w).toFixed(1)}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
      {allChecked && (
        <>
          <ResultBanner ok title={QK_TEXT.winTitle(BEST)}>
            <p>{QK_TEXT.win}</p>
          </ResultBanner>
          <p className="text-sm text-muted">{QK_TEXT.toy}</p>
          <button type="button" className={buttonClass} onClick={onDone}>Next experiment</button>
        </>
      )}
    </div>
  );

  const stage = (
    <div className="flex w-full flex-col items-center gap-6">
      <Playground
        tiles={TILES}
        focusKey={FOCUS_KEY}
        showWeights={allChecked}
        showScores={allChecked}
        onTileClick={ask}
        selectedKey={TILES.find((t) => t.word === current && !allChecked)?.key ?? null}
        correctKey={allChecked ? TILES.find((t) => t.word === BEST)?.key ?? null : null}
        bubbles={bubbles}
      />
      {current ? <MatchCard word={current} /> : <p className="text-muted">Click a word in the sentence.</p>}
    </div>
  );

  return <MissionShell title={LAB_TITLES.qk} panel={panel} stage={stage} />;
}
