import { describe, expect, it } from 'vitest';
import { EXPLAIN_TASKS } from '@/content/missions';
import { FeedbackRequestSchema } from '@/lib/tutor/schema';
import { CASES } from '@/eval/explanations';

describe('tutor comparison set (eval/explanations.ts)', () => {
  it.each(CASES.map((c) => [c.id, c] as const))('%s is a valid request with real rubric ids', (_, c) => {
    expect(FeedbackRequestSchema.safeParse({ missionId: c.missionId, explanation: c.explanation, parts: c.parts, round: 1 }).success).toBe(true);
    const m = EXPLAIN_TASKS[c.missionId];
    for (const h of c.hits) expect(m.rubric.map((r) => r.id)).toContain(h);
    if (c.misconception) expect(m.misconceptions.map((x) => x.id)).toContain(c.misconception);
  });
  it('ids are unique and every task is covered', () => {
    expect(new Set(CASES.map((c) => c.id)).size).toBe(CASES.length);
    expect(new Set(CASES.map((c) => c.missionId))).toEqual(new Set(['contrast', 'remove', 'formula']));
  });
});
