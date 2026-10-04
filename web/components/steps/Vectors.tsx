'use client';

import { useEffect, useId, useState, type ReactNode } from 'react';
import { useLogger } from '@/components/LoggerProvider';
import { MeaningMap } from '@/components/MeaningMap';
import { buttonClass, noteClass, secondaryButtonClass } from '@/components/ui';
import type { StepProps } from '@/components/steps/types';
import { DOT_PLOT, HAND_DOT, VECTORS_TEXT as T, dotPlotMin } from '@/content/steps';
import { MAP_WORDS } from '@/content/vectors';
import { dot, type Vec } from '@/lib/attention';
import { useSvgDrag } from '@/lib/drag';

const MIN = dotPlotMin();
/** Fixed digits with a real minus sign ("−1"), and never "−0". */
const num = (v: number, digits = 0) => (Object.is(Math.round(v * 10 ** digits), -0) ? 0 : v).toFixed(digits).replace('-', '−');
const vec = (v: Vec, digits = 0) => `[${num(v[0], digits)}, ${num(v[1], digits)}]`;

/** One numbered part: text and tasks on the left, the picture on the right. Stacks on phones. */
function Part({ n, title, children, graph }: { n: number; title: string; children: ReactNode; graph: ReactNode }) {
  return (
    <section id={`vectors-part-${n}`} className="slide-in grid scroll-mt-20 gap-5 rounded-2xl border border-line bg-card p-4 sm:p-6 lg:grid-cols-[minmax(18rem,26rem)_minmax(0,1fr)] lg:gap-8">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{T.partOf(n)}</p>
        <h2 className="font-display text-2xl font-bold leading-tight tracking-tight">{title}</h2>
        {children}
      </div>
      <div className="flex min-w-0 flex-col items-center justify-center gap-3">{graph}</div>
    </section>
  );
}

/** A task with a check circle that fills once it is done. */
function Task({ done, title, sub, right }: { done: boolean; title: string; sub?: string; right?: ReactNode }) {
  return (
    <div className={`flex items-center gap-3 rounded-xl border-2 p-3 transition ${done ? 'border-ok/40 bg-ok/10' : 'border-line'}`}>
      <span aria-hidden className={`grid size-7 shrink-0 place-items-center rounded-full text-sm font-bold ${done ? 'bg-ok text-white' : 'border-2 border-line'}`}>{done ? '✓' : ''}</span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold leading-snug">{title}</p>
        {sub && <p className="text-sm text-muted">{sub}</p>}
      </div>
      {right}
      <span className="sr-only">{done ? 'done' : 'to do'}</span>
    </div>
  );
}

/** a · b = a₁b₁ + a₂b₂, set as maths. */
function DotFormula() {
  const term = (i: number) => <><var>a</var><sub>{i}</sub><var>b</var><sub>{i}</sub></>;
  return (
    <p className="math py-1 text-center" aria-label="a dot b equals a 1 times b 1 plus a 2 times b 2">
      <var>a</var> · <var>b</var> = {term(1)} + {term(2)}
    </p>
  );
}

/** GitHub-style "Note" alert: purple bar, icon and title. */
function Note({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-r-lg border-l-4 border-note bg-note-soft px-3 py-2">
      <p className="flex items-center gap-1.5 text-sm font-semibold text-note">
        <svg aria-hidden viewBox="0 0 16 16" className="size-4 fill-current"><path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.5 7.75A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v2.75h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5h.25v-2h-.25a.75.75 0 0 1-.75-.75ZM8 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" /></svg>
        {title}
      </p>
      <p className="mt-0.5 text-sm">{children}</p>
    </div>
  );
}

/* ---------- Part 2: dot product plot ---------- */

