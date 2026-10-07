import type { CollectRecord } from '@/lib/collect/schema';

export type StoredRecord = CollectRecord & { receivedAt: string };

/**
 * Where records go after /api/collect accepts them. Picked by COLLECT_STORE, so changing the
 * backend touches this file and the env only. Keys stay on the server.
 */
export interface Store {
  name: string;
  /** false: records are not kept anywhere (no store, or one missing its settings). */
  ready: boolean;
  save(record: StoredRecord): Promise<void>;
}

type Env = Record<string, string | undefined>;
type Fetch = typeof fetch;

const TIMEOUT_MS = 8000;

async function post(fetchFn: Fetch, url: string, headers: Record<string, string>, body: unknown): Promise<void> {
  const res = await fetchFn(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`${url} answered HTTP ${res.status}`);
}

const none: Store = {
  name: 'none',
  ready: false,
  async save(r) {
    console.info(`[collect] no store configured; dropped a ${r.kind} record (participant ${r.participantId ?? '-'})`);
  },
};

function misconfigured(name: string, missing: string): Store {
  return {
    name: `${name} (missing ${missing})`,
    ready: false,
    async save() {
      throw new Error(`COLLECT_STORE=${name} needs ${missing}`);
    },
  };
}

/** Any URL that accepts a JSON POST (a Google Apps Script, a Zapier hook, a small server). */
function webhook(env: Env, fetchFn: Fetch): Store {
  const url = env.COLLECT_WEBHOOK_URL;
  if (!url) return misconfigured('webhook', 'COLLECT_WEBHOOK_URL');
  const auth: Record<string, string> = env.COLLECT_WEBHOOK_SECRET ? { Authorization: `Bearer ${env.COLLECT_WEBHOOK_SECRET}` } : {};
  return { name: 'webhook', ready: true, save: (r) => post(fetchFn, url, auth, r) };
}

/**
 * Supabase through its REST API (no SDK): one row per record in SUPABASE_TABLE.
 * Table: kind text, session_id text, participant_id text, condition text, debug bool, received_at timestamptz, data jsonb.
 */
function supabase(env: Env, fetchFn: Fetch): Store {
  const base = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return misconfigured('supabase', 'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  const url = `${base.replace(/\/$/, '')}/rest/v1/${env.SUPABASE_TABLE || 'study_records'}`;
  const headers = { apikey: key, Authorization: `Bearer ${key}`, Prefer: 'return=minimal' };
  return {
    name: 'supabase',
    ready: true,
    save: (r) => post(fetchFn, url, headers, {
      kind: r.kind,
      session_id: r.sessionId,
      participant_id: r.participantId,
      condition: r.condition,
      debug: r.debug,
      received_at: r.receivedAt,
      data: r.data,
    }),
  };
}

export function storeFromEnv(env: Env = process.env, fetchFn: Fetch = fetch): Store {
  const kind = (env.COLLECT_STORE ?? '').trim().toLowerCase();
  if (kind === '' || kind === 'none') return none;
  if (kind === 'webhook') return webhook(env, fetchFn);
  if (kind === 'supabase') return supabase(env, fetchFn);
  return misconfigured(kind, 'a known COLLECT_STORE (none, webhook, supabase)');
}
