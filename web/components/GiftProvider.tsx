'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLogger } from '@/components/LoggerProvider';
import { GIFTS, type MissionId } from '@/content/steps';
import { pendingOf, receive, revealNext, type GiftQueue } from '@/lib/giftQueue';

type Gift = (typeof GIFTS)[number];
export type RevealVia = 'button' | 'close' | 'hidden';

interface GiftState {
  /** Gifts received, in the order they arrived. */
  gifts: Gift[];
  /** Gifts already unwrapped: the only ones the garden shows. */
  revealed: Gift[];
  /** The next gift waiting to be unwrapped, or null. */
  pending: Gift | null;
  total: number;
  /** Gives Byte the gift for this module, once. Modules without a gift are ignored. */
  win: (id: MissionId) => void;
  /** Unwraps the pending gift (from the gift window, or silently when the garden is hidden). */
  reveal: (via: RevealVia, ms: number) => void;
}

const GiftContext = createContext<GiftState | null>(null);

/** Byte's gifts: one per finished module (completion only, identical in both conditions). */
export function GiftProvider({ children }: { children: ReactNode }) {
  const logger = useLogger();
  const [queue, setQueue] = useState<GiftQueue<Gift>>({ received: [], revealed: [] });
  const q = useRef(queue);
  const update = useCallback((next: GiftQueue<Gift>) => { q.current = next; setQueue(next); }, []);

  const win = useCallback((id: MissionId) => {
    const gift = GIFTS.find((g) => g.id === id);
    if (!gift || q.current.received.includes(gift)) return;
    update(receive(q.current, gift));
    logger.log('gift_received', { id, item: gift.item, count: q.current.received.length, total: GIFTS.length });
  }, [logger, update]);

  const reveal = useCallback((via: RevealVia, ms: number) => {
    const gift = pendingOf(q.current);
    if (!gift) return;
    update(revealNext(q.current));
    logger.log('gift_opened', { item: gift.item, via, ms: Math.round(ms) });
  }, [logger, update]);

  const value = useMemo(() => ({
    gifts: queue.received, revealed: queue.revealed, pending: pendingOf(queue), total: GIFTS.length, win, reveal,
  }), [queue, win, reveal]);
  return <GiftContext.Provider value={value}>{children}</GiftContext.Provider>;
}

export function useGifts(): GiftState {
  const g = useContext(GiftContext);
  if (!g) throw new Error('useGifts must be used inside <GiftProvider>');
  return g;
}
