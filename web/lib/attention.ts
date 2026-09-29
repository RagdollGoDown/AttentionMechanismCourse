export type Vec = [number, number];
export type Mat = [[number, number], [number, number]];

export function dot(a: Vec, b: Vec): number {
  return a[0] * b[0] + a[1] * b[1];
}

/** Row vector times matrix: x·W. */
export function project(x: Vec, W: Mat): Vec {
  return [x[0] * W[0][0] + x[1] * W[1][0], x[0] * W[0][1] + x[1] * W[1][1]];
}

/** Numerically stable softmax (subtracts the max before exponentiating). */
export function softmax(xs: number[]): number[] {
  if (xs.length === 0) return [];
  const m = Math.max(...xs);
  const e = xs.map((x) => Math.exp(x - m));
  const z = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / z);
}

export interface AttentionRow {
  scores: number[];
  weights: number[];
}

/** Attention of token `focus` over all tokens (itself included): softmax(q·k / √d_k). */
export function attentionRow(xs: Vec[], focus: number, WQ: Mat, WK: Mat): AttentionRow {
  if (focus < 0 || focus >= xs.length) throw new RangeError(`focus ${focus} out of range 0..${xs.length - 1}`);
  const q = project(xs[focus], WQ);
  const scale = Math.sqrt(q.length);
  const scores = xs.map((x) => dot(q, project(x, WK)) / scale);
  return { scores, weights: softmax(scores) };
}
