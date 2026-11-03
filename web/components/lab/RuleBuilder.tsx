'use client';

import { useState, type ReactNode } from 'react';
import { useLogger } from '@/components/LoggerProvider';
import { Frac, M, X, num } from '@/components/Math';
import { MissionShell } from '@/components/MissionShell';
import { ResultBanner } from '@/components/ResultBanner';
import { buttonClass, secondaryButtonClass, selectedClass } from '@/components/ui';
import type { StepProps } from '@/components/steps/types';
import { FOCUS, SENTENCE_A } from '@/content/sentences';
import { LAB_TITLES, RULE_BRICKS, RULE_SETS, RULE_TEXT } from '@/content/steps';
import { BOTTOMS, TOPS, applyRule, checkRule, passes, type BottomId, type RuleCheck, type TopId } from '@/lib/rules';
import { percentages, toTiles, topKey, weightsFor } from '@/lib/tiles';

// The bridge in the intro: the top word of our sentence, with the score and the bar the learner already saw.
const TILES = toTiles(SENTENCE_A);
const FOCUS_KEY = String(SENTENCE_A.indexOf(FOCUS));
const ROW = weightsFor(TILES, FOCUS_KEY);
const TOP = TILES.findIndex((t) => t.key === topKey(TILES, FOCUS_KEY));
const BRIDGE = { word: TILES[TOP].word, score: ROW.scores[TOP].toFixed(1), weight: percentages(ROW.weights)[TOP] };

/** Score → ? → weight, on the top word of our sentence: what the rule has to produce. */
function Bridge() {
  const B = RULE_TEXT.bridge;
  return (
    <div className="space-y-3 rounded-2xl border-2 border-cobalt/30 bg-cobalt-soft/40 p-4">
      <p className="font-display text-lg font-bold">{B.title}</p>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <span className="tile px-3 py-1.5 text-lg">{BRIDGE.word}</span>
        <div className="text-center">
          <p className="text-xs font-semibold text-muted">{B.score}</p>
          <p className="font-display text-2xl font-bold tabular-nums">s = {BRIDGE.score}</p>
        </div>
        <div className="flex flex-col items-center text-cobalt">
          <span className="text-xs font-bold">{B.rule}</span>
          <span aria-hidden className="text-2xl leading-none">⟶</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative h-14 w-6 overflow-hidden rounded bg-cobalt-soft" aria-hidden>
            <div className="absolute inset-x-0 bottom-0 bg-cobalt" style={{ height: `${BRIDGE.weight}%` }} />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted">{B.weight}</p>
            <p className="font-display text-2xl font-bold tabular-nums">{BRIDGE.weight} %</p>
          </div>
        </div>
      </div>
      <p className="text-sm">{B.text}</p>
    </div>
  );
}

const SETS = [
  { name: 'Our sentence', note: RULE_TEXT.sentenceNote, words: SENTENCE_A, scores: weightsFor(toTiles(SENTENCE_A), String(SENTENCE_A.indexOf(FOCUS))).scores },
  ...RULE_SETS,
];

const fmtPercent = (w: number) => (Number.isFinite(w) ? `${Math.round(w * 100)}%` : '÷0');
const fmt = (n: number) => (Math.abs(n) >= 100 ? n.toFixed(0) : n.toFixed(1));

/** A brick not picked yet. */
const Hole = ({ label }: { label: string }) => (
  <span className="inline-block rounded border-2 border-dashed border-line px-1.5 text-sm not-italic text-muted">{label}</span>
);

/** top(x) typeset, for a symbol or a number. */
function topOf(id: TopId, x: ReactNode, negative = false): ReactNode {
  const base = negative ? <>({x})</> : x;
  switch (id) {
    case 's': return x;
    case 'square': return <>{base}<sup>2</sup></>;
    case 'abs': return <>|{x}|</>;
    case 'plus5': return <>{x} + 5</>;
    case 'pow2': return <>2<sup>{x}</sup></>;
    case 'exp': return <>e<sup>{x}</sup></>;
  }
}

/**
 * The learner's rule on the top word of our sentence, as a derivation: the rule in symbols,
 * then every score plugged in, then the numbers. Updates with each brick picked.
 */
