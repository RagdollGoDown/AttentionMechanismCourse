import { describe, expect, it } from 'vitest';
import { evaluate } from '@/lib/calc';

describe('calculator', () => {
  it.each([
    ['2+3*4', 14],
    ['(2+3)*4', 20],
    ['3/sqrt(2)', 3 / Math.SQRT2],
    ['exp(2.12)', Math.exp(2.12)],
    ['8.34/(8.34+4.11+16.92)', 8.34 / (8.34 + 4.11 + 16.92)],
    ['0.28×1 + 0.58×1', 0.86],
    ['6 ÷ 3', 2],
    ['√(2)', Math.SQRT2],
    ['eˣ(1)', Math.E],
    ['e^2', Math.E ** 2],
    ['2^3^2', 512],
    ['-2 + −1', -3],
    ['0,5*2', 1],
  ])('%j', (input, expected) => expect(evaluate(input)).toBeCloseTo(expected, 10));

  it.each(['', '2+', '(2', 'exp 2', 'alert(1)', '1/0', 'sqrt(-1)', '2 3'])('%j is unreadable', (input) => {
    expect(evaluate(input)).toBeNull();
  });
});
