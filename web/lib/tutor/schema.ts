import { z } from 'zod';

export const EXPLANATION_MIN = 10;
export const EXPLANATION_MAX = 600;

export const FeedbackSchema = z.object({
  correct: z.string(),
  missing: z.string(),
  question: z.string(),
  misconceptionId: z.string().nullable(),
  rubricHits: z.array(z.string()),
});
export type Feedback = z.infer<typeof FeedbackSchema>;

export type FeedbackResponse = Feedback & { source: 'llm' | 'mock'; latencyMs: number };

export const FeedbackRequestSchema = z.object({
  missionId: z.enum(['swap', 'remove']),
  explanation: z.string().trim().min(EXPLANATION_MIN).max(EXPLANATION_MAX),
  round: z.union([z.literal(1), z.literal(2)]),
  previous: z
    .object({ explanation: z.string().max(EXPLANATION_MAX), feedback: FeedbackSchema })
    .optional(),
});
export type FeedbackRequest = z.infer<typeof FeedbackRequestSchema>;
