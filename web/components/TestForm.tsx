'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Calculator } from '@/components/Calculator';
import { useLogger } from '@/components/LoggerProvider';
import { buttonClass, secondaryButtonClass, selectedClass } from '@/components/ui';
import { TEST_TEXT as T, vecText } from '@/content/tests';
import {
  buildSubmission, isAnswered, type Answer, type ChoiceItem, type ComputeItem, type Item, type MatchItem,
  type NumberItem, type Submission, type TestId, type TextItem,
} from '@/lib/assessment';

const msSince = (start: number) => Math.round(performance.now() - start);

const inputClass = 'rounded-md border-2 border-cobalt/40 bg-card px-2 py-1.5 tabular-nums focus:border-cobalt focus:outline-none disabled:opacity-40';

type Change = (patch: Answer, logNow?: boolean) => void;

function DontKnow({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-muted">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-cobalt" />
      {T.dontKnow}
    </label>
  );
}

function Choice({ item, name, a, change }: { item: ChoiceItem; name: string; a: Answer; change: Change }) {
  return (
    <div className="grid gap-2">
      {item.options.map((o, i) => (
        <label
          key={o}
          className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 px-3 py-2 transition ${a.choice === i ? selectedClass : 'border-line bg-card hover:border-cobalt/50'}`}
        >
          <input type="radio" name={name} checked={a.choice === i} onChange={() => change({ choice: i }, true)} className="size-4 shrink-0 accent-cobalt" />
          <span className={item.mono && o !== T.dontKnow ? 'font-mono' : ''}>{o}</span>
        </label>
      ))}
    </div>
  );
}

function Match({ item, a, change }: { item: MatchItem; a: Answer; change: Change }) {
  return (
    <div className="grid gap-2">
      {item.rows.map((r, i) => (
        <label key={r.label} className="grid items-center gap-1 sm:grid-cols-[6rem_1fr] sm:gap-3">
          <span className="font-display font-bold">{r.label}</span>
          <select
            value={a.picks?.[i] ?? ''}
            onChange={(e) => {
              const picks = item.rows.map((_, j) => a.picks?.[j] ?? null);
              picks[i] = e.target.value === '' ? null : Number(e.target.value);
              change({ picks }, true);
            }}
            className="min-w-0 rounded-lg border-2 border-line bg-card px-2 py-2 text-sm focus:border-cobalt focus:outline-none"
          >
            <option value="">{T.pick}</option>
            {item.options.map((o, j) => <option key={o} value={j}>{o}</option>)}
          </select>
        </label>
      ))}
    </div>
  );
}

function rawAt(a: Answer, i: number) {
  return a.raw?.[i] ?? '';
}
function withRaw(a: Answer, i: number, value: string, size: number): Answer {
  const raw = Array.from({ length: size }, (_, j) => rawAt(a, j));
  raw[i] = value;
  return { raw };
}

function NumberFields({ item, a, change, onBlur }: { item: NumberItem; a: Answer; change: Change; onBlur: () => void }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-4">
        {item.fields.map((f, i) => (
          <label key={f.label} className="flex items-center gap-2">
            <span className="text-sm font-semibold">{f.label}</span>
            <input
              inputMode="decimal"
              autoComplete="off"
              placeholder={T.numberPlaceholder}
              disabled={a.dontKnow}
              value={rawAt(a, i)}
              onChange={(e) => change(withRaw(a, i, e.target.value, item.fields.length))}
              onBlur={onBlur}
              className={`${inputClass} w-28`}
            />
          </label>
        ))}
      </div>
      <DontKnow checked={!!a.dontKnow} onChange={(v) => change({ dontKnow: v }, true)} />
    </div>
  );
}

/** LG2: the weights of the three words and the output, with the keys and values in a table. */
function ComputeFields({ item, a, change, onBlur }: { item: ComputeItem; a: Answer; change: Change; onBlur: () => void }) {
  const ex = item.example;
  const size = ex.tokens.length + 2;
  const input = (i: number, label: string) => (
    <input
      inputMode="decimal"
      autoComplete="off"
      aria-label={label}
      disabled={a.dontKnow}
      value={rawAt(a, i)}
      onChange={(e) => change(withRaw(a, i, e.target.value, size))}
      onBlur={onBlur}
      className={`${inputClass} w-20 text-center`}
    />
  );
  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[20rem] border-separate border-spacing-y-1 text-center text-sm">
          <thead>
            <tr className="text-xs text-muted">
              <th className="text-left font-semibold">{T.word}</th>
              <th className="font-semibold">{T.key}</th>
              <th className="font-semibold">{T.value}</th>
              <th className="font-display text-sm font-bold text-ink">{T.weight}</th>
            </tr>
          </thead>
          <tbody>
            {ex.tokens.map((t, i) => (
              <tr key={t.word} className="bg-page">
                <td className="rounded-l-lg py-1.5 pl-2 text-left"><span className="tile px-2 py-0.5">{t.word}</span></td>
                <td className="font-mono">{vecText(t.k)}</td>
                <td className="font-mono">{vecText(t.v)}</td>
                <td className="rounded-r-lg py-1.5">{input(i, `${T.weight} of ${t.word}`)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="flex flex-wrap items-center gap-2 font-mono">
        <span className="font-sans text-sm font-semibold">{T.output} =</span>
        [{input(ex.tokens.length, `${T.output}, first number`)}, {input(ex.tokens.length + 1, `${T.output}, second number`)}]
      </p>
      <DontKnow checked={!!a.dontKnow} onChange={(v) => change({ dontKnow: v }, true)} />
    </div>
  );
}

function Text({ item, a, change, onBlur }: { item: TextItem; a: Answer; change: Change; onBlur: () => void }) {
  return (
    <textarea
      aria-label={item.prompt}
      rows={4}
      maxLength={800}
      placeholder={T.textPlaceholder}
      value={a.text ?? ''}
      onChange={(e) => change({ text: e.target.value })}
      onBlur={onBlur}
      className="w-full rounded-lg border-2 border-line bg-card p-3 focus:border-cobalt focus:outline-none"
    />
  );
}

function ItemCard({ n, total, item, children }: { n: number; total: number; item: Item; children: ReactNode }) {
  return (
    <section className="space-y-3 rounded-2xl border border-line bg-card p-4 sm:p-5" aria-labelledby={`q-${item.id}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{T.question(n, total)}</p>
      <h2 id={`q-${item.id}`} className="text-lg font-semibold text-pretty">{item.prompt}</h2>
      {item.figure && <pre className="w-fit max-w-full overflow-x-auto rounded-lg bg-page px-3 py-2 font-mono text-sm">{item.figure}</pre>}
      {children}
    </section>
  );
}

/**
 * One test on one page: every item, then Submit. No feedback and no correct answers.
 * Logs `test_answer` when an answer is committed (pick, or leaving a text box) and `test_submit` with the scored submission.
 */
export function TestForm({ test, items, submitLabel, onSubmit }: {
  test: TestId;
  items: readonly Item[];
  submitLabel: string;
  onSubmit: (s: Submission) => void;
}) {
  const logger = useLogger();
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [confirming, setConfirming] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const started = useRef(0);
  const times = useRef<Record<string, { first: number; last: number }>>({});
  const lastLogged = useRef<Record<string, string>>({});
  useEffect(() => {
    started.current = performance.now();
  }, []);

  function logAnswer(id: string, a: Answer) {
    const json = JSON.stringify(a);
    if (lastLogged.current[id] === json) return;
    lastLogged.current[id] = json;
    logger.log('test_answer', { test, item: id, answer: a });
  }

  function change(id: string): Change {
    return (patch, logNow = false) => {
      const next = { ...answers[id], ...patch };
      const t = msSince(started.current);
      times.current[id] = { first: times.current[id]?.first ?? t, last: t };
      setAnswers((all) => ({ ...all, [id]: next }));
      setConfirming(false);
      if (logNow) logAnswer(id, next);
    };
  }

  const missing = items.filter((i) => !isAnswered(i, answers[i.id])).length;

  function submit(force: boolean) {
    if (missing > 0 && !force) {
      setConfirming(true);
      return;
    }
    const sub = buildSubmission(test, items, answers, times.current, msSince(started.current));
    logger.log('test_submit', { ...sub });
    setSubmitted(true);
    onSubmit(sub);
  }

  return (
    <div className="space-y-4">
      {items.map((item, i) => {
        const a = answers[item.id] ?? {};
        const ch = change(item.id);
        const blur = () => logAnswer(item.id, answers[item.id] ?? {});
        return (
          <ItemCard key={item.id} n={i + 1} total={items.length} item={item}>
            {item.kind === 'choice' && <Choice item={item} name={`${test}-${item.id}`} a={a} change={ch} />}
            {item.kind === 'match' && <Match item={item} a={a} change={ch} />}
            {item.kind === 'number' && <NumberFields item={item} a={a} change={ch} onBlur={blur} />}
            {item.kind === 'compute' && <ComputeFields item={item} a={a} change={ch} onBlur={blur} />}
            {item.kind === 'text' && <Text item={item} a={a} change={ch} onBlur={blur} />}
            {(item.kind === 'compute' || (item.kind === 'number' && item.calculator)) && (
              <Calculator placeholder={T.calcPlaceholder} context={{ test, item: item.id }} />
            )}
          </ItemCard>
        );
      })}

      {confirming ? (
        <div role="alert" className="space-y-3 rounded-2xl border-2 border-xp bg-xp/15 p-4">
          <p className="font-semibold">{T.unanswered(missing)}</p>
          <div className="flex flex-wrap gap-3">
            <button type="button" className={secondaryButtonClass} onClick={() => setConfirming(false)}>{T.review}</button>
            <button type="button" className={buttonClass} disabled={submitted} onClick={() => submit(true)}>{T.submitAnyway}</button>
          </div>
        </div>
      ) : (
        <button type="button" className={`${buttonClass} px-6 py-3 text-base`} disabled={submitted} onClick={() => submit(false)}>{submitLabel}</button>
      )}
    </div>
  );
}
