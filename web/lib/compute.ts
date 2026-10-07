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

/** One verdict per entry. */
export function checkStage(ex: Example, stage: Stage, entries: (number | null)[]): boolean[] {
  const exact = stagesOf(ex)[stage];
  return exact.map((x, i) => {
    const e = entries[i];
    return e !== null && e !== undefined && Math.abs(e - x) <= TOLERANCE[stage](x);
  });
}

/** 2-decimal display, trailing zeros kept (0.70, not 0.7), so every column reads the same. */
export const fmt = (x: number) => x.toFixed(2);
export const fmtVec = (v: number[]) => `[${v.map(fmt).join(', ')}]`;
