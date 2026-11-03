'use client';

import { useEffect, useRef, useState } from 'react';
import { useGifts } from '@/components/GiftProvider';
import { useLogger } from '@/components/LoggerProvider';
import { GIFTS } from '@/content/steps';
import type { World } from '@/components/garden/world';

/** Height of the garden band; the lesson keeps this much room at its end so nothing stays under it. */
const BAND = 112;

/**
 * Byte's garden along the bottom of the window (the reward: one gift per finished module, see GiftProvider).
 * The 3D world loads the first time the garden shows and stays mounted, paused, while hidden
 * (tests, or the learner's own "Hide garden"). Without WebGL the lesson simply has no garden.
 */
export function Garden({ on }: { on: boolean }) {
  const { gifts } = useGifts();
  const logger = useLogger();
  const [hidden, setHidden] = useState(false);
  const [failed, setFailed] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const fx = useRef<HTMLDivElement>(null);
  const world = useRef<World | null>(null);
  const latest = useRef(gifts);
  const show = on && !hidden && !failed;

  useEffect(() => {
    latest.current = gifts;
    world.current?.setGifts(gifts, nextItem(gifts));
  }, [gifts]);

  useEffect(() => {
    if (!show) { world.current?.setRunning(false); return; }
    if (world.current) { world.current.setRunning(true); return; }
    let cancelled = false;
    import('@/components/garden/world').then(({ createWorld }) => {
      if (cancelled || !canvas.current || !fx.current) return;
      try {
        world.current = createWorld(canvas.current, fx.current, {
          onPet: () => logger.log('pet_petted'),
          onMove: (item) => logger.log('pet_item_moved', { item }),
        });
      } catch {
        setFailed(true);
        return;
      }
      world.current.setGifts(latest.current, nextItem(latest.current));
      world.current.setRunning(true);
    }, () => setFailed(true));
    return () => { cancelled = true; };
  }, [show, logger]);

  useEffect(() => () => { world.current?.dispose(); world.current = null; }, []);

  function toggle() {
    logger.log('garden_toggled', { hidden: !hidden });
    setHidden(!hidden);
  }

  return (
    <>
      {/* Room at the end of the page, so the lesson can always scroll clear of the band. */}
      <div aria-hidden style={{ height: show ? BAND + 24 : 0 }} />
      <div className="garden-band" hidden={!show} aria-hidden>
        <svg viewBox="0 0 1440 150" preserveAspectRatio="none">
          <path d="M0 58 C 200 30 380 50 560 38 S 900 14 1100 40 S 1330 26 1440 40 L1440 150 L0 150 Z" fill="#dbe7d8" />
          <path d="M0 80 C 220 52 420 72 640 64 S 1000 44 1200 70 S 1380 58 1440 64 L1440 150 L0 150 Z" fill="#c9dfc2" />
          <path d="M0 98 C 300 86 600 96 900 90 S 1260 96 1440 92 L1440 150 L0 150 Z" fill="#b4d8a6" />
          <path d="M0 122 C 300 112 640 126 960 118 S 1300 124 1440 120 L1440 150 L0 150 Z" fill="#acd39d" />
        </svg>
      </div>
      <canvas ref={canvas} className="garden-canvas" hidden={!show} aria-hidden />
      <div ref={fx} className="garden-fx" hidden={!show} aria-live="polite" />
      {on && !failed && (
        <button type="button" className="garden-toggle" onClick={toggle} aria-pressed={hidden}>
          {hidden ? 'Show Byte’s garden' : 'Hide garden'}
        </button>
      )}
    </>
  );
}

/** The next gift waits wrapped where it will stand. */
function nextItem(gifts: readonly (typeof GIFTS)[number][]) {
  return GIFTS.find((g) => !gifts.includes(g))?.item ?? null;
}
