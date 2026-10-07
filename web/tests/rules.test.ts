import { describe, expect, it } from 'vitest';
import { FOCUS, SENTENCE_A } from '@/content/sentences';
import { RULE_BRICKS, RULE_SETS, SOFTMAX_TEXT, softmaxCheckAnswer } from '@/content/steps';
import { applyRule, checkRule, passes, type BottomId, type TopId } from '@/lib/rules';
import { toTiles, weightsFor } from '@/lib/tiles';
import { simulatedWeights } from '@/components/steps/Formula';

const sentence = weightsFor(toTiles(SENTENCE_A), String(SENTENCE_A.indexOf(FOCUS))).scores;
const SETS = [sentence, ...RULE_SETS.map((s) => s.scores)];
const worksEverywhere = (t: TopId, b: BottomId) => SETS.every((s) => passes(checkRule(applyRule(t, b, s), s)));

describe('rule builder', () => {
  it('only eˢ ÷ sum and 2ˢ ÷ sum pass every test', () => {
    const winners = RULE_BRICKS.tops.flatMap((t) => RULE_BRICKS.bottoms.filter((b) => worksEverywhere(t, b)).map((b) => `${t}/${b}`));
    expect(winners.sort()).toEqual(['exp/sum', 'pow2/sum']);
  });
  it('the first idea, s ÷ sum, works on our sentence but breaks on negative scores', () => {
    expect(passes(checkRule(applyRule('s', 'sum', sentence), sentence))).toBe(true);
    expect(passes(checkRule(applyRule('s', 'sum', RULE_SETS[0].scores), RULE_SETS[0].scores))).toBe(false);
  });
  it('s + 5 survives test B, and test C breaks it', () => {
    expect(passes(checkRule(applyRule('plus5', 'sum', RULE_SETS[0].scores), RULE_SETS[0].scores))).toBe(true);
    expect(passes(checkRule(applyRule('plus5', 'sum', RULE_SETS[1].scores), RULE_SETS[1].scores))).toBe(false);
  });
  it('s² breaks the order when scores are negative', () => {
    expect(checkRule(applyRule('square', 'sum', RULE_SETS[0].scores), RULE_SETS[0].scores).order).toBe(false);
  });
  it('a sum of zero counts as broken, not as a pass', () => {
    const c = checkRule(applyRule('s', 'sum', [1, -1]), [1, -1]);
    expect(passes(c)).toBe(false);
  });
});

describe('softmax step', () => {
  it('the pipeline text matches Mixed scores: exactly two negative scores', () => {
    expect(RULE_SETS[0].scores.filter((s) => s < 0)).toHaveLength(2);
    expect(SOFTMAX_TEXT.stages[0].text).toContain('Two are negative');
  });
  it('the 3-word check answer is one of the options and matches the solution text', () => {
    expect(softmaxCheckAnswer()).toBe(67);
    expect(SOFTMAX_TEXT.options).toContain(67);
    expect(SOFTMAX_TEXT.solution).toContain('67 %');
  });
});

describe('√d_k slider', () => {
  const real = weightsFor(toTiles(SENTENCE_A), String(SENTENCE_A.indexOf(FOCUS))).weights;
  it('with the division, the bars are the real ones for every d_k', () => {
    for (const dk of [2, 8, 64, 512]) simulatedWeights(dk, true).forEach((w, i) => expect(w).toBeCloseTo(real[i], 10));
  });
  it('without it, a long vector puts almost all weight on one word', () => {
    expect(Math.max(...simulatedWeights(512, false))).toBeGreaterThan(0.99);
  });
});
