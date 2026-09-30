'use client';

import { useLogger } from '@/components/LoggerProvider';
import { buttonClass, secondaryButtonClass } from '@/components/ui';
import { downloadLog } from '@/lib/download';

export function EndScreen() {
  const logger = useLogger();
  return (
    <div className="mx-auto max-w-lg space-y-4 rounded-xl border border-slate-200 bg-white p-8 text-center">
      <h2 className="text-2xl font-semibold">Thanks for playing!</h2>
      <p className="text-slate-600">
        You explored how a word decides which other words to listen to. Next up: the formula behind the bars.
      </p>
      <div className="flex justify-center gap-3">
        <button type="button" className={buttonClass} onClick={() => downloadLog(logger)}>Download session log</button>
        <button type="button" className={secondaryButtonClass} onClick={() => window.location.reload()}>Start again</button>
      </div>
    </div>
  );
}
