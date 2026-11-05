'use client';

import { useState } from 'react';
import { useLogger } from '@/components/LoggerProvider';
import { TestForm } from '@/components/TestForm';
import { buttonClass, secondaryButtonClass } from '@/components/ui';
import type { StepProps } from '@/components/steps/types';
import { PRETEST_ITEMS, TEST_TEXT } from '@/content/tests';
import { GOALS, type ChoiceItem, type Submission } from '@/lib/assessment';
import { sendTestAndSession, type SendResult } from '@/lib/collect/send';
import type { Condition } from '@/lib/condition';
import { downloadLog } from '@/lib/download';

const T = TEST_TEXT.pre;

/**
 * Before the hook, identical in both conditions. With ?condition= in the link the learner just continues.
 * Without it, the lesson waits here: the experimenter reads the score and assigns the condition that keeps the groups balanced.
 */
export function Pretest({ onDone, assigned = true, onAssign }: StepProps) {
  const logger = useLogger();
  const [stage, setStage] = useState<'intro' | 'test' | 'done'>('intro');
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [sent, setSent] = useState<SendResult[] | 'sending' | null>(null);

  async function send(sub: Submission) {
    setSent('sending');
    setSent(await sendTestAndSession(logger, sub));
  }

  if (stage === 'intro') {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-6 py-6 text-center sm:py-12">
        <h1 className="font-display text-[clamp(2rem,6vw,3rem)] font-extrabold leading-tight tracking-tight text-balance">{T.title}</h1>
        <div className="space-y-2 text-lg text-pretty text-muted">
          {T.body.map((p) => <p key={p}>{p}</p>)}
        </div>
        <button type="button" className={`${buttonClass} px-8 py-3 text-base`} onClick={() => { setStage('test'); window.scrollTo({ top: 0 }); }}>
          {T.start}
        </button>
      </div>
    );
  }

  if (stage === 'test') {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <h1 className="font-display text-3xl font-bold tracking-tight">{T.title}</h1>
        <TestForm
          test="pre"
          items={PRETEST_ITEMS}
          submitLabel={T.submit}
          onSubmit={(sub) => {
            setSubmission(sub);
            setStage('done');
            window.scrollTo({ top: 0 });
            void send(sub);
          }}
        />
      </div>
    );
  }

  return (
    <div className="slide-in mx-auto flex max-w-xl flex-col items-center gap-6 py-6 text-center sm:py-12">
      <h1 className="font-display text-4xl font-extrabold tracking-tight">{T.doneTitle}</h1>
      <p className="text-lg text-muted">{assigned ? T.doneBody : T.waitBody}</p>
      {assigned && <button type="button" className={`${buttonClass} px-8 py-3 text-base`} onClick={onDone}>{T.continue}</button>}
      {/* Remote participants arrive with a condition in the link and do not need the panel; it stays for
          ?debug, for assigning the condition, and when saving failed (resend / download). */}
      {submission && (logger.debug || !assigned || saveFailed(sent)) && (
        <Experimenter
          submission={submission}
          sent={sent}
          onResend={() => void send(submission)}
          onAssign={assigned ? undefined : (c) => {
            onAssign?.(c);
            onDone();
          }}
        />
      )}
    </div>
  );
}

function saveFailed(sent: SendResult[] | 'sending' | null) {
  return Array.isArray(sent) && !sent.every((r) => r.stored);
}

/** Collapsed by default: the learner does not need their score; the experimenter needs it to assign the condition. */
function Experimenter({ submission, sent, onResend, onAssign }: {
  submission: Submission;
  sent: SendResult[] | 'sending' | null;
  onResend: () => void;
  /** Only when the link had no condition. */
  onAssign?: (c: Condition) => void;
}) {
  const logger = useLogger();
  const prior = PRETEST_ITEMS.find((i): i is ChoiceItem => i.id === 'bg-attention' && i.kind === 'choice');
  const choice = submission.items.find((i) => i.id === 'bg-attention')?.answer.choice;
  const priorText = prior && choice != null ? prior.options[choice] : '—';
  const savedOk = Array.isArray(sent) && sent.every((r) => r.stored);
  const saveText =
    sent === null || sent === 'sending' ? 'Saving…'
    : savedOk ? `Saved (${sent[0].store})`
    : sent.some((r) => !r.ok) ? `NOT SAVED: ${sent.find((r) => !r.ok)?.error ?? 'error'}`
    : sent[0].store === 'no consent' ? 'NOT SAVED: the participant did not consent'
    : `NOT SAVED: no store configured (${sent[0].store})`;

  return (
    <details className="w-full rounded-2xl border border-line bg-card p-4 text-left">
      <summary className="cursor-pointer font-display font-bold">For the experimenter</summary>
      <div className="mt-3 space-y-3 text-sm">
        <p>Participant <strong className="font-mono">{logger.participantId ?? '— (no ?pid in the link)'}</strong></p>
        <table className="w-full text-left">
          <tbody>
            {GOALS.filter((g) => g !== 'background').map((g) => (
              <tr key={g} className="border-t border-line">
                <td className="py-1 font-semibold">{g}</td>
                <td className="py-1 tabular-nums">{submission.byGoal[g].score} / {submission.byGoal[g].max}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>Studied attention before: <strong>{priorText}</strong></p>
        <p className={`rounded px-2 py-1 font-mono text-xs font-bold ${savedOk ? 'bg-ok text-white' : 'bg-miss text-white'}`}>{saveText}</p>
        <div className="flex flex-wrap gap-2">
          {Array.isArray(sent) && !savedOk && <button type="button" className={secondaryButtonClass} onClick={onResend}>Send again</button>}
          <button type="button" className={secondaryButtonClass} onClick={() => downloadLog(logger)}>Download log</button>
        </div>
        {onAssign && (
          <>
            <p className="font-semibold">Assign the condition that keeps the groups balanced, then hand back the device:</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={buttonClass} onClick={() => onAssign('ai')}>Continue: AI tutor</button>
              <button type="button" className={buttonClass} onClick={() => onAssign('control')}>Continue: control</button>
            </div>
          </>
        )}
      </div>
    </details>
  );
}
