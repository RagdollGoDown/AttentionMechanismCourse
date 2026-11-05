'use client';

import { useState } from 'react';
import { moodOf, type MoodLevel } from '@/lib/mood';

/** One face per mood level: colour and mouth. Original drawing (sticker style approved in the mockup). */
const FACES: Record<MoodLevel, { fill: string; mouth: string }> = {
  Bored: { fill: '#d9dde3', mouth: 'M13 27 h14' },
  Okay: { fill: '#f3e27a', mouth: 'M13 26 q7 3 14 0' },
  Happy: { fill: '#9be15d', mouth: 'M12 24 q8 7 16 0' },
  Joyful: { fill: '#5fd06a', mouth: 'M11 23 q9 10 18 0' },
  Overjoyed: { fill: '#38c9a0', mouth: 'M11 22 q9 12 18 0 z' },
};

/**
 * Byte's mood: a face on top of a vertical bar, and the mood word. It only goes up (completion only,
 * identical in both conditions). `pulse` changes when a gift is unwrapped: the gauge grows, fills, and shrinks back.
 */
export function MoodGauge({ count, total, pulse }: { count: number; total: number; pulse: number }) {
  const { level, pct } = moodOf(count, total);
  const face = FACES[level];
  // Grow only for gifts unwrapped while the gauge is on screen; switching between two identical
  // animations restarts it for every new gift.
  const [first] = useState(pulse);
  const pop = pulse === first ? '' : pulse % 2 ? 'garden-mood-pop-a' : 'garden-mood-pop-b';

  return (
    <div className={`garden-mood ${pop}`}>
      <span className="garden-mood-label">Mood</span>
      <svg viewBox="0 0 40 40" width="34" height="34" aria-hidden>
        <circle cx="20" cy="20" r="17" fill={face.fill} stroke="#2b2233" strokeWidth="3" />
        <circle cx="14.5" cy="16" r="2.4" fill="#2b2233" />
        <circle cx="25.5" cy="16" r="2.4" fill="#2b2233" />
        <path d={face.mouth} fill={level === 'Overjoyed' ? '#2b2233' : 'none'} stroke="#2b2233" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="garden-mood-bar" aria-hidden><i style={{ height: `${pct}%` }} /></span>
      <strong className="garden-mood-word">{level}</strong>
      <span className="sr-only" aria-live="polite">{`Byte's mood: ${level}, ${pct} %`}</span>
    </div>
  );
}
