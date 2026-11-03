import type { ReactNode } from 'react';

/** Inline textbook math, rendered with HTML (styles: .math, .frac, .colvec in globals.css). */
export function M({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`math ${className}`}>{children}</span>;
}

/** An italic variable with an optional subscript / superscript: <X n="k" sub="i" /> → kᵢ. */
export function X({ n, sub, sup }: { n: string; sub?: ReactNode; sup?: ReactNode }) {
  return <><i>{n}</i>{sub !== undefined && <sub>{italicIndex(sub)}</sub>}{sup !== undefined && <sup>{italicIndex(sup)}</sup>}</>;
}

/** A one-letter index (i, j, k) is a variable: italic. Numbers stay upright. */
const italicIndex = (x: ReactNode) => (typeof x === 'string' && /^[a-z]$/.test(x) ? <i>{x}</i> : x);

export function Frac({ num, den }: { num: ReactNode; den: ReactNode }) {
  return <span className="frac"><span>{num}</span><span>{den}</span></span>;
}

/** A number in math typesetting: true minus sign, and brackets when it is negative inside a product. */
export function num(x: number | string, paren = false): string {
  const s = String(x).replace('-', '−');
  return paren && s.startsWith('−') ? `(${s})` : s;
}

export function ColVec({ v }: { v: (number | string)[] }) {
  return <span className="colvec">{v.map((x, i) => <span key={i}>{num(x)}</span>)}</span>;
}
