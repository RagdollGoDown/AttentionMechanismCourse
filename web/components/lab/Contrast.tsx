'use client';

import { useState } from 'react';
import { ExplainRounds } from '@/components/ExplainRounds';
import { useLogger } from '@/components/LoggerProvider';
import { MissionShell } from '@/components/MissionShell';
import { Playground } from '@/components/Playground';
import { ResultBanner } from '@/components/ResultBanner';
import { buttonClass } from '@/components/ui';
import type { StepProps } from '@/components/steps/types';
import { CONTRAST_TASK } from '@/content/missions';
import { FOCUS, SENTENCE_A, SENTENCE_B } from '@/content/sentences';
import { CONTRAST_TEXT, LAB_TITLES } from '@/content/steps';
import { toTiles, topKey, type Tile } from '@/lib/tiles';

const SENTENCES = {
  A: { tiles: toTiles(SENTENCE_A), focusKey: String(SENTENCE_A.indexOf(FOCUS)) },
  B: { tiles: toTiles(SENTENCE_B), focusKey: String(SENTENCE_B.indexOf(FOCUS)) },
} as const;
type Which = keyof typeof SENTENCES;
const TOP: Record<Which, string | null> = {
  A: topKey(SENTENCES.A.tiles, SENTENCES.A.focusKey),
  B: topKey(SENTENCES.B.tiles, SENTENCES.B.focusKey),
};
const wordOf = (which: Which, key: string | null) => SENTENCES[which].tiles.find((t) => t.key === key)?.word ?? '–';

/**
 * Predict, then reveal. Right on both: on to the next experiment. A wrong pick: the learner says what made
 * them think so and gets one reply (the only part that differs between conditions: tutor vs expert answer).
 */
export function Contrast({ condition, onDone }: StepProps) {
  const logger = useLogger();
  const [picks, setPicks] = useState<Record<Which, string | null>>({ A: null, B: null });
  const [revealed, setRevealed] = useState(false);

  function pick(which: Which, tile: Tile) {
    setPicks({ ...picks, [which]: tile.key });
    logger.log('prediction', { sentence: which, word: tile.word });
  }
  function reveal() {
    setRevealed(true);
    logger.log('reveal', {
      A: { pick: wordOf('A', picks.A), correct: picks.A === TOP.A },
      B: { pick: wordOf('B', picks.B), correct: picks.B === TOP.B },
    });
  }
  const allRight = picks.A === TOP.A && picks.B === TOP.B;
  const prediction = (['A', 'B'] as const)
    .map((w) => `Sentence ${w}: picked "${wordOf(w, picks[w])}"${picks[w] === TOP[w] ? ' (right)' : `, but "model" listened most to "${wordOf(w, TOP[w])}"`}.`)
    .join(' ');

  const panel = (
    <div className="space-y-4">
      <p>{CONTRAST_TEXT.prompt}</p>
      <ul className="space-y-1">
        {(['A', 'B'] as const).map((w) => (
          <li key={w}>
            Sentence {w}: <strong>{picks[w] ? wordOf(w, picks[w]) : '…'}</strong>
            {revealed && (picks[w] === TOP[w]
              ? <span className="text-ok"> ✓</span>
              : <span className="text-miss"> ✗ it was &quot;{wordOf(w, TOP[w])}&quot;</span>)}
          </li>
        ))}
      </ul>
      {revealed && (() => {
        const right = (['A', 'B'] as const).filter((w) => picks[w] === TOP[w]).length;
        return (
          <ResultBanner ok={right === 2} title={right === 2 ? 'Right on both!' : `${right} of 2 right.`}>
            <p>In A, &quot;model&quot; listens most to &quot;{wordOf('A', TOP.A)}&quot;. In B, to &quot;{wordOf('B', TOP.B)}&quot;. Same word, different context, different bars.</p>
          </ResultBanner>
        );
      })()}
      {!revealed ? (
        <button type="button" className={buttonClass} disabled={!picks.A || !picks.B} onClick={reveal}>
          {CONTRAST_TEXT.revealLabel}
        </button>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted">{CONTRAST_TEXT.bars}</p>
          {allRight
            ? <button type="button" className={buttonClass} onClick={onDone}>Next experiment</button>
            : <ExplainRounds task={CONTRAST_TASK} condition={condition} onDone={onDone} doneLabel="Next experiment" maxRounds={1} prediction={prediction} />}
        </div>
      )}
    </div>
  );

  const stage = (
    <div className="flex w-full flex-col gap-10">
      {(['A', 'B'] as const).map((w) => (
        <div key={w} className="space-y-3">
          <p className="text-sm font-semibold text-muted">Sentence {w}</p>
          <Playground
            tiles={SENTENCES[w].tiles}
            focusKey={SENTENCES[w].focusKey}
            showWeights={revealed}
            showScores={false}
            onTileClick={revealed ? undefined : (t) => pick(w, t)}
            selectedKey={picks[w]}
            correctKey={revealed ? TOP[w] : null}
          />
        </div>
      ))}
    </div>
  );

  return <MissionShell title={LAB_TITLES.contrast} panel={panel} stage={stage} />;
}
