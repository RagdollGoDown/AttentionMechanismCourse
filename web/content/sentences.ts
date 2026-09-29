import type { Tile } from '@/lib/tiles';

export const FOCUS = 'model';

export const SENTENCE_A = ['after', 'the', 'fashion show', 'the', 'model', 'smiled'];
export const SENTENCE_B = ['after', 'training', 'the', 'model', 'predicted the next word'];

/** Free-play slots: "After [opener], the model [ending]". */
export const BUILDER_OPENERS: string[][] = [['the', 'fashion show'], ['training'], ['the', 'photo shoot'], ['the', 'long lecture']];
export const BUILDER_ENDINGS: string[][] = [['smiled'], ['predicted the next word'], ['posed'], ['overfitted']];

/** Keys encode the slot choice so tiles re-mount (no misleading animation) when a slot changes. */
export function buildSentenceTiles(opener: number, ending: number): Tile[] {
  return [
    { key: 'after', word: 'after' },
    ...BUILDER_OPENERS[opener].map((word, i) => ({ key: `open-${opener}-${i}`, word })),
    { key: 'the', word: 'the' },
    { key: FOCUS, word: FOCUS },
    ...BUILDER_ENDINGS[ending].map((word, i) => ({ key: `end-${ending}-${i}`, word })),
  ];
}
