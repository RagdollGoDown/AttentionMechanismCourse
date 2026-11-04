import type { Condition } from '@/lib/condition';
import type { MissionId } from '@/content/steps';

export type EventType =
  | 'session_start'
  | 'consent_answer'
  | 'mission_start'
  | 'mission_end'
  | 'skip'
  | 'focus_word'
  | 'swap_word'
  | 'remove_word'
  | 'restore_word'
  | 'part_next'
  | 'vector_peek'
  | 'dot_drag'
  | 'dot_task'
  | 'hand_dot_answer'
  | 'prediction'
  | 'reveal'
  | 'toggle_before_after'
  | 'reflection_submit'
  | 'explanation_submit'
  | 'feedback_received'
  | 'condition_change'
  | 'hook_answer'
  | 'tab_open'
  | 'qk_select'
  | 'rule_try'
  | 'check_answer'
  | 'softmax_stage'
  | 'formula_part'
  | 'dk_change'
  | 'trophy_piece'
  | 'compute_check'
  | 'calc_use'
  | 'compute_reveal'
  | 'revision_skipped'
  | 'test_answer'
  | 'test_submit'
  | 'data_sent'
  | 'nav_back'
  | 'lab_redo'
  // Developer tools (?debug) only; filter these out of study data.
  | 'debug_goto'
  | 'debug_reset'
  | 'debug_tutor_probe';

export interface LogEvent {
  sessionId: string;
  /** From `?pid=`; null when the link has none. */
  participantId: string | null;
  /** null on the standalone pre-test, which runs before a condition is assigned. */
  condition: Condition | null;
  missionId: MissionId | null;
  type: EventType;
  /** Milliseconds since the session started. */
  t: number;
  /** Wall-clock time (ISO 8601), to line sessions up with each other and with the calendar. */
  at: string;
  payload: Record<string, unknown>;
}

/** What the export header says about the tutor: a session with any mock reply is excluded from the study. */
export interface TutorSummary {
  replies: number;
  mockReplies: number;
  errors: number;
  models: string[];
}

export function tutorSummary(events: readonly LogEvent[]): TutorSummary {
  const fb = events.filter((e) => e.type === 'feedback_received' && e.payload.source !== 'expert');
  const models = fb.map((e) => e.payload.model).filter((m): m is string => typeof m === 'string');
  return {
    replies: fb.filter((e) => e.payload.source === 'llm' || e.payload.source === 'mock').length,
    mockReplies: fb.filter((e) => e.payload.source === 'mock').length,
    errors: fb.filter((e) => e.payload.source === 'error').length,
    models: [...new Set(models)],
  };
}

/** Where events go besides memory (e.g. Supabase in M4). */
export interface LogSink {
  write(event: LogEvent): void;
}

export interface Logger {
  readonly sessionId: string;
  readonly participantId: string | null;
  /** `?debug` session: excluded from the study. */
  readonly debug: boolean;
  log(type: EventType, payload?: Record<string, unknown>): void;
  setMission(id: MissionId | null): void;
  setCondition(condition: Condition): void;
  getCondition(): Condition | null;
  /** null until the learner has answered the consent page. Only an explicit true lets data leave the browser. */
  setConsent(agreed: boolean): void;
  getConsent(): boolean | null;
  getEvents(): readonly LogEvent[];
  subscribe(listener: () => void): () => void;
  toJSON(): string;
}

export function createLogger(opts: {
  sessionId: string;
  condition: Condition | null;
  participantId?: string | null;
  debug?: boolean;
  now?: () => number;
  /** Wall clock in epoch ms (for `at`). */
  wallNow?: () => number;
  sinks?: LogSink[];
}): Logger {
  const now = opts.now ?? (() => performance.now());
  const wallNow = opts.wallNow ?? (() => Date.now());
  const participantId = opts.participantId ?? null;
  const debug = opts.debug ?? false;
  const startedAt = new Date(wallNow()).toISOString();
  const sinks = opts.sinks ?? [];
  const t0 = now();
  const listeners = new Set<() => void>();
  let condition = opts.condition;
  let missionId: MissionId | null = null;
  let consent: boolean | null = null;
  let events: LogEvent[] = [];

  const logger: Logger = {
    sessionId: opts.sessionId,
    participantId,
    debug,
    log(type, payload = {}) {
      const event: LogEvent = {
        sessionId: opts.sessionId, participantId, condition, missionId, type,
        t: Math.round(now() - t0), at: new Date(wallNow()).toISOString(), payload,
      };
      events = [...events, event]; // new identity so useSyncExternalStore re-renders
      for (const sink of sinks) {
        try {
          sink.write(event);
        } catch (err) {
          console.error('[log] sink failed:', err);
        }
      }
      listeners.forEach((l) => l());
    },
    setMission(id) {
      missionId = id;
    },
    setCondition(next) {
      if (next === condition) return;
      const from = condition;
      condition = next;
      logger.log('condition_change', { from, to: next });
    },
    getCondition: () => condition,
    setConsent(agreed) {
      consent = agreed;
      logger.log('consent_answer', { agreed });
    },
    getConsent: () => consent,
    getEvents: () => events,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    toJSON: () => JSON.stringify({
      sessionId: opts.sessionId,
      participantId,
      condition,
      debug,
      consent,
      startedAt,
      exportedAt: new Date(wallNow()).toISOString(),
      totalMs: events.at(-1)?.t ?? 0,
      tutor: tutorSummary(events),
      events,
    }, null, 2),
  };

  logger.log('session_start', { condition, participantId, debug });
  return logger;
}
