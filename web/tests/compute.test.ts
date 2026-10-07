import { describe, expect, it } from 'vitest';
import { PRACTICE_EXAMPLE, WORKED_EXAMPLE } from '@/content/steps';
import { STAGES, checkAll, fmt, learnerPath, parseEntry, stagesOf, type Entries, type Stage } from '@/lib/compute';

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

describe('learnerPath: the numbers on the page (recomputed by hand, rounded and carried forward)', () => {
  it.each([
    ['worked', WORKED_EXAMPLE, { scores: [4, 1, 2], scaled: [2.83, 0.71, 1.41], exps: [16.95, 2.03, 4.1], weights: [0.73, 0.09, 0.18], output: [0.91, 0.27] }],
    ['practice', PRACTICE_EXAMPLE, { scores: [3, 2, 4], scaled: [2.12, 1.41, 2.83], exps: [8.33, 4.1, 16.95], weights: [0.28, 0.14, 0.58], output: [0.86, 0.72] }],
  ] as const)('%s', (_, ex, expected) => expect(learnerPath(ex)).toEqual(expected));

  it('each stage follows from the one before, as a calculator would give it', () => {
    for (const ex of [WORKED_EXAMPLE, PRACTICE_EXAMPLE]) {
      const p = learnerPath(ex);
      p.scaled.forEach((x, i) => expect(x).toBeCloseTo(p.scores[i] / Math.SQRT2, 2));
      p.exps.forEach((x, i) => expect(x).toBeCloseTo(Math.exp(p.scaled[i]), 2));
      expect(p.weights.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
    }
  });

  it('is accepted by the check (the "Show me" answers pass)', () => {
    const v = checkAll(PRACTICE_EXAMPLE, learnerPath(PRACTICE_EXAMPLE));
    expect(STAGES.every((s) => v[s].every(Boolean))).toBe(true);
  });
});

describe('checkAll', () => {
  const ex = PRACTICE_EXAMPLE;
  const exact = stagesOf(ex);
  /** A learner who rounds each stage to 2 decimals and carries the rounded numbers forward. */
  function carried(scores: number[]): Entries {
    const scaled = rounded(scores.map((x) => x / Math.SQRT2));
    const exps = rounded(scaled.map(Math.exp));
    const sum = exps.reduce((a, b) => a + b, 0);
    const weights = rounded(exps.map((e) => e / sum));
    const output = rounded([0, 1].map((d) => ex.tokens.reduce((acc, t, i) => acc + weights[i] * t.v[d], 0)));
    return { scores, scaled, exps, weights, output };
  }
  const allTrue = (v: Record<Stage, boolean[]>) => STAGES.every((s) => v[s].every(Boolean));

  it('accepts the exact values', () => {
    expect(allTrue(checkAll(ex, exact))).toBe(true);
  });

  it('accepts a learner who rounds and carries the rounded numbers forward', () => {
    expect(allTrue(checkAll(ex, carried([3, 2, 4])))).toBe(true);
  });

  it('marks only the cell of an early slip, judging later cells on the learner\'s own numbers', () => {
    const v = checkAll(ex, carried([3, 5, 4])); // 2nd score wrong, the rest computed from it
    expect(v.scores).toEqual([true, false, true]);
    for (const s of ['scaled', 'exps', 'weights', 'output'] as Stage[]) expect(v[s].every(Boolean), s).toBe(true);
  });

  it('rejects common mistakes', () => {
    // Forgot to scale: exponentiate the raw scores.
    expect(checkAll(ex, { ...exact, exps: [Math.exp(3), Math.exp(2), Math.exp(4)] }).exps).toEqual([false, false, false]);
    // Divided by 2 instead of √2.
    expect(checkAll(ex, { ...exact, scaled: [1.5, 1, 2] }).scaled).toEqual([false, false, false]);
    // Weights from the scores, not from eˣ (no softmax).
    expect(checkAll(ex, { ...exact, weights: [3 / 9, 2 / 9, 4 / 9] }).weights.every(Boolean)).toBe(false);
    // Missing entry.
    expect(checkAll(ex, { ...exact, scores: [3, null, 4] }).scores).toEqual([true, false, true]);
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
