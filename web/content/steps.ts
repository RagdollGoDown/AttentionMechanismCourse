import { dot, softmax } from '@/lib/attention';
import { EMBEDDINGS } from '@/content/vectors';
import type { BottomId, TopId } from '@/lib/rules';
import { SENTENCE_A, SENTENCE_B } from '@/content/sentences';

/** Linear steps of the lesson. The lab is one step that holds six unlockable experiments. */
export type StepId = 'welcome' | 'hook' | 'why' | 'pretest' | 'vectors' | 'lab' | 'formula' | 'explain' | 'posttest';
export type LabId = 'contrast' | 'qk' | 'swap' | 'remove' | 'rule' | 'softmax';
/** Anything the logger can stamp an event with. */
export type MissionId = StepId | LabId;

export const STEP_ORDER: StepId[] = ['welcome', 'hook', 'why', 'pretest', 'vectors', 'lab', 'formula', 'explain', 'posttest'];
export const LAB_ORDER: LabId[] = ['contrast', 'qk', 'swap', 'remove', 'rule', 'softmax'];

export const CHAPTERS: { title: string; steps: StepId[] }[] = [
  { title: 'Start', steps: ['welcome', 'hook', 'why', 'pretest'] },
  { title: 'Warm-up', steps: ['vectors'] },
  { title: 'Lab', steps: ['lab'] },
  { title: 'Formula', steps: ['formula', 'explain'] },
  { title: 'Finish', steps: ['posttest'] },
];

export const LAB_TITLES: Record<LabId, string> = {
  contrast: 'Two contexts',
  qk: 'Query and key',
  swap: 'Swap a word',
  remove: 'Remove a word',
  rule: 'Invent the rule',
  softmax: 'Meet softmax',
};

/** One trophy piece per finished module. Completion only, so it is identical in both conditions. */
export const TROPHY_PIECES: { id: MissionId; title: string }[] = [
  { id: 'vectors', title: 'Words as arrows' },
  { id: 'contrast', title: 'Two contexts' },
  { id: 'qk', title: 'Query and key' },
  { id: 'swap', title: 'Swap a word' },
  { id: 'remove', title: 'Remove a word' },
  { id: 'rule', title: 'Invent the rule' },
  { id: 'softmax', title: 'Meet softmax' },
  { id: 'formula', title: 'The formula' },
  { id: 'explain', title: 'Your explanation' },
];

/** What learners can do at the end (LG1–LG3), shown on the "Why" screen. */
export const GOALS = [
  'Predict how the weights move when a word changes.',
  'Work out the weights for three words.',
  'Say what Q, K, V, softmax and √dₖ do.',
];

export const WELCOME = {
  title: 'How does a word know what it means?',
  body: [
    'Take the word "model". A person on a runway? A program that writes text?',
    'Language models solve this with a trick called attention.',
    'You will play with one sentence, place bets and watch attention work. It takes about 30 minutes.',
  ],
  cta: 'Start',
};

export const HOOK = {
  question: 'What does "model" mean here?',
  options: ['A person who poses for photos', 'A program that learns from data', 'A small copy, like a model train', "I can't tell"],
  rounds: [null, SENTENCE_A, SENTENCE_B] as (string[] | null)[],
  outro: [
    'You changed your answer because of the other words.',
    'A language model has to do the same. Attention is how it does it.',
  ],
  cta: 'Why should I care?',
};

export const WHY = {
  title: 'Why attention?',
  body: [
    'Attention runs inside GPT, Claude, Gemini and most translation tools.',
    'For every word, it decides which other words to listen to.',
    'You will build it yourself, piece by piece.',
    'Each module you finish wins a piece of the trophy.',
  ],
  cta: "Let's go",
};

export const TEST_PLACEHOLDER = {
  pretest: { title: 'Pre-test', body: 'A short quiz goes here, so we can measure what you learn. It comes in the next version.', cta: 'Skip for now' },
  posttest: { title: 'Post-test', body: 'The final quiz goes here. It comes in the next version.', cta: 'See my results' },
};

