import { describe, expect, it } from 'vitest';
import { buildSubmission, isAnswered, scoreItem, type Item } from '@/lib/assessment';
import type { Example } from '@/lib/compute';

const choice: Item = { id: 'c', goal: 'prereq', kind: 'choice', prompt: '', options: ['a', 'b', "I don't know"], correct: 1 };
const background: Item = { id: 'bg', goal: 'background', kind: 'choice', prompt: '', options: ['yes', 'no'], correct: null };
const match: Item = { id: 'm', goal: 'LG1', kind: 'match', prompt: '', options: ['x', 'y', 'z'], rows: [{ label: 'Q', correct: 2 }, { label: 'K', correct: 0 }] };
const number: Item = { id: 'n', goal: 'LG2', kind: 'number', prompt: '', fields: [{ label: 'w', answer: 0.893, tol: 0.02, percent: true }] };
const text: Item = { id: 't', goal: 'LG1', kind: 'text', prompt: '', rubric: [{ id: 'a', text: '' }, { id: 'b', text: '' }] };
const ex: Example = { q: [0, 2], tokens: [{ word: 'a', k: [1, 1], v: [1, 0] }, { word: 'b', k: [2, 0], v: [0, 1] }, { word: 'c', k: [1, 2], v: [1, 1] }] };
const compute: Item = { id: 'x', goal: 'LG2', kind: 'compute', prompt: '', example: ex };

describe('scoreItem', () => {
  it('choice: 1 for the right option, 0 otherwise; background is not scored', () => {
    expect(scoreItem(choice, { choice: 1 })).toEqual({ score: 1, max: 1 });
    expect(scoreItem(choice, { choice: 2 })).toEqual({ score: 0, max: 1 });
    expect(scoreItem(choice, {})).toEqual({ score: 0, max: 1 });
    expect(scoreItem(background, { choice: 0 })).toEqual({ score: null, max: 0 });
  });

  it('match: one point per row', () => {
    expect(scoreItem(match, { picks: [2, 1] })).toEqual({ score: 1, max: 2 });
    expect(scoreItem(match, { picks: [2, 0] })).toEqual({ score: 2, max: 2 });
  });

  it('number: tolerance, decimal comma and percent', () => {
    for (const raw of ['0.89', '0,9', '89 %', ' 0.88 ']) expect(scoreItem(number, { raw: [raw] }).score).toBe(1);
    for (const raw of ['0.95', '1', 'abc', '']) expect(scoreItem(number, { raw: [raw] }).score).toBe(0);
    expect(scoreItem(number, { raw: ['0.89'], dontKnow: true }).score).toBe(0);
  });

  it('compute: one point per cell; the output is checked against the learner\'s own weights', () => {
    expect(scoreItem(compute, { raw: ['0.19', '0.05', '0.77', '0.96', '0.82'] })).toEqual({ score: 5, max: 5 });
    // Wrong weights (unscaled), but the output follows from them: only the output cells count.
    expect(scoreItem(compute, { raw: ['0.12', '0.02', '0.87', '0.99', '0.89'] }).score).toBe(2);
    expect(scoreItem(compute, { raw: ['19 %', '5%', '77%', '0.96', '0.82'] }).score).toBe(5);
  });

  it('text: left for the rubric scorers', () => {
    expect(scoreItem(text, { text: 'anything' })).toEqual({ score: null, max: 2 });
  });
});

describe('isAnswered', () => {
  it('needs every part, or "I don\'t know"', () => {
    expect(isAnswered(choice, {})).toBe(false);
    expect(isAnswered(choice, { choice: 0 })).toBe(true);
    expect(isAnswered(match, { picks: [1, null] })).toBe(false);
    expect(isAnswered(match, { picks: [1, 0] })).toBe(true);
    expect(isAnswered(compute, { raw: ['1', '2', '3', '4'] })).toBe(false);
    expect(isAnswered(compute, { dontKnow: true })).toBe(true);
    expect(isAnswered(text, { text: '  ' })).toBe(false);
  });
});

describe('buildSubmission', () => {
  it('scores by goal, counts rubric points as pending, and keeps answers and times', () => {
    const items = [background, choice, match, number, text];
    const sub = buildSubmission('pre', items, { c: { choice: 1 }, m: { picks: [2, 2] }, t: { text: 'hi' } }, { c: { first: 100, last: 900 } }, 5000);
    expect(sub.byGoal.prereq).toEqual({ score: 1, max: 1, pending: 0 });
    expect(sub.byGoal.LG1).toEqual({ score: 1, max: 2, pending: 2 });
    expect(sub.byGoal.LG2).toEqual({ score: 0, max: 1, pending: 0 });
    expect(sub.byGoal.background).toEqual({ score: 0, max: 0, pending: 0 });
    expect(sub.items.find((i) => i.id === 'c')).toMatchObject({ answered: true, firstMs: 100, lastMs: 900 });
    expect(sub.items.find((i) => i.id === 'n')).toMatchObject({ answered: false, firstMs: null, score: 0 });
    expect(sub.msTotal).toBe(5000);
  });
});
