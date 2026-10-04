'use client';

import { useState } from 'react';
import { EMBEDDINGS } from '@/content/vectors';
import type { Vec } from '@/lib/attention';

const SIZE = 380;
const PAD = 44;
const MAX = 3.6;
const SCALE = (SIZE - 2 * PAD) / MAX; // same scale on both axes, so angles are preserved

const toXY = ([a, b]: Vec): [number, number] => [PAD + a * SCALE, SIZE - PAD - b * SCALE];
const fmt = (v: Vec) => `[${v[0].toFixed(1)}, ${v[1].toFixed(1)}]`;

/** Label placement; default is up-right of the dot. Nudged where an arrow would cross the label. */
const LABEL: Record<string, { dx: number; dy: number; anchor?: 'end' }> = {
  smiled: { dx: 8, dy: 4 },
  predicted: { dx: 8, dy: 6 }, // default would cover the "data" dot
  the: { dx: -9, dy: -4, anchor: 'end' },
  after: { dx: 4, dy: 16 },
  'fashion show': { dx: -6, dy: -10, anchor: 'end' },
};

const INK = '#1b2b4b';
const COBALT = '#3d5afe';
const GREY = '#8391ab';
const HIGHLIGHT = '#e09a00';

function AngleArc({ a, b }: { a: Vec; b: Vec }) {
  const [ox, oy] = toXY([0, 0]);
  const r = 40;
  const t1 = Math.atan2(a[1], a[0]);
  const t2 = Math.atan2(b[1], b[0]);
  const [lo, hi] = t1 < t2 ? [t1, t2] : [t2, t1];
  const p = (t: number) => `${ox + r * Math.cos(t)} ${oy - r * Math.sin(t)}`;
  // All vectors are in the first quadrant: small arc, counter-clockwise on screen (sweep 0).
  return <path d={`M ${p(lo)} A ${r} ${r} 0 0 0 ${p(hi)}`} fill="none" stroke={HIGHLIGHT} strokeWidth={2.5} />;
}

/**
 * Words as arrows on a 2D meaning map. `labels` renames arrows (e.g. "query of model");
 * `extra` draws a dashed arrow that is not a word (e.g. model after attention).
 * `numbers` shows a word's vector while the pointer is over it (or it has focus, or was tapped).
 */
export function MeaningMap({ words, selected, onSelect, labels = {}, extra, focus = 'model', numbers = false, onPeek, className = 'max-w-[26rem]' }: {
  words: string[];
  selected: string[];
  onSelect?: (word: string) => void;
  labels?: Record<string, string>;
  extra?: { vec: Vec; label: string };
  focus?: string;
  numbers?: boolean;
  onPeek?: (word: string) => void;
  /** Width cap; the map scales to fill it. */
  className?: string;
}) {
  const [ox, oy] = toXY([0, 0]);
  const [peek, setPeek] = useState<string | null>(null);
  function show(w: string) {
    if (!numbers || peek === w) return;
    setPeek(w);
    onPeek?.(w);
  }
  function hide(w: string) {
    setPeek((p) => (p === w ? null : p));
  }
  const interactive = Boolean(onSelect || numbers);
  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className={`w-full select-none ${className}`} role={interactive ? 'group' : 'img'} aria-label="Meaning map: words as arrows">
      <line x1={ox} y1={oy} x2={SIZE - PAD / 2} y2={oy} stroke="#d5dbe8" />
      <line x1={ox} y1={oy} x2={ox} y2={PAD / 2} stroke="#d5dbe8" />
      <text x={SIZE - PAD / 2} y={oy + 18} textAnchor="end" fill={GREY} fontSize={11}>fashion →</text>
      <text x={ox - 8} y={PAD / 2 - 6} fill={GREY} fontSize={11}>↑ machine learning</text>
      {selected.length === 2 && <AngleArc a={EMBEDDINGS[selected[0]]} b={EMBEDDINGS[selected[1]]} />}
      {words.map((w) => {
        const [x, y] = toXY(EMBEDDINGS[w]);
        const isSel = selected.includes(w);
        const color = isSel || peek === w ? HIGHLIGHT : w === focus ? COBALT : GREY;
        const label = LABEL[w] ?? { dx: 7, dy: -7 };
        const bold = isSel || w === focus || peek === w;
        const g = (
          <>
            <line x1={ox} y1={oy} x2={x} y2={y} stroke={color} strokeWidth={bold ? 3 : 1.5} />
            {interactive && <line x1={ox} y1={oy} x2={x} y2={y} stroke="transparent" strokeWidth={12} />}
            <circle cx={x} cy={y} r={4} fill={color} />
            <circle cx={x} cy={y} r={18} fill="transparent" />
            <text x={x + label.dx} y={y + label.dy} textAnchor={label.anchor} fill={bold ? INK : GREY} fontSize={12} fontWeight={bold ? 700 : 400}>
              {labels[w] ?? w}
            </text>
          </>
        );
        const pick = () => (onSelect ? onSelect(w) : show(w));
        return interactive ? (
          <g
            key={w}
            onClick={pick}
            onPointerEnter={() => show(w)}
            onPointerLeave={() => hide(w)}
            onFocus={() => show(w)}
            onBlur={() => hide(w)}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && pick()}
            tabIndex={0}
            className="cursor-pointer outline-none"
            role="button"
            aria-label={numbers ? `${w}: ${fmt(EMBEDDINGS[w])}` : `Select ${w}`}
            aria-pressed={onSelect ? isSel : undefined}
          >
            {g}
          </g>
        ) : (
          <g key={w}>{g}</g>
        );
      })}
      {extra && (() => {
        const [x, y] = toXY(extra.vec);
        return (
          <g>
            <line x1={ox} y1={oy} x2={x} y2={y} stroke={INK} strokeWidth={3} strokeDasharray="6 4" />
            <circle cx={x} cy={y} r={5} fill={INK} />
            <text x={x} y={y - 12} textAnchor="middle" fill={INK} fontSize={12} fontWeight={700}>{extra.label}</text>
          </g>
        );
      })()}
      {peek && (() => {
        const [x, y] = toXY(EMBEDDINGS[peek]);
        const text = `${peek} = ${fmt(EMBEDDINGS[peek])}`;
        const w = text.length * 7 + 16;
        // Keep the tooltip inside the map: flip it left near the right edge, below near the top.
        const tx = Math.min(Math.max(x - w / 2, 4), SIZE - w - 4);
        const ty = y < 50 ? y + 14 : y - 40;
        return (
          <g aria-hidden pointerEvents="none">
            <rect x={tx} y={ty} width={w} height={24} rx={6} fill={INK} />
            <text x={tx + w / 2} y={ty + 16} textAnchor="middle" fill="white" fontSize={12} fontFamily="ui-monospace, monospace">{text}</text>
          </g>
        );
      })()}
    </svg>
  );
}
