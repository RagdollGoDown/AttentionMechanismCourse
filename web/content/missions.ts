import type { Change } from '@/lib/tiles';
import { SENTENCE_A } from '@/content/sentences';

/** Tasks where the learner writes an explanation and gets feedback (AI tutor or expert answer). */
export type TutorMissionId = 'contrast' | 'remove' | 'formula';

export interface RubricItem {
  id: string;
  /** For tasks with parts: the box this idea belongs in. */
  part?: string;
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
  part?: string;
  text: string;
  keywords: RegExp;
  hint: string;
  probe: string;
}

export interface ExplainTask {
  id: TutorMissionId;
  explainPrompt: string;
  rubric: RubricItem[];
  misconceptions: Misconception[];
  expertAnswer: string;
  /** True once the formula has been taught; the tutor may then name its parts. */
  formulaTaught?: boolean;
  /** One answer box per part; rubric items with a `part` are checked in that box only. */
  parts?: { id: string; label: string; prompt: string }[];
}

export type Prediction =
  | { kind: 'tile'; prompt: string; correctIndex: number }
  | { kind: 'choice'; prompt: string; options: string[]; correct: string };

export interface TutorMission extends ExplainTask {
  id: 'remove';
  intro: string;
  actionLabel: string;
  before: string[];
  focusIndex: number;
  change: Change;
  prediction: Prediction;
  revealNote: string;
}

/**
 * "Two contexts": the learner clicks the word "model" listens to most, in two sentences. Only a wrong pick
 * leads here: the learner says what made them think so, then gets one reply (AI: closing tutor reply,
 * control: this expert answer). Match scores are not taught yet: the tutor talks about weights and meaning.
 */
export const CONTRAST_TASK: ExplainTask = {
  id: 'contrast',
  explainPrompt: 'Your pick was not the word "model" listened to most. What made you think it was?',
  rubric: [
    {
      id: 'context',
      text: 'In each sentence, "model" listens most to the word that fits the meaning it has there: "fashion show" (fashion) in A, "training run" (machine learning) in B.',
      keywords: /meaning|context|fit|match|relat|about|fashion|machine|\bml\b|learning|sense|topic/i,
      hint: 'What decides which word "model" listens to?',
      probe: 'Compare the top word in A and in B: which meaning of "model" does each one fit?',
    },
    {
      id: 'position',
      text: 'Position does not decide: the word right next to "model" ("smiled" in A, "predicted" in B) gets less weight than the word that fits its meaning.',
      keywords:
        /\b(position|order|distance|closeness|proximity|nearest|closest|neighbou?rs?|adjacent)\b[^.]{0,25}\b(doesn'?t|does not|don'?t|do not|isn'?t|is not|not|never)\b[^.]{0,10}\b(matter|count|help|play|relevant|important|get|receive)|\b(even though|although|despite|while)\b[^.]{0,40}\b(close|closer|closest|nearest|next to|adjacent|neighbou?r)|\b(close|closer|closest|nearest|next to|adjacent|neighbou?r)\w*\b[^.]{0,40}\bbut\b[^.]{0,40}\b(less|lower|smaller|weaker|doesn'?t|does not)\b/i,
      hint: 'You have not said why the word right next to "model" does not win.',
      probe: 'Which word sits right next to "model" in each sentence? Is it the tallest bar?',
    },
  ],
  misconceptions: [
    {
      id: 'nearest',
      text: 'Attention goes to the nearest word.',
      // Checked per sentence; sentences with a negation or "but/even though" are skipped (see mock.ts).
      keywords:
        /\b(close|closer|closest|nearest|next to|adjacent|near|neighbou?r\w*|order|position)\b[^.]{0,40}\b(gets?|getting|receives?|has|have|so|should)\b[^.]{0,20}\b(more|most|higher|highest|bigger|larger)\b|\b(is|are|it'?s|being)\s+(closer|closest|nearest|next to|adjacent)\b/i,
      hint: 'Careful: you seem to link the weight to how close a word is to "model".',
      probe: 'Which word sits right next to "model" in each sentence? Is it the tallest bar?',
    },
  ],
  expertAnswer:
    '"model" has two meanings. In each sentence, it listens most to the word that fits the meaning it has there: "fashion show" in A (fashion), "training run" in B (machine learning). Position does not matter: the word right next to "model" ("smiled" in A, "predicted" in B) gets less weight.',
};

export const TUTOR_MISSIONS: Record<'remove', TutorMission> = {
  remove: {
    id: 'remove',
    intro: 'Back to the original sentence. Note the weight on "fashion show", then remove "smiled".',
    actionLabel: 'Remove "smiled"',
    before: SENTENCE_A,
    focusIndex: 4,
    change: { type: 'remove', index: 5 },
    prediction: {
      kind: 'choice',
      prompt: 'The weights are hidden now. What happened to the weight on "fashion show"?',
      options: ['It went up', 'It went down', 'It stayed the same'],
      correct: 'It went up',
    },
    revealNote: 'Look at the match score under "fashion show". It did not change. Its weight did.',
    explainPrompt: 'The score of "fashion show" did not change, yet its weight went up. Why?',
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
        text: 'A weight depends on how a word\'s score compares with the other words\' scores, not on the pair alone.',
        keywords: /compar|relative|other words|\bthe rest\b|proportion|competi/i,
        hint: 'You have not said what a weight depends on, besides the pair "model" and "fashion show".',
        probe: 'Toggle before and after. Watch "after" and "the": did their weights change too, even though nothing happened to them?',
      },
      {
        id: 'freed',
        text: 'Removing a competitor frees its share, which is split among the remaining words.',
        keywords: /free|redistribut|its share|spread|went to|goes to|split|left over|room|absorb|take (over|up)|took (over|up)|share it/i,
        hint: 'Where did the weight of "smiled" go?',
        probe: '"smiled" had about 16 %. Toggle before and after: which bars got that share?',
      },
    ],
    misconceptions: [
      {
        id: 'fixedPair',
        text: 'Each word pair has a fixed weight.',
        keywords: /\bweights?\b[^.]{0,30}\b(fixed|constant|always the same)\b|\b(fixed|constant)\s+weights?\b/i,
        hint: 'Careful: the score of a pair is fixed, but its weight is not.',
        probe: 'Toggle before and after on "fashion show": same score, different weight. What else changed in the sentence?',
      },
    ],
    expertAnswer:
      'The score of "model" and "fashion show" depends only on those two words, so it stays the same. Weights are not scores. They are shares of a total that always adds up to 100 %. A word\'s weight depends on how its score compares with the scores of all the other words. When "smiled" leaves, its share (about 16 %) is freed and split among the remaining words. So "fashion show" goes up, even though nothing about it changed.',
  },
};


