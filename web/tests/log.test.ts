import { describe, expect, it, vi } from 'vitest';
import { createLogger, tutorSummary, type LogEvent } from '@/lib/log';

const clock = () => {
  let t = 1000;
  return { now: () => t, advance: (ms: number) => (t += ms) };
};

describe('createLogger', () => {
  it('starts with session_start at t = 0', () => {
    const c = clock();
    const l = createLogger({ sessionId: 's1', condition: 'ai', now: c.now, wallNow: () => Date.UTC(2026, 9, 6, 12) });
    expect(l.getEvents()).toEqual([{
      sessionId: 's1', participantId: null, condition: 'ai', missionId: null, type: 'session_start', t: 0,
      at: '2026-10-06T12:00:00.000Z', payload: { condition: 'ai', participantId: null, debug: false },
    }]);
  });

  it('stamps the mission, relative time and payload', () => {
    const c = clock();
    const l = createLogger({ sessionId: 's1', condition: 'ai', now: c.now });
    l.setMission('swap');
    c.advance(1500);
    l.log('prediction', { choice: '2' });
    expect(l.getEvents().at(-1)).toMatchObject({ missionId: 'swap', type: 'prediction', t: 1500, payload: { choice: '2' } });
  });

  it('logs condition changes stamped with the new condition, and ignores no-op changes', () => {
    const l = createLogger({ sessionId: 's1', condition: 'ai' });
    l.setCondition('ai');
    l.setCondition('control');
    const last = l.getEvents().at(-1)!;
    expect(l.getEvents()).toHaveLength(2);
    expect(last).toMatchObject({ type: 'condition_change', condition: 'control', payload: { from: 'ai', to: 'control' } });
  });

  it('forwards events to sinks and survives a throwing sink', () => {
    const good: LogEvent[] = [];
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const l = createLogger({
      sessionId: 's1',
      condition: 'ai',
      sinks: [{ write: () => { throw new Error('db down'); } }, { write: (e) => good.push(e) }],
    });
    l.log('reveal');
    expect(good.map((e) => e.type)).toEqual(['session_start', 'reveal']);
    expect(l.getEvents()).toHaveLength(2);
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it('notifies subscribers with a new array identity, and unsubscribes', () => {
    const l = createLogger({ sessionId: 's1', condition: 'ai' });
    const before = l.getEvents();
    const fn = vi.fn();
    const off = l.subscribe(fn);
    l.log('reveal');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(l.getEvents()).not.toBe(before);
    off();
    l.log('reveal');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('exports JSON with the session id and all events', () => {
    const l = createLogger({ sessionId: 's1', condition: 'control' });
    const parsed = JSON.parse(l.toJSON());
    expect(parsed.sessionId).toBe('s1');
    expect(parsed.events).toHaveLength(1);
  });

  it('stamps every event with the participant and wall-clock time', () => {
    let wall = Date.UTC(2026, 9, 6, 12);
    const l = createLogger({ sessionId: 's1', condition: 'ai', participantId: 'P07', wallNow: () => wall });
    wall += 90_000;
    l.log('reveal');
    expect(l.getEvents().at(-1)).toMatchObject({ participantId: 'P07', at: '2026-10-06T12:01:30.000Z' });
  });

  it('export header: who, which condition, debug flag, total time and tutor summary', () => {
    const c = clock();
    const l = createLogger({ sessionId: 's1', condition: 'ai', participantId: 'P07', debug: true, now: c.now });
    c.advance(5000);
    l.log('feedback_received', { round: 1, source: 'llm', model: 'anthropic/claude-sonnet-5-5' });
    l.log('feedback_received', { round: 2, source: 'mock', model: null });
    l.log('feedback_received', { round: 2, source: 'error', error: 'HTTP 500' });
    const parsed = JSON.parse(l.toJSON());
    expect(parsed).toMatchObject({ participantId: 'P07', condition: 'ai', debug: true, totalMs: 5000 });
    expect(parsed.tutor).toEqual({ replies: 2, mockReplies: 1, errors: 1, models: ['anthropic/claude-sonnet-5-5'] });
  });

  it('tutor summary ignores the expert answer (control condition)', () => {
    const l = createLogger({ sessionId: 's1', condition: 'control' });
    l.log('feedback_received', { round: 1, source: 'expert' });
    expect(tutorSummary(l.getEvents())).toEqual({ replies: 0, mockReplies: 0, errors: 0, models: [] });
  });
});
