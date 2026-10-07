import { checkAll, parseEntry, type Example } from '@/lib/compute';

/** Pre-test (own page, before the condition is assigned) and post-test (last lesson step). */
export type TestId = 'pre' | 'post';
/** What an item measures. `background` items are asked, never scored. */
export type Goal = 'background' | 'prereq' | 'LG1' | 'LG2' | 'LG3';
export const GOALS: Goal[] = ['background', 'prereq', 'LG1', 'LG2', 'LG3'];

export const DONT_KNOW = "I don't know";

interface BaseItem {
  id: string;
  goal: Goal;
  prompt: string;
  /** Preformatted block under the prompt (a matrix, a sentence pair). */
  figure?: string;
  /** Items that measure the same thing in both tests share a twin id, for pre → post comparisons. */
  twin?: string;
}

export interface ChoiceItem extends BaseItem {
  kind: 'choice';
  options: string[];
  /** Index of the right option; null for background items. */
  correct: number | null;
  /** Options are vectors or numbers: shown in a monospace font. */
  mono?: boolean;
}

/** Each row gets one option from a shared list. One point per row. */
export interface MatchItem extends BaseItem {
  kind: 'match';
  rows: { label: string; correct: number }[];
  options: string[];
}

/** One or more numbers, each checked with a tolerance. One point per field. */
export interface NumberItem extends BaseItem {
  kind: 'number';
  fields: { label: string; answer: number; tol: number; /** "89 %" is read as 0.89. */ percent?: boolean }[];
  calculator?: boolean;
}

/** LG2: the weights and the output of a 3-token example. One point per cell, output checked against the learner's own weights. */
export interface ComputeItem extends BaseItem {
  kind: 'compute';
  example: Example;
}

/** Open answer, scored later by hand with the rubric (one point per idea). */
export interface TextItem extends BaseItem {
  kind: 'text';
  rubric: { id: string; text: string }[];
  /** Notes for the scorers: answers that show a known misconception. */
  misconceptions?: string[];
}

export type Item = ChoiceItem | MatchItem | NumberItem | ComputeItem | TextItem;

/** A learner's answer. Only the fields of the item's kind are used. */
export interface Answer {
  choice?: number | null;
  picks?: (number | null)[];
  /** Raw text of each number field; for `compute`: the 3 weights, then the 2 output numbers. */
  raw?: string[];
  text?: string;
  dontKnow?: boolean;
}

export interface ItemResult {
  /** null: not scored automatically (background, or rubric scoring later). */
  score: number | null;
  max: number;
}

const COMPUTE_CELLS = 5;

function computeVerdicts(ex: Example, raw: string[]): boolean[] {
  const none = ex.tokens.map(() => null);
  const verdict = checkAll(ex, {
    scores: none,
    scaled: none,
    exps: none,
    weights: ex.tokens.map((_, i) => parseEntry(raw[i] ?? '', 'weights')),
    output: [0, 1].map((d) => parseEntry(raw[ex.tokens.length + d] ?? '', 'output')),
  });
  return [...verdict.weights, ...verdict.output];
}

export function scoreItem(item: Item, a: Answer = {}): ItemResult {
  switch (item.kind) {
    case 'choice':
      return item.correct === null ? { score: null, max: 0 } : { score: a.choice === item.correct ? 1 : 0, max: 1 };
    case 'match':
      return { score: item.rows.filter((r, i) => a.picks?.[i] === r.correct).length, max: item.rows.length };
    case 'number':
      if (a.dontKnow) return { score: 0, max: item.fields.length };
      return {
        score: item.fields.filter((f, i) => {
          // parseEntry accepts "%" only for weights, so percent fields are read as weights.
          const n = parseEntry(a.raw?.[i] ?? '', f.percent ? 'weights' : 'output');
          return n !== null && Math.abs(n - f.answer) <= f.tol;
        }).length,
        max: item.fields.length,
      };
    case 'compute':
      if (a.dontKnow) return { score: 0, max: COMPUTE_CELLS };
      return { score: computeVerdicts(item.example, a.raw ?? []).filter(Boolean).length, max: COMPUTE_CELLS };
    case 'text':
      return { score: null, max: item.rubric.length };
  }
}

/** Has the learner given an answer (or said "I don't know")? Used to warn before submitting. */
export function isAnswered(item: Item, a: Answer = {}): boolean {
  if (a.dontKnow) return true;
  switch (item.kind) {
    case 'choice':
      return a.choice !== undefined && a.choice !== null;
    case 'match':
      return item.rows.every((_, i) => a.picks?.[i] !== undefined && a.picks?.[i] !== null);
    case 'number':
      return item.fields.every((_, i) => (a.raw?.[i] ?? '').trim() !== '');
    case 'compute':
      return Array.from({ length: COMPUTE_CELLS }, (_, i) => (a.raw?.[i] ?? '').trim() !== '').every(Boolean);
    case 'text':
      return (a.text ?? '').trim() !== '';
  }
}

export interface GoalScore {
  /** Points from automatically scored items. */
  score: number;
  max: number;
  /** Points still to be scored by hand (open answers). */
  pending: number;
}

export interface SubmittedItem extends ItemResult {
  id: string;
  goal: Goal;
  kind: Item['kind'];
  twin: string | null;
  answer: Answer;
  answered: boolean;
  /** ms since the test opened: first and last time the learner touched this item. */
  firstMs: number | null;
  lastMs: number | null;
}

export interface Submission {
  test: TestId;
  msTotal: number;
  items: SubmittedItem[];
  byGoal: Record<Goal, GoalScore>;
}

export function buildSubmission(
  test: TestId,
  items: readonly Item[],
  answers: Record<string, Answer>,
  times: Record<string, { first: number; last: number }>,
  msTotal: number,
): Submission {
  const submitted = items.map((item): SubmittedItem => {
    const answer = answers[item.id] ?? {};
    return {
      id: item.id,
      goal: item.goal,
      kind: item.kind,
      twin: item.twin ?? null,
      answer,
      answered: isAnswered(item, answer),
      ...scoreItem(item, answer),
      firstMs: times[item.id]?.first ?? null,
      lastMs: times[item.id]?.last ?? null,
    };
  });
  const byGoal = Object.fromEntries(GOALS.map((g) => [g, { score: 0, max: 0, pending: 0 }])) as Record<Goal, GoalScore>;
  for (const s of submitted) {
    if (s.goal === 'background') continue;
    if (s.score === null) byGoal[s.goal].pending += s.max;
    else {
      byGoal[s.goal].score += s.score;
      byGoal[s.goal].max += s.max;
    }
  }
  return { test, msTotal, items: submitted, byGoal };
}
