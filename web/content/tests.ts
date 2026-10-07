import { dot, project, softmax, type Mat, type Vec } from '@/lib/attention';
import { DONT_KNOW, type ChoiceItem, type ComputeItem, type Item, type MatchItem, type NumberItem, type TextItem } from '@/lib/assessment';
import type { Example } from '@/lib/compute';

/**
 * Pre-test and post-test (M3 §5.3, backward design).
 * Pre-test: prerequisites (mastery learning) and prior exposure, plus one short item per goal, so the
 * groups can be balanced and gains computed. Post-test: every goal on new material (new words, new numbers).
 * Every number below is computed from lib/attention.ts, never typed in; tests/content-tests.test.ts checks the claims.
 */

/** [3, −1] with a real minus sign, as in the rest of the lesson. */
export const vecText = (v: readonly number[]) => `[${v.map((n) => String(n).replace('-', '−')).join(', ')}]`;

const UP_DOWN_SAME = (stay: number) => ['It goes up', 'It goes down', `It stays at ${stay} %`, DONT_KNOW];

// ---------- Background (asked, not scored) ----------

const BG_ATTENTION: ChoiceItem = {
  id: 'bg-attention',
  goal: 'background',
  kind: 'choice',
  prompt: 'Have you studied the attention mechanism (the one inside Transformers) before?',
  options: [
    'No, I have never heard of it',
    "I have heard of it, but I don't know how it works",
    'Yes, in a course, a tutorial or a paper',
    'Yes, and I have implemented it',
  ],
  correct: null,
};

const BG_ML: ChoiceItem = {
  id: 'bg-ml',
  goal: 'background',
  kind: 'choice',
  prompt: 'Have you taken a machine learning course?',
  options: ['No', 'I am taking one this semester', 'Yes, I have finished one'],
  correct: null,
};

// ---------- Prerequisites ----------

export const DOT = { a: [3, -1] as Vec, b: [2, 4] as Vec };
const PRE_DOT: NumberItem = {
  id: 'pre-dot',
  goal: 'prereq',
  kind: 'number',
  prompt: `Compute the dot product ${vecText(DOT.a)} · ${vecText(DOT.b)}.`,
  fields: [{ label: 'Dot product', answer: dot(DOT.a, DOT.b), tol: 0.001 }],
};

export const MATMUL = { x: [1, 2] as Vec, W: [[3, 0], [1, 1]] as Mat };
/** Right answer x·W, then W·x (wrong order), then two slips. */
export const MATMUL_OPTIONS: Vec[] = [
  project(MATMUL.x, MATMUL.W),
  [MATMUL.W[0][0] * MATMUL.x[0] + MATMUL.W[0][1] * MATMUL.x[1], MATMUL.W[1][0] * MATMUL.x[0] + MATMUL.W[1][1] * MATMUL.x[1]],
  [MATMUL.x[0] * MATMUL.W[0][0], MATMUL.x[1] * MATMUL.W[1][1]],
  [5, 3],
];
const PRE_MATMUL: ChoiceItem = {
  id: 'pre-matmul',
  goal: 'prereq',
  kind: 'choice',
  prompt: `x = ${vecText(MATMUL.x)} is a row vector and W is the matrix below. What is x · W?`,
  figure: `W = | ${MATMUL.W[0].join('  ')} |\n    | ${MATMUL.W[1].join('  ')} |`,
  // Shown in a fixed shuffled order; the right answer is the third.
  options: [MATMUL_OPTIONS[1], MATMUL_OPTIONS[2], MATMUL_OPTIONS[0], MATMUL_OPTIONS[3]].map(vecText).concat(DONT_KNOW),
  correct: 2,
  mono: true,
};

export const PROB_OPTIONS = ['0.5, 0.5, 0.2', '0.6, 0.5, −0.1', '0.7, 0.2, 0.1', '1, 1, 1'];
const PRE_PROB: ChoiceItem = {
  id: 'pre-prob',
  goal: 'prereq',
  kind: 'choice',
  prompt: 'Which list could be a probability distribution over three outcomes?',
  options: [...PROB_OPTIONS, DONT_KNOW],
  correct: 2,
};

const PRE_EMBEDDING: ChoiceItem = {
  id: 'pre-embedding',
  goal: 'prereq',
  kind: 'choice',
  prompt: 'In a language model, what is the embedding of a word?',
  options: [
    'Its position in the sentence',
    'A vector of numbers that represents the word',
    'A list of words with the same meaning',
    'The probability that the word comes next',
    DONT_KNOW,
  ],
  correct: 1,
};

const PRE_SOFTMAX: ChoiceItem = {
  id: 'pre-softmax',
  goal: 'prereq',
  kind: 'choice',
  prompt: 'What does the softmax function do to a list of numbers?',
  options: [
    'It keeps the largest number and sets the others to 0',
    'It divides each number by the largest one',
    'It turns them into positive numbers that add up to 1, a larger input giving a larger output',
    'It sorts them from largest to smallest',
    DONT_KNOW,
  ],
  correct: 2,
};

// ---------- LG1: roles of Q, K, V (same item in both tests) ----------

