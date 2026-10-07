import { z } from 'zod';

export const EXPLANATION_MIN = 10;
export const EXPLANATION_MAX = 600;
export const PART_MAX = 110;

// Capped because `previous.feedback` comes back from the client and goes into the LLM prompt.
const text = z.string().max(EXPLANATION_MAX);
const id = z.string().max(40);

export const FeedbackSchema = z.object({
  correct: text,
  missing: text,
  question: text,
  misconceptionId: id.nullable(),
  rubricHits: z.array(id).max(10),
});
export type Feedback = z.infer<typeof FeedbackSchema>;

export type FeedbackResponse = Feedback & { source: 'llm' | 'mock'; latencyMs: number; /** Set by the API route. */ model?: string | null };

export const FeedbackRequestSchema = z.object({
  missionId: z.enum(['swap', 'remove', 'formula']),
  explanation: z.string().trim().min(EXPLANATION_MIN).max(EXPLANATION_MAX),
  round: z.union([z.literal(1), z.literal(2)]),
  /** Per-part answers (formula task). The joined `explanation` is what the LLM reads. */
  parts: z.record(z.string().max(20), z.string().max(PART_MAX)).refine((p) => Object.keys(p).length <= 5, "too many parts").optional(),
  previous: z
    .object({ explanation: z.string().max(EXPLANATION_MAX), feedback: FeedbackSchema })
    .optional(),
});
export type FeedbackRequest = z.infer<typeof FeedbackRequestSchema>;
