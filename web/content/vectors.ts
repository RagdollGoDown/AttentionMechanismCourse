import { attentionRow, type AttentionRow, type Mat, type Vec } from '@/lib/attention';

/**
 * 2D toy embeddings: [fashion-ish, machine-learning-ish].
 * Hand-tuned so every mission's claim holds; guarded by tests/content-*.test.ts.
 * Phrase tiles ("fashion show") have a single vector.
 */
export const EMBEDDINGS: Record<string, Vec> = {
  after: [0.2, 0.0],
  the: [0.1, 0.1],
  model: [1.2, 1.2],
  'fashion show': [3.5, 0.1],
  'training run': [0.1, 3.5],
  'photo shoot': [3.0, 0.5],
  'long lecture': [0.8, 1.4],
  training: [0.1, 3.2],
  smiled: [2.0, 0.1],
  posed: [2.3, 0.0],
  'predicted the next word': [0.1, 2.6],
  overfitted: [0.0, 3.5],
  runway: [3.0, 0.0],
  dress: [2.6, 0.3],
  photographer: [2.2, 0.5],
  data: [0.3, 2.8],
  word: [0.4, 2.0],
  predicted: [0.1, 2.6],
};

// M3: identity projections, so a match score is the Mission 0 similarity divided by √2.
// Distinct W_Q / W_K arrive with the formula activity (P4).
export const W_Q: Mat = [[1, 0], [0, 1]];
export const W_K: Mat = [[1, 0], [0, 1]];

/** Words drawn on the Mission 0 meaning map. */
export const MAP_WORDS = ['runway', 'dress', 'photographer', 'smiled', 'model', 'training', 'data', 'word', 'predicted', 'the'];

export function embed(word: string): Vec {
  const v = EMBEDDINGS[word];
  if (!v) throw new Error(`No embedding for "${word}"`);
  return v;
}

export function attendTiles(words: string[], focusIndex: number): AttentionRow {
  return attentionRow(words.map(embed), focusIndex, W_Q, W_K);
}
