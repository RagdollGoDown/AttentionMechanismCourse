import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Submission } from '@/lib/assessment';
import { sendTestAndSession } from '@/lib/collect/send';
import { createLogger } from '@/lib/log';

const sub = { test: 'pre', items: [], byGoal: {} } as unknown as Submission;
const make = () => createLogger({ sessionId: 's1', condition: null });

afterEach(() => vi.unstubAllGlobals());

describe('consent', () => {
  it('sends nothing before an answer or after a no', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const unanswered = make();
    const declined = make();
    declined.setConsent(false);
    for (const logger of [unanswered, declined]) {
      const results = await sendTestAndSession(logger, sub);
      expect(results.every((r) => r.ok && !r.stored)).toBe(true);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends the test and the session after a yes, and logs the answer', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true, stored: true, store: 'x' })));
    vi.stubGlobal('fetch', fetchMock);
    const logger = make();
    logger.setConsent(true);
    await sendTestAndSession(logger, sub);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(logger.getEvents().some((e) => e.type === 'consent_answer' && e.payload.agreed === true)).toBe(true);
    expect(JSON.parse(logger.toJSON()).consent).toBe(true);
  });
});
