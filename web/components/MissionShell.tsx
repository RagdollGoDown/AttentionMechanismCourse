import type { ReactNode } from 'react';

/** Text panel + stage. Stacks on phones; side by side from `lg`. */
export function MissionShell({ title, panel, stage, stageLabel }: {
  title: string;
  panel: ReactNode;
  stage: ReactNode;
  stageLabel?: string;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(18rem,26rem)_minmax(0,1fr)] lg:gap-6">
      <aside className="space-y-4 rounded-2xl border border-line bg-card p-4 sm:p-5 lg:self-start">
        <h2 className="font-display text-2xl font-bold leading-tight tracking-tight">{title}</h2>
        {panel}
      </aside>
      <section className="relative flex min-h-[22rem] flex-col items-center justify-center gap-6 rounded-2xl border border-line bg-card px-3 py-8 sm:p-6">
        {stageLabel && (
          <span className="absolute left-4 top-3 rounded-full bg-page px-2 py-0.5 text-xs font-semibold text-muted">{stageLabel}</span>
        )}
        {stage}
      </section>
    </div>
  );
}
