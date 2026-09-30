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

/** XP pays for effort, never for being right. Identical in both conditions. */
export const XP = {
  step: 20,
  labDone: 30,
  prediction: 10,
  explore: 5,
  explanation: 20,
  revision: 15,
} as const;
export const XP_PER_LEVEL = 100;

export type BadgeId = 'explainer' | 'calculator' | 'predictor';
export const BADGES: Record<BadgeId, { title: string; goal: string; icon: string }> = {
  predictor: { title: 'Predictor', goal: 'Predict how the weights move when a word changes.', icon: '◆' },
  calculator: { title: 'Calculator', goal: 'Work out the weights for three words.', icon: '▲' },
  explainer: { title: 'Explainer', goal: 'Say what Q, K, V, softmax and √dₖ do.', icon: '●' },
};

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
    'You will build it yourself, piece by piece. Three badges are waiting.',
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
    'Each word plays two roles.',
    'Its query says what it is looking for.',
    'Its key says what it has to offer.',
    'The match score tells how well a query fits a key. Here it is the dot product you just learned.',
  ],
  task: 'Click the words on the map. Whose key fits the query of "model" best?',
  found: 'Yes. "fashion show" fits best, so it gets the tallest bar.',
  toy: "In our toy, query and key are both the word's own arrow. In a real model, the query and the key are two different learned versions of it.",
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
  fail: 'Not yet. Look for the test that breaks.',
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
  intro: 'Researchers use eˢ ÷ sum of all tops. This rule is called softmax. e is a number, about 2.72.',
  why: [
    'eˢ is positive, even when s is below zero.',
    'A bigger score always gives a bigger eˢ.',
    'Dividing by the sum makes the weights add up to 100 %.',
  ],
  compare: 'Softmax on the scores of our sentence, next to the real bars:',
  gap: 'Close, but the real bars are a bit flatter. One piece is still missing. You will find it in the formula.',
  checkPrompt: 'Your turn. Three words have scores 2, 1 and 0. What weight does the first word get?',
  hint: 'e² ≈ 7.4 · e¹ ≈ 2.7 · e⁰ = 1',
  options: [33, 50, 67, 90],
  solution: '7.4 ÷ (7.4 + 2.7 + 1) = 7.4 ÷ 11.1 ≈ 67 %',
};
export const SOFTMAX_CHECK_SCORES = [2, 1, 0];
/** The right option, computed so the text can't drift from the math. */
export const softmaxCheckAnswer = () => Math.round(softmax(SOFTMAX_CHECK_SCORES)[0] * 100);

export type FormulaPart = 'q' | 'k' | 'dk' | 'softmax' | 'v';
export const FORMULA_TEXT = {
  title: 'The formula',
  intro: 'Everything you found in the lab fits in one line. Click each part.',
  parts: {
    q: { label: 'Q', text: 'Q is the query of "model": what it is looking for.' },
    k: { label: 'Kᵀ', text: 'K holds the keys of all words: what each one offers. Q times Kᵀ gives one match score per word. Those are the numbers on the tiles.' },
    dk: { label: '√dₖ', text: 'dₖ is the length of a key vector. Long vectors give big scores, and then softmax puts almost everything on one word. Dividing by √dₖ keeps the scores in range. It is the missing piece from the lab.' },
    softmax: { label: 'softmax', text: 'softmax turns scores into weights: eˢ, then divide by the sum. It is the rule you built in the lab.' },
    v: { label: 'V', text: 'V holds the values: what each word passes on. "model" takes a mix of the values, weighted by the bars. That mix is its new meaning.' },
  } satisfies Record<FormulaPart, { label: string; text: string }>,
  dkLabel: 'Vector length dₖ',
  dkValues: [2, 8, 64, 512],
  divideLabel: 'Divide by √dₖ',
  dkNote: 'Real models use dₖ = 64 or more. Try it with the division off.',
  mapNote: 'The dashed arrow is "model" after attention. It moved toward fashion.',
  remaining: (n: number) => `${n} part${n === 1 ? '' : 's'} left to explore`,
  cta: 'Explain it yourself',
};

export const EXPLAIN_TEXT = {
  title: 'Your turn to explain',
  intro: 'Use the formula on the right if you need it.',
};

export const END_TEXT = {
  title: 'You finished the lesson',
  body: 'You built attention from scratch: scores, softmax, scaling and values.',
  download: 'Download session log',
  restart: 'Start again',
};

export { SENTENCE_A, SENTENCE_B };
