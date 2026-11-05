/** Byte's mood: one step per gift, never down, Overjoyed exactly with the last gift (completion only). */
export const MOOD_LEVELS = ['Bored', 'Okay', 'Happy', 'Joyful', 'Overjoyed'] as const;
export type MoodLevel = (typeof MOOD_LEVELS)[number];

export function moodOf(count: number, total: number): { level: MoodLevel; pct: number } {
  const pct = total > 0 ? Math.round((100 * Math.min(count, total)) / total) : 0;
  const level: MoodLevel =
    count <= 0 ? 'Bored'
    : count >= total ? 'Overjoyed'
    : count * 3 <= total ? 'Okay'
    : count * 3 <= total * 2 ? 'Happy'
    : 'Joyful';
  return { level, pct };
}

/** "🎾 Tennis ball · Playful +1": what a gift adds to Byte's mood. */
export function badgeLabel(gift: { badge: { emoji: string; label: string; word: string } }): string {
  const { emoji, label, word } = gift.badge;
  return `${emoji} ${label} · ${word} +1`;
}
