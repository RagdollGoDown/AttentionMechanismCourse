import { afterEach, describe, expect, it, vi } from 'vitest';
import { SURVEY } from '@/content/tests';
import { RecordSchema } from '@/lib/collect/schema';
import { sendSurveyAndSession } from '@/lib/collect/send';
import { createLogger } from '@/lib/log';

afterEach(() => vi.unstubAllGlobals());

describe('reflection survey', () => {
  it('asks open questions only, with unique ids, and one about Byte', () => {
    const ids = SURVEY.open.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(SURVEY.open.some((q) => q.text.includes('Byte'))).toBe(true);
  });

  it('is accepted by /api/records and sent with the session log, only with consent', async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      expect(RecordSchema.safeParse(JSON.parse(String(init?.body))).success).toBe(true);
      return new Response(JSON.stringify({ ok: true, stored: true, store: 'x' }));
    });
    vi.stubGlobal('fetch', fetchMock);
    const answers = { open: { helped: 'the softmax step' }, durationMs: 1000 };
    const no = createLogger({ sessionId: 's1', condition: 'ai' });
    await sendSurveyAndSession(no, answers);
    expect(fetchMock).not.toHaveBeenCalled();
    const yes = createLogger({ sessionId: 's2', condition: 'ai' });
    yes.setConsent(true);
    await sendSurveyAndSession(yes, answers);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body)).kind).toBe('survey');
  });
});
