export function WeightBar({ weight, percent, visible, muted = false }: {
  weight: number;
  percent: number;
  visible: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex w-full flex-col items-center gap-1">
      <span className="font-display text-sm font-bold tabular-nums">{visible ? `${percent}%` : '?'}</span>
      <div className="relative h-[clamp(5rem,18vh,9rem)] w-full max-w-10 overflow-hidden rounded-md bg-cobalt-soft">
        <div
          className={`absolute inset-x-0 bottom-0 rounded-t-sm transition-[height] duration-700 ease-out ${muted ? 'bg-muted/40' : 'bg-cobalt'}`}
          style={{ height: visible ? `${weight * 100}%` : '0%' }}
        />
      </div>
    </div>
  );
}
