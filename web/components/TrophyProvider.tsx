'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLogger } from '@/components/LoggerProvider';
import { TROPHY_PIECES, type MissionId } from '@/content/steps';

interface TrophyState {
  /** Modules finished, in the order they were won. */
  pieces: MissionId[];
  total: number;
  /** The last piece won, for the header announcement. */
  latest: { id: MissionId; title: string } | null;
  /** Wins the piece for this module, once. Modules without a piece are ignored. */
  win: (id: MissionId) => void;
}

const TrophyContext = createContext<TrophyState | null>(null);

export function TrophyProvider({ children }: { children: ReactNode }) {
  const logger = useLogger();
  const [pieces, setPieces] = useState<MissionId[]>([]);
  const [latest, setLatest] = useState<TrophyState['latest']>(null);
  const won = useRef<MissionId[]>([]);

  const win = useCallback((id: MissionId) => {
    const piece = TROPHY_PIECES.find((p) => p.id === id);
    if (!piece || won.current.includes(id)) return;
    won.current = [...won.current, id];
    logger.log('trophy_piece', { id, count: won.current.length, total: TROPHY_PIECES.length });
    setPieces(won.current);
    setLatest(piece);
  }, [logger]);

  const value = useMemo(() => ({ pieces, total: TROPHY_PIECES.length, latest, win }), [pieces, latest, win]);
  return <TrophyContext.Provider value={value}>{children}</TrophyContext.Provider>;
}

export function useTrophy(): TrophyState {
  const t = useContext(TrophyContext);
  if (!t) throw new Error('useTrophy must be used inside <TrophyProvider>');
  return t;
}
