import { dot, softmax, type Vec } from '@/lib/attention';
import type { Example } from '@/lib/compute';
import type { BottomId, TopId } from '@/lib/rules';
import { SENTENCE_A, SENTENCE_B } from '@/content/sentences';

/** Linear steps of the lesson. The lab is one step that holds five unlockable experiments. */
export type StepId = 'welcome' | 'consent' | 'pretest' | 'hook' | 'why' | 'vectors' | 'lab' | 'formula' | 'compute' | 'explain' | 'posttest' | 'reflection';
export type LabId = 'contrast' | 'qk' | 'remove' | 'rule' | 'softmax';
/** Anything the logger can stamp an event with. */
export type MissionId = StepId | LabId;

// The pre-test comes before the hook, so nothing in the lesson has taught its answers yet. Without ?condition=,
// the condition is assigned at its end by the experimenter, from the score.
export const STEP_ORDER: StepId[] = ['welcome', 'consent', 'pretest', 'hook', 'why', 'vectors', 'lab', 'formula', 'compute', 'explain', 'posttest', 'reflection'];
export const LAB_ORDER: LabId[] = ['contrast', 'qk', 'remove', 'rule', 'softmax'];

export const CHAPTERS: { title: string; steps: StepId[] }[] = [
  { title: 'Start', steps: ['welcome', 'consent', 'pretest', 'hook', 'why'] },
  { title: 'Warm-up', steps: ['vectors'] },
  { title: 'Lab', steps: ['lab'] },
  { title: 'Formula', steps: ['formula', 'compute', 'explain'] },
  { title: 'Finish', steps: ['posttest', 'reflection'] },
];

export const LAB_TITLES: Record<LabId, string> = {
  contrast: 'Two contexts',
  qk: 'Query and key',
  remove: 'Remove a word',
  rule: 'Invent the rule',
  softmax: 'Meet softmax',
};

/** What Byte (the robot dog in the garden band) can be given. The food bowl is there from the start. */
export type PetItem = 'bowl' | 'tent' | 'ball' | 'tree' | 'cushion' | 'flowers' | 'frisbee' | 'lamp' | 'bench' | 'balloons';

/**
 * One gift for Byte per finished module, in lesson order. Completion only, never correctness, so it is
 * identical in both conditions. `fact` is what the module taught: the gift note says it back (informational reward).
 */
export const GIFTS: { id: MissionId; title: string; item: PetItem; name: string; fact: string }[] = [
  { id: 'vectors', title: 'Words as vectors', item: 'tent', name: 'a tent', fact: 'A word is a vector, and the dot product says how well two words match.' },
  { id: 'contrast', title: 'Two contexts', item: 'ball', name: 'a tennis ball', fact: 'Same word, different context, different bars.' },
  { id: 'qk', title: 'Query and key', item: 'tree', name: 'a tall apple tree to climb', fact: '"model" asks with its query, and every word answers with its key.' },
  { id: 'remove', title: 'Remove a word', item: 'cushion', name: 'a dog bed', fact: 'Weights always share 100 %. When a word leaves, the others take its share.' },
  { id: 'rule', title: 'Invent the rule', item: 'flowers', name: 'tulips', fact: 'A good rule keeps every weight positive and makes them add up to 100 %.' },
  { id: 'softmax', title: 'Meet softmax', item: 'frisbee', name: 'a frisbee', fact: 'softmax raises e to each score, then divides by the sum.' },
  { id: 'formula', title: 'The formula', item: 'lamp', name: 'a lamp post', fact: 'softmax(QKᵀ/√dₖ)·V: every part has a job.' },
  { id: 'compute', title: 'Compute it yourself', item: 'bench', name: 'a garden bench', fact: 'You computed attention by hand, number by number.' },
  { id: 'explain', title: 'Your explanation', item: 'balloons', name: 'party balloons', fact: 'You explained attention in your own words.' },
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
    'You will play with one sentence, place bets and watch attention work. With two short tests and a few questions at the end, it takes about 50 minutes.',
  ],
  cta: 'Start',
};

