'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

const SavedContext = createContext<Map<string, unknown> | null>(null);

/**
 * Keeps what the learner wrote across a remount of its children, so redoing a lab experiment
 * replays the interaction but still shows the answers already submitted.
 */
export function SavedAnswers({ children }: { children: ReactNode }) {
  const [store] = useState(() => new Map<string, unknown>());
  return <SavedContext.Provider value={store}>{children}</SavedContext.Provider>;
}

/** `useState` that survives a remount inside `<SavedAnswers>`. Outside one, it is plain `useState`. */
export function useSaved<T>(key: string, initial: T): [T, (value: T) => void] {
  const store = useContext(SavedContext);
  const [value, setValue] = useState<T>(() => (store?.has(key) ? (store.get(key) as T) : initial));
  function set(v: T) {
    store?.set(key, v);
    setValue(v);
  }
  return [value, set];
}
