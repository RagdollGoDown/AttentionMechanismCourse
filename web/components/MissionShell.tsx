import type { ReactNode } from 'react';

export function MissionShell({ step, title, panel, stage, stageLabel }: {
  step: number;
  title: string;
  panel: ReactNode;
  stage: ReactNode;
  stageLabel?: string;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[24rem_1fr]">
      <aside className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Mission {step}</p>
        <h2 className="text-xl font-semibold">{title}</h2>
        {panel}
      </aside>
      <section className="relative flex min-h-[28rem] flex-col items-center justify-center gap-6 rounded-xl border border-slate-200 bg-white p-6">
        {stageLabel && (
          <span className="absolute left-4 top-3 text-xs font-semibold uppercase tracking-wide text-slate-400">{stageLabel}</span>
        )}
        {stage}
      </section>
    </div>
  );
}