/** Shown before the pre-test. Keep it true to what the code stores (lib/collect) and sends (lib/tutor). */
export const CONSENT = {
  title: 'Before you start',
  intro: 'This lesson is part of a study for the course CS-411 Digital Education at EPFL. To take part, we need your OK to keep:',
  collected: [
    'your test answers and what you write in the lesson,',
    'your clicks, the time each part takes, and when you paste text or leave the tab,',
    'a participant code, no name and no email.',
  ],
  shared: [
    'Your data is stored with Supabase, in Zurich.',
    'In the AI version, your written explanations are also sent to an AI provider (Anthropic, or Groq as a backup) so it can write the feedback.',
    'Only the course team sees it. Results are reported for the whole group.',
  ],
  voluntary: 'It takes about 50 minutes. You can say no: then you cannot take part in the study, and nothing is saved. You can also stop at any time: a run you do not finish is not used.',
  agree: 'I agree',
  decline: 'No thanks',
  declinedTitle: 'Thank you anyway',
  declinedBody: 'Without your OK we cannot use your data, so you cannot take part in the study. Nothing was saved. You can close this page.',
} as const;

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
    'Meet Byte, the robot dog at the bottom of the page. Each module you finish brings him a gift.',
  ],
  cta: "Let's go",
};

/** Byte's closable hello, the first time the garden shows in a session (same in both conditions). */
export const GARDEN_INTRO = {
  title: 'Hi, I’m Byte!',
  body: 'My garden is still a bit empty. Each step you finish brings me a gift, so together we can make it a nicer place.',
  close: 'Got it',
};

/**
 * What Byte says to cheer the learner on: when a step opens and when a gift arrives. Effort and progress
 * only, never about being right, so it is the same whatever the learner answered and in both conditions.
 */
export const BYTE_LINES = {
  hype: ['You’ve got this!', 'Nice work!', 'Keep going!', 'Great focus!', 'You’re on a roll!', 'Look at you go!', 'One step closer!', 'Brain power!'],
  test: 'Last stretch. You can do it!',
  end: 'We did it! Thank you!',
};

export const VECTORS_TEXT = {
  kicker: 'Before the lab',
  title: 'Words as vectors',
  intro: 'Two ideas you will need: a word is a vector, and the dot product measures how well two vectors match.',
  skip: 'I know vectors and dot products. Skip',
  partOf: (n: number) => `${n} of 2`,
  next: 'Next',
  word: {
    title: 'A word is a vector',
    body: [
      'A language model stores each word as a vector: a list of numbers it learns during training.',
      'How many numbers a vector has is its dimension. Ours have 2 dimensions, so you can see them as arrows. The original Transformer used 512, and today\'s large models use thousands.',
      'Words with similar meanings end up with vectors that point in a similar direction.',
      'Our axes have names only to make the map easy to read. In a real model, a single dimension has no clear meaning on its own.',
    ],
    hint: 'Hover over a word to see its vector.',
  },
  dot: {
    title: 'The dot product measures a match',
    rule: 'Multiply the matching entries, then add them up:',
    note: { title: 'Note', text: 'There are two terms here because our vectors have 2 dimensions: one term per dimension.' },
    meaning: 'It is big when the arrows point the same way, 0 when they are at a right angle, and negative when they point away from each other.',
    drag: 'Drag the tip of b.',
    tasks: {
      zero: { title: 'Drag b so that a · b = 0', done: 'b is now at a right angle to a.' },
      min: { title: 'Make a · b as negative as you can', done: 'b points away from a.' },
      hand: { title: 'Compute [2, 1] · [1, 3] by hand', placeholder: 'Your answer', check: 'Check' },
    },
    handSolution: '2 × 1 + 1 × 3 = 5',
    legend: { pos: 'same way → positive', zero: 'right angle → 0', neg: 'away → negative' },
  },
  punchline: '"model" sits between the two groups on the map. One arrow has to cover both meanings. So how does "model" know which one it means?',
  cta: 'Find out',
};

