'use client';

import { useEffect, useRef, useState } from 'react';
import { Calculator } from '@/components/Calculator';
import { useLogger } from '@/components/LoggerProvider';
import { ResultBanner } from '@/components/ResultBanner';
import { buttonClass, noteClass, secondaryButtonClass } from '@/components/ui';
import type { StepProps } from '@/components/steps/types';
import { COMPUTE_TEXT as T, PRACTICE_EXAMPLE, WORKED_EXAMPLE } from '@/content/steps';
import { STAGES, checkAll, fmt, fmtVec, learnerPath, parseEntry, stagesOf, type Entries, type Example, type Stage } from '@/lib/compute';

const ROW_STAGES = STAGES.filter((s) => s !== 'output');
const vec = (v: number[]) => `[${v.join(', ')}]`;
/** Scores are whole numbers; every other column has 2 decimals. */
const show = (stage: Stage, x: number) => (stage === 'scores' ? String(x) : fmt(x));
const msSince = (start: number) => Math.round(performance.now() - start);

/** What one cell holds: a fixed text, an input, or nothing yet. */
type Cell = { text: string } | { input: string; wrong: boolean } | null;

/**
 * One table for the whole computation: a row per word, a column per stage, the output below.
 * `cell` decides what each cell shows; inputs report back through `onInput`.
 */
