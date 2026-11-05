'use client';

import { useEffect, useRef, useState } from 'react';
import { useLogger } from '@/components/LoggerProvider';
import { GIFT_REVEAL, GIFTS } from '@/content/steps';
import { badgeLabel } from '@/lib/mood';
import type { Reveal } from '@/components/garden/reveal';

type Gift = (typeof GIFTS)[number];
const AUTO_CLOSE_MS = 3500;

/**
 * The window that opens when a module is finished: "Open the new gift for Byte", one button, the
 * unwrapping, then the gift's name, badge and fact. Identical in both conditions, completion only.
 * Closing before opening reveals the gift without the animation. Without WebGL: text only.
 */
export function GiftReveal({ gift, webgl, onDone }: {
  gift: Gift;
  webgl: boolean;
  onDone: (via: 'button' | 'close', ms: number) => void;
}) {
  const logger = useLogger();
  const [stage, setStage] = useState<'closed' | 'opening' | 'open'>('closed');
  const [has3d, setHas3d] = useState(webgl);
  const canvas = useRef<HTMLCanvasElement>(null);
  const reveal = useRef<Reveal | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const started = useRef(0);
  const finished = useRef(false);
  const offered = useRef(false);   // once per window, even when React runs the effect twice in development

  const finish = (via: 'button' | 'close') => {
    if (finished.current) return;
    finished.current = true;
    onDone(via, performance.now() - started.current);
  };
  const dismiss = () => finish(stage === 'closed' ? 'close' : 'button');

  useEffect(() => {
    started.current = performance.now();
    const before = document.activeElement as HTMLElement | null;
    if (!offered.current) { offered.current = true; logger.log('gift_offered', { item: gift.item }); }
    button.current?.focus();
    let cancelled = false;
    if (webgl && canvas.current) {
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
      import('@/components/garden/reveal').then(({ createReveal }) => {
        if (cancelled || !canvas.current) return;
        try { reveal.current = createReveal(canvas.current, gift.item, reduce); } catch { setHas3d(false); }
      }, () => setHas3d(false));
    }
    return () => { cancelled = true; reveal.current?.dispose(); reveal.current = null; before?.focus?.(); };
  }, [gift.item, webgl, logger]);

  useEffect(() => {
    if (stage !== 'open') return;
    button.current?.focus();
    const t = setTimeout(() => finish('button'), AUTO_CLOSE_MS);
    return () => clearTimeout(t);
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') dismiss(); };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  });

  async function open() {
    setStage('opening');
    await reveal.current?.unwrap();
    setStage('open');
  }

  return (
    <div className="gift-reveal" onClick={(e) => { if (e.target === e.currentTarget) dismiss(); }}>
      <div className="gift-reveal-card" role="dialog" aria-modal="true" aria-labelledby="gift-reveal-title">
        <button type="button" className="gift-reveal-x" aria-label="Close" onClick={dismiss}>×</button>
        <h2 id="gift-reveal-title">{GIFT_REVEAL.title}</h2>
        {has3d
          ? <canvas ref={canvas} className="gift-reveal-canvas" aria-hidden />
          : stage !== 'open' && <div className="gift-reveal-box" aria-hidden>🎁</div>}
        {stage === 'open' && (
          <div className="gift-reveal-text" role="status">
            <p className="gift-reveal-badge">{badgeLabel(gift)}</p>
            <p className="gift-reveal-fact">{gift.fact}</p>
          </div>
        )}
        <button
          ref={button} type="button" className="gift-reveal-button" disabled={stage === 'opening'}
          onClick={stage === 'closed' ? () => void open() : () => finish('button')}
        >
          {stage === 'open' ? GIFT_REVEAL.done : GIFT_REVEAL.open}
        </button>
      </div>
    </div>
  );
}