/** Part 2: a is fixed, b is dragged on a whole-number grid from −GRID to GRID. */
export const DOT_PLOT = { a: [-1, 3] as Vec, bStart: [2, 1] as Vec, grid: 4 };
export const HAND_DOT = { a: [2, 1] as Vec, b: [1, 3] as Vec };
/** The most negative a · b that b can reach on the grid (computed, never hard-coded). */
export function dotPlotMin(): number {
  const { a, grid } = DOT_PLOT;
  let min = Infinity;
  for (let x = -grid; x <= grid; x++) for (let y = -grid; y <= grid; y++) min = Math.min(min, dot(a, [x, y]));
  return min;
}

export const LAB_TEXT = {
  title: 'The sentence lab',
  intro: 'One sentence, five experiments. Finish one to unlock the next.',
  locked: 'Finish the experiment before to unlock this one.',
  next: 'Next experiment',
  done: 'Lab complete. On to the formula',
  redoNote: 'You finished this one. Your written answers stay as they are.',
  redo: '↻ Redo the experiment',
};

export const CONTRAST_TEXT = {
  prompt: 'Here is "model" in two sentences. In each one, click the word you think "model" listens to most.',
  bars: 'Each bar is a weight: how much "model" listens to a word, in %. The weights add up to 100 %.',
  revealLabel: 'Show the weights',
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
  /** The card above the tests: the two numbers met so far (score from Query and key, weight = the bar), on our sentence. */
  bridge: {
    title: 'Two numbers per word',
    score: 'match score',
    weight: 'weight (the bar)',
    rule: '? rule',
    text: 'Something turns the scores into the weights. In Remove a word, the score stayed and the weight moved: the rule looks at all the scores together.',
  },
  intro: [
    'Scores can be any number, even below zero. Weights must be positive and add up to 100 %.',
    'Build the rule that turns scores into weights, in two picks:',
  ],
  howTo: [
    'Top: what to do with each score.',
    'Bottom: what to divide by.',
  ],
  testsIntro: 'Your rule runs on three sets of scores. A test turns green when all three checks pass.',
  topSlot: 'top',
  bottomSlot: 'bottom',
  exampleTitle: 'Your rule on one word',
  sentenceNote: 'The real scores from our sentence.',
  checks: { positive: 'Every weight is positive', sums: 'The weights add up to 100 %', order: 'A higher score gets a higher weight' },
  pass: 'It works on every test. Nice rule!',
  fail: 'Not yet.',
  giveUp: 'I tried enough, show me',
  cta: 'See what researchers use',
  minTries: 3,
};

/** Extra test sets for the rule, each with what it catches. "Our sentence" is added from the real match scores. */
export const RULE_SETS: { name: string; note: string; words: string[]; scores: number[] }[] = [
  { name: 'Mixed scores', note: 'Two scores are below zero.', words: ['A', 'B', 'C', 'D'], scores: [2.5, 0.4, -1.2, -3.0] },
  { name: 'All below zero', note: 'Every score is below zero. The best one is −1.', words: ['A', 'B', 'C', 'D'], scores: [-8, -4, -6, -1] },
];

export const RULE_BRICKS: { tops: TopId[]; bottoms: BottomId[] } = {
  tops: ['s', 'square', 'abs', 'plus5', 'pow2', 'exp'],
  bottoms: ['one', 'count', 'sum', 'max'],
};

