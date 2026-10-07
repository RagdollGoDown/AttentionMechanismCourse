import { MAX_BODY_CHARS, RecordSchema } from '@/lib/collect/schema';
import { storeFromEnv } from '@/lib/collect/store';

/** Store status for the experimenter: `{ store, ready }`. */
export async function GET(): Promise<Response> {
  const { name, ready } = storeFromEnv();
  return Response.json({ store: name, ready });
}

/** One record from the browser (a test submission or a session log), handed to the configured store. */
export async function POST(request: Request): Promise<Response> {
  const text = await request.text();
  if (text.length > MAX_BODY_CHARS) return Response.json({ error: 'Too large' }, { status: 413 });
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = RecordSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Invalid record', issues: parsed.error.issues }, { status: 400 });
  }
  const store = storeFromEnv();
  try {
    await store.save({ ...parsed.data, receivedAt: new Date().toISOString() });
  } catch (err) {
    console.error('[collect] store failed:', err);
    return Response.json({ ok: false, stored: false, store: store.name, error: 'Store failed' }, { status: 502 });
  }
  return Response.json({ ok: true, stored: store.ready, store: store.name });
}
