import { describe, expect, it } from 'vitest';
import { moodOf } from '@/lib/mood';
import { pendingOf, receive, revealNext, type GiftQueue } from '@/lib/giftQueue';

describe("Byte's mood", () => {
  it('climbs one level band at a time and is Overjoyed only with the last gift', () => {
    expect([0, 1, 3, 4, 6, 7, 8, 9].map((n) => moodOf(n, 9).level))
      .toEqual(['Bored', 'Okay', 'Okay', 'Happy', 'Happy', 'Joyful', 'Joyful', 'Overjoyed']);
  });
  it('percentage is gifts over total, 100 exactly at the end', () => {
    expect(moodOf(0, 9).pct).toBe(0);
    expect(moodOf(4, 9).pct).toBe(44);
    expect(moodOf(9, 9).pct).toBe(100);
  });
});

describe('gift queue', () => {
  const empty: GiftQueue<string> = { received: [], revealed: [] };
  it('reveals gifts one at a time, in the order they were received', () => {
    let q = receive(receive(empty, 'a'), 'b');
    expect(pendingOf(q)).toBe('a');
    q = revealNext(q);
    expect(pendingOf(q)).toBe('b');
    q = revealNext(q);
    expect(pendingOf(q)).toBeNull();
    expect(q.revealed).toEqual(['a', 'b']);
  });
  it('ignores a gift received twice, and revealing with nothing pending changes nothing', () => {
    const q = revealNext(receive(empty, 'a'));
    expect(receive(q, 'a').received).toEqual(['a']);
    expect(revealNext(q)).toEqual(q);
  });
});
