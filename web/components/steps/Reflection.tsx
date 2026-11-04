'use client';

import { useEffect, useRef, useState } from 'react';
import { useLogger } from '@/components/LoggerProvider';
import { ResultBanner } from '@/components/ResultBanner';
import { buttonClass, secondaryButtonClass } from '@/components/ui';
import type { StepProps } from '@/components/steps/types';
import { SURVEY, TEST_TEXT } from '@/content/tests';
import { sendSurveyAndSession } from '@/lib/collect/send';
import { downloadLog } from '@/lib/download';

/** The reflection survey, after the post-test: four optional open questions, the same in both conditions. Sends the answers and the full session log. */
export function Reflection({ onDone }: StepProps) {
  const logger = useLogger();
  const [texts, setTexts] = useState<Record<string, string>>({});
  const [state, setState] = useState<'open' | 'saving' | 'failed'>('open');
  const started = useRef(0);
  useEffect(() => { started.current = performance.now(); }, []);

  async function submit() {
    const answers = {
      open: Object.fromEntries(SURVEY.open.map((q) => [q.id, (texts[q.id] ?? '').trim()])),
      durationMs: Math.round(performance.now() - started.current),
    };
    logger.log('survey_submit', answers);
    setState('saving');
    const results = await sendSurveyAndSession(logger, answers);
    if (results.every((r) => r.ok)) onDone();
    else setState('failed');
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{SURVEY.kicker}</p>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{SURVEY.title}</h1>
        <div className="space-y-1 text-lg text-muted">{SURVEY.body.map((p) => <p key={p}>{p}</p>)}</div>
      </header>

      <section className="space-y-4 rounded-2xl border border-line bg-card p-4 sm:p-5">
        {SURVEY.open.map((q) => (
          <label key={q.id} className="block space-y-2">
            <span className="font-semibold">{q.text}</span>
            <textarea
              rows={3} maxLength={1500} placeholder={TEST_TEXT.textPlaceholder}
              value={texts[q.id] ?? ''} onChange={(e) => setTexts((all) => ({ ...all, [q.id]: e.target.value }))}
              className="w-full rounded-lg border-2 border-line bg-card p-3 focus:border-cobalt focus:outline-none"
            />
          </label>
        ))}
      </section>

      <button type="button" className={`${buttonClass} px-6 py-3 text-base`} disabled={state === 'saving'} onClick={submit}>{SURVEY.submit}</button>
      {state === 'saving' && <p role="status" className="text-muted">{TEST_TEXT.saving}</p>}
      {state === 'failed' && (
        <ResultBanner ok={false} title={TEST_TEXT.saveFailed}>
          <div className="mt-2 flex flex-wrap gap-3">
            <button type="button" className={buttonClass} onClick={() => downloadLog(logger)}>{TEST_TEXT.download}</button>
            <button type="button" className={secondaryButtonClass} onClick={onDone}>{TEST_TEXT.continue}</button>
          </div>
        </ResultBanner>
      )}
    </div>
  );
}
