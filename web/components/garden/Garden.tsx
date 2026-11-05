'use client';

import { useEffect, useRef, useState } from 'react';
import { useGifts } from '@/components/GiftProvider';
import { useLogger } from '@/components/LoggerProvider';
import { BYTE_LINES, GARDEN_INTRO, GIFTS, type StepId } from '@/content/steps';
import type { World } from '@/components/garden/world';

/** Height of the garden band; the lesson keeps this much room at its end so nothing stays under it. */
const BAND = 112;

/**
 * Byte's garden along the bottom of the window (the reward: one gift per finished module, see GiftProvider).
 * The 3D world loads the first time the garden shows and stays mounted, paused, while hidden
 * (tests, or the learner's own "Hide garden"). Without WebGL the lesson simply has no garden.
 */
export function Garden({ on, step }: { on: boolean; step: StepId | 'end' }) {
  const { gifts, revealed, pending, reveal } = useGifts();
  const logger = useLogger();
  const [hidden, setHidden] = useState(false);
  const [failed, setFailed] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const fx = useRef<HTMLDivElement>(null);
  const world = useRef<World | null>(null);
  const latest = useRef(revealed);
  const upcoming = useRef(gifts);
  const show = on && !hidden && !failed;

  useEffect(() => {
    latest.current = revealed;
    upcoming.current = gifts;
    world.current?.setGifts(revealed, nextItem(gifts));
  }, [revealed, gifts]);

  // ponytail: temporary until the gift window lands (Task 5): unwrap at once.
  useEffect(() => { if (pending) reveal('hidden', 0); }, [pending, reveal]);

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
        }, BYTE_LINES.hype);
      } catch {
        setFailed(true);
        return;
      }
      world.current.setGifts(latest.current, nextItem(upcoming.current));
      world.current.setRunning(true);
      if (!latest.current.length && !introSeen()) {
        world.current.intro(GARDEN_INTRO, () => { remember(); logger.log('garden_intro_closed'); });
      }
    }, () => setFailed(true));
    return () => { cancelled = true; };
  }, [show, logger]);

  // Byte cheers when a step opens (the first time the garden shows, his hello does that) and celebrates the end.
  useEffect(() => {
    if (!on) return;
    if (step === 'end') world.current?.celebrate(BYTE_LINES.end);
    else world.current?.cheer(step === 'posttest' ? BYTE_LINES.test : undefined);
  }, [step, on]);

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
          {/* Far trees on the horizon, then the hills */}
          <g fill="#d3e3cf">
            {[[90, 40, 30], [150, 34, 22], [420, 40, 26], [470, 36, 18], [760, 26, 28], [820, 22, 20], [1010, 34, 24], [1240, 30, 30], [1300, 26, 20]].map(([x, y, r]) => (
              <ellipse key={x} cx={x} cy={y} rx={r} ry={r * 1.25} />
            ))}
          </g>
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

/** Byte says hello once per browser session (storage can be blocked: then he just says it again next time). */
const INTRO_KEY = 'byte-intro-seen';
function introSeen() { try { return sessionStorage.getItem(INTRO_KEY) === '1'; } catch { return false; } }
function remember() { try { sessionStorage.setItem(INTRO_KEY, '1'); } catch { /* ignore */ } }

/** The next gift waits wrapped where it will stand. */
function nextItem(gifts: readonly (typeof GIFTS)[number][]) {
  return GIFTS.find((g) => !gifts.includes(g))?.item ?? null;
}
