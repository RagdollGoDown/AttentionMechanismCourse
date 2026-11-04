'use client';

import { useEffect, useState, type ComponentType } from 'react';
import { useLogger } from '@/components/LoggerProvider';
import { SavedAnswers } from '@/components/SavedAnswers';
import { useGifts } from '@/components/GiftProvider';
import { buttonClass, secondaryButtonClass } from '@/components/ui';
import type { StepProps } from '@/components/steps/types';
import { Contrast } from '@/components/lab/Contrast';
import { QueryKey } from '@/components/lab/QueryKey';
import { PredictMission } from '@/components/lab/PredictMission';
import { RuleBuilder } from '@/components/lab/RuleBuilder';
import { Softmax } from '@/components/lab/Softmax';
import { TUTOR_MISSIONS } from '@/content/missions';
import { FOCUS, SENTENCE_A } from '@/content/sentences';
import { LAB_ORDER, LAB_TEXT, LAB_TITLES, type LabId } from '@/content/steps';
import { displayWord } from '@/lib/tiles';

function Remove(p: StepProps) {
  return <PredictMission mission={TUTOR_MISSIONS.remove} {...p} />;
}

const VIEWS: Record<LabId, ComponentType<StepProps>> = {
  contrast: Contrast,
  qk: QueryKey,
  remove: Remove,
  rule: RuleBuilder,
  softmax: Softmax,
};

function Lock() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden fill="currentColor">
      <path d="M4 7V5a4 4 0 1 1 8 0v2h.5A1.5 1.5 0 0 1 14 8.5v5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 13.5v-5A1.5 1.5 0 0 1 3.5 7H4Zm2 0h4V5a2 2 0 1 0-4 0v2Z" />
    </svg>
  );
}

/**
 * The hub: the sentence stays on the board while experiments unlock one by one.
 * Opened experiments stay mounted (hidden), so going back never resets them or re-logs a prediction.
 * A finished experiment can be redone: it restarts, but the answers already written stay (read-only).
 */
export function Lab({ condition, onDone, debug = false, visible = true }: StepProps) {
  const logger = useLogger();
  const { win } = useGifts();
  const [done, setDone] = useState<LabId[]>([]);
  const [active, setActive] = useState<LabId>('contrast');
  const [opened, setOpened] = useState<LabId[]>(['contrast']);
  // Redo remounts the experiment but keeps its saved answers; debug reset also clears those.
  const [redos, setRedos] = useState<Partial<Record<LabId, number>>>({});
  const [resets, setResets] = useState<Partial<Record<LabId, number>>>({});
  const unlocked = (id: LabId) => {
    const i = LAB_ORDER.indexOf(id);
    return debug || i === 0 || done.includes(LAB_ORDER[i - 1]);
  };

  // Stamp events with the experiment, not just "lab".
  useEffect(() => {
    if (!visible) return;
    logger.setMission(active);
    logger.log('tab_open', { lab: active });
    return () => logger.setMission('lab');
  }, [active, visible, logger]);

  function open(id: LabId) {
    if (!unlocked(id)) return;
    setActive(id);
    if (!opened.includes(id)) setOpened([...opened, id]);
  }
  function finish(id: LabId) {
    if (!done.includes(id)) {
      setDone([...done, id]);
      win(id);
    }
    const next = LAB_ORDER[LAB_ORDER.indexOf(id) + 1];
    if (next) {
      setActive(next);
      if (!opened.includes(next)) setOpened([...opened, next]);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function redo(id: LabId) {
    logger.log('lab_redo', { lab: id });
    setRedos({ ...redos, [id]: (redos[id] ?? 0) + 1 });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function resetExperiment(id: LabId) {
    logger.log('debug_reset', { lab: id });
    setDone(done.filter((d) => d !== id));
    setResets({ ...resets, [id]: (resets[id] ?? 0) + 1 });
  }

  const activeIndex = LAB_ORDER.indexOf(active);
  const allDone = done.length === LAB_ORDER.length;
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-ink p-4 text-white sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-2xl font-bold tracking-tight">{LAB_TEXT.title}</h2>
          <p className="text-sm text-white/70">{LAB_TEXT.intro}</p>
        </div>
        <p className="my-5 flex flex-wrap justify-center gap-1.5 sm:gap-2" aria-label="Our sentence">
          {SENTENCE_A.map((w, i) => (
            <span key={i} className={`tile px-2.5 py-1.5 text-[clamp(0.95rem,3vw,1.4rem)] ${w === FOCUS ? 'tile-focus ring-2 ring-tile' : ''}`}>
              {displayWord(w, i)}
            </span>
          ))}
        </p>
        <div role="tablist" aria-label="Experiments" className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {LAB_ORDER.map((id, i) => {
            const isOpen = unlocked(id);
            const isDone = done.includes(id);
            return (
              <button
                key={id}
                role="tab"
                type="button"
                aria-selected={active === id}
                aria-disabled={!isOpen}
                title={isOpen ? undefined : LAB_TEXT.locked}
                onClick={() => open(id)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                  active === id ? 'bg-white font-semibold text-ink'
                    : isOpen ? 'bg-white/10 text-white hover:bg-white/20'
                    : 'cursor-not-allowed bg-white/5 text-white/35'
                }`}
              >
                <span className={`grid size-6 shrink-0 place-items-center rounded-md font-display text-xs font-bold ${isDone ? 'bg-ok text-white' : active === id ? 'bg-ink text-tile' : 'bg-white/15'}`}>
                  {isDone ? '✓' : isOpen ? i + 1 : <Lock />}
                </span>
                {LAB_TITLES[id]}
              </button>
            );
          })}
        </div>
        {debug && (
          <div role="toolbar" aria-label="Lab developer tools" className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border-2 border-dashed border-xp p-2">
            <span className="rounded bg-xp/25 px-1.5 py-0.5 font-mono text-[11px] font-bold">DEBUG</span>
            <button type="button" className={secondaryButtonClass} disabled={activeIndex <= 0} onClick={() => open(LAB_ORDER[activeIndex - 1])} aria-label="Previous experiment">←</button>
            <button type="button" className={secondaryButtonClass} disabled={activeIndex >= LAB_ORDER.length - 1} onClick={() => open(LAB_ORDER[activeIndex + 1])} aria-label="Next experiment">→</button>
            <button type="button" className={secondaryButtonClass} onClick={() => resetExperiment(active)}>Reset experiment</button>
          </div>
        )}
      </div>

      {allDone && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-ok/40 bg-ok/10 p-4">
          <p className="font-display text-lg font-bold">{LAB_TEXT.done}</p>
          <button type="button" className={buttonClass} onClick={onDone}>Continue</button>
        </div>
      )}

      {done.includes(active) && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-page px-4 py-2.5">
          <p className="text-sm text-muted">{LAB_TEXT.redoNote}</p>
          <button type="button" className={secondaryButtonClass} onClick={() => redo(active)}>{LAB_TEXT.redo}</button>
        </div>
      )}

      {opened.map((id) => {
        const View = VIEWS[id];
        return (
          // Showing a hidden panel restarts its CSS animation, so switching experiments slides too.
          <div key={`${id}-${resets[id] ?? 0}`} role="tabpanel" hidden={active !== id} className="slide-in">
            <SavedAnswers>
              <View key={redos[id] ?? 0} condition={condition} onDone={() => finish(id)} />
            </SavedAnswers>
          </div>
        );
      })}
    </div>
  );
}
