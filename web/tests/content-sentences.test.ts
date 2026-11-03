import { describe, expect, it } from 'vitest';
import { EMBEDDINGS, MAP_WORDS, embed } from '@/content/vectors';
import { FOCUS, SENTENCE_A, SENTENCE_B } from '@/content/sentences';
import { toTiles, topKey, weightsFor } from '@/lib/tiles';

const focusKeyOf = (words: string[]) => String(words.indexOf(FOCUS));

describe('content: every word has an embedding', () => {
  const all = [...SENTENCE_A, ...SENTENCE_B, ...MAP_WORDS];
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
    expect(t.find((x) => x.key === topKey(t, focusKeyOf(SENTENCE_B)))?.word).toBe('training run');
  });
});

describe('content: meaning map', () => {
  it('the map shows model between the clusters', () => {
    expect(EMBEDDINGS.model[0]).toBeCloseTo(EMBEDDINGS.model[1]);
  });
});
