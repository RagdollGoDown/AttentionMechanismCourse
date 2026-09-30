'use client';

import { createContext, useContext, useState, useSyncExternalStore, type ReactNode } from 'react';
import { createLogger, type LogEvent, type Logger } from '@/lib/log';
import type { Condition } from '@/lib/condition';

const LoggerContext = createContext<Logger | null>(null);
const EMPTY: readonly LogEvent[] = [];

export function LoggerProvider({ condition, children }: { condition: Condition; children: ReactNode }) {
  const [logger] = useState(() => createLogger({ sessionId: crypto.randomUUID(), condition }));
  return <LoggerContext.Provider value={logger}>{children}</LoggerContext.Provider>;
}

export function useLogger(): Logger {
  const logger = useContext(LoggerContext);
  if (!logger) throw new Error('useLogger must be used inside <LoggerProvider>');
  return logger;
}

export function useLogEvents(): readonly LogEvent[] {
  const logger = useLogger();
  return useSyncExternalStore(logger.subscribe, logger.getEvents, () => EMPTY);
}
