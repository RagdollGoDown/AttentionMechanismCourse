import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from '@/app/api/records/route';
import { RECORDS_URL } from '@/lib/collect/send';
import { storeFromEnv, type StoredRecord } from '@/lib/collect/store';

const record = { kind: 'test', sessionId: 's1', participantId: 'P07', condition: null, debug: false, data: { test: 'pre' } };
const call = (body: unknown) =>
  POST(new Request('http://localhost/api/records', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  }));

beforeEach(() => {
  for (const k of ['COLLECT_STORE', 'COLLECT_WEBHOOK_URL', 'COLLECT_WEBHOOK_SECRET', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_TABLE']) vi.stubEnv(k, '');
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('POST /api/records', () => {
  it('accepts a record without a store, and says it was not kept', async () => {
    const res = await call(record);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, stored: false, store: 'none' });
  });

  it.each([
    ['invalid JSON', '{nope'],
    ['unknown kind', { ...record, kind: 'other' }],
    ['unknown condition', { ...record, condition: 'both' }],
    ['missing session', { ...record, sessionId: '' }],
    ['data not an object', { ...record, data: 'text' }],
  ])('400 on %s', async (_, body) => {
    expect((await call(body)).status).toBe(400);
  });

  it('413 on a huge body', async () => {
    expect((await call({ ...record, data: { x: 'a'.repeat(2_000_001) } })).status).toBe(413);
  });

  it('forwards to the webhook with the secret, and stamps receivedAt', async () => {
    vi.stubEnv('COLLECT_STORE', 'webhook');
    vi.stubEnv('COLLECT_WEBHOOK_URL', 'https://hook.example/in');
    vi.stubEnv('COLLECT_WEBHOOK_SECRET', 's3cret');
    const fetchMock = vi.fn<(url: string, init: RequestInit) => Promise<Response>>(async () => new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const res = await call(record);
    expect(await res.json()).toEqual({ ok: true, stored: true, store: 'webhook' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://hook.example/in');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer s3cret');
    const sent = JSON.parse(init.body as string);
    expect(sent).toMatchObject(record);
    expect(Date.parse(sent.receivedAt)).not.toBeNaN();
  });

  it('502 when the store fails, so the page can offer the download', async () => {
    vi.stubEnv('COLLECT_STORE', 'webhook');
    vi.stubEnv('COLLECT_WEBHOOK_URL', 'https://hook.example/in');
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 500 })));
    const res = await call(record);
    expect(res.status).toBe(502);
    expect((await res.json()).ok).toBe(false);
  });
});

describe('GET /api/records (store status)', () => {
  it('reports no store by default', async () => {
    expect(await (await GET()).json()).toEqual({ store: 'none', ready: false });
  });
  it('reports a store missing its settings as not ready', async () => {
    vi.stubEnv('COLLECT_STORE', 'supabase');
    const body = await (await GET()).json();
    expect(body.ready).toBe(false);
    expect(body.store).toMatch(/supabase \(missing/);
  });
});

describe('storeFromEnv', () => {
  const stored: StoredRecord = { kind: 'session', sessionId: 's1', participantId: null, condition: 'ai', debug: true, data: { events: [] }, receivedAt: '2026-10-07T10:00:00.000Z' };

  it('supabase: inserts one row through the REST API with the service key', async () => {
    const fetchMock = vi.fn<(url: string, init: RequestInit) => Promise<Response>>(async () => new Response(null, { status: 201 }));
    const store = storeFromEnv({ COLLECT_STORE: 'supabase', SUPABASE_URL: 'https://abc.supabase.co/', SUPABASE_SERVICE_ROLE_KEY: 'key' }, fetchMock as unknown as typeof fetch);
    expect(store).toMatchObject({ name: 'supabase', ready: true });
    await store.save(stored);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://abc.supabase.co/rest/v1/study_records');
    expect(init.headers).toMatchObject({ apikey: 'key', Authorization: 'Bearer key' });
    expect(JSON.parse(init.body as string)).toEqual({
      kind: 'session', session_id: 's1', participant_id: null, condition: 'ai', debug: true, received_at: stored.receivedAt, data: { events: [] },
    });
  });

  it('an unknown store name is reported, and saving with it fails loudly', async () => {
    const store = storeFromEnv({ COLLECT_STORE: 'mongo' });
    expect(store.ready).toBe(false);
    await expect(store.save(stored)).rejects.toThrow();
  });
});

describe('records endpoint', () => {
  it('has a path ad blockers leave alone (uBlock Origin blocked /api/collect)', () => {
    expect(RECORDS_URL).toBe('/api/records');
    expect(RECORDS_URL).not.toMatch(/collect|track|analytic|beacon|pixel|telemetry|stats|log/i);
  });
});