const QKV_MATCH: MatchItem = {
  id: 'qkv-match',
  twin: 'qkv-match',
  goal: 'LG1',
  kind: 'match',
  prompt: 'In attention, each word gets a query, a key and a value. Match each one to its role.',
  options: [
    'Where the word sits in the sentence',
    'What the word passes on to the words that attend to it',
    'What the word is looking for in the other words',
    'What the word offers, to be compared with what the others look for',
    DONT_KNOW,
  ],
  rows: [
    { label: 'Query', correct: 2 },
    { label: 'Key', correct: 3 },
    { label: 'Value', correct: 1 },
  ],
};

// ---------- LG2: compute ----------

/** Pre-test: one weight over two words. Scores 3 and 0 keep the scaled, unscaled and plain-ratio answers apart. */
export const PRE_WEIGHT = { q: [1, 0] as Vec, keys: [[3, 1], [0, 2]] as Vec[] };
export const preWeightAnswer = () => softmax(PRE_WEIGHT.keys.map((k) => dot(PRE_WEIGHT.q, k) / Math.SQRT2))[0];
const PRE_LG2: NumberItem = {
  id: 'pre-weight',
  twin: 'lg2-weights',
  goal: 'LG2',
  kind: 'number',
  prompt:
    `A word has the query q = ${vecText(PRE_WEIGHT.q)}. Two other words have the keys k₁ = ${vecText(PRE_WEIGHT.keys[0])} ` +
    `and k₂ = ${vecText(PRE_WEIGHT.keys[1])}, so dₖ = 2. With scaled dot-product attention, what weight does the word give ` +
    'to word 1? Give a number between 0 and 1.',
  fields: [{ label: 'Weight on word 1', answer: preWeightAnswer(), tol: 0.02, percent: true }],
  calculator: true,
};

/** Post-test: new numbers, different from the worked example and the practice in the lesson. */
export const POST_EXAMPLE: Example = {
  q: [0, 2],
  tokens: [
    { word: 'river', k: [1, 1], v: [1, 0] },
    { word: 'the', k: [2, 0], v: [0, 1] },
    { word: 'muddy', k: [1, 2], v: [1, 1] },
  ],
};
const POST_COMPUTE: ComputeItem = {
  id: 'post-compute',
  twin: 'lg2-weights',
  goal: 'LG2',
  kind: 'compute',
  prompt:
    `The word "bank" has the query q = ${vecText(POST_EXAMPLE.q)}. Compute its attention over the three words below ` +
    '(dₖ = 2). Give the three weights and the output vector. Round each step to 2 decimals.',
  example: POST_EXAMPLE,
};

// ---------- LG3: predict weight shifts ----------

/** Removing a word frees its share: the other word's weight goes up. Percentages before the removal. */
export const PRE_REMOVE = { removed: 45, other: 25 };
const PRE_LG3: ChoiceItem = {
  id: 'pre-remove',
  twin: 'lg3-remove',
  goal: 'LG3',
  kind: 'choice',
  prompt:
    `In one attention layer, the word "bat" in "the bat flew out of the cave" gives ${PRE_REMOVE.removed} % of its attention ` +
    `to "cave" and ${PRE_REMOVE.other} % to "flew". Now "cave" is removed from the sentence. What happens to the weight "bat" gives to "flew"?`,
  options: UP_DOWN_SAME(PRE_REMOVE.other),
  correct: 0,
};

export const POST_REMOVE = { removed: 50, other: 15 };
const POST_LG3_REMOVE: ChoiceItem = {
  id: 'post-remove',
  twin: 'lg3-remove',
  goal: 'LG3',
  kind: 'choice',
  prompt:
    `In one attention layer, the word "bank" in "she sat on the bank of the river" gives ${POST_REMOVE.removed} % of its ` +
    `attention to "river" and ${POST_REMOVE.other} % to "sat". Now "river" is removed from the sentence. What happens to the weight "bank" gives to "sat"?`,
  options: UP_DOWN_SAME(POST_REMOVE.other),
  correct: 0,
};

export const SWAP = {
  before: 'after the fishing trip the bank was quiet',
  after: 'after the robbery the bank was quiet',
  words: ['after', 'the', 'robbery', 'was', 'quiet'],
  answer: 'robbery',
};
const POST_LG3_SWAP: ChoiceItem = {
  id: 'post-swap',
  goal: 'LG3',
  kind: 'choice',
  prompt: 'In sentence B, "fishing trip" is replaced by "robbery". In sentence B, which word does "bank" give the most weight to?',
  figure: `A: ${SWAP.before}\nB: ${SWAP.after}`,
  options: [...SWAP.words, DONT_KNOW],
  correct: SWAP.words.indexOf(SWAP.answer),
};

