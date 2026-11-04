import type { Submission } from '@/lib/assessment';
import type { CollectRecord } from '@/lib/collect/schema';
import type { Logger } from '@/lib/log';

/** Not /api/collect: ad blockers (uBlock Origin, EasyPrivacy) block that path as analytics, and nothing would be saved. */
export const RECORDS_URL = '/api/records';

export interface SendResult {
  /** The server accepted the record (and the store, if any, saved it). */
  ok: boolean;
  /** The record is kept somewhere. false with ok = true means no store is configured. */
  stored: boolean;
  store: string | null;
  error?: string;
}

function header(logger: Logger) {
  return { sessionId: logger.sessionId, participantId: logger.participantId, condition: logger.getCondition(), debug: logger.debug };
}

export function testRecord(logger: Logger, submission: Submission): CollectRecord {
  return { kind: 'test', ...header(logger), data: { ...submission } };
}

/** The whole log as the download has it, header and events. */
export function sessionRecord(logger: Logger): CollectRecord {
  return { kind: 'session', ...header(logger), data: JSON.parse(logger.toJSON()) };
}

/** Never throws: a failed send must not stop the lesson. The JSON download stays the fallback. */
export async function sendRecord(record: CollectRecord): Promise<SendResult> {
  try {
    const res = await fetch(RECORDS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
    const body = await res.json().catch(() => ({}));
    return { ok: res.ok, stored: res.ok && body.stored === true, store: body.store ?? null, error: res.ok ? undefined : body.error ?? `HTTP ${res.status}` };
  } catch (err) {
    return { ok: false, stored: false, store: null, error: err instanceof Error ? err.message : String(err) };
  }
}

export function surveyRecord(logger: Logger, answers: Record<string, unknown>): CollectRecord {
  return { kind: 'survey', ...header(logger), data: answers };
}

/** Sends a record, then the session log (only with consent), and logs what happened (in the downloadable log, after the sent copy). */
async function sendWithSession(logger: Logger, record: CollectRecord, what: string): Promise<SendResult[]> {
  // Without an explicit yes, nothing leaves the browser. "ok" so the lesson goes on; the JSON download stays available.
  if (logger.getConsent() !== true) {
    const results: SendResult[] = [0, 1].map(() => ({ ok: true, stored: false, store: 'no consent' }));
    logger.log('data_sent', { test: what, results: 'skipped: no consent' });
    return results;
  }
  const results = [await sendRecord(record), await sendRecord(sessionRecord(logger))];
  logger.log('data_sent', { test: what, results: results.map(({ ok, stored, store, error }) => ({ ok, stored, store, error })) });
  return results;
}

export const sendTestAndSession = (logger: Logger, submission: Submission) => sendWithSession(logger, testRecord(logger, submission), submission.test);
export const sendSurveyAndSession = (logger: Logger, answers: Record<string, unknown>) => sendWithSession(logger, surveyRecord(logger, answers), 'survey');
