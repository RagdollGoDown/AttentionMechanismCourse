import { FeedbackRequestSchema, type FeedbackRequest } from '@/lib/tutor/schema';
import { getFeedback, llmFromEnv, tutorModel } from '@/lib/tutor/getFeedback';

/** A fixed explanation for the experimenter's test call. */
const PROBE: FeedbackRequest = { missionId: 'remove', explanation: 'The weights always add up to 100 percent.', round: 1 };

/**
 * Tutor status for the experimenter: `{ llm, model }`.
 * With `?probe`, also makes one real tutor call and reports which tutor answered (`llm` or `mock`).
 */
export async function GET(request: Request): Promise<Response> {
  const model = tutorModel();
  const status = { llm: model !== null, model };
  if (!new URL(request.url).searchParams.has('probe')) return Response.json(status);
  const fb = await getFeedback(PROBE, llmFromEnv());
  return Response.json({ ...status, probe: { source: fb.source, latencyMs: fb.latencyMs } });
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = FeedbackRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Invalid request', issues: parsed.error.issues }, { status: 400 });
  }
  const fb = await getFeedback(parsed.data, llmFromEnv());
  // The model name goes into the learner's log, so each reply says which model wrote it.
  return Response.json({ ...fb, model: fb.source === 'llm' ? tutorModel() : null });
}