export const SOFTMAX_TEXT = {
  intro: 'Researchers use one rule to turn scores into weights. It is called softmax. Watch it work on the Mixed scores test, step by step.',
  stages: [
    { formula: 's', title: 'Start with the match scores', text: "Two are negative. A weight can't be negative, so we can't use them as they are." },
    { formula: 'eˢ', title: 'Raise e to each score', text: 'e is a number, about 2.72. eˢ is always positive, even for s = −3. Each +1 in score multiplies eˢ by 2.7, so the best match pulls ahead.' },
    { formula: 'eˢ ÷ sum', title: 'Divide by the sum', text: 'Now each weight is a share of the total. Together they make 100 %.' },
  ],
  next: 'Next step',
  done: 'That is softmax. If your rule was eˢ ÷ sum, you found it yourself!',
  checkPrompt: 'Your turn. Three words have match scores 2, 1 and 0. What weight does the first word get?',
  checkHint: 'A weight is eˢ ÷ sum.',
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
  cta: 'Compute it yourself',
};

/** LG2. Worked example from the M3 report; the practice uses other numbers. dₖ = 2 in both. */
export const WORKED_EXAMPLE: Example = {
  q: [1, 2],
  tokens: [
    { word: 'fashion', k: [2, 1], v: [1, 0] },
    { word: 'smiled', k: [1, 0], v: [0, 1] },
    { word: 'the', k: [0, 1], v: [1, 1] },
  ],
};
export const PRACTICE_EXAMPLE: Example = {
  q: [2, 1],
  tokens: [
    { word: 'after', k: [1, 1], v: [1, 0] },
    { word: 'training', k: [0, 2], v: [0, 1] },
    { word: 'the', k: [2, 0], v: [1, 1] },
  ],
};

export const COMPUTE_TEXT = {
  kicker: 'Formula',
  title: 'Compute it yourself',
  intro: 'Three words, two numbers per vector, so dₖ = 2. First read one example worked out, then do one yourself.',
  setup: 'Each word i has a key and a value. The query of "model" and the key size:',
  workedTitle: 'Worked example',
  practiceTitle: 'Your turn',
  practiceIntro: 'Now the whole table is yours. Fill in every cell, then check. Round to 2 decimals and use your rounded numbers in the next column.',
  ready: 'I read it. My turn',
  check: 'Check',
  showMe: 'Show me',
  showMeAfter: 3,
  calc: {
    title: 'Calculator',
    placeholder: 'e.g. exp(2.12) or 8.34 / (8.34 + 4.11 + 16.92)',
    run: '=',
    error: 'Cannot read that. Check the brackets.',
  },
  outputLabel: 'Output',
  /** Per stage: a plain-text label (screen readers), a name and one line on how to get it. */
  stages: {
    scores: { head: 'score s', name: 'Scores', how: 'Dot product of the query with each key.' },
    scaled: { head: 'scaled score z', name: 'Scale', how: 'Divide each score by √dₖ = √2 ≈ 1.41.' },
    exps: { head: 'e to the z', name: 'Exponentiate', how: 'Raise e to each scaled score.' },
    weights: { head: 'weight alpha', name: 'Normalise (softmax)', how: 'Divide each eᶻ by the sum of all three. The weights add up to 1.' },
    output: { head: 'output o', name: 'Weighted sum', how: 'Add up the values, each multiplied by its weight.' },
  },
  right: 'Right!',
  wrong: (n: number) => `${n} ${n === 1 ? 'cell is' : 'cells are'} off: see the amber ones. Each cell is checked with your own numbers from the column before.`,
  revealed: 'Here are the numbers. Compare them with yours.',
  done: 'You computed attention by hand: scores, scaling, softmax and the weighted sum.',
  cta: 'Explain it yourself',
};

export const EXPLAIN_TEXT = {
  title: 'Your turn to explain',
  intro: 'Use the formula on the right if you need it.',
};

export const END_TEXT = {
  title: 'Congratulations! You finished the lecture.',
  body: 'You built attention from scratch: queries and keys, softmax, scaling and values. Byte\'s garden is complete.',
  garden: (n: number, total: number) => `Byte\'s garden: ${n} of ${total} gifts`,
  goalsTitle: 'You can now:',
  download: 'Download session log',
  restart: 'Start again',
};

export { SENTENCE_A, SENTENCE_B };
