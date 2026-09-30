'use client';

import { WeightBar } from '@/components/WeightBar';
import { displayWord, percentages, weightsFor, type Tile } from '@/lib/tiles';

export interface PlaygroundProps {
  tiles: Tile[];
  focusKey: string;
  showWeights: boolean;
  showScores?: boolean;
  onTileClick?: (tile: Tile) => void;
  selectedKey?: string | null;
  correctKey?: string | null;
  notes?: Record<string, string>;
  onRemove?: (tile: Tile) => void;
}

export function Playground({
  tiles, focusKey, showWeights, showScores = true, onTileClick, selectedKey = null, correctKey = null, notes = {}, onRemove,
}: PlaygroundProps) {
  const { scores, weights } = weightsFor(tiles, focusKey);
  const percents = percentages(weights);
  return (
    <div className="flex flex-wrap items-start justify-center gap-3">
      {tiles.map((tile, i) => {
        const isFocus = tile.key === focusKey;
        const canClick = Boolean(onTileClick) && !isFocus;
        const tileClass = isFocus
          ? 'border-indigo-600 bg-indigo-600 font-semibold text-white'
          : selectedKey === tile.key
            ? 'border-amber-400 bg-amber-50 ring-2 ring-amber-300'
            : canClick
              ? 'cursor-pointer border-slate-300 bg-white hover:border-indigo-400 hover:bg-indigo-50'
              : 'border-slate-200 bg-white';
        return (
          <div key={tile.key} className="flex w-24 flex-col items-center gap-2">
            <WeightBar weight={weights[i]} percent={percents[i]} score={scores[i]} visible={showWeights} muted={isFocus} showScore={showScores} />
            <button
              type="button"
              disabled={!canClick}
              onClick={() => onTileClick?.(tile)}
              className={`w-full break-words rounded-lg border px-2 py-1.5 text-center text-sm leading-tight transition ${tileClass}`}
            >
              {displayWord(tile.word, i)}
            </button>
            {isFocus && <span className="text-[11px] text-slate-500">focus · itself</span>}
            {selectedKey === tile.key && <span className="text-[11px] font-medium text-amber-700">your pick</span>}
            {correctKey === tile.key && <span className="text-[11px] font-medium text-emerald-700">✓ most weight</span>}
            {notes[tile.key] && <span className="text-center text-[11px] font-medium text-amber-700">{notes[tile.key]}</span>}
            {onRemove && !isFocus && (
              <button type="button" onClick={() => onRemove(tile)} aria-label={`Remove ${tile.word}`} className="text-xs text-slate-400 hover:text-red-600">
                ✕
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
