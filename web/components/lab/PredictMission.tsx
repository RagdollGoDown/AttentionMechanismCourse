'use client';

import { useMemo, useState } from 'react';
import { ExplainRounds } from '@/components/ExplainRounds';
import { useLogger } from '@/components/LoggerProvider';
import { MissionShell } from '@/components/MissionShell';
import { Playground, type PendingChange } from '@/components/Playground';
import { ResultBanner } from '@/components/ResultBanner';
import { buttonClass, secondaryButtonClass, selectedClass } from '@/components/ui';
import type { StepProps } from '@/components/steps/types';
import type { TutorMission } from '@/content/missions';
import { LAB_TITLES } from '@/content/steps';
import { applyChange, toTiles, topKey } from '@/lib/tiles';

/** Predict → change the sentence → compare → explain (tutor or expert answer). */
export function PredictMission({ mission, condition, onDone }: StepProps & { mission: TutorMission }) {
  const logger = useLogger();
  const before = useMemo(() => toTiles(mission.before), [mission]);
  const after = useMemo(() => applyChange(before, mission.change), [before, mission]);
  const focusKey = before[mission.focusIndex].key;
  const changedKey = before[mission.change.index].key;
  const pred = mission.prediction;
  const change: PendingChange = mission.change.type === 'swap' ? { kind: 'swap', to: mission.change.to } : { kind: 'remove' };
  const correctChoice = pred.kind === 'tile' ? before[pred.correctIndex].key : pred.correct;

  const [choice, setChoice] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [showAfter, setShowAfter] = useState(true);

  // Tile predictions name the word that will sit at that position after the change
  // (picking the "fashion show → training run" tile means predicting "training run").
  const choiceLabel = (c: string | null) =>
    c === null ? '…' : pred.kind === 'tile' ? (after.find((t) => t.key === c) ?? before.find((t) => t.key === c))?.word ?? c : c;

  function lock() {
    setLocked(true);
    logger.log('prediction', { choice: choiceLabel(choice), correct: choice === correctChoice });
  }
  function doChange() {
    // Let the old tile visibly leave before the new sentence appears (skipped with reduced motion).
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setLeaving(true);
    setTimeout(() => {
      setLeaving(false);
      setRevealed(true);
    }, reduce ? 0 : 800);
    const c = mission.change;
    logger.log(c.type === 'swap' ? 'swap_word' : 'remove_word', {
      word: mission.before[c.index],
      ...(c.type === 'swap' ? { to: c.to } : {}),
    });
    logger.log('reveal', { top: after.find((t) => t.key === topKey(after, focusKey))?.word });
  }
  function toggleView() {
    const next = !showAfter;
    setShowAfter(next);
    logger.log('toggle_before_after', { showing: next ? 'after' : 'before' });
  }

  const panel = (
    <div className="space-y-4">
      <p>{mission.intro}</p>

      {!locked && (
        <div className="space-y-2">
          <p className="font-semibold">{pred.prompt}</p>
          {pred.kind === 'choice' && (
            <div className="flex flex-wrap gap-2">
              {pred.options.map((o) => (
                <button key={o} type="button" aria-pressed={choice === o} onClick={() => setChoice(o)} className={`${secondaryButtonClass} ${choice === o ? selectedClass : ''}`}>
                  {o}
                </button>
              ))}
            </div>
          )}
          {pred.kind === 'tile' && <p className="text-muted">Your pick: <strong className="text-ink">{choiceLabel(choice)}</strong></p>}
          <button type="button" className={buttonClass} disabled={choice === null} onClick={lock}>Lock in my bet</button>
        </div>
      )}

      {locked && !revealed && (
        <div className="space-y-2">
          <p>Your bet: <strong>{choiceLabel(choice)}</strong></p>
          <button type="button" className={buttonClass} disabled={leaving} onClick={doChange}>{mission.actionLabel}</button>
        </div>
      )}

      {revealed && (
        <div className="space-y-4">
          <ResultBanner ok={choice === correctChoice} title={choice === correctChoice ? 'Right bet!' : `Not quite: it's "${choiceLabel(correctChoice)}".`}>
            <p>You bet on &quot;{choiceLabel(choice)}&quot;. {mission.revealNote}</p>
          </ResultBanner>
          <ExplainRounds task={mission} condition={condition} onDone={onDone} doneLabel="Next experiment" />
        </div>
      )}
    </div>
  );

  const stage = (
    <>
      <Playground
        tiles={revealed && showAfter ? after : before}
        focusKey={focusKey}
        showWeights
        onTileClick={pred.kind === 'tile' && !locked ? (t) => setChoice(t.key) : undefined}
        selectedKey={pred.kind === 'tile' && !revealed ? choice : null}
        pending={revealed || leaving ? {} : { [changedKey]: change }}
        leaving={leaving ? { key: changedKey, kind: mission.change.type } : null}
        enteringKey={revealed && showAfter && mission.change.type === 'swap' ? changedKey : null}
      />
      {revealed && showAfter && mission.change.type === 'remove' && (
        <p className="rounded-full bg-miss/10 px-3 py-1 text-sm font-semibold text-miss">&quot;{mission.before[mission.change.index]}&quot; was removed</p>
      )}
      {revealed && (
        <button type="button" className={secondaryButtonClass} onClick={toggleView}>
          Show {showAfter ? 'before' : 'after'}
        </button>
      )}
    </>
  );

  return (
    <MissionShell
      title={LAB_TITLES[mission.id]}
      panel={panel}
      stage={stage}
      stageLabel={revealed ? (showAfter ? 'After' : 'Before') : 'Now'}
    />
  );
}