function Example({ top, bottom }: { top: TopId | null; bottom: BottomId | null }) {
  const { words, scores } = SETS[0];
  const i = scores.indexOf(Math.max(...scores));
  const sym = <X n="s" sub="i" />;
  const symJ = <X n="s" sub="j" />;
  const val = (k: number) => num(fmt(scores[k]));
  const topSym = top ? topOf(top, sym) : <Hole label={RULE_TEXT.topSlot} />;
  const topVal = top ? topOf(top, val(i), scores[i] < 0) : <Hole label={RULE_TEXT.topSlot} />;
  const tops = top ? scores.map(TOPS[top].f) : null;
  const d = tops && bottom ? BOTTOMS[bottom].f(tops) : null;
  const w = tops && d !== null ? tops[i] / d : null;
  const bad = w !== null && (!Number.isFinite(w) || w < 0);

  const all = top && scores.map((x, k) => <span key={k}>{k > 0 && ' + '}{topOf(top, val(k), x < 0)}</span>);
  const bottomSym: ReactNode = !bottom ? <Hole label={RULE_TEXT.bottomSlot} />
    : bottom === 'one' ? '1'
    : bottom === 'count' ? <><X n="n" /> = {scores.length}</>
    : bottom === 'sum' ? <>Σ<sub><i>j</i></sub> {top ? topOf(top, symJ) : <Hole label={RULE_TEXT.topSlot} />}</>
    : <>max<sub><i>j</i></sub> {top ? topOf(top, symJ) : <Hole label={RULE_TEXT.topSlot} />}</>;
  const bottomVal: ReactNode = !bottom ? <Hole label={RULE_TEXT.bottomSlot} />
    : bottom === 'one' ? '1'
    : bottom === 'count' ? String(scores.length)
    : !top ? <Hole label={RULE_TEXT.topSlot} />
    : bottom === 'sum' ? all
    : <>max({all?.map((a, k) => <span key={k}>{k > 0 ? ', ' : ''}{topOf(top, val(k), scores[k] < 0)}</span>)})</>;

  return (
    <div className="space-y-3 rounded-2xl border-2 border-line bg-card p-4">
      <p className="font-display text-lg font-bold">{RULE_TEXT.exampleTitle}: &quot;{words[i]}&quot;</p>
      <div className="space-y-2 overflow-x-auto rounded-lg bg-page px-3 py-2.5" aria-live="polite">
        <p><M><X n="w" sub="i" /> = <Frac num={topSym} den={bottomSym} /></M></p>
        <p className="border-t border-line pt-2">
          <M>
            <X n="w" /><sub>{words[i]}</sub> = <Frac num={topVal} den={bottomVal} />
            {tops && d !== null && <> = <Frac num={fmt(tops[i])} den={fmt(d)} /></>}
            {' '}= <strong className={bad ? 'text-miss' : 'text-cobalt'}>{w === null ? '?' : fmtPercent(w)}</strong>
          </M>
        </p>
      </div>
    </div>
  );
}

function Slot({ label, value, hint }: { label: string | null; value: string; hint: string }) {
  return (
    <span className={`inline-grid min-w-16 place-items-center rounded-lg px-3 py-1.5 ${label ? 'tile' : 'border-2 border-dashed border-line text-muted'}`}>
      {label ?? <span className="text-sm font-normal">{hint}</span>}
      <span className="sr-only">{value}</span>
    </span>
  );
}

