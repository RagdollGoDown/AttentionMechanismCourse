import { describe, expect, it } from 'vitest';
import { dot, project, softmax } from '@/lib/attention';
import { DONT_KNOW, scoreItem, type ChoiceItem, type ComputeItem, type Item } from '@/lib/assessment';
import { learnerPath, stagesOf, fmt } from '@/lib/compute';
import { PRACTICE_EXAMPLE, WORKED_EXAMPLE } from '@/content/steps';
import {
  DOT, MATMUL, MATMUL_OPTIONS, POST_EXAMPLE, POST_REMOVE, POSTTEST_ITEMS, PRE_REMOVE, PRE_WEIGHT, PRETEST_ITEMS,
  PROB_OPTIONS, SWAP, preWeightAnswer, vecText,
} from '@/content/tests';

const byId = (items: Item[], id: string) => {
  const item = items.find((i) => i.id === id);
  if (!item) throw new Error(`no item ${id}`);
  return item;
};

describe.each([['pre', PRETEST_ITEMS], ['post', POSTTEST_ITEMS]] as const)('%s-test structure', (_, items) => {
  it('has unique item ids', () => {
    expect(new Set(items.map((i) => i.id)).size).toBe(items.length);
  });

  it('every scored choice points at a real option, and options are distinct', () => {
    for (const i of items.filter((x): x is ChoiceItem => x.kind === 'choice')) {
      expect(new Set(i.options).size).toBe(i.options.length);
      if (i.goal === 'background') expect(i.correct).toBeNull();
      else {
        expect(i.correct).not.toBeNull();
        expect(i.options[i.correct!]).toBeDefined();
        expect(i.options[i.correct!]).not.toBe(DONT_KNOW);
      }
    }
  });

  it('knowledge choices offer "I don\'t know", to cut guessing', () => {
    for (const i of items) {
      if ((i.kind === 'choice' && i.goal !== 'background') || i.kind === 'match') expect(i.options).toContain(DONT_KNOW);
    }
  });

  it('covers LG1, LG2 and LG3', () => {
    for (const g of ['LG1', 'LG2', 'LG3']) expect(items.some((i) => i.goal === g)).toBe(true);
  });
});

describe('pre-test', () => {
  it('is short and scored automatically, so the condition can be assigned right away', () => {
    expect(PRETEST_ITEMS.length).toBeLessThanOrEqual(10);
    expect(PRETEST_ITEMS.some((i) => i.kind === 'text')).toBe(false);
  });

  it('checks the prerequisites named in M3 and asks about prior exposure', () => {
    for (const id of ['pre-dot', 'pre-matmul', 'pre-prob', 'pre-embedding', 'pre-softmax']) expect(byId(PRETEST_ITEMS, id).goal).toBe('prereq');
    expect(byId(PRETEST_ITEMS, 'bg-attention').goal).toBe('background');
  });

  it('dot product answer is computed', () => {
    const item = byId(PRETEST_ITEMS, 'pre-dot');
    expect(item.kind === 'number' && item.fields[0].answer).toBe(dot(DOT.a, DOT.b));
    expect(item.prompt).toContain(vecText(DOT.a));
  });

  it('matrix item: the right option is x·W and no distractor equals it', () => {
    const item = byId(PRETEST_ITEMS, 'pre-matmul') as ChoiceItem;
    expect(item.options[item.correct!]).toBe(vecText(project(MATMUL.x, MATMUL.W)));
    const right = vecText(MATMUL_OPTIONS[0]);
    expect(new Set(MATMUL_OPTIONS.map(vecText)).size).toBe(MATMUL_OPTIONS.length);
    expect(item.options.filter((o) => o === right)).toHaveLength(1);
  });

  it('probability item: exactly one option is a distribution, and it is the right one', () => {
    const valid = PROB_OPTIONS.map((o) => {
      const xs = o.split(',').map((x) => Number(x.trim().replace('−', '-')));
      return xs.every((x) => x >= 0) && Math.abs(xs.reduce((a, b) => a + b, 0) - 1) < 1e-9;
    });
    expect(valid.filter(Boolean)).toHaveLength(1);
    expect(valid.indexOf(true)).toBe((byId(PRETEST_ITEMS, 'pre-prob') as ChoiceItem).correct);
  });

  it('weight item tells apart scaled attention, no scaling, and a plain ratio of scores', () => {
    const scores = PRE_WEIGHT.keys.map((k) => dot(PRE_WEIGHT.q, k));
    const right = preWeightAnswer();
    const noScale = softmax(scores)[0];
    const ratio = scores[0] / scores.reduce((a, b) => a + b, 0);
    const tol = 0.02;
    expect(Math.abs(right - noScale)).toBeGreaterThan(2 * tol);
    expect(Math.abs(right - ratio)).toBeGreaterThan(2 * tol);
    expect(right).toBeCloseTo(0.893, 3);
  });
});