const G = DOT_PLOT.grid;
const CELL = 34;
const PLOT_PAD = 18;
const PLOT = 2 * G * CELL + 2 * PLOT_PAD;
/** Room around the grid for the arrow labels: the longest, "b = [−4, −4]", must fit beside a tip on the edge. */
const MARGIN_X = 104;
const MARGIN_Y = 20;
const px = ([x, y]: Vec): [number, number] => [PLOT_PAD + (x + G) * CELL, PLOT_PAD + (G - y) * CELL];
const snap = (v: number) => Math.max(-G, Math.min(G, Math.round(v)));
const angleDeg = (a: Vec, b: Vec) => {
  const n = Math.hypot(...a) * Math.hypot(...b);
  return n === 0 ? 0 : Math.round((Math.acos(Math.max(-1, Math.min(1, dot(a, b) / n))) * 180) / Math.PI);
};

function signTag(d: number) {
  if (d > 0) return { text: T.dot.legend.pos, cls: 'bg-ok/15 text-ok' };
  if (d < 0) return { text: T.dot.legend.neg, cls: 'bg-xp/20 text-ink' };
  return { text: T.dot.legend.zero, cls: 'bg-cobalt-soft text-cobalt' };
}

function Arrow({ to, color, markerId, width = 3 }: { to: Vec; color: string; markerId: string; width?: number }) {
  const [x0, y0] = px([0, 0]);
  const [x1, y1] = px(to);
  if (to[0] === 0 && to[1] === 0) return null;
  return <line x1={x0} y1={y0} x2={x1} y2={y1} stroke={color} strokeWidth={width} markerEnd={`url(#${markerId})`} />;
}

/** Label just past the arrow's tip, along its direction: it never sits on the arrow, the angle or the other label's tip. */
function TipLabel({ v, color, children }: { v: Vec; color: string; children: ReactNode }) {
  const [x, y] = px(v);
  const len = Math.hypot(...v) || 1;
  const [ux, uy] = [v[0] / len, v[1] / len];
  const anchor = ux > 0.35 ? 'start' : ux < -0.35 ? 'end' : 'middle';
  const dy = anchor === 'middle' ? (uy >= 0 ? -10 : 22) : 4 - uy * 10;
  return (
    <text x={x + ux * 16} y={y + dy} textAnchor={anchor} fill={color} fontSize={12} fontWeight={700} fontFamily="ui-monospace, monospace">
      {children}
    </text>
  );
}

