import { describe, expect, it } from 'vitest';
import { EMBEDDINGS, MAP_WORDS, embed } from '@/content/vectors';
import { BUILDER_ENDINGS, BUILDER_OPENERS, FOCUS, SENTENCE_A, SENTENCE_B, buildSentenceTiles } from '@/content/sentences';
import { toTiles, topKey, weightsFor } from '@/lib/tiles';

const focusKeyOf = (words: string[]) => String(words.indexOf(FOCUS));

describe('content: every word has an embedding', () => {
  const all = [...SENTENCE_A, ...SENTENCE_B, ...MAP_WORDS, ...BUILDER_OPENERS.flat(), ...BUILDER_ENDINGS.flat()];
  it.each(all)('%s', (w) => expect(() => embed(w)).not.toThrow());
  it('embed throws on unknown words', () => expect(() => embed('banana')).toThrow());
});

describe('content: Mission 1 contrast', () => {
  it('sentence A: model leans most on “fashion show”', () => {
    const t = toTiles(SENTENCE_A);
    expect(t.find((x) => x.key === topKey(t, focusKeyOf(SENTENCE_A)))?.word).toBe('fashion show');
  });
  it('sentence A: “fashion show” outweighs model itself', () => {
    const { weights } = weightsFor(toTiles(SENTENCE_A), focusKeyOf(SENTENCE_A));
    expect(weights[SENTENCE_A.indexOf('fashion show')]).toBeGreaterThan(weights[SENTENCE_A.indexOf(FOCUS)]);
  });
  it('sentence B: model leans most on “training”', () => {
    const t = toTiles(SENTENCE_B);
    expect(t.find((x) => x.key === topKey(t, focusKeyOf(SENTENCE_B)))?.word).toBe('training');
  });
});

describe('content: free play', () => {
  it('builder tiles have unique keys and contain model', () => {
    for (let o = 0; o < BUILDER_OPENERS.length; o++)
      for (let e = 0; e < BUILDER_ENDINGS.length; e++) {
        const keys = buildSentenceTiles(o, e).map((t) => t.key);
        expect(new Set(keys).size).toBe(keys.length);
        expect(keys).toContain(FOCUS);
      }
  });
  it('has a ~50/50 sentence (top two non-focus weights within 2 points)', () => {
    let found = false;
    for (let o = 0; o < BUILDER_OPENERS.length; o++)
      for (let e = 0; e < BUILDER_ENDINGS.length; e++) {
        const tiles = buildSentenceTiles(o, e);
        const { weights } = weightsFor(tiles, FOCUS);
        const others = weights.filter((_, i) => tiles[i].key !== FOCUS).sort((a, b) => b - a);
        if (others[0] - others[1] < 0.02) found = true;
      }
    expect(found).toBe(true);
  });
  it('the map shows model between the clusters', () => {
    expect(EMBEDDINGS.model[0]).toBeCloseTo(EMBEDDINGS.model[1]);
  });
});
