'use client';

import { useEffect, useState, type ComponentType } from 'react';
import { TrophyProvider, useTrophy } from '@/components/TrophyProvider';
import { DebugBar } from '@/components/DebugBar';
import { Header } from '@/components/Header';
import { LoggerProvider, useLogger } from '@/components/LoggerProvider';
import { SessionLog } from '@/components/SessionLog';
import { Explain, Formula } from '@/components/steps/Formula';
import { Hook } from '@/components/steps/Hook';
import { End, TestPlaceholder, Welcome, Why } from '@/components/steps/Intro';
import { Lab } from '@/components/steps/Lab';
import type { StepProps } from '@/components/steps/types';
import { Vectors } from '@/components/steps/Vectors';
import { STEP_ORDER, type StepId } from '@/content/steps';
import type { Condition } from '@/lib/condition';
import { canGoBack } from '@/lib/nav';

function Pretest(p: StepProps) {
  return <TestPlaceholder which="pretest" {...p} />;
}
function Posttest(p: StepProps) {
  return <TestPlaceholder which="posttest" {...p} />;
}

const VIEWS: Record<StepId, ComponentType<StepProps>> = {
  welcome: Welcome,
  hook: Hook,
  why: Why,
  pretest: Pretest,
  vectors: Vectors,
  lab: Lab,
  formula: Formula,
  explain: Explain,
  posttest: Posttest,
};

export function Lesson({ initialCondition, debug = false }: { initialCondition: Condition; debug?: boolean }) {
  return (
    <LoggerProvider condition={initialCondition}>
      <TrophyProvider>
        <LessonInner initialCondition={initialCondition} debug={debug} />
      </TrophyProvider>
    </LoggerProvider>
  );
}

/**
 * Stamps events with the current step. Rendered before the steps so its effects run first:
 * a step's own effects (the lab names its experiment) can then refine the stamp.
 */
function MissionTracker({ id }: { id: StepId | null }) {
  const logger = useLogger();
  useEffect(() => {
    if (!id) return;
    logger.setMission(id);
    logger.log('mission_start');
    return () => {
      logger.setMission(id);
      logger.log('mission_end');
    };
  }, [id, logger]);
  return null;
}

function LessonInner({ initialCondition, debug }: { initialCondition: Condition; debug: boolean }) {
  const logger = useLogger();
  const { win } = useTrophy();
  const [condition, setCondition] = useState(initialCondition);
  const [index, setIndex] = useState(0);
  // Steps already opened stay mounted (hidden), so going back shows them as the learner left them.
  const [visited, setVisited] = useState<number[]>([0]);
  const [logOpen, setLogOpen] = useState(false);
  // Bumped by the debug "Reset step" button: a new key remounts that step with fresh state.
  const [resets, setResets] = useState<Partial<Record<StepId, number>>>({});
  const id = index < STEP_ORDER.length ? STEP_ORDER[index] : null;

  function show(to: number) {
    setIndex(to);
    if (!visited.includes(to)) setVisited([...visited, to]);
    window.scrollTo({ top: 0 });
  }
  function next(from: number) {
    win(STEP_ORDER[from]);
    show(from + 1);
  }
  function back() {
    if (!canGoBack(index)) return;
    logger.log('nav_back', { from: id, to: STEP_ORDER[index - 1] });
    show(index - 1);
  }

  // Debug tools: no trophy pieces are won by jumping, and the tests are no barrier.
  function goTo(i: number) {
    const to = Math.max(0, Math.min(i, STEP_ORDER.length));
    logger.log('debug_goto', { from: id ?? 'end', to: STEP_ORDER[to] ?? 'end' });
    show(to);
  }
  function resetStep() {
    if (!id) return;
    logger.log('debug_reset', { step: id });
    setResets({ ...resets, [id]: (resets[id] ?? 0) + 1 });
    window.scrollTo({ top: 0 });
  }

  function changeCondition(c: Condition) {
    setCondition(c);
    logger.setCondition(c);
    const url = new URL(window.location.href);
    url.searchParams.set('condition', c);
    window.history.replaceState(null, '', url);
  }

  return (
    <>
      <MissionTracker id={id} />
      <Header condition={condition} onConditionChange={changeCondition} step={id ?? 'posttest'} onOpenLog={() => setLogOpen(true)} />
      <main className="mx-auto max-w-7xl px-4 py-5 sm:py-8">
        {canGoBack(index) && (
          <button type="button" className="mb-3 text-sm text-muted underline hover:text-ink" onClick={back}>
            ← Back
          </button>
        )}
        {STEP_ORDER.map((stepId, i) => {
          if (!visited.includes(i)) return null;
          const View = VIEWS[stepId];
          return (
            // Showing a hidden step restarts its CSS animation, so going back slides in too.
            <div key={`${stepId}-${resets[stepId] ?? 0}`} hidden={i !== index} className="slide-in">
              <View condition={condition} onDone={() => next(i)} debug={debug} visible={i === index} />
            </div>
          );
        })}
        {!id && <div className="slide-in"><End /></div>}
      </main>
      {debug && <DebugBar index={index} onGoTo={goTo} onReset={resetStep} />}
      <SessionLog open={logOpen} onClose={() => setLogOpen(false)} />
    </>
  );
}
