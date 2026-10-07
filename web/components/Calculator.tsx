'use client';

import { useState } from 'react';
import { useLogger } from '@/components/LoggerProvider';
import { buttonClass, secondaryButtonClass } from '@/components/ui';
import { COMPUTE_TEXT } from '@/content/steps';
import { evaluate } from '@/lib/calc';

const T = COMPUTE_TEXT.calc;

/** Expression in, number out. Every use is logged: it shows how learners got to their numbers. */
export function Calculator({ placeholder = T.placeholder, context }: {
  placeholder?: string;
  /** Added to the `calc_use` event, e.g. the test item the learner is on. */
  context?: Record<string, unknown>;
}) {
  const logger = useLogger();
  const [expr, setExpr] = useState('');
  const [out, setOut] = useState<string | null>(null);
  const insert = (text: string) => setExpr((e) => e + text);
  function run() {
    const v = evaluate(expr);
    setOut(v === null ? T.error : `= ${Number(v.toFixed(4))}`);
    logger.log('calc_use', { expr, result: v, ...context });
  }
  return (
    <form
      className="space-y-2 rounded-xl border border-line bg-page p-3"
      onSubmit={(e) => {
        e.preventDefault();
        run();
      }}
    >
      <p className="font-display text-sm font-bold">{T.title}</p>
      <div className="flex gap-2">
        <input
          aria-label={T.title}
          autoComplete="off"
          value={expr}
          onChange={(e) => setExpr(e.target.value)}
          placeholder={placeholder}
          className="min-w-0 flex-1 rounded-md border-2 border-cobalt/40 bg-card px-2 py-1.5 font-mono text-sm focus:border-cobalt focus:outline-none"
        />
        <button type="submit" className={buttonClass} disabled={expr.trim() === ''}>{T.run}</button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {[['eˣ', 'exp('], ['√', 'sqrt('], ['×', '×'], ['÷', '÷'], ['(', '('], [')', ')']].map(([label, text]) => (
          <button key={label} type="button" className={`${secondaryButtonClass} min-w-10 font-mono`} onClick={() => insert(text)}>{label}</button>
        ))}
        <button type="button" className={secondaryButtonClass} onClick={() => { setExpr(''); setOut(null); }}>C</button>
      </div>
      {out && <p role="status" className="font-mono text-sm font-semibold">{out}</p>}
    </form>
  );
}
