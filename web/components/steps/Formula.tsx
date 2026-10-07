'use client';

import { useEffect, useState } from 'react';
import { ExplainRounds } from '@/components/ExplainRounds';
import { useLogger } from '@/components/LoggerProvider';
import { MeaningMap } from '@/components/MeaningMap';
import { MissionShell } from '@/components/MissionShell';
import { Playground, type Bubble } from '@/components/Playground';
import { buttonClass, noteClass } from '@/components/ui';
import type { StepProps } from '@/components/steps/types';
import { FORMULA_TASK } from '@/content/missions';
import { FOCUS, SENTENCE_A } from '@/content/sentences';
import { EXPLAIN_TEXT, FORMULA_TEXT, QK_TEXT, type FormulaPart } from '@/content/steps';
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

const others = TILES.filter((t) => t.key !== FOCUS_KEY);
const keySays = (w: string) => QK_TEXT.keySays(EMBEDDINGS[w][0], EMBEDDINGS[w][1]);
/** What a word passes on, said in one word (V bubbles). */
const VALUE_SAYS: Record<string, string> = { "I'm about fashion": 'fashion', "I'm about ML": 'ML', 'Not much here': 'little', 'A bit of both': 'both' };
const QUERY: Bubble = { key: FOCUS_KEY, text: FORMULA_TEXT.query, span: 3, tone: 'query' };
const KEYS: Bubble[] = others.map((t) => ({ key: t.key, text: keySays(t.word), tone: 'key' }));
const VALUES: Bubble[] = [
  { key: FOCUS_KEY, text: FORMULA_TEXT.newMeaning, span: 3, tone: 'value' },
  ...others.map((t) => ({ key: t.key, text: VALUE_SAYS[keySays(t.word)] ?? keySays(t.word), tone: 'value' as const })),
];

/** Bars start empty and grow, so softmax visibly "produces" the weights. */
function useGrow(active: boolean): boolean {
  const [grown, setGrown] = useState(false);
  useEffect(() => {
    if (!active) return;
    let id = requestAnimationFrame(() => {
      id = requestAnimationFrame(() => setGrown(true));
    });
    return () => {
      cancelAnimationFrame(id);
      setGrown(false);
    };
  }, [active]);
  return grown;
}

/** softmax(QKᵀ/√dₖ)·V as clickable parts; the sentence acts out the part that is picked. */
function FormulaBoard({ part, onPart }: { part: FormulaPart | null; onPart: (p: FormulaPart) => void }) {
  const logger = useLogger();
  const [dk, setDk] = useState(64);
  const [replay, setReplay] = useState(0);
  const grown = useGrow(part === 'softmax');
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
    logger.log('dk_change', { dk: FORMULA_TEXT.dkValues[i] });
  }

  const board = (() => {
    switch (part) {
      case 'q':
        return <Playground tiles={TILES} focusKey={FOCUS_KEY} showWeights={false} showScores={false} bubbles={[QUERY]} />;
      case 'k':
        return <Playground tiles={TILES} focusKey={FOCUS_KEY} showWeights={false} bubbles={[QUERY, ...KEYS]} />;
      case 'softmax':
        return <Playground tiles={TILES} focusKey={FOCUS_KEY} showWeights={grown} />;
      case 'dk':
        return (
          <div className="w-full space-y-5">
            <label className="mx-auto flex max-w-md flex-wrap items-center justify-center gap-3 rounded-xl bg-page p-3 text-sm font-semibold">
              {FORMULA_TEXT.dkLabel} = <span className="w-10 font-display text-lg tabular-nums">{dk}</span>
              <input
                type="range"
                min={0}
                max={FORMULA_TEXT.dkValues.length - 1}
                value={FORMULA_TEXT.dkValues.indexOf(dk)}
                onChange={(e) => changeDk(Number(e.target.value))}
                className="w-40 accent-cobalt"
              />
            </label>
            <div className="grid gap-5 xl:grid-cols-2">
              <div className="space-y-2 rounded-xl border-2 border-miss/30 p-3">
                <p className="font-display font-bold text-miss">{FORMULA_TEXT.without}</p>
                <Playground tiles={TILES} focusKey={FOCUS_KEY} showWeights showScores={false} weights={simulatedWeights(dk, false)} />
              </div>
              <div className="space-y-2 rounded-xl border-2 border-ok/40 p-3">
                <p className="font-display font-bold text-ok">{FORMULA_TEXT.with}</p>
                <Playground tiles={TILES} focusKey={FOCUS_KEY} showWeights showScores={false} weights={simulatedWeights(dk, true)} />
              </div>
            </div>
            <p className="text-center text-sm text-muted">{FORMULA_TEXT.dkNote}</p>
          </div>
        );
      case 'v':
        return (
          <div className="flex w-full flex-col items-center gap-4">
            <Playground key={replay} tiles={TILES} focusKey={FOCUS_KEY} showWeights showScores={false} bubbles={VALUES} flow />
            <button type="button" className={`${buttonClass} motion-reduce:hidden`} onClick={() => setReplay((r) => r + 1)}>Replay</button>
            <MeaningMap words={[...new Set(SENTENCE_A)]} selected={[]} extra={{ vec: OUTPUT, label: 'model, after' }} />
            <p className="text-sm text-muted">{FORMULA_TEXT.mapNote}</p>
          </div>
        );
      default:
        return <Playground tiles={TILES} focusKey={FOCUS_KEY} showWeights />;
    }
  })();

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <p className="flex flex-wrap items-center justify-center gap-x-1 font-display text-[clamp(1.4rem,4.5vw,2.4rem)] font-bold" aria-label="softmax of Q K transpose over square root of d k, times V">
        {btn('softmax')}(<span className="inline-flex flex-col items-center leading-none">
          <span className="flex">{btn('q')}{btn('k')}</span>
          <span className="my-1 h-0.5 w-full bg-ink" />
          {btn('dk')}
        </span>)·{btn('v')}
      </p>
      {board}
    </div>
  );
}

function useParts() {
  const logger = useLogger();
  const [part, setPart] = useState<FormulaPart | null>(null);
  const [seen, setSeen] = useState<FormulaPart[]>([]);
  function onPart(p: FormulaPart) {
    setPart(p);
    logger.log('formula_part', { part: p });
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
      <div className={`${noteClass} min-h-24`} aria-live="polite">
        {part ? (
          <>
            <p className="mb-1 font-display text-lg font-bold">{FORMULA_TEXT.parts[part].label}</p>
            <p>{FORMULA_TEXT.parts[part].text}</p>
          </>
        ) : <p>{FORMULA_TEXT.pick}</p>}
      </div>
      <ul className="flex flex-wrap gap-1.5" aria-label="Parts explored">
        {PARTS.map((p) => (
          <li key={p} className={`rounded-md px-2 py-0.5 font-display text-sm font-bold ${seen.includes(p) ? 'bg-ok text-white' : 'bg-page text-muted'}`}>
            {seen.includes(p) ? '✓ ' : ''}{FORMULA_TEXT.parts[p].label}
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
  const panel = (
    <div className="space-y-4">
      <p className="text-sm text-muted">{EXPLAIN_TEXT.intro}</p>
      <ExplainRounds task={FORMULA_TASK} condition={condition} onDone={onDone} />
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
