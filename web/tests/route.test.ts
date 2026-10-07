import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from '@/app/api/feedback/route';

const call = (body: unknown) =>
  POST(new Request('http://localhost/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  }));

beforeEach(() => {
  vi.stubEnv('TUTOR_MODEL', '');
  vi.stubEnv('AI_GATEWAY_API_KEY', '');
  vi.stubEnv('VERCEL_OIDC_TOKEN', '');
});
afterEach(() => vi.unstubAllEnvs());

describe('POST /api/feedback', () => {
  it('returns mock feedback without an LLM configured', async () => {
    const res = await call({ missionId: 'remove', explanation: 'The weights add up to 100 percent.', round: 1 });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.source).toBe('mock');
    expect(body.model).toBeNull();
    expect(body.rubricHits).toContain('sum');
  });
  it.each([
    ['invalid JSON', '{nope'],
    ['whitespace-only explanation', { missionId: 'swap', explanation: ' '.repeat(15), round: 1 }],
    ['too long explanation', { missionId: 'swap', explanation: 'x'.repeat(601), round: 1 }],
    ['unknown mission', { missionId: 'free', explanation: 'long enough text', round: 1 }],
  ])('400 on %s', async (_, body) => {
    expect((await call(body)).status).toBe(400);
  });
});

describe('GET /api/feedback (tutor status)', () => {
  const get = (q = '') => GET(new Request(`http://localhost/api/feedback${q}`));

  it('reports the LLM as off without a model or auth', async () => {
    expect(await (await get()).json()).toEqual({ llm: false, model: null });
  });

  it('reports the configured model', async () => {
    vi.stubEnv('TUTOR_MODEL', 'anthropic/claude-sonnet-5-5');
    vi.stubEnv('AI_GATEWAY_API_KEY', 'test-key');
    expect(await (await get()).json()).toEqual({ llm: true, model: 'anthropic/claude-sonnet-5-5' });
  });

  it('a model without auth still counts as off', async () => {
    vi.stubEnv('TUTOR_MODEL', 'anthropic/claude-sonnet-5-5');
    expect((await (await get()).json()).llm).toBe(false);
  });

  it('?probe makes a tutor call and says which tutor answered', async () => {
    const body = await (await get('?probe')).json();
    expect(body.probe.source).toBe('mock');
    expect(typeof body.probe.latencyMs).toBe('number');
  });
});
