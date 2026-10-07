import type { AttentionRow } from '@/lib/attention';
import { attendTiles } from '@/content/vectors';

export interface Tile {
  key: string;
  word: string;
}

export type Change = { type: 'swap'; index: number; to: string } | { type: 'remove'; index: number };

export function toTiles(words: string[]): Tile[] {
  return words.map((word, i) => ({ key: String(i), word }));
}

export function applyChange(tiles: Tile[], change: Change): Tile[] {
  if (change.index < 0 || change.index >= tiles.length) throw new RangeError(`index ${change.index} out of range`);
  if (change.type === 'swap') return tiles.map((t, i) => (i === change.index ? { ...t, word: change.to } : t));
  return tiles.filter((_, i) => i !== change.index);
}

export function weightsFor(tiles: Tile[], focusKey: string): AttentionRow {
  return attendTiles(tiles.map((t) => t.word), tiles.findIndex((t) => t.key === focusKey));
}

/** Key of the non-focus tile with the largest weight, or null if only the focus is left. */
export function topKey(tiles: Tile[], focusKey: string): string | null {
  const { weights } = weightsFor(tiles, focusKey);
  let best = -1;
  tiles.forEach((t, i) => {
    if (t.key !== focusKey && (best < 0 || weights[i] > weights[best])) best = i;
  });
  return best < 0 ? null : tiles[best].key;
}

export function resolveFocus(tiles: Tile[], focusKey: string, fallback: string): string {
  return tiles.some((t) => t.key === focusKey) ? focusKey : fallback;
}

export function displayWord(word: string, position: number): string {
  return position === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word;
}

/** Whole percentages that always add up to 100 (largest-remainder rounding), so learners can check the sum. */
export function percentages(weights: number[]): number[] {
  const raw = weights.map((w) => w * 100);
  const out = raw.map(Math.floor);
  const order = raw.map((r, i) => i).sort((a, b) => raw[b] - out[b] - (raw[a] - out[a]));
  const missing = 100 - out.reduce((a, b) => a + b, 0);
  for (let k = 0; k < missing; k++) out[order[k]]++;
  return out;
}
