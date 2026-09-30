'use client';

import { useEffect, useState } from 'react';
import { EndScreen } from '@/components/EndScreen';
import { Header } from '@/components/Header';
import { LoggerProvider, useLogger } from '@/components/LoggerProvider';
import { SessionLog } from '@/components/SessionLog';
import { MISSION_VIEWS } from '@/components/missions/registry';
import { MISSION_ORDER } from '@/content/missions';
import type { Condition } from '@/lib/condition';

const ACTIVE = MISSION_ORDER.filter((id) => MISSION_VIEWS[id]);

export function Lesson({ initialCondition }: { initialCondition: Condition }) {
  return (
    <LoggerProvider condition={initialCondition}>
      <LessonInner initialCondition={initialCondition} />
    </LoggerProvider>
  );
}

function LessonInner({ initialCondition }: { initialCondition: Condition }) {
  const logger = useLogger();
  const [condition, setCondition] = useState(initialCondition);
  const [index, setIndex] = useState(0);
  const [logOpen, setLogOpen] = useState(false);
  const id = index < ACTIVE.length ? ACTIVE[index] : null;

  useEffect(() => {
    if (!id) return;
    logger.setMission(id);
    logger.log('mission_start');
    return () => logger.log('mission_end');
  }, [id, logger]);

  function changeCondition(next: Condition) {
    setCondition(next);
    logger.setCondition(next);
    const url = new URL(window.location.href);
    url.searchParams.set('condition', next);
    window.history.replaceState(null, '', url);
  }

  const View = id ? MISSION_VIEWS[id] : undefined;
  return (
    <>
      <Header condition={condition} onConditionChange={changeCondition} missions={ACTIVE} currentIndex={index} onOpenLog={() => setLogOpen(true)} />
      <main className="mx-auto max-w-6xl px-4 py-6">
        {id && View ? (
          <View key={id} step={MISSION_ORDER.indexOf(id)} condition={condition} onDone={() => setIndex((i) => i + 1)} />
        ) : (
          <EndScreen />
        )}
      </main>
      <SessionLog open={logOpen} onClose={() => setLogOpen(false)} />
    </>
  );
}
