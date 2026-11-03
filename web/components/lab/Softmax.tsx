'use client';

import { useState } from 'react';
import { useLogger } from '@/components/LoggerProvider';
import { MissionShell } from '@/components/MissionShell';
import { Playground } from '@/components/Playground';
import { ResultBanner } from '@/components/ResultBanner';
import { buttonClass, noteClass, secondaryButtonClass } from '@/components/ui';
import type { StepProps } from '@/components/steps/types';
import { FOCUS, SENTENCE_A } from '@/content/sentences';
import { LAB_TITLES, RULE_SETS, SOFTMAX_CHECK_SCORES, SOFTMAX_TEXT, softmaxCheckAnswer } from '@/content/steps';
import { softmax } from '@/lib/attention';
import { percentages, toTiles, weightsFor } from '@/lib/tiles';

const TILES = toTiles(SENTENCE_A);
const FOCUS_KEY = String(SENTENCE_A.indexOf(FOCUS));
const PLAIN = softmax(weightsFor(TILES, FOCUS_KEY).scores);
const FS = SENTENCE_A.indexOf('fashion show');
const MINE = percentages(PLAIN)[FS];
const REAL = percentages(weightsFor(TILES, FOCUS_KEY).weights)[FS];

const SET = RULE_SETS[0];
const EXPS = SET.scores.map(Math.exp);
const SUM = EXPS.reduce((a, b) => a + b, 0);
const SHARES = percentages(EXPS.map((e) => e / SUM));

