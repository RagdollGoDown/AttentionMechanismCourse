import { describe, expect, it } from 'vitest';
import { attentionRow, dot, project, softmax, type Mat } from '@/lib/attention';

const I: Mat = [[1, 0], [0, 1]];

describe('dot / project', () => {
  it('dot multiplies and sums', () => expect(dot([1, 2], [3, 4])).toBe(11));
  it('project computes the row vector x·W', () => expect(project([1, 2], [[1, 2], [3, 4]])).toEqual([7, 10]));
});

describe('softmax', () => {
  it('sums to 1', () => {
    const w = softmax([0.3, -1.2, 2.5, 0]);
    expect(w.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
  });
  it('is shift-invariant', () => {
    const a = softmax([1, 2, 3]);
    const b = softmax([101, 102, 103]);
    a.forEach((v, i) => expect(v).toBeCloseTo(b[i], 12));
  });
  it('is numerically stable for large inputs', () => expect(softmax([1000, 1000])).toEqual([0.5, 0.5]));
  it('returns [] for []', () => expect(softmax([])).toEqual([]));
  it('handles negative scores (weights stay positive)', () => {
    softmax([-3, -1, -2]).forEach((w) => expect(w).toBeGreaterThan(0));
  });
});

describe('attentionRow', () => {
  it('matches a hand-computed 3-token example (d_k = 2)', () => {
    // q = [1,0]; raw scores = [1, 0, 1]; weights = softmax(scores/√2) = e^.7071 / (2e^.7071 + 1) etc.
    const { scores, weights } = attentionRow([[1, 0], [0, 1], [1, 1]], 0, I, I);
    expect(scores[0]).toBe(1);
    expect(scores[1]).toBeCloseTo(0, 10);
    expect(weights[0]).toBeCloseTo(0.40111, 4);
    expect(weights[1]).toBeCloseTo(0.19778, 4);
    expect(weights[2]).toBeCloseTo(0.40111, 4);
  });
  it('gives weight 1 to a lone token', () => {
    expect(attentionRow([[1.2, 1.2]], 0, I, I).weights).toEqual([1]);
  });
  it('throws on an out-of-range focus', () => {
    expect(() => attentionRow([[1, 0]], 3, I, I)).toThrow(RangeError);
  });
});
