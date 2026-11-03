import { FeedbackRequestSchema, type FeedbackRequest } from '@/lib/tutor/schema';
import { getFeedback, tutorModels, tutorsFromEnv } from '@/lib/tutor/getFeedback';

/** A fixed explanation for the experimenter's test call. */
const PROBE: FeedbackRequest = { missionId: 'remove', explanation: 'The weights always add up to 100 percent.', round: 1, mode: 'formative' };

/**
 * Tutor status for the experimenter: `{ llm, model }` (model: the chain, e.g. "primary → backup").
 * With `?probe`, also makes one real tutor call and reports who answered (`llm` + model, or `mock`).
 */
export async function GET(request: Request): Promise<Response> {
  const models = tutorModels();
  const status = { llm: models.length > 0, model: models.join(' → ') || null };
  if (!new URL(request.url).searchParams.has('probe')) return Response.json(status);
  const fb = await getFeedback(PROBE, tutorsFromEnv());
  return Response.json({ ...status, probe: { source: fb.source, model: fb.model, latencyMs: fb.latencyMs } });
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
  // `model` goes into the learner's log, so each reply says which model wrote it (backup included).
  return Response.json(await getFeedback(parsed.data, tutorsFromEnv()));
}
