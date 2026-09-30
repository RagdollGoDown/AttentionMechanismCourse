/** Step 9 "Invent the rule": weight_i = top(s_i) ÷ bottom, built from bricks. */

export type TopId = 's' | 'square' | 'abs' | 'plus5' | 'pow2' | 'exp';
export type BottomId = 'one' | 'count' | 'sum' | 'max';

export const TOPS: Record<TopId, { label: string; f: (s: number) => number }> = {
  s: { label: 's', f: (s) => s },
  square: { label: 's²', f: (s) => s * s },
  abs: { label: '|s|', f: (s) => Math.abs(s) },
  plus5: { label: 's + 5', f: (s) => s + 5 },
  pow2: { label: '2ˢ', f: (s) => 2 ** s },
  exp: { label: 'eˢ', f: (s) => Math.exp(s) },
};

export const BOTTOMS: Record<BottomId, { label: string; f: (tops: number[]) => number }> = {
  one: { label: '1', f: () => 1 },
  count: { label: 'number of words', f: (t) => t.length },
  sum: { label: 'sum of all tops', f: (t) => t.reduce((a, b) => a + b, 0) },
  max: { label: 'largest top', f: (t) => Math.max(...t) },
};

export function applyRule(top: TopId, bottom: BottomId, scores: number[]): number[] {
  const tops = scores.map(TOPS[top].f);
  const d = BOTTOMS[bottom].f(tops);
  return tops.map((t) => t / d);
}

export interface RuleCheck {
  positive: boolean;
  sums: boolean;
  order: boolean;
}

export function checkRule(weights: number[], scores: number[]): RuleCheck {
  const finite = weights.every(Number.isFinite);
  const sum = weights.reduce((a, b) => a + b, 0);
  const order = scores.every((si, i) => scores.every((sj, j) => !(si > sj) || weights[i] > weights[j]));
  return {
    positive: finite && weights.every((w) => w > 0),
    sums: finite && Math.abs(sum - 1) < 0.005,
    order: finite && order,
  };
}

export const passes = (c: RuleCheck) => c.positive && c.sums && c.order;
