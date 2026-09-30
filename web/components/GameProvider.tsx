'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLogger } from '@/components/LoggerProvider';
import { XP_PER_LEVEL, type BadgeId } from '@/content/steps';

interface Game {
  xp: number;
  level: number;
  /** XP inside the current level, 0..XP_PER_LEVEL. */
  levelXp: number;
  badges: BadgeId[];
  toast: { id: number; amount: number } | null;
  /** Adds XP once per `reason` (so replays and double clicks don't farm points). */
  award: (amount: number, reason: string) => void;
  earnBadge: (id: BadgeId) => void;
}

const GameContext = createContext<Game | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const logger = useLogger();
  const [xp, setXp] = useState(0);
  const [badges, setBadges] = useState<BadgeId[]>([]);
  const [toast, setToast] = useState<Game['toast']>(null);
  const paid = useRef(new Set<string>());

  const award = useCallback((amount: number, reason: string) => {
    if (paid.current.has(reason)) return;
    paid.current.add(reason);
    setXp((x) => x + amount);
    setToast({ id: paid.current.size, amount });
    logger.log('xp_gain', { amount, reason });
  }, [logger]);

  const earnBadge = useCallback((id: BadgeId) => {
    if (paid.current.has(`badge:${id}`)) return;
    paid.current.add(`badge:${id}`);
    setBadges((b) => [...b, id]);
    logger.log('badge', { id });
  }, [logger]);

  const game = useMemo(
    () => ({ xp, level: Math.floor(xp / XP_PER_LEVEL) + 1, levelXp: xp % XP_PER_LEVEL, badges, toast, award, earnBadge }),
    [xp, badges, toast, award, earnBadge],
  );
  return <GameContext.Provider value={game}>{children}</GameContext.Provider>;
}

export function useGame(): Game {
  const game = useContext(GameContext);
  if (!game) throw new Error('useGame must be used inside <GameProvider>');
  return game;
}
