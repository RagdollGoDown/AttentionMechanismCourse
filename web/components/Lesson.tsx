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
import { Compute } from '@/components/steps/Compute';
import { Lab } from '@/components/steps/Lab';
import type { StepProps } from '@/components/steps/types';
import { Vectors } from '@/components/steps/Vectors';
import { STEP_ORDER, type StepId } from '@/content/steps';
import type { Condition } from '@/lib/condition';

function Posttest(p: StepProps) {
  return <TestPlaceholder which="posttest" {...p} />;
}

const VIEWS: Record<StepId, ComponentType<StepProps>> = {
  welcome: Welcome,
  hook: Hook,
  why: Why,
  vectors: Vectors,
  lab: Lab,
  formula: Formula,
  compute: Compute,
  explain: Explain,
  posttest: Posttest,
};

export function Lesson({ initialCondition, debug = false, participantId = null }: {
  initialCondition: Condition;
  debug?: boolean;
  participantId?: string | null;
}) {
  return (
    <LoggerProvider condition={initialCondition} participantId={participantId} debug={debug}>
      <TrophyProvider>
        <LessonInner initialCondition={initialCondition} debug={debug} />
      </TrophyProvider>
    </LoggerProvider>
  );
}

function LessonInner({ initialCondition, debug }: { initialCondition: Condition; debug: boolean }) {
  const logger = useLogger();
  const { win } = useTrophy();
  const [condition, setCondition] = useState(initialCondition);
  const [index, setIndex] = useState(0);
  const [logOpen, setLogOpen] = useState(false);
  // Bumped by the debug "Reset step" button: a new key remounts the step with fresh state.
  const [resets, setResets] = useState(0);
  const id = index < STEP_ORDER.length ? STEP_ORDER[index] : null;

  useEffect(() => {
    if (!id) return;
    logger.setMission(id);
    logger.log('mission_start');
    return () => {
      logger.setMission(id);
      logger.log('mission_end');
    };
  }, [id, logger]);

  function next() {
    if (id) win(id);
    setIndex((i) => i + 1);
    window.scrollTo({ top: 0 });
  }

  // Debug tools: no trophy pieces are won by jumping.
  function goTo(i: number) {
    const to = Math.max(0, Math.min(i, STEP_ORDER.length));
    logger.log('debug_goto', { from: id ?? 'end', to: STEP_ORDER[to] ?? 'end' });
    setIndex(to);
    window.scrollTo({ top: 0 });
  }
  function resetStep() {
    logger.log('debug_reset', { step: id });
    setResets((r) => r + 1);
    window.scrollTo({ top: 0 });
  }

  function changeCondition(c: Condition) {
    setCondition(c);
    logger.setCondition(c);
    const url = new URL(window.location.href);
    url.searchParams.set('condition', c);
    window.history.replaceState(null, '', url);
  }

  const View = id ? VIEWS[id] : null;
  return (
    <>
      <Header condition={condition} onConditionChange={changeCondition} step={id ?? 'posttest'} onOpenLog={() => setLogOpen(true)} debug={debug} />
      <main className="mx-auto max-w-7xl px-4 py-5 sm:py-8">
        {/* Keyed wrapper: every new step replays the slide-in. */}
        <div key={`${id ?? 'end'}-${resets}`} className="slide-in">
          {View ? <View condition={condition} onDone={next} debug={debug} /> : <End />}
        </div>
      </main>
      {debug && <DebugBar index={index} onGoTo={goTo} onReset={resetStep} />}
      <SessionLog open={logOpen} onClose={() => setLogOpen(false)} />
    </>
  );
}