export const VECTORS_TEXT = {
  title: 'Words as arrows',
  intro: [
    'A language model turns each word into a list of numbers: a vector.',
    'Here each word has just two numbers. How "fashion" is it? How "machine learning" is it?',
    'Related words point the same way.',
  ],
  pickPrompt: 'Click two words on the map.',
  dotRule: 'Dot product: multiply number by number, then add.',
  caption: 'Long arrows pointing the same way give a big dot product.',
  punchline: '"model" sits between the two groups. One arrow has to cover both meanings. So how does "model" know which one it means?',
  skip: 'I know dot products. Skip',
  cta: 'Find out',
};

export const QUICK_CHECK = {
  prompt: 'Which pair has the largest dot product?',
  pairs: [['runway', 'dress'], ['model', 'smiled'], ['training', 'dress'], ['data', 'word']] as [string, string][],
  reason: '"runway" and "dress" are long, and they point almost the same way.',
};

/** Index of the truly largest dot product in QUICK_CHECK (computed, never hard-coded). */
export function quickCheckAnswer(): number {
  const sims = QUICK_CHECK.pairs.map(([a, b]) => dot(EMBEDDINGS[a], EMBEDDINGS[b]));
  return sims.indexOf(Math.max(...sims));
}

export const LAB_TEXT = {
  title: 'The sentence lab',
  intro: 'One sentence, six experiments. Finish one to unlock the next.',
  locked: 'Finish the experiment before to unlock this one.',
  next: 'Next experiment',
  done: 'Lab complete. On to the formula',
};

export const CONTRAST_TEXT = {
  prompt: 'Here is "model" in two sentences. In each one, click the word you think "model" listens to most.',
  bars: 'Each bar shows how much "model" listens to a word. The bars add up to 100 %.',
  revealLabel: 'Show the weights',
  reflectPrompt: 'What made the difference? (optional)',
};

export const QK_TEXT = {
  intro: [
    '"model" has to decide who to listen to. So it asks a question: its query.',
    'Every word answers with its key: what it is about.',
    'The match score compares the two. A big match means "listen to me!"',
  ],
  query: 'Who matches me?',
  task: 'Click each word to hear its answer.',
  leaderboard: 'Matches so far',
  winTitle: (w: string) => `"${w}" is the best match!`,
  win: 'The best match gets the tallest bar. That is how "model" picks who to listen to.',
  toy: "In our toy, a word's query and key are both its own two numbers. In a real model, they are two different learned versions of it.",
  /** A word's key, said in plain words (from its two numbers). */
  keySays: (fashion: number, ml: number) =>
    Math.hypot(fashion, ml) < 0.6 ? 'Not much here' : fashion > 2 * ml ? "I'm about fashion" : ml > 2 * fashion ? "I'm about ML" : 'A bit of both',
};

export const RULE_TEXT = {
  intro: [
    'Match scores can be any number, even below zero.',
    'The bars need weights instead: all positive, all adding up to 100 %.',
    'Build a rule that turns scores into weights. Then test it.',
  ],
  topSlot: 'top',
  bottomSlot: 'bottom',
  checks: { positive: 'Every weight is positive', sums: 'The weights add up to 100 %', order: 'A higher score gets a higher weight' },
  pass: 'It works on every test. Nice rule!',
  fail: 'Not yet.',
  giveUp: 'I tried enough, show me',
  cta: 'See what researchers use',
  minTries: 3,
};

/** Test sets for the rule. "sentence" is filled in from our sentence's real match scores. */
export const RULE_SETS: { name: string; words: string[]; scores: number[] }[] = [
  { name: 'Test B', words: ['A', 'B', 'C', 'D'], scores: [2.5, 0.4, -1.2, -3.0] },
  { name: 'Test C', words: ['A', 'B', 'C', 'D'], scores: [-8, -4, -6, -1] },
];

export const RULE_BRICKS: { tops: TopId[]; bottoms: BottomId[] } = {
  tops: ['s', 'square', 'abs', 'plus5', 'pow2', 'exp'],
  bottoms: ['one', 'count', 'sum', 'max'],
};

