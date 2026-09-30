import { dot } from '@/lib/attention';
import type { Change } from '@/lib/tiles';
import { EMBEDDINGS } from '@/content/vectors';
import { SENTENCE_A } from '@/content/sentences';

export type MissionId = 'embeddings' | 'contrast' | 'swap' | 'remove' | 'free';
export type TutorMissionId = 'swap' | 'remove';

export const MISSION_ORDER: MissionId[] = ['embeddings', 'contrast', 'swap', 'remove', 'free'];

export const MISSION_TITLES: Record<MissionId, string> = {
  embeddings: 'Words as vectors',
  contrast: 'Same word, two meanings',
  swap: 'Predict a swap',
  remove: 'Predict a removal',
  free: 'Free play',
};

export interface RubricItem {
  id: string;
  /** The target idea, phrased for the tutor prompt. */
  text: string;
  /** Mock-tutor detector. No `g` flag. */
  keywords: RegExp;
  /** What the mock tutor says when this idea is missing. */
  hint: string;
  /** A question that sends the learner back to the playground. */
  probe: string;
}

export interface Misconception {
  id: string;
  text: string;
  keywords: RegExp;
  hint: string;
  probe: string;
}

export type Prediction =
  | { kind: 'tile'; prompt: string; correctIndex: number }
  | { kind: 'choice'; prompt: string; options: string[]; correct: string };

export interface TutorMission {
  id: TutorMissionId;
  intro: string;
  actionLabel: string;
  before: string[];
  focusIndex: number;
  change: Change;
  /** Shown under the tile that will change, during the prediction phase. */
  changeNote: string;
  prediction: Prediction;
  revealNote: string;
  explainPrompt: string;
  rubric: RubricItem[];
  misconceptions: Misconception[];
  expertAnswer: string;
}