const FORMULA_EXPERT: Record<string, string> = {
  q: 'Q is what "model" is looking for: its question to the sentence.',
  k: 'K is what each word offers. Q times Kᵀ compares them and gives one match score per word.',
  dk: 'Long vectors make big scores. Dividing by √dₖ keeps them in range, so one word does not take all the weight.',
  softmax: 'softmax turns the scores into positive weights that add up to 100 %.',
  v: 'V is what each word passes on. "model" takes a weighted mix of the values: its new meaning.',
};

export const FORMULA_TASK: ExplainTask = {
  id: 'formula',
  formulaTaught: true,
  explainPrompt: 'Explain each part in your own words. One short sentence each.',
  parts: [
    { id: 'q', label: 'Q', prompt: 'What does Q do?' },
    { id: 'k', label: 'Kᵀ', prompt: 'What does Kᵀ do, together with Q?' },
    { id: 'dk', label: '√dₖ', prompt: 'Why divide by √dₖ?' },
    { id: 'softmax', label: 'softmax', prompt: 'What does softmax do?' },
    { id: 'v', label: 'V', prompt: 'What does V do?' },
  ],
  rubric: [
    {
      id: 'q',
      part: 'q',
      text: 'Q is what "model" is looking for: its question to the other words.',
      keywords: /look|search|seek|want|ask|question|need|find|interest|attention/i,
      hint: 'Your Q box does not say what the query is for.',
      probe: 'Click Q. What does "model" ask the sentence?',
    },
    {
      id: 'qk',
      part: 'k',
      text: 'K is what each word offers; Q times Kᵀ compares the query with every key and gives a match score per word.',
      keywords: /offer|about|describ|label|contain|advertis|match|compar|score|answer|similar/i,
      hint: 'Your Kᵀ box does not say what the keys are compared with, or what comes out.',
      probe: 'Click Kᵀ. What does each word answer, and what number appears under it?',
    },
    {
      id: 'scale',
      part: 'dk',
      text: '√dₖ shrinks the scores, so softmax does not put almost all the weight on one word when vectors are long.',
      keywords: /big|large|grow|huge|small|shrink|peak|spik|one word|extreme|sharp|flat|stable|range|saturat|dominat|100|all the weight/i,
      hint: 'Your √dₖ box does not say what goes wrong without the division.',
      probe: 'Click √dₖ and move the slider to 512. Compare the two boards.',
    },
    {
      id: 'softmax',
      part: 'softmax',
      text: 'softmax turns the scores into positive weights that add up to 100 %.',
      keywords: /positive|sum|add|100|\b1\b|share|probab|normali|weight/i,
      hint: 'What does softmax do to the scores?',
      probe: 'Click softmax. What is true of the weights that was not true of the scores?',
    },
    {
      id: 'values',
      part: 'v',
      text: 'The output of "model" is a mix of the values V, weighted by the attention weights.',
      keywords: /mix|weighted|sum|combin|average|blend|pass|collect|new meaning|informat|content/i,
      hint: 'Your V box does not say what "model" gets at the very end.',
      probe: 'Click V. What flows into "model", and how much from each word?',
    },
  ],
  misconceptions: [
    {
      id: 'maxOnly',
      part: 'softmax',
      text: 'softmax keeps only the word with the highest score.',
      keywords: /\b(only|just)\b[^.]{0,30}\b(one|highest|biggest|max|top|best)\b[^.]{0,20}\b(word|score)?/i,
      hint: 'Careful: softmax keeps every word in the mix, some with small weights.',
      probe: 'Click softmax and look at the bars. Does any word get exactly 0 %?',
    },
  ],
  expertAnswer: Object.entries(FORMULA_EXPERT).map(([id, t]) => `${({ q: 'Q', k: 'Kᵀ', dk: '√dₖ', softmax: 'softmax', v: 'V' } as Record<string, string>)[id]}: ${t}`).join('\n'),
};

export { FORMULA_EXPERT };

export const EXPLAIN_TASKS: Record<TutorMissionId, ExplainTask> = { contrast: CONTRAST_TASK, ...TUTOR_MISSIONS, formula: FORMULA_TASK };