const POST_LG3_EXPLAIN: TextItem = {
  id: 'post-swap-explain',
  goal: 'LG3',
  kind: 'text',
  prompt:
    'Explain your last answer. Why does that word get the most weight, and what happens to the weights of the other words ' +
    'when "fishing trip" becomes "robbery"? (2 to 4 sentences)',
  rubric: [
    { id: 'match', text: '"robbery" fits the money meaning of "bank": it matches the query of "bank" best, so it gets the highest score and weight.' },
    { id: 'position', text: 'Position does not decide: the words right next to "bank" ("the", "was") get no extra weight for being close.' },
    { id: 'shares', text: 'The weights still add up to 100 %: when one word gains weight, the others lose some.' },
  ],
  misconceptions: ['Attention goes to the nearest word.', 'Each word pair has a fixed weight.'],
};

// ---------- LG1: open explanations (post-test only) ----------

const POST_QKV_EXPLAIN: TextItem = {
  id: 'post-qkv-explain',
  goal: 'LG1',
  kind: 'text',
  prompt:
    'Pick one word in a sentence. Explain how attention uses its query, and the keys and values of the other words, ' +
    'to give it a new vector. (2 to 4 sentences)',
  rubric: [
    { id: 'qk', text: 'The query is compared with every key (dot product), giving one match score per word.' },
    { id: 'weights', text: 'The scores become weights (softmax): a better match gets a bigger weight.' },
    { id: 'values', text: 'The new vector is a mix of the values, each multiplied by its weight (weighted sum).' },
  ],
  misconceptions: ['Mixes up the roles (e.g. the values are compared with the query, or the keys are passed on).'],
};

const POST_SOFTMAX: TextItem = {
  id: 'post-softmax',
  goal: 'LG1',
  kind: 'text',
  prompt: 'Why does attention apply softmax to the match scores, instead of using the scores directly as weights? (1 to 3 sentences)',
  rubric: [
    { id: 'positive', text: 'Scores can be any number, even below zero; softmax makes every weight positive.' },
    { id: 'sum', text: 'The weights add up to 1 (100 %), so each weight is a share of the attention.' },
    { id: 'order', text: 'A higher score still gets a higher weight.' },
  ],
  misconceptions: ['softmax keeps only the highest score and gives the others 0.'],
};

const POST_SCALE: TextItem = {
  id: 'post-scale',
  goal: 'LG1',
  kind: 'text',
  prompt: 'Real models divide the match scores by √dₖ before softmax. In one sentence: what does this prevent?',
  rubric: [
    { id: 'big', text: 'With many numbers per key (large dₖ), the scores get large.' },
    { id: 'peak', text: 'Without the division, softmax gives almost all the weight to one word (and training gets stuck).' },
  ],
  misconceptions: ['The division is only cosmetic.', 'The division is what makes the weights add up to 1.'],
};

// ---------- The two tests ----------

/** About 6 minutes. Auto-scored only, so the experimenter can read the score at once and assign the condition. */
export const PRETEST_ITEMS: Item[] = [BG_ATTENTION, BG_ML, PRE_DOT, PRE_MATMUL, PRE_PROB, PRE_EMBEDDING, PRE_SOFTMAX, QKV_MATCH, PRE_LG2, PRE_LG3];

/** About 12 minutes. In goal order, so the LG2 numbers come after the LG1 explanations. */
export const POSTTEST_ITEMS: Item[] = [QKV_MATCH, POST_QKV_EXPLAIN, POST_SOFTMAX, POST_SCALE, POST_COMPUTE, POST_LG3_REMOVE, POST_LG3_SWAP, POST_LG3_EXPLAIN];

export const TEST_TEXT = {
  pre: {
    title: 'Before we start: a short quiz',
    body: [
      'It shows what you already know, so we can see what you learn. It does not count for anything.',
      "Please don't look anything up. If you don't know, say so: that helps us too.",
      'It takes about 6 minutes.',
    ],
    start: 'Start the quiz',
    submit: 'Submit',
    doneTitle: 'Thank you!',
    doneBody: 'Now the fun part: on to the lesson.',
    /** The link had no condition: the experimenter assigns it from the score. */
    waitBody: 'Please tell the experimenter that you are done.',
    continue: 'Start the lesson',
  },
  post: {
    kicker: 'Finish',
    title: 'Final quiz',
    body: [
      'Show what you learned. There are no hints and no feedback here.',
      "Use the calculator if you need it, but please don't look anything up.",
      'It takes about 12 minutes.',
    ],
    submit: 'Submit and finish',
  },
  question: (n: number, total: number) => `Question ${n} of ${total}`,
  dontKnow: DONT_KNOW,
  pick: 'Pick one',
  textPlaceholder: 'Your answer',
  numberPlaceholder: 'Number',
  word: 'word',
  key: 'key k',
  value: 'value v',
  weight: 'weight',
  output: 'output',
  /** The lesson's calculator placeholder shows the softmax steps; this one gives nothing away. */
  calcPlaceholder: 'e.g. 2 × (3 + 4) ÷ 5',
  unanswered: (n: number) => `${n} ${n === 1 ? 'question has' : 'questions have'} no answer yet.`,
  submitAnyway: 'Submit anyway',
  review: 'Go back to them',
  saving: 'Saving your answers…',
  saveFailed: 'Your answers could not be sent. Please download the log and give the file to the experimenter.',
  download: 'Download the log',
  continue: 'Continue',
};