export const TUTOR_MISSIONS: Record<TutorMissionId, TutorMission> = {
  swap: {
    id: 'swap',
    intro: 'Right now “model” leans on “fashion show”. We are about to swap “fashion show” for “training run”.',
    actionLabel: 'Swap it',
    before: SENTENCE_A,
    focusIndex: 4,
    change: { type: 'swap', index: 2, to: 'training run' },
    changeNote: '→ training run',
    prediction: {
      kind: 'tile',
      prompt: 'Before we swap: which word will “model” lean on most afterwards? Click it in the sentence.',
      correctIndex: 2,
    },
    revealNote: '“model” now leans on “training run”, even though “smiled” sits right next to it.',
    explainPrompt: 'Why does “model” lean on “training run” and not on “smiled”, the word right next to it?',
    rubric: [
      {
        id: 'match',
        text: 'A word gets a high score when it matches what “model” is about (its meaning).',
        keywords: /match|similar|align|meaning|relat|relevan|fit|direction|vector|score/i,
        hint: 'You describe what happened, but not what makes a word score high for “model”.',
        probe: 'Look at the faint match scores under the bars: which words score highest, and what do they share with “model”?',
      },
      {
        id: 'ml',
        text: '“training run” fits the machine-learning meaning of “model”, as strongly as “fashion show” fitted the fashion meaning.',
        keywords: /machine|\bml\b|learning|\bai\b|neural|comput|data/i,
        hint: 'Which of the two meanings of “model” does “training run” connect to?',
        probe: 'Toggle before/after: which meaning of “model” did “fashion show” support, and which one does “training run” support?',
      },
      {
        id: 'position',
        text: 'Position does not matter: “smiled” is closer but matches “model” less.',
        // Must state that position does NOT count; a bare "close"/"next to" would credit the misconception.
        keywords:
          /\b(position|order|distance|closeness|proximity|nearest|closest|neighbou?rs?|adjacent)\b[^.]{0,25}\b(doesn'?t|does not|don'?t|do not|isn'?t|is not|not|never)\b[^.]{0,10}\b(matter|count|help|play|relevant|important|get|receive)|\b(even though|although|despite|while)\b[^.]{0,40}\b(close|closer|closest|nearest|next to|adjacent|neighbou?r)|\b(close|closer|closest|nearest|next to|adjacent|neighbou?r)\w*\b[^.]{0,40}\bbut\b[^.]{0,40}\b(less|lower|smaller|weaker|doesn'?t|does not)\b/i,
        hint: 'You haven’t said why being right next to “model” doesn’t help “smiled”.',
        probe: '“smiled” is the closest word to “model”. Does its bar suggest that closeness counts?',
      },
    ],
    misconceptions: [
      {
        id: 'nearest',
        text: 'Attention goes to the nearest word.',
        // Checked per sentence; sentences with a negation or "but/even though" are skipped (see mock.ts).
        keywords:
          /\b(close|closer|closest|nearest|next to|adjacent|near|neighbou?r\w*|order|position)\b[^.]{0,40}\b(gets?|getting|receives?|has|have|so|should)\b[^.]{0,20}\b(more|most|higher|highest|bigger|larger)\b|\b(is|are|it'?s|being)\s+(closer|closest|nearest|next to|adjacent)\b/i,
        hint: 'Careful: you seem to link weight to how close a word is to “model”.',
        probe: 'Think back to Mission 1: was “model” leaning on its neighbour there?',
      },
    ],
    expertAnswer:
      '“model” is ambiguous: its vector sits between the fashion meaning and the machine-learning meaning. Every other word gets a match score for how well it fits what “model” is about. “training run” fits the machine-learning meaning very well, so it gets the highest score and the largest weight, just as “fashion show” did for the fashion meaning. Position plays no role: “smiled” is right next to “model” but fits it less, so it gets less weight.',
  },
  remove: {
    id: 'remove',
    intro: 'Back to the original sentence. We are about to remove “smiled”.',
    actionLabel: 'Remove “smiled”',
    before: SENTENCE_A,
    focusIndex: 4,
    change: { type: 'remove', index: 5 },
    changeNote: '✕ will be removed',
    prediction: {
      kind: 'choice',
      prompt: 'Before we remove it: what will happen to the weight on “fashion show”?',
      options: ['It goes up', 'It goes down', 'It stays the same'],
      correct: 'It goes up',
    },
    revealNote: 'Look at the faint number under “fashion show”: its match score did not change, but its weight did.',
    explainPrompt: 'The match score of “fashion show” did not change, yet its weight went up. Why?',
    rubric: [
      {
        id: 'sum',
        text: 'The weights always add up to 1 (100 %).',
        keywords: /\bsum|add(s)? up|100|total|normali|to 1\b|one whole/i,
        hint: 'What is always true about all the weights together?',
        probe: 'Add up the percentages on the bars, before and after. What do you notice?',
      },
      {
        id: 'relative',
        text: 'A weight depends on how a word’s score compares with the other words’ scores, not on the pair alone.',
        keywords: /compar|relative|other words|\bthe rest\b|proportion|competi/i,
        hint: 'You haven’t said what a weight depends on besides the pair “model”–“fashion show”.',
        probe: 'Toggle before/after and watch “after” and “the”: did their weights change too, even though nothing happened to them?',
      },
      {
        id: 'freed',
        text: 'Removing a competitor frees its share, which is split among the remaining words.',
        keywords: /free|redistribut|its share|spread|went to|goes to|split|left over|room/i,
        hint: 'Where did the weight that “smiled” had go?',
        probe: '“smiled” had about 16 %. Toggle before/after: which bars got that share?',
      },
    ],
    misconceptions: [
      {
        id: 'fixedPair',
        text: 'Each word pair has a fixed weight.',
        keywords: /\bweights?\b[^.]{0,30}\b(fixed|constant|always the same)\b|\b(fixed|constant)\s+weights?\b/i,
        hint: 'Careful: the score of a pair is fixed, but its weight is not.',
        probe: 'Toggle before/after on “fashion show”: same score, different weight. What else changed in the sentence?',
      },
    ],
    expertAnswer:
      'The match score of “model”–“fashion show” depends only on those two words, so it stays the same. Weights are not scores: they are shares of a total that always adds up to 100 %. A word’s weight depends on how its score compares with the scores of all the other words. When “smiled” is removed, its share (about 16 %) is freed and split among the remaining words, so “fashion show” goes up even though nothing about it changed.',
  },
};

export const EMBEDDINGS_TEXT = {
  intro: [
    'Language models turn every word into a list of numbers: a vector.',
    'Here each word gets just two numbers: how “fashion-ish” and how “machine-learning-ish” it is. Words with related meanings point in similar directions.',
  ],
  pickPrompt: 'Click two words on the map to compare them.',
  caption: 'Arrows pointing the same way (and long) → large similarity.',
  punchline:
    'Notice where “model” sits: between the two groups. One fixed arrow has to cover both meanings. How could “model” figure out which meaning it has in a given sentence?',
};

export const QUICK_CHECK = {
  prompt: 'Quick check: which pair is most similar?',
  pairs: [['runway', 'dress'], ['model', 'smiled'], ['training', 'dress'], ['data', 'word']] as [string, string][],
  reason: '“runway” and “dress” are long arrows pointing almost the same way, so their similarity is the largest.',
};

/** Index of the truly most similar pair in QUICK_CHECK (computed, never hard-coded). */
export function quickCheckAnswer(): number {
  const sims = QUICK_CHECK.pairs.map(([a, b]) => dot(EMBEDDINGS[a], EMBEDDINGS[b]));
  return sims.indexOf(Math.max(...sims));
}

export const CONTRAST_TEXT = {
  prompt: 'Same word, two sentences. In each one, click the word you think “model” leans on most.',
  revealLabel: 'Reveal the weights',
  reflectPrompt: 'What made the difference between the two sentences? (optional)',
};

export const FREE_PLAY_TEXT = {
  intro: 'Build your own sentence. Click any word to make it the focus, and use ✕ to remove a word.',
  challenges: [
    'Find a sentence where “model” splits its attention about 50/50 between two words.',
    'Make “model” lean most on the word after it.',
    'Remove words until “model” leans only on itself.',
  ],
};
