import { dot, softmax, type Vec } from '@/lib/attention';

/** A 3-token attention example with dₖ = 2: one query, and a key and a value per word. */
export interface Example {
  q: Vec;
  tokens: { word: string; k: Vec; v: Vec }[];
}

/** The five stages of softmax(q·Kᵀ/√dₖ)·V, in the order learners compute them. */
export const STAGES = ['scores', 'scaled', 'exps', 'weights', 'output'] as const;
export type Stage = (typeof STAGES)[number];

/** Every intermediate number of the example (unrounded). `output` has 2 entries, the others one per word. */
export function stagesOf(ex: Example): Record<Stage, number[]> {
  const scores = ex.tokens.map((t) => dot(ex.q, t.k));
  const scaled = scores.map((s) => s / Math.sqrt(ex.q.length));
  const exps = scaled.map(Math.exp);
  const weights = softmax(scaled);
  const output = [0, 1].map((d) => ex.tokens.reduce((sum, t, i) => sum + weights[i] * t.v[d], 0));
  return { scores, scaled, exps, weights, output };
}

const round2 = (x: number) => Math.round(x * 100) / 100;

/**
 * The numbers a learner gets by following the instructions: each stage rounded to 2 decimals and the
 * rounded numbers carried into the next one. This is what the page shows (worked example, "Show me"),
 * so a learner who redoes it on the calculator finds the same numbers.
 */
export function learnerPath(ex: Example): Record<Stage, number[]> {
  const scores = ex.tokens.map((t) => dot(ex.q, t.k));
  const scaled = scores.map((s) => round2(s / Math.sqrt(ex.q.length)));
  const exps = scaled.map((x) => round2(Math.exp(x)));
  const sum = exps.reduce((a, b) => a + b, 0);
  const weights = exps.map((e) => round2(e / sum));
  const output = [0, 1].map((d) => round2(ex.tokens.reduce((acc, t, i) => acc + weights[i] * t.v[d], 0)));
  return { scores, scaled, exps, weights, output };
}

/**
 * How far an entry may be from the exact value. Learners round each stage to 2 decimals and carry
 * their rounded numbers forward, so later stages need a little more room than the rounding itself.
 */
const TOLERANCE: Record<Stage, (exact: number) => number> = {
  scores: () => 0.001, // whole numbers
  scaled: () => 0.02,
  exps: (x) => Math.max(0.02, 0.015 * Math.abs(x)), // eˣ amplifies the rounding of x
  weights: () => 0.02,
  output: () => 0.03,
};

/** "0,73", " 0.73 ", "73 %" → number. Percentages are accepted for weights only. Unreadable → null. */
export function parseEntry(raw: string, stage: Stage): number | null {
  const s = raw.trim().replace(',', '.').replace(/\s/g, '');
  const pct = s.endsWith('%');
  const body = pct ? s.slice(0, -1) : s;
  if (!/^[-−]?\d*\.?\d+$/.test(body)) return null;
  const n = Number(body.replace('−', '-'));
  if (pct) return stage === 'weights' ? n / 100 : null;
  return n;
}

export type Entries = Record<Stage, (number | null)[]>;

/**
 * One verdict per cell of the whole table. Each stage is checked against what follows from the
 * learner's own previous stage (their own numbers carried forward), so one early slip marks only
 * the cell where it happened, not every cell after it. A missing earlier entry falls back to the exact value.
 */
export function checkAll(ex: Example, entries: Entries): Record<Stage, boolean[]> {
  const exact = stagesOf(ex);
  const own = (stage: Stage) => exact[stage].map((x, i) => entries[stage][i] ?? x);
  const scores = own('scores');
  const scaled = own('scaled');
  const exps = own('exps');
  const sumExps = exps.reduce((a, b) => a + b, 0);
  const weights = own('weights');
  const expected: Record<Stage, number[]> = {
    scores: exact.scores,
    scaled: scores.map((s) => s / Math.sqrt(ex.q.length)),
    exps: scaled.map(Math.exp),
    weights: exps.map((e) => e / sumExps),
    output: [0, 1].map((d) => ex.tokens.reduce((sum, t, i) => sum + weights[i] * t.v[d], 0)),
  };
  return Object.fromEntries(STAGES.map((stage) => [stage, expected[stage].map((x, i) => {
    const e = entries[stage][i];
    return e !== null && e !== undefined && Math.abs(e - x) <= TOLERANCE[stage](x);
  })])) as Record<Stage, boolean[]>;
}

/** 2-decimal display, trailing zeros kept (0.70, not 0.7), so every column reads the same. */
export const fmt = (x: number) => x.toFixed(2);
export const fmtVec = (v: number[]) => `[${v.map(fmt).join(', ')}]`;
