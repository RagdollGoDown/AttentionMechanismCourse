import { describe, expect, it } from 'vitest';
import { CONTRAST_TASK, EXPLAIN_TASKS, FORMULA_TASK, TUTOR_MISSIONS } from '@/content/missions';
import { FOCUS, SENTENCE_A, SENTENCE_B } from '@/content/sentences';
import { DOT_PLOT, HAND_DOT, LAB_ORDER, STEP_ORDER, VECTORS_TEXT, dotPlotMin } from '@/content/steps';
import { EMBEDDINGS } from '@/content/vectors';
import { dot, type Vec } from '@/lib/attention';
import { applyChange, toTiles, topKey, weightsFor } from '@/lib/tiles';

const setup = (id: 'remove') => {
  const m = TUTOR_MISSIONS[id];
  const before = toTiles(m.before);
  const after = applyChange(before, m.change);
  const focusKey = before[m.focusIndex].key;
  return { m, before, after, focusKey };
};

describe('mission content', () => {
  it('flow order', () => {
    expect(STEP_ORDER).toEqual(['welcome', 'consent', 'pretest', 'hook', 'why', 'vectors', 'lab', 'formula', 'compute', 'explain', 'posttest', 'reflection']);
    expect(LAB_ORDER).toEqual(['contrast', 'qk', 'remove', 'rule', 'softmax']);
  });

  it.each(Object.values(EXPLAIN_TASKS))('$id: ids unique; no g-flag regexes', (t) => {
    const all = [...t.rubric, ...t.misconceptions];
    expect(new Set(all.map((r) => r.id)).size).toBe(all.length);
    all.forEach((r) => expect(r.keywords.flags).not.toContain('g'));
  });

  it('only the formula task may name the formula', () => {
    expect(FORMULA_TASK.formulaTaught).toBe(true);
    expect(CONTRAST_TASK.formulaTaught).toBeFalsy();
    expect(TUTOR_MISSIONS.remove.formulaTaught).toBeFalsy();
  });

  it.each(['remove'] as const)('%s: focusIndex points at model; ids unique; no g-flag regexes', (id) => {
    const { m } = setup(id);
    expect(m.before[m.focusIndex]).toBe('model');
    const ids = [...m.rubric, ...m.misconceptions].map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    [...m.rubric, ...m.misconceptions].forEach((r) => expect(r.keywords.flags).not.toContain('g'));
  });

  // The contrast expert answer and rubric quote these facts: the top word per sentence, and that the
  // word right next to "model" gets less weight than it.
  it.each([
    [SENTENCE_A, 'fashion show', 'smiled'],
    [SENTENCE_B, 'training run', 'predicted'],
  ])('contrast: in "%s", "model" listens most to "%s"; the neighbour "%s" gets less', (sentence, top, neighbour) => {
    const tiles = toTiles(sentence);
    const focus = sentence.indexOf(FOCUS);
    expect(tiles.find((t) => t.key === topKey(tiles, String(focus)))?.word).toBe(top);
    expect(sentence[focus + 1]).toBe(neighbour);
    const { weights } = weightsFor(tiles, String(focus));
    expect(weights[focus + 1]).toBeLessThan(weights[sentence.indexOf(top)]);
    expect(CONTRAST_TASK.expertAnswer).toContain(`"${top}"`);
    expect(CONTRAST_TASK.expertAnswer).toContain(`"${neighbour}"`);
  });

  it('remove: every remaining weight rises; the “fashion show” score is unchanged; the gain is visible', () => {
    const { m, before, after, focusKey } = setup('remove');
    const wb = weightsFor(before, focusKey);
    const wa = weightsFor(after, focusKey);
    after.forEach((t) => {
      const i = before.findIndex((b) => b.key === t.key);
      expect(wa.weights[after.indexOf(t)]).toBeGreaterThan(wb.weights[i]);
    });
    expect(wa.scores[2]).toBeCloseTo(wb.scores[2], 12);
    expect(wa.weights[2] - wb.weights[2]).toBeGreaterThan(0.05);
    expect(m.prediction.kind === 'choice' && m.prediction.correct).toBe('It went up');
  });

});

describe('displayed percentages', () => {
  it.each(['remove'] as const)('%s: bars add up to 100 before and after', async (id) => {
    const { percentages } = await import('@/lib/tiles');
    const { before, after, focusKey } = setup(id);
    for (const t of [before, after]) expect(percentages(weightsFor(t, focusKey).weights).reduce((a, b) => a + b, 0)).toBe(100);
  });
});

it('remove: the “smiled” share quoted in the texts matches its bar', async () => {
  const { percentages } = await import('@/lib/tiles');
  const { m, before, focusKey } = setup('remove');
  const shown = `about ${percentages(weightsFor(before, focusKey).weights)[5]} %`;
  expect(m.expertAnswer).toContain(shown);
  expect(m.rubric.find((r) => r.id === 'freed')!.probe).toContain(shown);
});

describe('warm-up: words as vectors', () => {
  const { a, bStart, grid } = DOT_PLOT;
  const points: Vec[] = [];
  for (let x = -grid; x <= grid; x++) for (let y = -grid; y <= grid; y++) points.push([x, y]);

  it('dot plot: a · b = 0 is reachable with a non-zero b, and b does not start on a finished task', () => {
    expect(points.some((p) => (p[0] !== 0 || p[1] !== 0) && dot(a, p) === 0)).toBe(true);
    expect(dot(a, bStart)).not.toBe(0);
    expect(dot(a, bStart)).not.toBe(dotPlotMin());
  });

  it('dot plot: the most negative value is below zero', () => {
    expect(dotPlotMin()).toBeLessThan(0);
  });

  it('hand computation: the shown solution matches the math', () => {
    expect(dot(HAND_DOT.a, HAND_DOT.b)).toBe(5);
    expect(VECTORS_TEXT.dot.handSolution).toContain(`= ${dot(HAND_DOT.a, HAND_DOT.b)}`);
  });

  it('punchline: "model" sits between the two groups (it matches "dress" about as much as "data")', () => {
    const m = EMBEDDINGS.model;
    expect(Math.abs(dot(m, EMBEDDINGS.dress) - dot(m, EMBEDDINGS.data))).toBeLessThan(0.5);
  });
});
