'use client';

import { secondaryButtonClass } from '@/components/ui';
import { STEP_ORDER } from '@/content/steps';

/**
 * Developer tools, shown only with `?debug`. Jumps between steps without awarding trophy pieces,
 * and remounts the current step to retest it. Participants never get this flag.
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
    </div>
  );
}