describe('post-test', () => {
  it('has the M3 items: Q/K/V and softmax and one scaling item (LG1), a calculation (LG2), a new ambiguous word (LG3)', () => {
    expect(byId(POSTTEST_ITEMS, 'post-softmax').goal).toBe('LG1');
    expect(byId(POSTTEST_ITEMS, 'post-scale').goal).toBe('LG1');
    expect(byId(POSTTEST_ITEMS, 'post-compute').kind).toBe('compute');
    expect(byId(POSTTEST_ITEMS, 'post-swap').prompt + byId(POSTTEST_ITEMS, 'post-swap').figure).not.toMatch(/\bmodel\b/);
  });

  it('every open answer has a rubric', () => {
    for (const i of POSTTEST_ITEMS) if (i.kind === 'text') expect(i.rubric.length).toBeGreaterThan(0);
  });

  it('the calculation uses new numbers, not the lesson\'s examples', () => {
    for (const ex of [WORKED_EXAMPLE, PRACTICE_EXAMPLE]) expect(POST_EXAMPLE).not.toEqual(ex);
    expect(new Set(stagesOf(POST_EXAMPLE).scores).size).toBe(3);
  });

  it('the calculation catches a forgotten √dₖ', () => {
    const scaled = stagesOf(POST_EXAMPLE).weights;
    const unscaled = softmax(stagesOf(POST_EXAMPLE).scores);
    expect(Math.max(...scaled.map((w, i) => Math.abs(w - unscaled[i])))).toBeGreaterThan(0.05);
  });

  it('following the lesson\'s rounding earns full marks; the unscaled answer does not', () => {
    const item = byId(POSTTEST_ITEMS, 'post-compute') as ComputeItem;
    const p = learnerPath(POST_EXAMPLE);
    expect(scoreItem(item, { raw: [...p.weights, ...p.output].map(fmt) })).toEqual({ score: 5, max: 5 });
    const w = softmax(stagesOf(POST_EXAMPLE).scores);
    expect(scoreItem(item, { raw: w.map(fmt).concat(['0', '0']) }).score).toBeLessThan(3);
  });

  it('LG3 swap: the answer is a word of sentence B, and "bank" is the ambiguous word in both', () => {
    expect(SWAP.after.split(' ')).toContain(SWAP.answer);
    expect(SWAP.before).toContain('bank');
    expect(SWAP.after).toContain('bank');
  });
});

describe('twins (pre ↔ post)', () => {
  it('the Q/K/V match is the very same item in both tests', () => {
    expect(byId(POSTTEST_ITEMS, 'qkv-match')).toBe(byId(PRETEST_ITEMS, 'qkv-match'));
  });

  it('the Q/K/V answers are not simply in row order', () => {
    const m = byId(PRETEST_ITEMS, 'qkv-match');
    if (m.kind !== 'match') throw new Error('not a match item');
    const correct = m.rows.map((r) => r.correct);
    expect(new Set(correct).size).toBe(3);
    expect(correct).not.toEqual([0, 1, 2]);
  });

  it('every twin id appears in both tests', () => {
    const twins = (items: Item[]) => new Set(items.map((i) => i.twin).filter(Boolean));
    expect(twins(PRETEST_ITEMS)).toEqual(twins(POSTTEST_ITEMS));
  });

  it.each([['pre', PRE_REMOVE, PRETEST_ITEMS, 'pre-remove'], ['post', POST_REMOVE, POSTTEST_ITEMS, 'post-remove']] as const)(
    '%s removal: the freed share raises the other weight ("It goes up")',
    (_, r, items, id) => {
      const after = r.other / (100 - r.removed);
      expect(after * 100).toBeGreaterThan(r.other);
      const item = byId([...items], id) as ChoiceItem;
      expect(item.options[item.correct!]).toBe('It goes up');
    },
  );
});
