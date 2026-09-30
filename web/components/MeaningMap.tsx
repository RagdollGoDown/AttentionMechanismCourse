'use client';

import { EMBEDDINGS, MAP_WORDS } from '@/content/vectors';
import type { Vec } from '@/lib/attention';

const SIZE = 380;
const PAD = 44;
const MAX = 3.6;
const SCALE = (SIZE - 2 * PAD) / MAX; // same scale on both axes, so angles are preserved

const toXY = ([a, b]: Vec): [number, number] => [PAD + a * SCALE, SIZE - PAD - b * SCALE];

/** Label placement; default is up-right of the dot. Nudged where an arrow would cross the label. */
const LABEL: Record<string, { dx: number; dy: number; anchor?: 'end' }> = {
  smiled: { dx: 8, dy: 4 },
  predicted: { dx: 8, dy: 6 }, // default would cover the "data" dot

  the: { dx: -9, dy: -4, anchor: 'end' },
};

function AngleArc({ a, b }: { a: Vec; b: Vec }) {
  const [ox, oy] = toXY([0, 0]);
  const r = 40;
  const t1 = Math.atan2(a[1], a[0]);
  const t2 = Math.atan2(b[1], b[0]);
  const [lo, hi] = t1 < t2 ? [t1, t2] : [t2, t1];
  const p = (t: number) => `${ox + r * Math.cos(t)} ${oy - r * Math.sin(t)}`;
  // All vectors are in the first quadrant: small arc, counter-clockwise on screen (sweep 0).
  return <path d={`M ${p(lo)} A ${r} ${r} 0 0 0 ${p(hi)}`} fill="none" stroke="#f59e0b" strokeWidth={2.5} />;
}

export function MeaningMap({ selected, onSelect }: { selected: string[]; onSelect: (word: string) => void }) {
  const [ox, oy] = toXY([0, 0]);
  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full max-w-md select-none" role="img" aria-label="Meaning map: words as arrows">
      <line x1={ox} y1={oy} x2={SIZE - PAD / 2} y2={oy} stroke="#cbd5e1" />
      <line x1={ox} y1={oy} x2={ox} y2={PAD / 2} stroke="#cbd5e1" />
      <text x={SIZE - PAD / 2} y={oy + 18} textAnchor="end" className="fill-slate-500 text-[11px]">fashion-ish →</text>
      <text x={ox - 8} y={PAD / 2 - 6} className="fill-slate-500 text-[11px]">↑ machine-learning-ish</text>
      {selected.length === 2 && <AngleArc a={EMBEDDINGS[selected[0]]} b={EMBEDDINGS[selected[1]]} />}
      {MAP_WORDS.map((w) => {
        const [x, y] = toXY(EMBEDDINGS[w]);
        const isSel = selected.includes(w);
        const color = isSel ? '#f59e0b' : w === 'model' ? '#4f46e5' : '#64748b';
        const label = LABEL[w] ?? { dx: 7, dy: -7 };
        return (
          <g key={w} onClick={() => onSelect(w)} className="cursor-pointer" role="button" aria-label={`Select ${w}`} aria-pressed={isSel}>
            <line x1={ox} y1={oy} x2={x} y2={y} stroke={color} strokeWidth={isSel ? 3 : 1.5} />
            <circle cx={x} cy={y} r={4} fill={color} />
            <circle cx={x} cy={y} r={16} fill="transparent" />
            <text x={x + label.dx} y={y + label.dy} textAnchor={label.anchor} fill={color} className={`text-[12px] ${isSel || w === 'model' ? 'font-semibold' : ''}`}>{w}</text>
          </g>
        );
      })}
    </svg>
  );
}
