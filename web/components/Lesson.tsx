'use client';

import { useEffect, useState, type ComponentType } from 'react';
import { GameProvider, useGame } from '@/components/GameProvider';
import { Header } from '@/components/Header';
import { LoggerProvider, useLogger } from '@/components/LoggerProvider';
import { SessionLog } from '@/components/SessionLog';
import { Explain, Formula } from '@/components/steps/Formula';
import { Hook } from '@/components/steps/Hook';
import { End, TestPlaceholder, Welcome, Why } from '@/components/steps/Intro';
import { Lab } from '@/components/steps/Lab';
import type { StepProps } from '@/components/steps/types';
import { Vectors } from '@/components/steps/Vectors';
import { STEP_ORDER, XP, type StepId } from '@/content/steps';
import type { Condition } from '@/lib/condition';

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

export function Lesson({ initialCondition }: { initialCondition: Condition }) {
  return (
    <LoggerProvider condition={initialCondition}>
      <GameProvider>
        <LessonInner initialCondition={initialCondition} />
      </GameProvider>
    </LoggerProvider>
  );
}

function LessonInner({ initialCondition }: { initialCondition: Condition }) {
  const logger = useLogger();
  const { award } = useGame();
  const [condition, setCondition] = useState(initialCondition);
  const [index, setIndex] = useState(0);
  const [logOpen, setLogOpen] = useState(false);
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
    if (id) award(XP.step, `step:${id}`);
    setIndex((i) => i + 1);
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
      <Header condition={condition} onConditionChange={changeCondition} step={id ?? 'posttest'} onOpenLog={() => setLogOpen(true)} />
      <main className="mx-auto max-w-7xl px-4 py-5 sm:py-8">
        {View ? <View key={id} condition={condition} onDone={next} /> : <End />}
      </main>
      <SessionLog open={logOpen} onClose={() => setLogOpen(false)} />
    </>
  );
}
