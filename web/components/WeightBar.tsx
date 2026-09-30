export function WeightBar({ weight, percent, score, visible, muted = false, showScore = true }: {
  weight: number;
  percent: number;
  score: number;
  visible: boolean;
  muted?: boolean;
  showScore?: boolean;
}) {
  return (
    <div className="flex w-full flex-col items-center gap-1">
      <div className="relative h-36 w-10 overflow-hidden rounded-md bg-slate-100">
        <div
          className={`absolute inset-x-0 bottom-0 transition-[height] duration-700 ease-out ${muted ? 'bg-slate-300' : 'bg-indigo-500'}`}
          style={{ height: visible ? `${weight * 100}%` : '0%' }}
        />
      </div>
      <span className="text-sm font-semibold tabular-nums">{visible ? `${percent}%` : '?'}</span>
      {showScore && (
        <span className={`text-[11px] tabular-nums text-slate-400 ${visible ? '' : 'invisible'}`} title="match score">
          score {score.toFixed(2)}
        </span>
      )}
    </div>
  );
}
