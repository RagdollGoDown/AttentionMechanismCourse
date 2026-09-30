import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/feedback/route';

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
