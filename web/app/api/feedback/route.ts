import { FeedbackRequestSchema } from '@/lib/tutor/schema';
import { getFeedback, llmFromEnv } from '@/lib/tutor/getFeedback';

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
  return Response.json(await getFeedback(parsed.data, llmFromEnv()));
}
