import { z } from 'zod';

/** What the browser sends to POST /api/records: one test submission, the reflection survey, or a whole session log. */
export const RecordSchema = z.object({
  kind: z.enum(['test', 'survey', 'session']),
  sessionId: z.string().min(1).max(100),
  participantId: z.string().max(40).nullable(),
  /** null on the pre-test, which runs before the condition is assigned. */
  condition: z.enum(['ai', 'control']).nullable(),
  /** `?debug` session: kept, but excluded from the study. */
  debug: z.boolean(),
  /** The test submission, the survey answers, or the session log as exported (header + events). */
  data: z.record(z.string(), z.unknown()),
});

export type CollectRecord = z.infer<typeof RecordSchema>;

/** A session log is ~100 kB; this leaves room and stays under Vercel's 4.5 MB body limit. */
export const MAX_BODY_CHARS = 2_000_000;
