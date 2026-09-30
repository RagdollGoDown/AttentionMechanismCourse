import type { Change } from '@/lib/tiles';
import { SENTENCE_A } from '@/content/sentences';

/** Tasks where the learner writes an explanation and gets feedback (AI tutor or expert answer). */
export type TutorMissionId = 'swap' | 'remove' | 'formula';

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

export interface ExplainTask {
  id: TutorMissionId;
  explainPrompt: string;
  rubric: RubricItem[];
  misconceptions: Misconception[];
  expertAnswer: string;
  /** True once the formula has been taught; the tutor may then name its parts. */
  formulaTaught?: boolean;
}

export type Prediction =
  | { kind: 'tile'; prompt: string; correctIndex: number }
  | { kind: 'choice'; prompt: string; options: string[]; correct: string };

export interface TutorMission extends ExplainTask {
  id: 'swap' | 'remove';
  intro: string;
  actionLabel: string;
  before: string[];
  focusIndex: number;
  change: Change;
  /** Shown under the tile that will change, during the prediction phase. */
  changeNote: string;
  prediction: Prediction;
  revealNote: string;
}

export const TUTOR_MISSIONS: Record<'swap' | 'remove', TutorMission> = {
  swap: {
    id: 'swap',
    intro: 'Right now "model" listens most to "fashion show". Next, we swap "fashion show" for "training run".',
    actionLabel: 'Swap it',
    before: SENTENCE_A,
    focusIndex: 4,
    change: { type: 'swap', index: 2, to: 'training run' },
    changeNote: '→ training run',
    prediction: {
      kind: 'tile',
      prompt: 'Before we swap: which word will "model" listen to most afterwards? Click it in the sentence.',
      correctIndex: 2,
    },
    revealNote: '"model" now listens most to "training run". Yet "smiled" sits right next to it.',
    explainPrompt: 'Why does "model" listen to "training run" and not to "smiled", the word right next to it?',
    rubric: [
      {
        id: 'match',
        text: 'A word gets a high score when it matches what "model" is about (its meaning).',
        keywords: /match|similar|align|meaning|relat|relevan|fit|direction|vector|score/i,
        hint: 'You describe what happened, but not what makes a word score high for "model".',
        probe: 'Look at the score on each tile. Which words score highest, and what do they share with "model"?',
      },
      {
        id: 'ml',
        text: '"training run" fits the machine-learning meaning of "model", as strongly as "fashion show" fitted the fashion meaning.',
        keywords: /machine|\bml\b|learning|\bai\b|neural|comput|data/i,
        hint: 'Which of the two meanings of "model" does "training run" connect to?',
        probe: 'Toggle before and after. Which meaning did "fashion show" support? Which one does "training run" support?',
      },
      {
        id: 'position',
        text: 'Position does not matter: "smiled" is closer but matches "model" less.',
        // Must state that position does NOT count; a bare "close"/"next to" would credit the misconception.
        keywords:
          /\b(position|order|distance|closeness|proximity|nearest|closest|neighbou?rs?|adjacent)\b[^.]{0,25}\b(doesn'?t|does not|don'?t|do not|isn'?t|is not|not|never)\b[^.]{0,10}\b(matter|count|help|play|relevant|important|get|receive)|\b(even though|although|despite|while)\b[^.]{0,40}\b(close|closer|closest|nearest|next to|adjacent|neighbou?r)|\b(close|closer|closest|nearest|next to|adjacent|neighbou?r)\w*\b[^.]{0,40}\bbut\b[^.]{0,40}\b(less|lower|smaller|weaker|doesn'?t|does not)\b/i,
        hint: 'You have not said why being right next to "model" does not help "smiled".',
        probe: '"smiled" is the closest word to "model". Does its bar suggest that closeness counts?',
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
        probe: 'Think back to "Two contexts". Did "model" listen to its neighbour there?',
      },
    ],
    expertAnswer:
      '"model" is ambiguous. Its vector sits between the fashion meaning and the machine-learning meaning. Every other word gets a match score for how well it fits "model". "training run" fits the machine-learning meaning very well. So it gets the highest score and the largest weight, just like "fashion show" did for fashion. Position plays no role: "smiled" is right next to "model" but fits it less, so it gets less weight.',
  },
  remove: {
    id: 'remove',
    intro: 'Back to the original sentence. Next, we remove "smiled".',
    actionLabel: 'Remove "smiled"',
    before: SENTENCE_A,
    focusIndex: 4,
    change: { type: 'remove', index: 5 },
    changeNote: '✕ will be removed',
    prediction: {
      kind: 'choice',
      prompt: 'Before we remove it: what happens to the weight on "fashion show"?',
      options: ['It goes up', 'It goes down', 'It stays the same'],
      correct: 'It goes up',
    },
    revealNote: 'Look at the score on "fashion show". It did not change. Its weight did.',
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
        keywords: /free|redistribut|its share|spread|went to|goes to|split|left over|room/i,
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

export const FORMULA_TASK: ExplainTask = {
  id: 'formula',
  formulaTaught: true,
  explainPrompt: 'In your own words: what do Q, K, V, softmax and √dₖ each do when "model" reads the sentence?',
  rubric: [
    {
      id: 'qk',
      text: 'The query of "model" is compared with the key of every word; a good match gives a high score.',
      keywords: /\b(q|quer(y|ies))\b[^.]{0,80}\b(k|keys?)\b|\b(k|keys?)\b[^.]{0,80}\b(q|quer(y|ies))\b/i,
      hint: 'You have not said where the scores come from.',
      probe: 'Click Q and Kᵀ in the formula. What is the query of "model" compared with?',
    },
    {
      id: 'softmax',
      text: 'softmax turns the scores into positive weights that add up to 100 %.',
      keywords: /softmax[^.]{0,80}(weight|sum|add|100|\b1\b|positive|probab|normali|share)|(weight|probab|share)[^.]{0,60}softmax/i,
      hint: 'What does softmax do to the scores?',
      probe: 'Click softmax. What is true of the weights that was not true of the scores?',
    },
    {
      id: 'scale',
      text: '√dₖ shrinks the scores, so softmax does not put almost all the weight on one word when vectors are long.',
      keywords: /(√|sqrt|root|d_?k|dₖ|scal|divid)[^.]{0,100}(big|large|grow|huge|small|shrink|peak|spik|one word|extreme|sharp|flat|stable|range|saturat|dominat)/i,
      hint: 'Why divide by √dₖ at all?',
      probe: 'Turn the division off and move the dₖ slider. What happens to the bars?',
    },
    {
      id: 'values',
      text: 'The output of "model" is a mix of the values V, weighted by the attention weights.',
      keywords: /\b(v|values?)\b[^.]{0,80}(mix|weighted|sum|combin|average|blend)|(mix|weighted|sum|combin|average|blend)[^.]{0,80}\b(v|values?)\b/i,
      hint: 'What does "model" get at the very end?',
      probe: 'Click V. Where does the arrow of "model" move, and why there?',
    },
  ],
  misconceptions: [
    {
      id: 'maxOnly',
      text: 'softmax keeps only the word with the highest score.',
      keywords: /softmax[^.]{0,60}\b(only|just)\b[^.]{0,30}\b(one|highest|biggest|max|top|best)\b|\b(only|just) (the )?(highest|biggest|top|best)\b[^.]{0,30}\b(word|score)\b[^.]{0,20}\b(counts?|matters?|kept|survives?)\b/i,
      hint: 'Careful: softmax keeps every word in the mix, some with small weights.',
      probe: 'Look at the bars. Does any word get exactly 0 %?',
    },
  ],
  expertAnswer:
    'Q is the query of "model": what it looks for. K holds the keys of all words: what each one offers. Q times Kᵀ compares the query with every key and gives one match score per word. Dividing by √dₖ keeps these scores small. Otherwise, with long vectors, softmax would put almost all the weight on one word. softmax turns the scores into positive weights that add up to 100 %. Finally, "model" takes a mix of the values V, weighted by these weights. That mix is its new meaning in this sentence.',
};

export const EXPLAIN_TASKS: Record<TutorMissionId, ExplainTask> = { ...TUTOR_MISSIONS, formula: FORMULA_TASK };
