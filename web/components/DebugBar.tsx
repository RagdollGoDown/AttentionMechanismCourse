'use client';

import { useEffect, useState } from 'react';
import { useGifts } from '@/components/GiftProvider';
import { useLogger } from '@/components/LoggerProvider';
import { secondaryButtonClass } from '@/components/ui';
import { GIFTS, STEP_ORDER } from '@/content/steps';

/**
 * Developer tools, shown only with `?debug`. Jumps between steps without giving Byte gifts,
 * remounts the current step to retest it, and can hand Byte his next gift to test the garden. Participants never get this flag.
 */
export function DebugBar({ index, onGoTo, onReset }: {
  index: number;
  onGoTo: (index: number) => void;
  onReset: () => void;
}) {
  const last = STEP_ORDER.length; // one past the steps = the end screen
  return (
    <div
      role="toolbar"
      aria-label="Developer tools"
      className="fixed bottom-3 left-3 z-40 flex flex-wrap items-center gap-2 rounded-xl border-2 border-dashed border-xp bg-card p-2 text-ink shadow-xl"
    >
      <span className="rounded bg-xp/25 px-1.5 py-0.5 font-mono text-[11px] font-bold">DEBUG</span>
      <button type="button" className={secondaryButtonClass} disabled={index <= 0} onClick={() => onGoTo(index - 1)} aria-label="Previous step">←</button>
      <select
        aria-label="Jump to step"
        className="rounded-lg border border-line bg-card px-2 py-2 text-sm"
        value={index}
        onChange={(e) => onGoTo(Number(e.target.value))}
      >
        {STEP_ORDER.map((id, i) => (
          <option key={id} value={i}>{i + 1}. {id}</option>
        ))}
        <option value={last}>end</option>
      </select>
      <button type="button" className={secondaryButtonClass} disabled={index >= last} onClick={() => onGoTo(index + 1)} aria-label="Next step">→</button>
      <button type="button" className={secondaryButtonClass} disabled={index >= last} onClick={onReset}>Reset step</button>
      <NextGift />
      <TutorStatus />
      <StoreStatus />
    </div>
  );
}

function NextGift() {
  const { gifts, win } = useGifts();
  const next = GIFTS.find((g) => !gifts.includes(g));
  return (
    <button type="button" className={secondaryButtonClass} disabled={!next} onClick={() => next && win(next.id)}>
      {next ? `Gift: ${next.item}` : 'All gifts'}
    </button>
  );
}

type Status = { llm: boolean; model: string | null; probe?: { source: 'llm' | 'mock'; model?: string | null; latencyMs: number } };

async function fetchStatus(probe: boolean): Promise<Status> {
  const res = await fetch(`/api/feedback${probe ? '?probe' : ''}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/**
 * For the experimenter, before a participant starts: is the LLM tutor on?
 * The study excludes any AI-condition session that got a reply from the offline (mock) tutor.
 */
function TutorStatus() {
  const logger = useLogger();
  const [status, setStatus] = useState<Status | 'loading' | 'error'>('loading');
  const [probing, setProbing] = useState(false);

  useEffect(() => {
    fetchStatus(false).then(setStatus, () => setStatus('error'));
  }, []);

  async function probe() {
    setProbing(true);
    try {
      const s = await fetchStatus(true);
      setStatus(s);
      logger.log('debug_tutor_probe', { ...s });
    } catch {
      setStatus('error');
    }
    setProbing(false);
  }

  const ok = typeof status === 'object' && status.llm && (!status.probe || status.probe.source === 'llm');
  const text =
    status === 'loading' ? 'Tutor: …'
    : status === 'error' ? 'Tutor: no answer'
    : !status.llm ? 'Tutor: OFFLINE (mock)'
    : status.probe?.source === 'mock' ? `Tutor: ${status.model} FAILED, mock answered`
    : `Tutor: LLM ${status.probe?.model ?? status.model}${status.probe ? ` ✓ ${status.probe.latencyMs} ms` : ''}`;
  return (
    <>
      <span role="status" className={`rounded px-2 py-1 font-mono text-[11px] font-bold ${ok ? 'bg-ok text-white' : 'bg-miss text-white'}`}>{text}</span>
      <button
        type="button"
        className={secondaryButtonClass}
        disabled={probing}
        onClick={probe}
      >
        {probing ? 'Testing…' : 'Test call'}
      </button>
    </>
  );
}

/** Where test answers and session logs go (POST /api/collect). Red: they are only in the browser. */
function StoreStatus() {
  const [status, setStatus] = useState<{ store: string; ready: boolean } | 'loading' | 'error'>('loading');
  useEffect(() => {
    fetch('/api/collect', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(setStatus, () => setStatus('error'));
  }, []);
  const ok = typeof status === 'object' && status.ready;
  const text =
    status === 'loading' ? 'Store: …'
    : status === 'error' ? 'Store: no answer'
    : status.ready ? `Store: ${status.store}`
    : `Store: ${status.store.toUpperCase()} (not saved)`;
  return <span role="status" className={`rounded px-2 py-1 font-mono text-[11px] font-bold ${ok ? 'bg-ok text-white' : 'bg-miss text-white'}`}>{text}</span>;
}
