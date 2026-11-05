/** Gifts the learner has won (received) and the ones already unwrapped (revealed), in order. */
export interface GiftQueue<T> {
  received: T[];
  revealed: T[];
}

export function receive<T>(q: GiftQueue<T>, item: T): GiftQueue<T> {
  return q.received.includes(item) ? q : { ...q, received: [...q.received, item] };
}

/** The next gift waiting to be unwrapped, or null. */
export function pendingOf<T>(q: GiftQueue<T>): T | null {
  return q.received.find((g) => !q.revealed.includes(g)) ?? null;
}

export function revealNext<T>(q: GiftQueue<T>): GiftQueue<T> {
  const next = pendingOf(q);
  return next === null ? q : { ...q, revealed: [...q.revealed, next] };
}