function StageTable({ ex, cell, onInput }: {
  ex: Example;
  cell: (stage: Stage, i: number) => Cell;
  onInput?: (stage: Stage, i: number, value: string) => void;
}) {
  function render(stage: Stage, i: number, label: string) {
    const c = cell(stage, i);
    if (!c) return <span className="text-muted/50">·</span>;
    if ('text' in c) return <span className="tabular-nums">{c.text}</span>;
    return (
      <input
        inputMode="decimal"
        autoComplete="off"
        aria-label={label}
        aria-invalid={c.wrong || undefined}
        value={c.input}
        onChange={(e) => onInput?.(stage, i, e.target.value)}
        className={`w-16 rounded-md border-2 bg-card px-1.5 py-1 text-center tabular-nums focus:outline-none ${c.wrong ? 'border-xp bg-xp/10' : 'border-cobalt/40 focus:border-cobalt'}`}
      />
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[34rem] border-separate border-spacing-y-1 text-center text-sm">
        <thead>
          <tr className="text-xs text-muted">
            <th className="text-left font-semibold">word</th>
            <th className="font-semibold">key k</th>
            <th className="font-semibold">value v</th>
            {ROW_STAGES.map((s) => <th key={s} className="font-display text-sm font-bold text-ink">{T.stages[s].head}</th>)}
          </tr>
        </thead>
        <tbody>
          {ex.tokens.map((t, i) => (
            <tr key={t.word} className="bg-page">
              <td className="rounded-l-lg py-1.5 pl-2 text-left"><span className="tile px-2 py-0.5">{t.word}</span></td>
              <td className="font-mono">{vec(t.k)}</td>
              <td className="font-mono">{vec(t.v)}</td>
              {ROW_STAGES.map((s, j) => (
                <td key={s} className={`py-1.5 ${j === ROW_STAGES.length - 1 ? 'rounded-r-lg' : ''}`}>{render(s, i, `${T.stages[s].head} for ${t.word}`)}</td>
              ))}
            </tr>
          ))}
          <tr>
            <td colSpan={3} className="pt-2 text-left text-sm font-semibold">
              {T.outputLabel} = <span className="font-display">{T.stages.output.head}</span>
            </td>
            <td colSpan={ROW_STAGES.length} className="pt-2 text-left font-mono">
              [{render('output', 0, 'output, first number')}, {render('output', 1, 'output, second number')}]
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/** One line per stage, with the first word's numbers plugged in, so every step of the worked example is visible. */
function WorkedSteps() {
  const ex = WORKED_EXAMPLE;
  const s = learnerPath(ex);
  const [t0] = ex.tokens;
  const lines: Record<Stage, string> = {
    scores: `${t0.word}: ${ex.q[0]}×${t0.k[0]} + ${ex.q[1]}×${t0.k[1]} = ${s.scores[0]}`,
    scaled: `${s.scores[0]} ÷ √2 ≈ ${fmt(s.scaled[0])}`,
    exps: `e^${fmt(s.scaled[0])} ≈ ${fmt(s.exps[0])}`,
    weights: `${fmt(s.exps[0])} ÷ (${s.exps.map(fmt).join(' + ')}) ≈ ${fmt(s.weights[0])}`,
    output: ex.tokens.map((t, i) => `${fmt(s.weights[i])}×${vec(t.v)}`).join(' + ') + ` ≈ ${fmtVec(s.output)}`,
  };
  return (
    <ol className="space-y-2">
      {STAGES.map((st, i) => (
        <li key={st} className="flex gap-3">
          <span aria-hidden className="grid size-6 shrink-0 place-items-center rounded-full bg-cobalt font-display text-xs font-bold text-white">{i + 1}</span>
          <div>
            <p><strong className="font-display">{T.stages[st].head}</strong> · {T.stages[st].how}</p>
            <p className="font-mono text-sm text-muted">{lines[st]}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

const ALL_CELLS = (ex: Example) => STAGES.flatMap((s) => stagesOf(ex)[s].map((_, i) => [s, i] as const));

/** LG2 practice: the learner fills the whole table alone, with the calculator, and checks it in one go. */
function Practice({ onDone }: { onDone: () => void }) {
  const logger = useLogger();
  const ex = PRACTICE_EXAMPLE;
  const exact = stagesOf(ex);
  const shown = learnerPath(ex);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [wrong, setWrong] = useState<Set<string>>(new Set());
  const [attempts, setAttempts] = useState(0);
  const [result, setResult] = useState<'wrong' | 'right' | 'revealed' | null>(null);
  const started = useRef(0);
  useEffect(() => {
    started.current = performance.now();
  }, []);
  const key = (s: Stage, i: number) => `${s}-${i}`;
  const finished = result === 'right' || result === 'revealed';
  const cells = ALL_CELLS(ex);
  const raw = (s: Stage) => exact[s].map((_, i) => drafts[key(s, i)] ?? '');

  function check() {
    const entries = Object.fromEntries(STAGES.map((s) => [s, raw(s).map((r) => parseEntry(r, s))])) as Entries;
    const verdict = checkAll(ex, entries);
    const bad = new Set(cells.filter(([s, i]) => !verdict[s][i]).map(([s, i]) => key(s, i)));
    const attempt = attempts + 1;
    logger.log('compute_check', {
      entries: Object.fromEntries(STAGES.map((s) => [s, raw(s)])),
      correct: verdict,
      ok: bad.size === 0,
      wrongCells: bad.size,
      attempt,
      msSinceStart: msSince(started.current),
    });
    setWrong(bad);
    setAttempts(attempt);
    setResult(bad.size === 0 ? 'right' : 'wrong');
  }

  function reveal() {
    logger.log('compute_reveal', { attempts, msSinceStart: msSince(started.current) });
    setDrafts(Object.fromEntries(cells.map(([s, i]) => [key(s, i), show(s, shown[s][i])])));
    setWrong(new Set());
    setResult('revealed');
  }

  const cell = (s: Stage, i: number): Cell =>
    finished ? { text: drafts[key(s, i)] ?? '' } : { input: drafts[key(s, i)] ?? '', wrong: wrong.has(key(s, i)) };

  return (
    <div className="space-y-4">
      <p>{T.practiceIntro}</p>
      <p className={`${noteClass} text-sm`}>{T.setup(vec(ex.q))}</p>
      <StageTable
        ex={ex}
        cell={cell}
        onInput={(s, i, v) => {
          setDrafts((d) => ({ ...d, [key(s, i)]: v }));
          setWrong((w) => {
            if (!w.has(key(s, i))) return w;
            const next = new Set(w);
            next.delete(key(s, i));
            return next;
          });
        }}
      />
      {!finished && <Calculator />}

      {!finished && (
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className={buttonClass} disabled={cells.some(([s, i]) => (drafts[key(s, i)] ?? '').trim() === '')} onClick={check}>{T.check}</button>
          {attempts >= T.showMeAfter && <button type="button" className={secondaryButtonClass} onClick={reveal}>{T.showMe}</button>}
        </div>
      )}

      {result === 'wrong' && <ResultBanner ok={false}>{T.wrong(wrong.size)}</ResultBanner>}
      {result === 'revealed' && <ResultBanner ok={false} title={T.revealed} />}
      {finished && (
        <div className="space-y-4">
          {result === 'right' && <ResultBanner ok>{T.done}</ResultBanner>}
          <button type="button" className={`${buttonClass} px-6 py-3 text-base`} onClick={onDone}>{T.cta}</button>
        </div>
      )}
    </div>
  );
}

/** LG2: a fully worked 3-token example, then the learner computes a second one stage by stage. */
export function Compute({ onDone }: StepProps) {
  const logger = useLogger();
  const [practice, setPractice] = useState(false);
  const worked = learnerPath(WORKED_EXAMPLE);
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{T.kicker}</p>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{T.title}</h1>
        <p className="text-lg text-muted">{T.intro}</p>
      </header>

      <section className="space-y-4 rounded-2xl border border-line bg-card p-4 sm:p-5">
        <h2 className="font-display text-xl font-bold">{T.workedTitle}</h2>
        <p className={`${noteClass} text-sm`}>{T.setup(vec(WORKED_EXAMPLE.q))}</p>
        <StageTable ex={WORKED_EXAMPLE} cell={(s, i) => ({ text: show(s, worked[s][i]) })} />
        <WorkedSteps />
        {!practice && (
          <button
            type="button"
            className={buttonClass}
            onClick={() => {
              logger.log('part_next', { part: 'worked' });
              setPractice(true);
            }}
          >
            {T.ready}
          </button>
        )}
      </section>

      {practice && (
        <section className="slide-in space-y-4 rounded-2xl border-2 border-cobalt/30 bg-card p-4 sm:p-5">
          <h2 className="font-display text-xl font-bold">{T.practiceTitle}</h2>
          <Practice onDone={onDone} />
        </section>
      )}
    </div>
  );
}