export const SOFTMAX_TEXT = {
  intro: 'Researchers use one rule to turn scores into weights. It is called softmax. Watch it work on Test B, step by step.',
  stages: [
    { formula: 's', title: 'Start with the match scores', text: "Two are negative. A weight can't be negative, so we can't use them as they are." },
    { formula: 'eˢ', title: 'Raise e to each score', text: 'e is a number, about 2.72. eˢ is always positive, even for s = −3. Each +1 in score multiplies eˢ by 2.7, so the best match pulls ahead.' },
    { formula: 'eˢ ÷ sum', title: 'Divide by the sum', text: 'Now each weight is a share of the total. Together they make 100 %.' },
  ],
  next: 'Next step',
  done: 'That is softmax. If your rule was eˢ ÷ sum, you found it yourself!',
  checkPrompt: 'Your turn. Three words have match scores 2, 1 and 0. What weight does the first word get?',
  options: [33, 50, 67, 90],
  solution: '7.4 ÷ (7.4 + 2.7 + 1) = 7.4 ÷ 11.1 ≈ 67 %',
  mysteryTitle: 'One more thing',
  mystery: (mine: number, real: number) =>
    `On our sentence, softmax gives "fashion show" ${mine} %. The real bar shows ${real} %. The real bars are flatter. The missing piece is in the formula.`,
};
export const SOFTMAX_CHECK_SCORES = [2, 1, 0];
/** The right option, computed so the text can't drift from the math. */
export const softmaxCheckAnswer = () => Math.round(softmax(SOFTMAX_CHECK_SCORES)[0] * 100);

export type FormulaPart = 'q' | 'k' | 'dk' | 'softmax' | 'v';
export const FORMULA_TEXT = {
  title: 'The formula',
  intro: 'Everything you found in the lab fits in one line. Click each part.',
  parts: {
    q: { label: 'Q', text: 'Q is the query of "model": its question to the sentence. "Who should I listen to?"' },
    k: { label: 'Kᵀ', text: "K holds the keys: each word's answer, what it is about. Q times Kᵀ compares the question with every answer. That gives one match score per word." },
    dk: { label: '√dₖ', text: 'dₖ is how many numbers a key has. Real models use 64 or more. More numbers make bigger match scores. Without the division, softmax then gives one word almost 100 % and the rest almost 0 %. "model" stops listening to the sentence, and training gets stuck. Dividing by √dₖ keeps the scores in range.' },
    softmax: { label: 'softmax', text: 'softmax turns the match scores into weights: eˢ, then divide by the sum. Every weight is positive, and together they make 100 %.' },
    v: { label: 'V', text: 'V holds the values: what each word passes on. "model" collects a bit of every value, as much as its bar says. The mix is its new meaning: here, mostly fashion.' },
  } satisfies Record<FormulaPart, { label: string; text: string }>,
  query: 'Who should I listen to?',
  newMeaning: 'New me: mostly fashion',
  dkLabel: 'Numbers per key, dₖ',
  dkValues: [2, 8, 64, 512],
  without: 'Without ÷√dₖ',
  with: 'With ÷√dₖ',
  dkNote: 'Move the slider. Watch what happens without the division.',
  mapNote: 'The dashed arrow is "model" after attention. It moved toward fashion.',
  pick: 'Pick a part of the formula.',
  remaining: (n: number) => `${n} part${n === 1 ? '' : 's'} left to explore`,
  cta: 'Explain it yourself',
};

export const EXPLAIN_TEXT = {
  title: 'Your turn to explain',
  intro: 'Use the formula on the right if you need it.',
};

export const END_TEXT = {
  title: 'Congratulations! You finished the lecture.',
  body: 'You built attention from scratch: queries and keys, softmax, scaling and values. The trophy is yours.',
  goalsTitle: 'You can now:',
  download: 'Download session log',
  restart: 'Start again',
};

export { SENTENCE_A, SENTENCE_B };
