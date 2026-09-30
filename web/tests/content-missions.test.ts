import { describe, expect, it } from 'vitest';
import { MISSION_ORDER, QUICK_CHECK, TUTOR_MISSIONS, quickCheckAnswer } from '@/content/missions';
import { applyChange, toTiles, topKey, weightsFor } from '@/lib/tiles';

const setup = (id: 'swap' | 'remove') => {
  const m = TUTOR_MISSIONS[id];
  const before = toTiles(m.before);
  const after = applyChange(before, m.change);
  const focusKey = before[m.focusIndex].key;
  return { m, before, after, focusKey };
};

describe('mission content', () => {
  it('mission order', () => expect(MISSION_ORDER).toEqual(['embeddings', 'contrast', 'swap', 'remove', 'free']));

  it.each(['swap', 'remove'] as const)('%s: focusIndex points at model; ids unique; no g-flag regexes', (id) => {
    const { m } = setup(id);
    expect(m.before[m.focusIndex]).toBe('model');
    const ids = [...m.rubric, ...m.misconceptions].map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    [...m.rubric, ...m.misconceptions].forEach((r) => expect(r.keywords.flags).not.toContain('g'));
  });

  it('swap: model leans on “fashion show” before and on “training run” after', () => {
    const { m, before, after, focusKey } = setup('swap');
    expect(topKey(before, focusKey)).toBe('2');
    expect(after[2].word).toBe('training run');
    expect(m.prediction.kind === 'tile' && before[m.prediction.correctIndex].key).toBe(topKey(after, focusKey));
  });

  it('swap: the adjacent word “smiled” gets less weight than “training run”', () => {
    const { after, focusKey } = setup('swap');
    const { weights } = weightsFor(after, focusKey);
    expect(weights[5]).toBeLessThan(weights[2]);
  });

  it('remove: every remaining weight rises; the “fashion show” score is unchanged; the gain is visible', () => {
    const { m, before, after, focusKey } = setup('remove');
    const wb = weightsFor(before, focusKey);
    const wa = weightsFor(after, focusKey);
    after.forEach((t) => {
      const i = before.findIndex((b) => b.key === t.key);
      expect(wa.weights[after.indexOf(t)]).toBeGreaterThan(wb.weights[i]);
    });
    expect(wa.scores[2]).toBeCloseTo(wb.scores[2], 12);
    expect(wa.weights[2] - wb.weights[2]).toBeGreaterThan(0.05);
    expect(m.prediction.kind === 'choice' && m.prediction.correct).toBe('It goes up');
  });

  it('quick check: the intended answer is the most similar pair', () => {
    expect(quickCheckAnswer()).toBe(0);
    expect(QUICK_CHECK.pairs[0]).toEqual(['runway', 'dress']);
  });
});
