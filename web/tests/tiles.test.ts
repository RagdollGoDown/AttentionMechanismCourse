import { describe, expect, it } from 'vitest';
import { applyChange, displayWord, resolveFocus, toTiles, topKey, weightsFor } from '@/lib/tiles';

const A = toTiles(['after', 'the', 'fashion show', 'the', 'model', 'smiled']);

describe('tiles', () => {
  it('toTiles keys by index', () => expect(A.map((t) => t.key)).toEqual(['0', '1', '2', '3', '4', '5']));
  it('swap keeps the key and changes the word', () => {
    const s = applyChange(A, { type: 'swap', index: 2, to: 'training run' });
    expect(s[2]).toEqual({ key: '2', word: 'training run' });
    expect(s).toHaveLength(6);
  });
  it('remove drops the tile and keeps other keys', () => {
    expect(applyChange(A, { type: 'remove', index: 5 }).map((t) => t.key)).toEqual(['0', '1', '2', '3', '4']);
  });
  it('applyChange rejects out-of-range indices', () => {
    expect(() => applyChange(A, { type: 'remove', index: 9 })).toThrow(RangeError);
  });
  it('weightsFor sums to 1', () => {
    expect(weightsFor(A, '4').weights.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
  });
  it('topKey ignores the focus tile', () => expect(topKey(A, '4')).toBe('2'));
  it('topKey is null when only the focus is left', () => {
    expect(topKey([{ key: 'model', word: 'model' }], 'model')).toBeNull();
  });
  it('a lone focus tile gets 100 %', () => {
    expect(weightsFor([{ key: 'model', word: 'model' }], 'model').weights).toEqual([1]);
  });
  it('resolveFocus falls back when the focused tile is gone', () => {
    expect(resolveFocus(A, 'open-0-1', 'model')).toBe('model');
    expect(resolveFocus(A, '2', 'model')).toBe('2');
  });
  it('displayWord capitalizes only the first tile', () => {
    expect(displayWord('after', 0)).toBe('After');
    expect(displayWord('the', 1)).toBe('the');
  });
});
