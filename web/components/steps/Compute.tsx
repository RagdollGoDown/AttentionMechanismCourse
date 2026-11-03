'use client';

import { useEffect, useRef, useState } from 'react';
import { Calculator } from '@/components/Calculator';
import { ColVec, Frac, M, X, num } from '@/components/Math';
import { useLogger } from '@/components/LoggerProvider';
import { ResultBanner } from '@/components/ResultBanner';
import { buttonClass, noteClass, secondaryButtonClass } from '@/components/ui';
import type { StepProps } from '@/components/steps/types';
import { COMPUTE_TEXT as T, PRACTICE_EXAMPLE, WORKED_EXAMPLE } from '@/content/steps';
import { STAGES, checkAll, fmt, learnerPath, parseEntry, stagesOf, type Entries, type Example, type Stage } from '@/lib/compute';

const ROW_STAGES = STAGES.filter((s) => s !== 'output');
/** A row vector, e.g. (2, 1). */
const RowVec = ({ v }: { v: number[] }) => <M>({v.map((x) => num(x)).join(', ')})</M>;
const DK = 2;

/** Each column's symbol, as the worked steps define it. */
const SYMBOL: Record<Stage, React.ReactNode> = {
  scores: <M><X n="s" sub="i" /> = <X n="q" /> · <X n="k" sub="i" /></M>,
  scaled: <M><X n="z" sub="i" /> = <Frac num={<X n="s" sub="i" />} den={`√${DK}`} /></M>,
  exps: <M>e<sup><X n="z" sub="i" /></sup></M>,
  weights: <M><X n="α" sub="i" /></M>,
  output: <M><X n="o" /> = Σ<sub><i>i</i></sub> <X n="α" sub="i" /><X n="v" sub="i" /></M>,
};

/** The query and dₖ, typeset. */
function Setup({ ex }: { ex: Example }) {
  return (
    <p className={`${noteClass} text-sm`}>
      {T.setup} <M><X n="q" /> = </M><RowVec v={ex.q} />, <M><X n="d" sub={<i>k</i>} /> = {DK}</M>.
    </p>
  );
}
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
    if ('text' in c) return <M>{num(c.text)}</M>;
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
          <tr className="text-sm text-muted">
            <th className="text-left font-semibold">word <M><i>i</i></M></th>
            <th className="font-semibold text-ink"><M><X n="k" sub="i" /></M></th>
            <th className="font-semibold text-ink"><M><X n="v" sub="i" /></M></th>
            {ROW_STAGES.map((s) => <th key={s} className="px-1 font-normal text-ink">{SYMBOL[s]}</th>)}
          </tr>
        </thead>
        <tbody>
          {ex.tokens.map((t, i) => (
            <tr key={t.word} className="bg-page">
              <td className="rounded-l-lg py-1.5 pl-2 text-left"><M className="mr-1.5 text-muted">{i + 1}</M><span className="tile px-2 py-0.5">{t.word}</span></td>
              <td><RowVec v={t.k} /></td>
              <td><RowVec v={t.v} /></td>
              {ROW_STAGES.map((s, j) => (
                <td key={s} className={`py-1.5 ${j === ROW_STAGES.length - 1 ? 'rounded-r-lg' : ''}`}>{render(s, i, `${T.stages[s].head} for ${t.word}`)}</td>
              ))}
            </tr>
          ))}
          <tr>
            <td colSpan={3} className="pt-3 text-left text-sm font-semibold">
              {T.outputLabel} {SYMBOL.output}
            </td>
            <td colSpan={ROW_STAGES.length} className="pt-3 text-left">
              <M>(</M>{render('output', 0, 'output, first number')}<M>, </M>{render('output', 1, 'output, second number')}<M>)</M>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/**
 * The worked example as a derivation: per stage, the definition, then every word's numbers plugged in.
 * Values are rounded to 2 decimals and carried forward, exactly as the learner is asked to do.
 */
