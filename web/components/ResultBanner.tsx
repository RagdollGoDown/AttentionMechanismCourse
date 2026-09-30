import type { ReactNode } from 'react';

/** The unmistakable verdict after a check: big green when right, calm amber when not. */
export function ResultBanner({ ok, title, children }: { ok: boolean; title?: string; children?: ReactNode }) {
  return (
    <div
      role="status"
      className={`result-pop flex gap-3 rounded-2xl p-4 ${ok ? 'bg-ok text-white shadow-[0_6px_20px_rgb(31_163_122/0.35)]' : 'border-2 border-xp bg-xp/15 text-ink'}`}
    >
      <span aria-hidden className={`grid size-10 shrink-0 place-items-center rounded-full font-display text-2xl font-bold ${ok ? 'bg-white text-ok' : 'bg-xp text-ink'}`}>
        {ok ? '✓' : '!'}
      </span>
      <div className="space-y-1">
        <p className="font-display text-xl font-bold leading-tight">{title ?? (ok ? 'Right!' : 'Not quite.')}</p>
        {children && <div className={ok ? 'text-white/95' : ''}>{children}</div>}
      </div>
    </div>
  );
}
