'use client';

import { WeightBar } from '@/components/WeightBar';
import { displayWord, percentages, weightsFor, type Tile } from '@/lib/tiles';

export interface PlaygroundProps {
  tiles: Tile[];
  focusKey: string;
  showWeights: boolean;
  showScores?: boolean;
  /** Override the weights (e.g. the √d_k slider); defaults to the real attention weights. */
  weights?: number[];
  onTileClick?: (tile: Tile) => void;
  selectedKey?: string | null;
  correctKey?: string | null;
  notes?: Record<string, string>;
}

/** The board: one column per word, bar on top, word tile below with its match score in the corner. */
export function Playground({
  tiles, focusKey, showWeights, showScores = true, weights: override, onTileClick, selectedKey = null, correctKey = null, notes = {},
}: PlaygroundProps) {
  const row = weightsFor(tiles, focusKey);
  const weights = override ?? row.weights;
  const percents = percentages(weights);
  return (
    <div className="w-full">
      <div className="mx-auto grid max-w-3xl gap-1.5 sm:gap-3" style={{ gridTemplateColumns: `repeat(${tiles.length}, minmax(0, 1fr))` }}>
        {tiles.map((tile, i) => {
          const isFocus = tile.key === focusKey;
          const canClick = Boolean(onTileClick) && !isFocus;
          const ring = selectedKey === tile.key ? 'ring-3 ring-cobalt' : correctKey === tile.key ? 'ring-3 ring-ok' : '';
          return (
            <div key={tile.key} className="flex min-w-0 flex-col items-center gap-2">
              <WeightBar weight={weights[i]} percent={percents[i]} visible={showWeights} muted={isFocus} />
              <button
                type="button"
                disabled={!canClick}
                onClick={() => onTileClick?.(tile)}
                aria-pressed={onTileClick ? selectedKey === tile.key : undefined}
                className={`tile flex min-h-12 w-full items-center justify-center break-words px-1 pb-2 pt-2.5 text-center text-[clamp(0.68rem,2.4vw,0.95rem)] leading-tight transition ${
                  isFocus ? 'tile-focus' : ''
                } ${canClick ? 'cursor-pointer hover:-translate-y-0.5' : ''} ${ring}`}
              >
                {displayWord(tile.word, i)}
                {showScores && (
                  <span className="absolute bottom-0.5 right-1 text-[0.6rem] font-bold tabular-nums opacity-70" title="match score">
                    {row.scores[i].toFixed(1)}
                  </span>
                )}
              </button>
              <span className="min-h-4 text-center text-[11px] font-medium leading-tight">
                {isFocus ? <span className="text-muted">focus</span>
                  : correctKey === tile.key ? <span className="text-ok">✓ top</span>
                  : selectedKey === tile.key ? <span className="text-cobalt">your pick</span>
                  : notes[tile.key] ? <span className="text-miss">{notes[tile.key]}</span> : null}
              </span>
            </div>
          );
        })}
      </div>
      {showScores && <p className="mt-2 text-center text-xs text-muted">Small number on a tile: its match score with &quot;model&quot;.</p>}
    </div>
  );
}
