'use client';

import { useState } from 'react';
import { ExplainRounds } from '@/components/ExplainRounds';
import { useGame } from '@/components/GameProvider';
import { useLogger } from '@/components/LoggerProvider';
import { MeaningMap } from '@/components/MeaningMap';
import { MissionShell } from '@/components/MissionShell';
import { Playground } from '@/components/Playground';
import { buttonClass, noteClass } from '@/components/ui';
import type { StepProps } from '@/components/steps/types';
import { FORMULA_TASK } from '@/content/missions';
import { FOCUS, SENTENCE_A } from '@/content/sentences';
import { EXPLAIN_TEXT, FORMULA_TEXT, XP, type FormulaPart } from '@/content/steps';
import { EMBEDDINGS } from '@/content/vectors';
import { softmax, type Vec } from '@/lib/attention';
import { toTiles, weightsFor } from '@/lib/tiles';

const TILES = toTiles(SENTENCE_A);
const FOCUS_KEY = String(SENTENCE_A.indexOf(FOCUS));
const ROW = weightsFor(TILES, FOCUS_KEY);
const PARTS = Object.keys(FORMULA_TEXT.parts) as FormulaPart[];

/** V = embeddings in our toy: the output of "model" is the weighted mix of the words' arrows. */
const OUTPUT: Vec = SENTENCE_A.reduce<Vec>((acc, w, i) => [acc[0] + ROW.weights[i] * EMBEDDINGS[w][0], acc[1] + ROW.weights[i] * EMBEDDINGS[w][1]], [0, 0]);

/**
 * Dot products of d_k-long vectors grow like √d_k. We simulate that by stretching our 2D scores,
 * so the division is visibly what keeps the bars from collapsing onto one word.
 */
export function simulatedWeights(dk: number, divide: boolean): number[] {
  const scores = ROW.scores.map((s) => s * Math.sqrt(dk / 2));
  return softmax(divide ? scores.map((s) => s / Math.sqrt(dk)) : scores);
}

/** softmax(QKᵀ/√d_k)·V as clickable parts, with the board that each part points to. */
function FormulaBoard({ part, onPart }: { part: FormulaPart | null; onPart: (p: FormulaPart) => void }) {
  const logger = useLogger();
  const [dk, setDk] = useState(2);
  const [divide, setDivide] = useState(true);
  const btn = (p: FormulaPart) => (
    <button
      type="button"
      aria-pressed={part === p}
      onClick={() => onPart(p)}
      className={`rounded-md px-1.5 py-0.5 transition ${part === p ? 'tile' : 'hover:bg-cobalt-soft'} ${part && part !== p ? 'opacity-45' : ''}`}
    >
      {FORMULA_TEXT.parts[p].label}
    </button>
  );
  function changeDk(i: number) {
    setDk(FORMULA_TEXT.dkValues[i]);
    logger.log('dk_change', { dk: FORMULA_TEXT.dkValues[i], divide });
  }
  function toggleDivide() {
    setDivide(!divide);
    logger.log('dk_change', { dk, divide: !divide });
  }

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <p className="flex flex-wrap items-center justify-center gap-x-1 font-display text-[clamp(1.4rem,4.5vw,2.4rem)] font-bold" aria-label="softmax of Q K transpose over square root of d k, times V">
        {btn('softmax')}(<span className="inline-flex flex-col items-center leading-none">
          <span className="flex">{btn('q')}{btn('k')}</span>
          <span className="my-1 h-0.5 w-full bg-ink" />
          {btn('dk')}
        </span>)·{btn('v')}
      </p>

      {part === 'v' ? (
        <div className="flex w-full flex-col items-center gap-2">
          <MeaningMap words={[...new Set(SENTENCE_A)]} selected={[]} extra={{ vec: OUTPUT, label: 'model, after' }} />
          <p className="text-sm text-muted">{FORMULA_TEXT.mapNote}</p>
        </div>
      ) : (
        <div className="w-full space-y-4">
          <Playground tiles={TILES} focusKey={FOCUS_KEY} showWeights showScores={part !== 'softmax'} weights={part === 'dk' ? simulatedWeights(dk, divide) : undefined} />
          {part === 'dk' && (
            <div className="mx-auto flex max-w-md flex-col gap-3 rounded-xl bg-page p-3">
              <label className="flex items-center justify-between gap-3 text-sm font-semibold">
                {FORMULA_TEXT.dkLabel}: <span className="font-display text-lg tabular-nums">{dk}</span>
                <input
                  type="range"
                  min={0}
                  max={FORMULA_TEXT.dkValues.length - 1}
                  value={FORMULA_TEXT.dkValues.indexOf(dk)}
                  onChange={(e) => changeDk(Number(e.target.value))}
                  className="w-40 accent-cobalt"
                />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={divide} onChange={toggleDivide} className="size-4 accent-cobalt" />
                {FORMULA_TEXT.divideLabel}
              </label>
              <p className="text-xs text-muted">{FORMULA_TEXT.dkNote}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function useParts() {
  const logger = useLogger();
  const { award } = useGame();
  const [part, setPart] = useState<FormulaPart | null>(null);
  const [seen, setSeen] = useState<FormulaPart[]>([]);
  function onPart(p: FormulaPart) {
    setPart(p);
    logger.log('formula_part', { part: p });
    award(XP.explore, `formula:${p}`);
    if (!seen.includes(p)) setSeen([...seen, p]);
  }
  return { part, seen, onPart };
}

export function Formula({ onDone }: StepProps) {
  const { part, seen, onPart } = useParts();
  const left = PARTS.length - seen.length;
  const panel = (
    <div className="space-y-4">
      <p>{FORMULA_TEXT.intro}</p>
      <p className={`${noteClass} min-h-24`}>{part ? FORMULA_TEXT.parts[part].text : 'Pick a part of the formula.'}</p>
      <ul className="flex flex-wrap gap-1.5" aria-label="Parts explored">
        {PARTS.map((p) => (
          <li key={p} className={`rounded-md px-2 py-0.5 font-display text-sm font-bold ${seen.includes(p) ? 'bg-ok text-white' : 'bg-page text-muted'}`}>
            {FORMULA_TEXT.parts[p].label}
          </li>
        ))}
      </ul>
      {left > 0
        ? <p className="text-sm text-muted">{FORMULA_TEXT.remaining(left)}</p>
        : <button type="button" className={buttonClass} onClick={onDone}>{FORMULA_TEXT.cta}</button>}
    </div>
  );
  return <MissionShell title={FORMULA_TEXT.title} panel={panel} stage={<FormulaBoard part={part} onPart={onPart} />} />;
}

export function Explain({ condition, onDone }: StepProps) {
  const { part, onPart } = useParts();
  const { earnBadge } = useGame();
  const panel = (
    <div className="space-y-4">
      <p className="text-sm text-muted">{EXPLAIN_TEXT.intro}</p>
      <ExplainRounds
        task={FORMULA_TASK}
        condition={condition}
        onDone={() => {
          earnBadge('explainer');
          onDone();
        }}
      />
    </div>
  );
  return (
    <MissionShell
      title={EXPLAIN_TEXT.title}
      panel={panel}
      // The board stays interactive, but the part texts stay hidden: the learner generates the explanation.
      stage={<FormulaBoard part={part} onPart={onPart} />}
    />
  );
}