/** One stage of s → eˢ → eˢ ÷ sum. Bars grow up from a zero line (down for negative scores). */
function Pipeline({ stage }: { stage: number }) {
  const values = [SET.scores, EXPS, SHARES.map((p) => p / 100)][stage];
  const max = Math.max(...values.map(Math.abs));
  const label = (i: number) => (stage === 0 ? SET.scores[i].toFixed(1) : stage === 1 ? EXPS[i].toFixed(2) : `${SHARES[i]} %`);
  return (
    <div className="w-full max-w-lg">
      <p className="mb-4 text-center font-display text-3xl font-bold" aria-live="polite">
        {SOFTMAX_TEXT.stages[stage].formula}
        {stage === 1 && <span className="ml-3 text-base font-semibold text-muted">sum = {SUM.toFixed(1)}</span>}
      </p>
      <div className="grid grid-cols-4 gap-3">
        {SET.words.map((w, i) => {
          const v = values[i];
          const h = (Math.abs(v) / max) * 100;
          return (
            <div key={w} className="flex flex-col items-center gap-1">
              <span className={`font-display text-lg font-bold tabular-nums ${v < 0 ? 'text-miss' : ''}`}>{label(i)}</span>
              <div className="flex h-40 w-full max-w-12 flex-col">
                <div className="relative flex-1 border-b-2 border-ink/60">
                  <div className="absolute inset-x-0 bottom-0 rounded-t bg-cobalt transition-[height] duration-700" style={{ height: v > 0 ? `${h}%` : '0%' }} />
                </div>
                <div className="relative flex-1">
                  <div className="absolute inset-x-0 top-0 rounded-b bg-miss transition-[height] duration-700" style={{ height: v < 0 ? `${h}%` : '0%' }} />
                </div>
              </div>
              <span className="tile px-3 py-1 text-sm">{w}</span>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-center text-xs text-muted">Mixed scores, from the rule builder. The dark line is zero.</p>
    </div>
  );
}

export function Softmax({ onDone }: StepProps) {
  const logger = useLogger();
  const [stage, setStage] = useState(0);
  const [answer, setAnswer] = useState<number | null>(null);
  const correct = softmaxCheckAnswer();
  const last = SOFTMAX_TEXT.stages.length - 1;

  function nextStage() {
    setStage(stage + 1);
    logger.log('softmax_stage', { stage: stage + 1 });
  }
  function pick(option: number) {
    if (answer !== null) return;
    setAnswer(option);
    logger.log('check_answer', { check: 'softmax_3_words', choice: option, correct: option === correct });
  }

  const panel = (
    <div className="space-y-4">
      <p>{SOFTMAX_TEXT.intro}</p>
      <ol className="space-y-2">
        {SOFTMAX_TEXT.stages.slice(0, stage + 1).map((s, i) => (
          <li key={s.title} className={`bubble-in rounded-xl p-3 ${i === stage ? 'border-2 border-cobalt/40 bg-cobalt-soft' : 'bg-page'}`}>
            <p className="font-display font-bold">{i + 1}. {s.title}</p>
            <p className="text-sm">{s.text}</p>
          </li>
        ))}
      </ol>
      {stage < last && <button type="button" className={buttonClass} onClick={nextStage}>{SOFTMAX_TEXT.next}</button>}

      {stage === last && (
        <>
          <ResultBanner ok title="That's softmax.">
            <p>{SOFTMAX_TEXT.done}</p>
          </ResultBanner>
          <div className="space-y-3 rounded-xl border-2 border-line p-3">
            <p className="font-semibold">{SOFTMAX_TEXT.checkPrompt}</p>
            <table className="w-full text-center text-sm tabular-nums">
              <thead>
                <tr className="text-muted">
                  <th />
                  {SOFTMAX_CHECK_SCORES.map((s, i) => <th key={s} className="font-semibold">{i === 0 ? 'first word' : `word ${i + 1}`}</th>)}
                  <th className="font-semibold">sum</th>
                </tr>
              </thead>
              <tbody>
                <tr><th className="text-left font-semibold text-muted">match score s</th>{SOFTMAX_CHECK_SCORES.map((s) => <td key={s} className="font-display font-bold">{s}</td>)}<td /></tr>
                <tr><th className="text-left font-semibold text-muted">eˢ</th>{SOFTMAX_CHECK_SCORES.map((s) => <td key={s} className="font-display font-bold">{Math.exp(s).toFixed(1)}</td>)}<td className="font-display font-bold">{SOFTMAX_CHECK_SCORES.reduce((a, s) => a + Math.exp(s), 0).toFixed(1)}</td></tr>
              </tbody>
            </table>
            <p className="text-sm text-muted">{SOFTMAX_TEXT.checkHint}</p>
            <div className="grid grid-cols-4 gap-2">
              {SOFTMAX_TEXT.options.map((o) => {
                const state = answer === null ? '' : o === correct ? 'border-ok bg-ok/10' : o === answer ? 'border-miss bg-miss/10' : 'opacity-50';
                return (
                  <button key={o} type="button" disabled={answer !== null} onClick={() => pick(o)} className={`${secondaryButtonClass} ${state} disabled:opacity-100`}>
                    {o} %
                  </button>
                );
              })}
            </div>
            {answer !== null && (
              <ResultBanner ok={answer === correct}>
                <p className="font-display tabular-nums">{SOFTMAX_TEXT.solution}</p>
              </ResultBanner>
            )}
          </div>
        </>
      )}

      {answer !== null && (
        <>
          <div className={noteClass}>
            <p className="font-display font-bold">{SOFTMAX_TEXT.mysteryTitle}</p>
            <p className="text-sm">{SOFTMAX_TEXT.mystery(MINE, REAL)}</p>
          </div>
          <button type="button" className={buttonClass} onClick={onDone}>Finish the lab</button>
        </>
      )}
    </div>
  );

  const stageView = answer === null ? <Pipeline stage={stage} /> : (
    <div className="flex w-full flex-col gap-8">
      <div className="space-y-2">
        <p className="text-sm font-semibold">Softmax on the match scores of our sentence</p>
        <Playground tiles={TILES} focusKey={FOCUS_KEY} showWeights weights={PLAIN} />
      </div>
      <div className="space-y-2">
        <p className="text-sm font-semibold">The real bars (flatter)</p>
        <Playground tiles={TILES} focusKey={FOCUS_KEY} showWeights showScores={false} />
      </div>
    </div>
  );

  return <MissionShell title={LAB_TITLES.softmax} panel={panel} stage={stageView} />;
}
