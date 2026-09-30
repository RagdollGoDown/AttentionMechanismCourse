'use client';

import { useLogEvents, useLogger } from '@/components/LoggerProvider';
import { secondaryButtonClass } from '@/components/ui';
import { downloadLog } from '@/lib/download';

export function SessionLog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const logger = useLogger();
  const events = useLogEvents();
  if (!open) return null;
  return (
    <aside className="fixed inset-y-0 right-0 z-30 flex w-full max-w-sm flex-col border-l border-line bg-card shadow-xl">
      <div className="flex items-center justify-between border-b border-line p-3">
        <h2 className="font-semibold">Session log ({events.length})</h2>
        <div className="flex gap-2">
          <button type="button" className={secondaryButtonClass} onClick={() => downloadLog(logger)}>Download JSON</button>
          <button type="button" className={secondaryButtonClass} onClick={onClose} aria-label="Close log">✕</button>
        </div>
      </div>
      <ol className="flex-1 space-y-1 overflow-y-auto p-3 font-mono text-[11px]">
        {events.map((e, i) => ({ e, i })).reverse().map(({ e, i }) => (
          <li key={i} className="rounded bg-page p-1.5">
            <span className="text-muted">{(e.t / 1000).toFixed(1)}s</span>{' '}
            <span className="font-semibold text-cobalt">{e.type}</span>{' '}
            <span className="text-muted">{e.missionId ?? '–'} · {e.condition}</span>
            <div className="truncate text-ink">{JSON.stringify(e.payload)}</div>
          </li>
        ))}
      </ol>
    </aside>
  );
}
