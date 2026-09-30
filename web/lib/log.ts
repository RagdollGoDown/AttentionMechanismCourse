import type { Condition } from '@/lib/condition';
import type { MissionId } from '@/content/steps';

export type EventType =
  | 'session_start'
  | 'mission_start'
  | 'mission_end'
  | 'skip'
  | 'focus_word'
  | 'swap_word'
  | 'remove_word'
  | 'restore_word'
  | 'map_pair_select'
  | 'quick_check_answer'
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
  | 'formula_part'
  | 'dk_change'
  | 'xp_gain'
  | 'badge';

export interface LogEvent {
  sessionId: string;
  condition: Condition;
  missionId: MissionId | null;
  type: EventType;
  /** Milliseconds since the session started. */
  t: number;
  payload: Record<string, unknown>;
}

/** Where events go besides memory (e.g. Supabase in M4). */
export interface LogSink {
  write(event: LogEvent): void;
}

export interface Logger {
  log(type: EventType, payload?: Record<string, unknown>): void;
  setMission(id: MissionId | null): void;
  setCondition(condition: Condition): void;
  getEvents(): readonly LogEvent[];
  subscribe(listener: () => void): () => void;
  toJSON(): string;
}

export function createLogger(opts: {
  sessionId: string;
  condition: Condition;
  now?: () => number;
  sinks?: LogSink[];
}): Logger {
  const now = opts.now ?? (() => performance.now());
  const sinks = opts.sinks ?? [];
  const t0 = now();
  const listeners = new Set<() => void>();
  let condition = opts.condition;
  let missionId: MissionId | null = null;
  let events: LogEvent[] = [];

  const logger: Logger = {
    log(type, payload = {}) {
      const event: LogEvent = { sessionId: opts.sessionId, condition, missionId, type, t: Math.round(now() - t0), payload };
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
    getEvents: () => events,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    toJSON: () => JSON.stringify({ sessionId: opts.sessionId, exportedAt: new Date().toISOString(), events }, null, 2),
  };

  logger.log('session_start', { condition });
  return logger;
}
