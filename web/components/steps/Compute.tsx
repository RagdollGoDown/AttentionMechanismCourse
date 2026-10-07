'use client';

import { useEffect, useRef, useState } from 'react';
import { useLogger } from '@/components/LoggerProvider';
import { ResultBanner } from '@/components/ResultBanner';
import { buttonClass, noteClass, secondaryButtonClass } from '@/components/ui';
import type { StepProps } from '@/components/steps/types';
import { COMPUTE_TEXT as T, PRACTICE_EXAMPLE, WORKED_EXAMPLE } from '@/content/steps';
import { STAGES, checkStage, fmt, fmtVec, parseEntry, stagesOf, type Example, type Stage } from '@/lib/compute';

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
  const s = stagesOf(ex);
  const [t0] = ex.tokens;
  const lines: Record<Stage, string> = {
    scores: `${t0.word}: ${ex.q[0]}×${t0.k[0]} + ${ex.q[1]}×${t0.k[1]} = ${s.scores[0]}`,
    scaled: `${s.scores[0]} ÷ 1.41 ≈ ${fmt(s.scaled[0])}`,
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

type Result = { kind: 'right' | 'wrong' | 'revealed'; stage: Stage };

function Practice({ onDone }: { onDone: () => void }) {
  const logger = useLogger();
  const ex = PRACTICE_EXAMPLE;
  const exact = stagesOf(ex);
  const [at, setAt] = useState(0); // index into STAGES; STAGES.length = finished
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [accepted, setAccepted] = useState<Partial<Record<Stage, string[]>>>({});
  const [wrong, setWrong] = useState<boolean[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const stageStart = useRef(0);
  useEffect(() => {
    stageStart.current = performance.now(); // a new stage starts its clock
  }, [at]);
  const stage = STAGES[at] as Stage | undefined;
  const key = (s: Stage, i: number) => `${s}-${i}`;
  const raw = stage ? exact[stage].map((_, i) => drafts[key(stage, i)] ?? '') : [];

  function advance(values: string[]) {
    setAccepted((a) => ({ ...a, [stage!]: values }));
    setAt((n) => n + 1);
    setWrong([]);
    setAttempts(0);
  }

  function check() {
    if (!stage) return;
    const parsed = raw.map((r) => parseEntry(r, stage));
    const verdict = checkStage(ex, stage, parsed);
    const ok = verdict.every(Boolean);
    const attempt = attempts + 1;
    logger.log('compute_entry', { stage, entries: raw, correct: verdict, ok, attempt, msOnStage: msSince(stageStart.current) });
    setResult({ kind: ok ? 'right' : 'wrong', stage });
    if (ok) advance(parsed.map((x) => show(stage, x!)));
    else {
      setWrong(verdict.map((v) => !v));
      setAttempts(attempt);
    }
  }

  function reveal() {
    if (!stage) return;
    logger.log('compute_reveal', { stage, attempts, msOnStage: msSince(stageStart.current) });
    setResult({ kind: 'revealed', stage });
    advance(exact[stage].map((x) => show(stage, x)));
  }

  const cell = (s: Stage, i: number): Cell => {
    if (accepted[s]) return { text: accepted[s]![i] };
    if (s === stage) return { input: drafts[key(s, i)] ?? '', wrong: wrong[i] ?? false };
    return null;
  };

  return (
    <div className="space-y-4">
      <p>{T.practiceIntro}</p>
      <p className={`${noteClass} text-sm`}>{T.setup(vec(ex.q))} {T.calculator}</p>
      <StageTable ex={ex} cell={cell} onInput={(s, i, v) => setDrafts((d) => ({ ...d, [key(s, i)]: v }))} />

      {stage && (
        <form
          className="flex flex-wrap items-center gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            check();
          }}
        >
          <p className="w-full text-sm"><strong className="font-display">{T.stages[stage].head}</strong> · {T.stages[stage].how}</p>
          <button type="submit" className={buttonClass} disabled={raw.some((r) => r.trim() === '')}>{T.check}</button>
          {attempts >= T.showMeAfter && <button type="button" className={secondaryButtonClass} onClick={reveal}>{T.showMe}</button>}
        </form>
      )}

      {result && stage && result.kind === 'wrong' && <ResultBanner ok={false}>{T.wrong}</ResultBanner>}
      {result && result.kind === 'right' && stage && <ResultBanner ok>{T.stages[result.stage].head} ✓</ResultBanner>}
      {result && result.kind === 'revealed' && stage && <ResultBanner ok={false} title={T.revealed} />}

      {!stage && (
        <div className="space-y-4">
          <ResultBanner ok>{T.done}</ResultBanner>
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
  const worked = stagesOf(WORKED_EXAMPLE);
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
