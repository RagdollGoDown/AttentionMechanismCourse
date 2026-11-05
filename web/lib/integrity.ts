/** The minimum of a DOM element that the paste log needs (plain objects in tests). */
interface FieldLike {
  tagName?: string;
  name?: string;
  id?: string;
  getAttribute?: (name: string) => string | null;
}

/**
 * Which text field a paste went into, or null when it was not a text field. We log the field and the
 * length of the pasted text, never the text itself.
 */
export function pastedField(target: EventTarget | FieldLike | null): string | null {
  const el = target as FieldLike | null;
  const tag = el?.tagName?.toLowerCase();
  if (tag !== 'textarea' && tag !== 'input') return null;
  return el?.name || el?.id || el?.getAttribute?.('aria-label') || tag;
}
