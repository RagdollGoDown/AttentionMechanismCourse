'use client';

import type { CSSProperties } from 'react';
import { WeightBar } from '@/components/WeightBar';
import { displayWord, percentages, weightsFor, type Tile } from '@/lib/tiles';

export type PendingChange = { kind: 'swap'; to: string } | { kind: 'remove' };

export interface Bubble {
  key: string;
  text: string;
  /** Columns the bubble may spread over, centred on its word (default 1). */
  span?: number;
  tone?: 'query' | 'key' | 'value';
}

export interface PlaygroundProps {
  tiles: Tile[];
  focusKey: string;
  showWeights: boolean;
  showScores?: boolean;
  /** Override the weights (e.g. the √dₖ slider); defaults to the real attention weights. */
  weights?: number[];
  onTileClick?: (tile: Tile) => void;
  selectedKey?: string | null;
  correctKey?: string | null;
  /** Announced change, drawn before it happens. */
  pending?: Record<string, PendingChange>;
  /** The tile that is leaving right now (animation). */
  leaving?: { key: string; kind: 'swap' | 'remove' } | null;
  /** The tile that just arrived (animation + "new" label). */
  enteringKey?: string | null;
  bubbles?: Bubble[];
  /** Animate each word's value flowing into the focus word. */
  flow?: boolean;
}

const GAP = '0.5rem';
const BUBBLE_TONE = {
  query: 'bg-cobalt text-white after:border-t-cobalt',
  key: 'bg-tile text-ink after:border-t-tile',
  value: 'bg-ok text-white after:border-t-ok',
};

/** The board: one column per word. Bar on top, word tile below, its labelled match score under it. */
export function Playground({
  tiles, focusKey, showWeights, showScores = true, weights: override, onTileClick, selectedKey = null, correctKey = null,
  pending = {}, leaving = null, enteringKey = null, bubbles = [], flow = false,
}: PlaygroundProps) {
  const row = weightsFor(tiles, focusKey);
  const weights = override ?? row.weights;
  const percents = percentages(weights);
  const focusIndex = tiles.findIndex((t) => t.key === focusKey);
  const n = tiles.length;
  const grid: CSSProperties = { gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`, columnGap: GAP };

  return (
    <div className="w-full">
      {bubbles.length > 0 && (
        <div className="mx-auto mb-3 grid max-w-3xl items-end gap-y-3" style={grid}>
          {bubbles.map((b) => {
            const i = tiles.findIndex((t) => t.key === b.key);
            const span = Math.min(b.span ?? 1, n);
            const start = Math.max(0, Math.min(i - Math.floor((span - 1) / 2), n - span));
            const tail = ((i - start + 0.5) / span) * 100;
            return (
              <p
                key={`${b.key}-${b.text}`}
                style={{ gridColumn: `${start + 1} / span ${span}`, gridRow: span > 1 ? 1 : 2, '--tail': `${tail}%` } as CSSProperties}
                className={`bubble-in relative rounded-xl px-2 py-1.5 text-center text-[clamp(0.65rem,2.2vw,0.85rem)] font-semibold leading-snug after:absolute after:left-[var(--tail)] after:top-full after:-translate-x-1/2 after:border-8 after:border-transparent after:content-[''] ${BUBBLE_TONE[b.tone ?? 'key']}`}
              >
                {b.text}
              </p>
            );
          })}
        </div>
      )}

      <div className="mx-auto grid max-w-3xl" style={grid}>
        {tiles.map((tile, i) => {
          const isFocus = tile.key === focusKey;
          const canClick = Boolean(onTileClick) && !isFocus;
          const change = pending[tile.key];
          const isLeaving = leaving?.key === tile.key;
          const isNew = enteringKey === tile.key;
          const ring = selectedKey === tile.key ? 'ring-3 ring-cobalt' : correctKey === tile.key ? 'ring-3 ring-ok' : '';
          const outline = change?.kind === 'swap' ? 'outline-2 outline-dashed outline-offset-2 outline-cobalt'
            : change?.kind === 'remove' ? 'outline-2 outline-dashed outline-offset-2 outline-miss' : '';
          return (
            <div key={tile.key} className={`relative flex min-w-0 flex-col items-center gap-1.5 ${isLeaving && leaving?.kind === 'remove' ? 'col-leave' : ''}`}>
              <div className="relative w-full">
                <WeightBar weight={weights[i]} percent={percents[i]} visible={showWeights} muted={isFocus} />
                {flow && !isFocus && (
                  <span
                    aria-hidden
                    className="value-flow pointer-events-none absolute inset-x-0 top-1/2 flex justify-center"
                    style={{ '--steps': focusIndex - i, '--gap': GAP, animationDelay: `${i * 0.12}s` } as CSSProperties}
                  >
                    <span className="rounded-full bg-ok" style={{ width: `${6 + weights[i] * 22}px`, height: `${6 + weights[i] * 22}px` }} />
                  </span>
                )}
              </div>
              <button
                key={`${tile.key}-${tile.word}`}
                type="button"
                disabled={!canClick}
                onClick={() => onTileClick?.(tile)}
                aria-pressed={onTileClick ? selectedKey === tile.key : undefined}
                className={`tile flex min-h-12 w-full items-center justify-center break-words px-1 py-2 text-center text-[clamp(0.68rem,2.4vw,0.95rem)] leading-tight transition ${
                  isFocus ? 'tile-focus' : ''
                } ${canClick ? 'cursor-pointer hover:-translate-y-0.5' : ''} ${ring} ${outline} ${isLeaving && leaving?.kind === 'swap' ? 'tile-leave' : ''} ${isNew ? 'tile-enter' : ''}`}
              >
                {displayWord(tile.word, i)}
              </button>
              {showScores && (
                <span className="rounded-md bg-page px-1.5 py-0.5 text-center text-[10px] font-semibold tabular-nums leading-tight text-muted sm:text-[11px]">
                  match <span className="text-ink">{row.scores[i].toFixed(1)}</span>
                </span>
              )}
              <span className="min-h-4 text-center text-[11px] font-semibold leading-tight">
                {change?.kind === 'swap' ? <span className="text-cobalt">becomes<br />&quot;{change.to}&quot;</span>
                  : change?.kind === 'remove' ? <span className="text-miss">will be removed</span>
                  : selectedKey === tile.key ? <span className="text-cobalt">your pick</span>
                  : isNew ? <span className="text-cobalt">new word</span>
                  : isFocus ? <span className="text-muted">focus</span>
                  : correctKey === tile.key ? <span className="text-ok">✓ top</span> : null}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
