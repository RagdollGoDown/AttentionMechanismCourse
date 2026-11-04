import type { Submission } from '@/lib/assessment';
import type { CollectRecord } from '@/lib/collect/schema';
import type { Logger } from '@/lib/log';

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
    const res = await fetch('/api/collect', {
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

/** Sends the test, then the session log (only with consent), and logs what happened (in the downloadable log, after the sent copy). */
export async function sendTestAndSession(logger: Logger, submission: Submission): Promise<SendResult[]> {
  // Without an explicit yes, nothing leaves the browser. "ok" so the lesson goes on; the JSON download stays available.
  if (logger.getConsent() !== true) {
    const results: SendResult[] = [0, 1].map(() => ({ ok: true, stored: false, store: 'no consent' }));
    logger.log('data_sent', { test: submission.test, results: 'skipped: no consent' });
    return results;
  }
  const results = [await sendRecord(testRecord(logger, submission)), await sendRecord(sessionRecord(logger))];
  logger.log('data_sent', { test: submission.test, results: results.map(({ ok, stored, store, error }) => ({ ok, stored, store, error })) });
  return results;
}
