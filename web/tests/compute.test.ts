import { describe, expect, it } from 'vitest';
import { PRACTICE_EXAMPLE, WORKED_EXAMPLE } from '@/content/steps';
import { STAGES, checkStage, fmt, parseEntry, stagesOf, type Stage } from '@/lib/compute';

const rounded = (xs: number[]) => xs.map((x) => Number(fmt(x)));

describe('worked example (numbers quoted in the M3 report)', () => {
  const s = stagesOf(WORKED_EXAMPLE);
  it.each([
    ['scores', [4, 1, 2]],
    ['scaled', [2.83, 0.71, 1.41]],
    ['weights', [0.73, 0.09, 0.18]],
    ['output', [0.91, 0.27]],
  ] as [Stage, number[]][])('%s', (stage, expected) => expect(rounded(s[stage])).toEqual(expected));

  it('weights add up to 1', () => {
    expect(s.weights.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
  });
});

describe('practice example', () => {
  const p = stagesOf(PRACTICE_EXAMPLE);
  it('uses other numbers than the worked example', () => {
    expect(PRACTICE_EXAMPLE.q).not.toEqual(WORKED_EXAMPLE.q);
    for (const stage of STAGES) expect(rounded(p[stage])).not.toEqual(rounded(stagesOf(WORKED_EXAMPLE)[stage]));
  });
  it('has whole-number scores and a clear winner', () => {
    expect(p.scores).toEqual([3, 2, 4]);
    expect(Math.max(...p.weights)).toBe(p.weights[2]);
  });
});

describe('checkStage', () => {
  it('accepts the exact values', () => {
    for (const stage of STAGES) {
      expect(checkStage(PRACTICE_EXAMPLE, stage, stagesOf(PRACTICE_EXAMPLE)[stage])).toEqual(stagesOf(PRACTICE_EXAMPLE)[stage].map(() => true));
    }
  });

  it('accepts a learner who rounds each stage and carries the rounded numbers forward', () => {
    const scaled = rounded(stagesOf(PRACTICE_EXAMPLE).scores.map((x) => x / Math.SQRT2));
    const exps = rounded(scaled.map(Math.exp));
    const sum = exps.reduce((a, b) => a + b, 0);
    const weights = rounded(exps.map((e) => e / sum));
    const output = rounded([0, 1].map((d) => PRACTICE_EXAMPLE.tokens.reduce((acc, t, i) => acc + weights[i] * t.v[d], 0)));
    for (const [stage, entries] of [['scaled', scaled], ['exps', exps], ['weights', weights], ['output', output]] as [Stage, number[]][]) {
      expect(checkStage(PRACTICE_EXAMPLE, stage, entries).every(Boolean), stage).toBe(true);
    }
  });

  it('rejects common mistakes', () => {
    // Forgot to scale: exponentiate the raw scores.
    expect(checkStage(PRACTICE_EXAMPLE, 'exps', [Math.exp(3), Math.exp(2), Math.exp(4)])).toEqual([false, false, false]);
    // Divided by 2 instead of √2.
    expect(checkStage(PRACTICE_EXAMPLE, 'scaled', [1.5, 1, 2])).toEqual([false, false, false]);
    // Weights from the scores, not from eˣ (no softmax).
    expect(checkStage(PRACTICE_EXAMPLE, 'weights', [3 / 9, 2 / 9, 4 / 9]).every(Boolean)).toBe(false);
    // Missing entry.
    expect(checkStage(PRACTICE_EXAMPLE, 'scores', [3, null, 4])).toEqual([true, false, true]);
  });
});

describe('parseEntry', () => {
  it.each([
    ['0.73', 'weights', 0.73],
    ['0,73', 'weights', 0.73],
    [' .73 ', 'weights', 0.73],
    ['73 %', 'weights', 0.73],
    ['73%', 'scores', null],
    ['−1.5', 'scaled', -1.5],
    ['-2', 'scores', -2],
    ['', 'scores', null],
    ['abc', 'scores', null],
    ['1.2.3', 'scores', null],
  ] as [string, Stage, number | null][])('%j (%s) → %j', (raw, stage, expected) => expect(parseEntry(raw, stage)).toBe(expected));
});
