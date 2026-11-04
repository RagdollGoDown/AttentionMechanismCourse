import { describe, expect, it } from 'vitest';
import { BYTE_LINES, GIFTS, LAB_ORDER, STEP_ORDER } from '@/content/steps';

describe("Byte's gifts", () => {
  it('one gift per finished module: every lesson step but the welcome, consent, tests and survey, and every lab experiment', () => {
    const expected = [...STEP_ORDER.filter((s) => !['welcome', 'consent', 'pretest', 'hook', 'why', 'lab', 'posttest', 'reflection'].includes(s)), ...LAB_ORDER];
    expect(new Set(GIFTS.map((g) => g.id))).toEqual(new Set(expected));
  });
  it('items are unique, and the food bowl is not one of them (Byte has it from the start)', () => {
    const items = GIFTS.map((g) => g.item);
    expect(new Set(items).size).toBe(items.length);
    expect(items).not.toContain('bowl');
  });
  it('every gift names what it is and what the module taught', () => {
    for (const g of GIFTS) { expect(g.name.length).toBeGreaterThan(2); expect(g.fact.length).toBeGreaterThan(10); }
  });

  it("Byte's cheers praise effort, never correctness (they are the same whatever the learner answered)", () => {
    for (const line of [...BYTE_LINES.hype, BYTE_LINES.test, BYTE_LINES.end]) expect(line).not.toMatch(/right|correct|wrong|smart|perfect/i);
  });
});
