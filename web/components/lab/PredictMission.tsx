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

/** See the weights → change the sentence → predict the hidden weights → reveal → explain (tutor or expert answer). */
export function PredictMission({ mission, condition, onDone }: StepProps & { mission: TutorMission }) {
  const logger = useLogger();
  const before = useMemo(() => toTiles(mission.before), [mission]);
  const after = useMemo(() => applyChange(before, mission.change), [before, mission]);
  const focusKey = before[mission.focusIndex].key;
  const changedKey = before[mission.change.index].key;
  const pred = mission.prediction;
  const change: PendingChange = mission.change.type === 'swap' ? { kind: 'swap', to: mission.change.to } : { kind: 'remove' };
  const correctChoice = pred.kind === 'tile' ? before[pred.correctIndex].key : pred.correct;

  // before (real weights) → leaving (animation) → predict (weights hidden) → revealed
  const [phase, setPhase] = useState<'before' | 'leaving' | 'predict' | 'revealed'>('before');
  const [choice, setChoice] = useState<string | null>(null);
  const [showAfter, setShowAfter] = useState(true);
  const revealed = phase === 'revealed';

  // Tile predictions name the word that sits at that position after the change
  // (picking the "training run" tile means predicting "training run").
  const choiceLabel = (c: string | null) =>
    c === null ? '…' : pred.kind === 'tile' ? (after.find((t) => t.key === c) ?? before.find((t) => t.key === c))?.word ?? c : c;

  function doChange() {
    // Let the old tile visibly leave before the new sentence appears (skipped with reduced motion).
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setPhase('leaving');
    setTimeout(() => setPhase('predict'), reduce ? 0 : 800);
    const c = mission.change;
    logger.log(c.type === 'swap' ? 'swap_word' : 'remove_word', {
      word: mission.before[c.index],
      ...(c.type === 'swap' ? { to: c.to } : {}),
    });
  }
  function lock() {
    setPhase('revealed');
    logger.log('prediction', { choice: choiceLabel(choice), correct: choice === correctChoice });
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

      {phase === 'before' || phase === 'leaving' ? (
        <button type="button" className={buttonClass} disabled={phase === 'leaving'} onClick={doChange}>{mission.actionLabel}</button>
      ) : phase === 'predict' ? (
        <div className="result-pop space-y-2 rounded-xl border-2 border-cobalt/40 bg-cobalt-soft/40 p-3">
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
          <button type="button" className={buttonClass} disabled={choice === null} onClick={lock}>Lock in and show the weights</button>
        </div>
      ) : (
        <div className="space-y-4">
          <ResultBanner ok={choice === correctChoice} title={choice === correctChoice ? 'Right bet!' : `Not quite: it's "${choiceLabel(correctChoice)}".`}>
            <p>You bet on &quot;{choiceLabel(choice)}&quot;. {mission.revealNote}</p>
          </ResultBanner>
          <ExplainRounds task={mission} condition={condition} onDone={onDone} doneLabel="Next experiment" />
        </div>
      )}
    </div>
  );

  const changed = phase === 'predict' || (revealed && showAfter);
  const stage = (
    <>
      <Playground
        tiles={changed ? after : before}
        focusKey={focusKey}
        // Hidden while predicting: the new scores would give the answer away.
        showWeights={phase !== 'predict'}
        showScores={phase !== 'predict'}
        onTileClick={pred.kind === 'tile' && phase === 'predict' ? (t) => setChoice(t.key) : undefined}
        selectedKey={pred.kind === 'tile' && phase === 'predict' ? choice : null}
        pending={phase === 'before' ? { [changedKey]: change } : {}}
        leaving={phase === 'leaving' ? { key: changedKey, kind: mission.change.type } : null}
        enteringKey={changed && mission.change.type === 'swap' ? changedKey : null}
      />
      {changed && mission.change.type === 'remove' && (
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
      stageLabel={phase === 'predict' ? 'After: weights hidden' : revealed ? (showAfter ? 'After' : 'Before') : 'Before'}
    />
  );
}
