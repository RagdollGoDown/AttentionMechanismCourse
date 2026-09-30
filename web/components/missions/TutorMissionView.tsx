'use client';

import { useMemo, useState } from 'react';
import { ExplanationBox } from '@/components/ExplanationBox';
import { FeedbackCard, type ShownFeedback } from '@/components/FeedbackCard';
import { useLogger } from '@/components/LoggerProvider';
import { MissionShell } from '@/components/MissionShell';
import { Playground } from '@/components/Playground';
import { buttonClass, secondaryButtonClass } from '@/components/ui';
import type { MissionViewProps } from '@/components/missions/types';
import { MISSION_TITLES, type TutorMission } from '@/content/missions';
import { applyChange, toTiles, topKey } from '@/lib/tiles';
import type { FeedbackResponse } from '@/lib/tutor/schema';

const MAX_ROUNDS = 2;

interface Round {
  explanation: string;
  shown: ShownFeedback;
}

export function TutorMissionView({ mission, step, condition, onDone }: MissionViewProps & { mission: TutorMission }) {
  const logger = useLogger();
  const before = useMemo(() => toTiles(mission.before), [mission]);
  const after = useMemo(() => applyChange(before, mission.change), [before, mission]);
  const focusKey = before[mission.focusIndex].key;
  const changedKey = before[mission.change.index].key;
  const pred = mission.prediction;
  const correctChoice = pred.kind === 'tile' ? before[pred.correctIndex].key : pred.correct;

  const [choice, setChoice] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [showAfter, setShowAfter] = useState(true);
  const [draft, setDraft] = useState('');
  const [rounds, setRounds] = useState<Round[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tile predictions name the word that will sit at that position after the change
  // (picking the "fashion show → training run" tile means predicting "training run").
  const choiceLabel = (c: string | null) =>
    c === null ? '…' : pred.kind === 'tile' ? (after.find((t) => t.key === c) ?? before.find((t) => t.key === c))?.word ?? c : c;

  function lock() {
    setLocked(true);
    logger.log('prediction', { choice: choiceLabel(choice), correct: choice === correctChoice });
  }
  function doChange() {
    setRevealed(true);
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

  async function submit() {
    const explanation = draft.trim();
    const round = rounds.length + 1;
    logger.log('explanation_submit', { round, text: explanation });

    if (condition === 'control') {
      setRounds([...rounds, { explanation, shown: { kind: 'expert', text: mission.expertAnswer } }]);
      logger.log('feedback_received', { round, source: 'expert' });
      return;
    }

    setPending(true);
    setError(null);
    try {
      const prev = rounds.at(-1);
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          missionId: mission.id,
          explanation,
          round,
          previous: prev && prev.shown.kind === 'tutor' ? { explanation: prev.explanation, feedback: prev.shown.feedback } : undefined,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const feedback = (await res.json()) as FeedbackResponse;
      setRounds([...rounds, { explanation, shown: { kind: 'tutor', feedback } }]);
      logger.log('feedback_received', { round, ...feedback });
    } catch (err) {
      setError('Could not reach the tutor. Please try again.');
      logger.log('feedback_received', { round, source: 'error', error: String(err) });
    } finally {
      setPending(false);
    }
  }

  const panel = (
    <div className="space-y-4 text-sm">
      <p>{mission.intro}</p>

      {!locked && (
        <div className="space-y-2">
          <p className="font-medium">{pred.prompt}</p>
          {pred.kind === 'choice' && (
            <div className="flex flex-wrap gap-2">
              {pred.options.map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setChoice(o)}
                  className={`${secondaryButtonClass} ${choice === o ? 'border-amber-400 bg-amber-50 ring-2 ring-amber-300' : ''}`}
                >
                  {o}
                </button>
              ))}
            </div>
          )}
          {pred.kind === 'tile' && <p className="text-slate-500">Your pick: <strong>{choiceLabel(choice)}</strong></p>}
          <button type="button" className={buttonClass} disabled={choice === null} onClick={lock}>Lock in my prediction</button>
        </div>
      )}

      {locked && !revealed && (
        <div className="space-y-2">
          <p>Prediction locked: <strong>{choiceLabel(choice)}</strong></p>
          <button type="button" className={buttonClass} onClick={doChange}>{mission.actionLabel}</button>
        </div>
      )}

      {revealed && (
        <div className="space-y-4">
          <p className={choice === correctChoice ? 'text-emerald-700' : 'text-red-700'}>
            You predicted <strong>{choiceLabel(choice)}</strong>. {choice === correctChoice ? '✓ Right!' : `✗ The answer: ${choiceLabel(correctChoice)}.`}
          </p>
          <p className="rounded-lg bg-slate-50 p-3">{mission.revealNote}</p>
          <p className="font-medium">{mission.explainPrompt}</p>
          {rounds.map((r, i) => (
            <div key={i} className="space-y-2">
              <blockquote className="border-l-4 border-slate-300 pl-3 italic text-slate-600">{r.explanation}</blockquote>
              <FeedbackCard shown={r.shown} round={i + 1} />
            </div>
          ))}
          {rounds.length < MAX_ROUNDS && (
            <ExplanationBox
              value={draft}
              onChange={setDraft}
              onSubmit={submit}
              pending={pending}
              label={rounds.length === 0 ? 'Your explanation' : 'Revise your explanation (optional)'}
            />
          )}
          {error && <p className="text-red-700">{error}</p>}
          {rounds.length > 0 && <button type="button" className={buttonClass} onClick={onDone}>Continue →</button>}
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
        notes={revealed ? {} : { [changedKey]: mission.changeNote }}
      />
      {revealed && (
        <button type="button" className={secondaryButtonClass} onClick={toggleView}>
          Show {showAfter ? 'before' : 'after'}
        </button>
      )}
    </>
  );

  return (
    <MissionShell
      step={step}
      title={MISSION_TITLES[mission.id]}
      panel={panel}
      stage={stage}
      stageLabel={revealed ? (showAfter ? 'After' : 'Before') : 'Now'}
    />
  );
}
