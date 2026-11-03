'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLogger } from '@/components/LoggerProvider';
import { GIFTS, type MissionId } from '@/content/steps';

type Gift = (typeof GIFTS)[number];

interface GiftState {
  /** Gifts received, in the order they arrived. */
  gifts: Gift[];
  total: number;
  /** Gives Byte the gift for this module, once. Modules without a gift are ignored. */
  win: (id: MissionId) => void;
}

const GiftContext = createContext<GiftState | null>(null);

/** Byte's gifts: one per finished module (completion only, identical in both conditions). */
export function GiftProvider({ children }: { children: ReactNode }) {
  const logger = useLogger();
  const [gifts, setGifts] = useState<Gift[]>([]);
  const got = useRef<Gift[]>([]);

  const win = useCallback((id: MissionId) => {
    const gift = GIFTS.find((g) => g.id === id);
    if (!gift || got.current.includes(gift)) return;
    got.current = [...got.current, gift];
    logger.log('gift_received', { id, item: gift.item, count: got.current.length, total: GIFTS.length });
    setGifts(got.current);
  }, [logger]);

  const value = useMemo(() => ({ gifts, total: GIFTS.length, win }), [gifts, win]);
  return <GiftContext.Provider value={value}>{children}</GiftContext.Provider>;
}

export function useGifts(): GiftState {
  const g = useContext(GiftContext);
  if (!g) throw new Error('useGifts must be used inside <GiftProvider>');
  return g;
}
