import { describe, expect, it, vi } from 'vitest';
import { createLogger, type LogEvent } from '@/lib/log';

const clock = () => {
  let t = 1000;
  return { now: () => t, advance: (ms: number) => (t += ms) };
};

describe('createLogger', () => {
  it('starts with session_start at t = 0', () => {
    const c = clock();
    const l = createLogger({ sessionId: 's1', condition: 'ai', now: c.now });
    expect(l.getEvents()).toEqual([
      { sessionId: 's1', condition: 'ai', missionId: null, type: 'session_start', t: 0, payload: { condition: 'ai' } },
    ]);
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
});
