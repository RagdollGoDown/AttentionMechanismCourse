'use client';

import { useState } from 'react';
import { useLogger } from '@/components/LoggerProvider';
import { ResultBanner } from '@/components/ResultBanner';
import { TestForm } from '@/components/TestForm';
import { buttonClass, secondaryButtonClass } from '@/components/ui';
import type { StepProps } from '@/components/steps/types';
import { POSTTEST_ITEMS, TEST_TEXT } from '@/content/tests';
import { sendTestAndSession } from '@/lib/collect/send';
import { downloadLog } from '@/lib/download';

const T = TEST_TEXT.post;

/** Last step, identical in both conditions. Sends the test and the session log, then shows the end screen. */
export function Posttest({ onDone }: StepProps) {
  const logger = useLogger();
  const [state, setState] = useState<'open' | 'saving' | 'failed'>('open');

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{T.kicker}</p>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{T.title}</h1>
        <div className="space-y-1 text-lg text-muted">
          {T.body.map((p) => <p key={p}>{p}</p>)}
        </div>
      </header>

      <TestForm
        test="post"
        items={POSTTEST_ITEMS}
        submitLabel={T.submit}
        onSubmit={async (sub) => {
          setState('saving');
          const results = await sendTestAndSession(logger, sub);
          // No store configured still counts as sent: the experimenter checks the store before the session (debug bar).
          if (results.every((r) => r.ok)) onDone();
          else setState('failed');
        }}
      />

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