function WorkedSteps() {
  const ex = WORKED_EXAMPLE;
  const p = learnerPath(ex);
  const sumExps = p.exps.reduce((a, b) => a + b, 0);
  const idx = ex.tokens.map((_, i) => i);
  const sub = (i: number) => String(i + 1);
  const rows: Record<Stage, { def: React.ReactNode; lines: React.ReactNode[] }> = {
    scores: {
      def: <M><X n="s" sub="i" /> = <X n="q" /> · <X n="k" sub="i" /> = <X n="q" sub="1" /><X n="k" sub={<><i>i</i>,1</>} /> + <X n="q" sub="2" /><X n="k" sub={<><i>i</i>,2</>} /></M>,
      lines: idx.map((i) => <M key={i}><X n="s" sub={sub(i)} /> = {num(ex.q[0])}·{num(ex.tokens[i].k[0], true)} + {num(ex.q[1])}·{num(ex.tokens[i].k[1], true)} = {num(p.scores[i])}</M>),
    },
    scaled: {
      def: <M><X n="z" sub="i" /> = <Frac num={<X n="s" sub="i" />} den={<>√<X n="d" sub={<i>k</i>} /></>} />, &nbsp;<X n="d" sub={<i>k</i>} /> = {DK}</M>,
      lines: idx.map((i) => <M key={i}><X n="z" sub={sub(i)} /> = <Frac num={num(p.scores[i])} den={`√${DK}`} /> ≈ {num(fmt(p.scaled[i]))}</M>),
    },
    exps: {
      def: <M>e<sup><X n="z" sub="i" /></sup>, &nbsp;e ≈ 2.718</M>,
      lines: idx.map((i) => <M key={i}>e<sup><X n="z" sub={sub(i)} /></sup> = e<sup>{num(fmt(p.scaled[i]))}</sup> ≈ {num(fmt(p.exps[i]))}</M>),
    },
    weights: {
      def: <M><X n="α" sub="i" /> = <Frac num={<>e<sup><X n="z" sub="i" /></sup></>} den={<>Σ<sub><i>j</i></sub> e<sup><X n="z" sub="j" /></sup></>} />, &nbsp;Σ<sub><i>j</i></sub> e<sup><X n="z" sub="j" /></sup> = {p.exps.map(fmt).join(' + ')} = {fmt(sumExps)}</M>,
      lines: idx.map((i) => <M key={i}><X n="α" sub={sub(i)} /> = <Frac num={fmt(p.exps[i])} den={fmt(sumExps)} /> ≈ {fmt(p.weights[i])}</M>),
    },
    output: {
      def: <M><X n="o" /> = Σ<sub><i>i</i></sub> <X n="α" sub="i" /><X n="v" sub="i" /> = {idx.map((i) => <span key={i}>{i > 0 && ' + '}<X n="α" sub={sub(i)} /><X n="v" sub={sub(i)} /></span>)}</M>,
      lines: [
        <M key="o">
          <X n="o" /> = {idx.map((i) => <span key={i}>{i > 0 && ' + '}{fmt(p.weights[i])}<ColVec v={ex.tokens[i].v} /></span>)} ≈ <ColVec v={p.output.map(fmt)} />
        </M>,
      ],
    },
  };
  return (
    <ol className="space-y-4">
      {STAGES.map((st, n) => (
        <li key={st} className="flex gap-3">
          <span aria-hidden className="grid size-6 shrink-0 place-items-center rounded-full bg-cobalt font-display text-xs font-bold text-white">{n + 1}</span>
          <div className="min-w-0 space-y-1.5">
            <p><strong className="font-display">{T.stages[st].name}</strong> · {T.stages[st].how}</p>
            <div className="overflow-x-auto rounded-lg bg-page px-3 py-2">
              <p className="py-0.5">{rows[st].def}</p>
              <div className="mt-1 flex flex-wrap gap-x-8 gap-y-1 border-t border-line pt-1.5">
                {rows[st].lines.map((l, i) => <p key={i} className="py-0.5">{l}</p>)}
              </div>
            </div>
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
      <Setup ex={ex} />
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
        <Setup ex={WORKED_EXAMPLE} />
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
