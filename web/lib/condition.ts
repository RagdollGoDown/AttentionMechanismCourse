export type Condition = 'ai' | 'control';

/**
 * `?condition=` value → Condition. Case-insensitive; first value wins.
 * Anything else → null: the entry page then draws one at random (`randomCondition`).
 */
export function parseCondition(value: string | readonly string[] | null | undefined): Condition | null {
  const v = Array.isArray(value) ? value[0] : value;
  const c = typeof v === 'string' ? v.trim().toLowerCase() : '';
  return c === 'ai' || c === 'control' ? c : null;
}

/** 50/50 draw, used when the link has no `?condition=`. */
export function randomCondition(random: () => number = Math.random): Condition {
  return random() < 0.5 ? 'ai' : 'control';
}

/** `?debug` → developer tools on. The flag's presence is enough; any value is ignored. */
export function parseDebug(value: string | readonly string[] | null | undefined): boolean {
  return value !== undefined && value !== null;
}

/** `?pid=` → participant ID. Letters, digits, `-` and `_` only (it ends up in file names and logs); else null. */
export function parsePid(value: string | readonly string[] | null | undefined): string | null {
  const v = Array.isArray(value) ? value[0] : value;
  return typeof v === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(v.trim()) ? v.trim() : null;
}