function DotPlot({ b, onChange, onEnd }: { b: Vec; onChange: (v: Vec) => void; onEnd: (v: Vec) => void }) {
  const id = useId().replace(/:/g, '');
  const a = DOT_PLOT.a;
  const d = dot(a, b);
  // Screen readers hear the result once per drag, not once per grid cell crossed.
  const [spoken, setSpoken] = useState('');
  const { svgProps, handleProps } = useSvgDrag<Vec>({
    fromSvg: (x, y) => [snap((x - PLOT_PAD) / CELL - G), snap(G - (y - PLOT_PAD) / CELL)],
    value: b,
    onChange,
    onEnd: (v) => {
      setSpoken(`b = ${vec(v)}, a · b = ${num(dot(a, v))}, ${signTag(dot(a, v)).text}`);
      onEnd(v);
    },
    nudge: (v, dx, dy) => [snap(v[0] + dx), snap(v[1] + dy)],
  });
  const [ox, oy] = px([0, 0]);
  const [bx, by] = px(b);
  const tag = signTag(d);
  // Angle arc between a and b, drawn the short way round.
  const r = 30;
  const ta = Math.atan2(a[1], a[0]);
  let tb = Math.atan2(b[1], b[0]);
  if (tb - ta > Math.PI) tb -= 2 * Math.PI;
  if (ta - tb > Math.PI) tb += 2 * Math.PI;
  const p = (t: number) => `${ox + r * Math.cos(t)} ${oy - r * Math.sin(t)}`;
  const sweep = tb > ta ? 0 : 1;
  const mid = (ta + tb) / 2;
  const zeroB = b[0] === 0 && b[1] === 0;

  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-3">
      <p className="sr-only" aria-live="polite">{spoken}</p>
      <div className="w-fit max-w-full rounded-xl border border-line bg-page px-4 py-2.5 text-center">
        <p className="font-mono text-sm tabular-nums sm:text-base">
          a · b = ({num(a[0])})({num(b[0])}) + ({num(a[1])})({num(b[1])}) = <strong className="text-cobalt">{num(d)}</strong>
        </p>
        <span className={`mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${tag.cls}`}>{tag.text}</span>
      </div>
      <svg {...svgProps} viewBox={`${-MARGIN_X} ${-MARGIN_Y} ${PLOT + 2 * MARGIN_X} ${PLOT + 2 * MARGIN_Y}`} className="w-full max-w-[38rem] select-none" role="group" aria-label="Two arrows a and b">
        <defs>
          {[['a', '#1b2b4b'], ['b', '#3d5afe']].map(([k, c]) => (
            <marker key={k} id={`${id}-${k}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={c} />
            </marker>
          ))}
        </defs>
        {Array.from({ length: 2 * G + 1 }, (_, i) => {
          const c = PLOT_PAD + i * CELL;
          const axis = i === G;
          return (
            <g key={i}>
              <line x1={c} y1={PLOT_PAD} x2={c} y2={PLOT - PLOT_PAD} stroke={axis ? '#8391ab' : '#e3e7f0'} strokeWidth={axis ? 1.5 : 1} />
              <line x1={PLOT_PAD} y1={c} x2={PLOT - PLOT_PAD} y2={c} stroke={axis ? '#8391ab' : '#e3e7f0'} strokeWidth={axis ? 1.5 : 1} />
            </g>
          );
        })}
        {!zeroB && <path d={`M ${p(ta)} A ${r} ${r} 0 0 ${sweep} ${p(tb)}`} fill="none" stroke="#e09a00" strokeWidth={2} />}
        {!zeroB && (
          <text x={ox + (r + 16) * Math.cos(mid)} y={oy - (r + 16) * Math.sin(mid) + 4} textAnchor="middle" fill="#b07800" fontSize={11} fontWeight={700}>
            {angleDeg(a, b)}°
          </text>
        )}
        <Arrow to={a} color="#1b2b4b" markerId={`${id}-a`} />
        <Arrow to={b} color="#3d5afe" markerId={`${id}-b`} />
        <TipLabel v={a} color="#1b2b4b">a = {vec(a)}</TipLabel>
        {!zeroB && <TipLabel v={b} color="#3d5afe">b = {vec(b)}</TipLabel>}
        <g {...handleProps} aria-label={`Arrow b, now ${vec(b)}. Use the arrow keys to move it.`} className="outline-none">
          <circle cx={bx} cy={by} r={20} fill="transparent" />
          <circle cx={bx} cy={by} r={8} fill="white" stroke="#3d5afe" strokeWidth={3} />
        </g>
      </svg>
      <p className="text-sm text-muted">{T.dot.drag}</p>
      <div className="flex flex-wrap justify-center gap-1.5 text-xs font-semibold">
        {[signTag(1), signTag(0), signTag(-1)].map((t) => <span key={t.text} className={`rounded-full px-2.5 py-0.5 ${t.cls}`}>{t.text}</span>)}
      </div>
    </div>
  );
}

function HandDot({ onAnswer }: { onAnswer: (answer: number, correct: boolean) => void }) {
  const [value, setValue] = useState('');
  const [result, setResult] = useState<boolean | null>(null);
  const answer = dot(HAND_DOT.a, HAND_DOT.b);
  function check() {
    const n = Number(value.replace('−', '-'));
    if (value.trim() === '' || Number.isNaN(n)) return;
    const ok = n === answer;
    setResult(ok);
    onAnswer(n, ok);
  }
  return (
    <div className="space-y-2">
      {/* A wrong try still unlocks "Next" (the solution is shown), but only a right answer gets the tick. */}
      <Task
        done={result === true}
        title={T.dot.tasks.hand.title}
        right={
          <form className="flex gap-1.5" onSubmit={(e) => { e.preventDefault(); check(); }}>
            <input
              inputMode="numeric"
              aria-label={T.dot.tasks.hand.placeholder}
              placeholder="?"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-14 rounded-lg border-2 border-line bg-card px-2 py-1 text-center font-mono tabular-nums focus:border-cobalt"
            />
            <button type="submit" className={secondaryButtonClass}>{T.dot.tasks.hand.check}</button>
          </form>
        }
      />
      {result !== null && (
        <p role="status" className={`result-pop rounded-lg px-3 py-2 text-sm ${result ? 'bg-ok/10 text-ink' : 'bg-xp/15 text-ink'}`}>
          <strong>{result ? 'Right!' : 'Not quite.'}</strong> <span className="font-mono">{T.dot.handSolution}</span>
        </p>
      )}
    </div>
  );
}

/* ---------- The step ---------- */

export function Vectors({ onDone }: StepProps) {
  const logger = useLogger();
  const [reached, setReached] = useState(1);
  const [b, setB] = useState<Vec>(DOT_PLOT.bStart);
  const [dotDone, setDotDone] = useState({ zero: false, min: false, hand: false });

  // Bring each new part into view once it unlocks.
  useEffect(() => {
    if (reached === 1) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById(`vectors-part-${reached}`)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }, [reached]);

  function next(from: number) {
    logger.log('part_next', { part: from });
    setReached(from + 1);
  }
  function skip() {
    logger.log('skip', { step: 'vectors', part: reached });
    onDone();
  }

  function moveB(v: Vec) {
    setB(v);
    const d = dot(DOT_PLOT.a, v);
    const zero = !dotDone.zero && d === 0 && (v[0] !== 0 || v[1] !== 0);
    const min = !dotDone.min && d === MIN;
    if (zero) logger.log('dot_task', { task: 'zero', b: v });
    if (min) logger.log('dot_task', { task: 'min', b: v });
    if (zero || min) setDotDone((s) => ({ ...s, zero: s.zero || zero, min: s.min || min }));
  }

  const dotComplete = dotDone.zero && dotDone.min && dotDone.hand;

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{T.kicker}</p>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{T.title}</h1>
          <p className="text-lg text-muted">{T.intro}</p>
        </div>
        <button type="button" onClick={skip} className="self-start text-sm text-muted underline hover:text-ink sm:self-auto">{T.skip}</button>
      </header>

      <Part
        n={1}
        title={T.word.title}
        graph={<MeaningMap words={MAP_WORDS} selected={[]} numbers className="max-w-[30rem]" onPeek={(w) => logger.log('vector_peek', { word: w })} />}
      >
        {T.word.body.map((p) => <p key={p}>{p}</p>)}
        <p className={`${noteClass} text-sm font-semibold`}>{T.word.hint}</p>
        {reached === 1 && <button type="button" className={buttonClass} onClick={() => next(1)}>{T.next}</button>}
      </Part>

      {reached >= 2 && (
        <Part
          n={2}
          title={T.dot.title}
          graph={<DotPlot b={b} onChange={moveB} onEnd={(v) => logger.log('dot_drag', { b: v, dot: dot(DOT_PLOT.a, v) })} />}
        >
          <p>{T.dot.rule}</p>
          <DotFormula />
          <Note title={T.dot.note.title}>{T.dot.note.text}</Note>
          <p>{T.dot.meaning}</p>
          <div className="space-y-2">
            <Task done={dotDone.zero} title={T.dot.tasks.zero.title} sub={dotDone.zero ? T.dot.tasks.zero.done : undefined} />
            <Task done={dotDone.min} title={T.dot.tasks.min.title} sub={dotDone.min ? T.dot.tasks.min.done : undefined} />
            <HandDot
              onAnswer={(answer, correct) => {
                logger.log('hand_dot_answer', { answer, correct });
                setDotDone((s) => ({ ...s, hand: true }));
              }}
            />
          </div>
        </Part>
      )}

      {dotComplete && (
        <div className="result-pop flex flex-col items-center gap-4 py-4 text-center">
          <p className="max-w-2xl font-display text-xl font-bold text-balance">{T.punchline}</p>
          <button type="button" className={`${buttonClass} px-6 py-3 text-base`} onClick={onDone}>{T.cta}</button>
        </div>
      )}
    </div>
  );
}
