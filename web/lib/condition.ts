export type Condition = 'ai' | 'control';

/** `?condition=` value → Condition. Case-insensitive; first value wins; anything else → 'ai'. */
export function parseCondition(value: string | readonly string[] | null | undefined): Condition {
  const v = Array.isArray(value) ? value[0] : value;
  return typeof v === 'string' && v.trim().toLowerCase() === 'control' ? 'control' : 'ai';
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