function TestCard({ set, weights, check }: { set: (typeof SETS)[number]; weights: number[] | null; check: RuleCheck | null }) {
  return (
    <div className={`w-full rounded-xl border-2 p-4 ${check ? (passes(check) ? 'border-ok/50 bg-ok/5' : 'border-miss/40 bg-miss/5') : 'border-line'}`}>
      <p className="font-display text-lg font-bold">{set.name}</p>
      <p className="mb-3 text-sm text-muted">{set.note}</p>
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${set.words.length}, minmax(0, 1fr))` }}>
        {set.words.map((w, i) => {
          const wt = weights?.[i];
          const bad = wt !== undefined && (!Number.isFinite(wt) || wt < 0);
          return (
            <div key={i} className="flex min-w-0 flex-col items-center gap-1 text-center">
              <span className={`text-sm font-bold tabular-nums ${bad ? 'text-miss' : ''}`}>{wt === undefined ? '?' : fmtPercent(wt)}</span>
              <div className="relative h-28 w-full max-w-14 overflow-hidden rounded-md bg-cobalt-soft">
                {wt !== undefined && (
                  <div
                    className={`absolute inset-x-0 bottom-0 transition-[height] duration-500 ${bad ? 'bg-miss' : 'bg-cobalt'}`}
                    style={{ height: `${Number.isFinite(wt) ? Math.min(Math.abs(wt), 1) * 100 : 100}%` }}
                  />
                )}
              </div>
              <span className="w-full truncate text-sm text-muted" title={w}>{w}</span>
              <span className="whitespace-nowrap text-xs font-semibold tabular-nums sm:text-sm">s = {set.scores[i].toFixed(1)}</span>
            </div>
          );
        })}
      </div>
      {check && (
        <ul className="mt-3 grid gap-x-4 gap-y-0.5 text-sm sm:grid-cols-3">
          {(Object.keys(RULE_TEXT.checks) as (keyof RuleCheck)[]).map((k) => (
            <li key={k} className={check[k] ? 'text-ok' : 'text-miss'}>
              {check[k] ? '✓' : '✗'} {RULE_TEXT.checks[k]}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Productive failure: learners snap bricks into "weight = top ÷ bottom" and test the rule on three score sets. */
export function RuleBuilder({ onDone }: StepProps) {
  const logger = useLogger();
  const [top, setTop] = useState<TopId | null>(null);
  const [bottom, setBottom] = useState<BottomId | null>(null);
  const [tried, setTried] = useState<string[]>([]);

  const results = top && bottom
    ? SETS.map((s) => {
      const weights = applyRule(top, bottom, s.scores);
      return { weights, check: checkRule(weights, s.scores) };
    })
    : null;
  const allPass = results?.every((r) => passes(r.check)) ?? false;

  function choose(nextTop: TopId | null, nextBottom: BottomId | null) {
    setTop(nextTop);
    setBottom(nextBottom);
    if (!nextTop || !nextBottom) return;
    const rule = `${TOPS[nextTop].label} ÷ ${BOTTOMS[nextBottom].label}`;
    if (tried.includes(rule)) return;
    setTried([...tried, rule]);
    const checks = SETS.map((s) => checkRule(applyRule(nextTop, nextBottom, s.scores), s.scores));
    logger.log('rule_try', { rule, passes: checks.every(passes), checks });
  }

  const panel = (
    <div className="space-y-4">
      <div className="space-y-1.5">
        {RULE_TEXT.intro.map((p) => <p key={p}>{p}</p>)}
        <ol className="list-decimal space-y-0.5 pl-6 font-semibold">{RULE_TEXT.howTo.map((p) => <li key={p}>{p}</li>)}</ol>
      </div>

      <p className="flex flex-wrap items-center gap-2 font-display text-xl font-bold" aria-live="polite">
        weight =
        <Slot label={top && TOPS[top].label} value={top ? TOPS[top].label : 'empty'} hint={RULE_TEXT.topSlot} />
        ÷
        <Slot label={bottom && BOTTOMS[bottom].label} value={bottom ? BOTTOMS[bottom].label : 'empty'} hint={RULE_TEXT.bottomSlot} />
      </p>

      <fieldset className="space-y-2">
        <legend className="mb-1 text-sm font-semibold">1. Top: what to do with each score s</legend>
        <div className="flex flex-wrap gap-2">
          {RULE_BRICKS.tops.map((id) => (
            <button key={id} type="button" aria-pressed={top === id} onClick={() => choose(id, bottom)} className={`${secondaryButtonClass} min-w-12 font-display text-base ${top === id ? selectedClass : ''}`}>
              {TOPS[id].label}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="space-y-2">
        <legend className="mb-1 text-sm font-semibold">2. Bottom: what to divide by</legend>
        <div className="flex flex-wrap gap-2">
          {RULE_BRICKS.bottoms.map((id) => (
            <button key={id} type="button" aria-pressed={bottom === id} onClick={() => choose(top, id)} className={`${secondaryButtonClass} ${bottom === id ? selectedClass : ''}`}>
              {BOTTOMS[id].label}
            </button>
          ))}
        </div>
      </fieldset>

      {results && (allPass
        ? <ResultBanner ok title={RULE_TEXT.pass} />
        : <ResultBanner ok={false} title={RULE_TEXT.fail}>
          <p>{SETS.filter((_, i) => !passes(results[i].check)).map((s) => s.name).join(' and ')} {results.filter((r) => !passes(r.check)).length === 1 ? 'breaks' : 'break'} your rule.</p>
        </ResultBanner>)}
      <p className="text-sm text-muted">Rules tried: {tried.length}</p>

      {(allPass || tried.length >= RULE_TEXT.minTries) && (
        <button type="button" className={allPass ? buttonClass : secondaryButtonClass} onClick={onDone}>
          {allPass ? RULE_TEXT.cta : RULE_TEXT.giveUp}
        </button>
      )}
    </div>
  );

  const stage = (
    <div className="w-full space-y-4">
      <Bridge />
      <Example top={top} bottom={bottom} />
      <p className="font-semibold">{RULE_TEXT.testsIntro}</p>
      <div className="grid w-full gap-3">
      {SETS.map((s, i) => <TestCard key={s.name} set={s} weights={results?.[i].weights ?? null} check={results?.[i].check ?? null} />)}
      </div>
    </div>
  );

  return <MissionShell title={LAB_TITLES.rule} panel={panel} stage={stage} />;
}
