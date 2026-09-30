'use client';

import { useState } from 'react';
import { useLogger } from '@/components/LoggerProvider';
import { MissionShell } from '@/components/MissionShell';
import { ResultBanner } from '@/components/ResultBanner';
import { buttonClass, secondaryButtonClass, selectedClass } from '@/components/ui';
import type { StepProps } from '@/components/steps/types';
import { FOCUS, SENTENCE_A } from '@/content/sentences';
import { LAB_TITLES, RULE_BRICKS, RULE_SETS, RULE_TEXT } from '@/content/steps';
import { BOTTOMS, TOPS, applyRule, checkRule, passes, type BottomId, type RuleCheck, type TopId } from '@/lib/rules';
import { toTiles, weightsFor } from '@/lib/tiles';

const SETS = [
  { name: 'Our sentence', note: RULE_TEXT.sentenceNote, words: SENTENCE_A, scores: weightsFor(toTiles(SENTENCE_A), String(SENTENCE_A.indexOf(FOCUS))).scores },
  ...RULE_SETS,
];

const fmtPercent = (w: number) => (Number.isFinite(w) ? `${Math.round(w * 100)}%` : '÷0');
const fmt = (n: number) => (Math.abs(n) >= 100 ? n.toFixed(0) : n.toFixed(1));

/** The rule worked out on the top word of our sentence, so the bricks read as a calculation. */
function Example({ top, bottom }: { top: TopId | null; bottom: BottomId | null }) {
  const { words, scores } = SETS[0];
  const i = scores.indexOf(Math.max(...scores));
  const tops = top ? scores.map(TOPS[top].f) : null;
  const d = tops && bottom ? BOTTOMS[bottom].f(tops) : null;
  return (
    <div className="rounded-xl bg-page p-3 text-sm">
      <p className="mb-1 font-semibold">{RULE_TEXT.exampleTitle}: &quot;{words[i]}&quot;</p>
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-display tabular-nums">
        <span>s = {fmt(scores[i])}</span>
        <span aria-hidden>→</span>
        <span>top = {tops ? fmt(tops[i]) : '?'}</span>
        <span aria-hidden>→</span>
        <span>÷ {d === null ? '?' : fmt(d)}</span>
        <span aria-hidden>=</span>
        <strong className="text-cobalt">{tops && d !== null ? fmtPercent(tops[i] / d) : '?'}</strong>
      </p>
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
    <div className={`w-full rounded-xl border-2 p-3 ${check ? (passes(check) ? 'border-ok/50 bg-ok/5' : 'border-miss/40 bg-miss/5') : 'border-line'}`}>
      <p className="font-display font-bold">{set.name}</p>
      <p className="mb-2 text-sm text-muted">{set.note}</p>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${set.words.length}, minmax(0, 1fr))` }}>
        {set.words.map((w, i) => {
          const wt = weights?.[i];
          const bad = wt !== undefined && (!Number.isFinite(wt) || wt < 0);
          return (
            <div key={i} className="flex min-w-0 flex-col items-center gap-1 text-center">
              <span className={`text-xs font-bold tabular-nums ${bad ? 'text-miss' : ''}`}>{wt === undefined ? '?' : fmtPercent(wt)}</span>
              <div className="relative h-16 w-full max-w-8 overflow-hidden rounded bg-cobalt-soft">
                {wt !== undefined && (
                  <div
                    className={`absolute inset-x-0 bottom-0 transition-[height] duration-500 ${bad ? 'bg-miss' : 'bg-cobalt'}`}
                    style={{ height: `${Number.isFinite(wt) ? Math.min(Math.abs(wt), 1) * 100 : 100}%` }}
                  />
                )}
              </div>
              <span className="w-full truncate text-[11px] text-muted" title={w}>{w}</span>
              <span className="text-[11px] font-semibold tabular-nums">s = {set.scores[i].toFixed(1)}</span>
            </div>
          );
        })}
      </div>
      {check && (
        <ul className="mt-2 space-y-0.5 text-sm">
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

      <Example top={top} bottom={bottom} />

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
    <div className="w-full space-y-3">
      <p className="font-semibold">{RULE_TEXT.testsIntro}</p>
      <div className="grid w-full gap-3 xl:grid-cols-3">
      {SETS.map((s, i) => <TestCard key={s.name} set={s} weights={results?.[i].weights ?? null} check={results?.[i].check ?? null} />)}
      </div>
    </div>
  );

  return <MissionShell title={LAB_TITLES.rule} panel={panel} stage={stage} />;
}
