'use client';

import { useState } from 'react';
import { useLogger } from '@/components/LoggerProvider';
import { buttonClass, secondaryButtonClass } from '@/components/ui';
import type { StepProps } from '@/components/steps/types';
import { CONSENT } from '@/content/steps';

function Bullets({ items }: { items: readonly string[] }) {
  return <ul className="list-disc space-y-1 pl-5">{items.map((t) => <li key={t}>{t}</li>)}</ul>;
}

/**
 * Before the pre-test, identical in both conditions. A yes continues; a no ends the session here
 * (not eligible for the study), and nothing was sent anywhere.
 */
export function Consent({ onDone }: StepProps) {
  const logger = useLogger();
  const [declined, setDeclined] = useState(false);

  if (declined) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 py-6 text-center sm:py-12">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">{CONSENT.declinedTitle}</h1>
        <p className="text-lg text-muted">{CONSENT.declinedBody}</p>
      </div>
    );
  }
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5 py-6 sm:py-12">
      <h1 className="font-display text-[clamp(2rem,6vw,3rem)] font-extrabold leading-tight tracking-tight text-balance">{CONSENT.title}</h1>
      <div className="space-y-3 rounded-2xl border border-line bg-card p-5 text-left">
        <p>{CONSENT.intro}</p>
        <Bullets items={CONSENT.collected} />
        <Bullets items={CONSENT.shared} />
        <p className="text-muted">{CONSENT.voluntary}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <button type="button" className={`${buttonClass} px-6 py-3 text-base`} onClick={() => { logger.setConsent(true); onDone(); }}>{CONSENT.agree}</button>
        <button type="button" className={`${secondaryButtonClass} px-6 py-3 text-base`} onClick={() => setDeclined(true)}>{CONSENT.decline}</button>
      </div>
    </div>
  );
}
