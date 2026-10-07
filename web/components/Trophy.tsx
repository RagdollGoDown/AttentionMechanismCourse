/** A trophy cut into horizontal pieces that fill with gold from the base up. */
const TOP = 6;
const BOTTOM = 58;

export function Trophy({ won, total, className = 'size-8', tone = 'dark' }: {
  won: number;
  total: number;
  className?: string;
  tone?: 'dark' | 'light';
}) {
  const h = (BOTTOM - TOP) / total;
  const empty = tone === 'dark' ? 'rgb(255 255 255 / 0.14)' : '#d5dbe8';
  const seam = tone === 'dark' ? '#1b2b4b' : '#ffffff';
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label={`Trophy: ${won} of ${total} pieces`}>
      <defs>
        <clipPath id={`trophy-${tone}`}>
          <path d="M16 6H48V20C48 30 41 36 32 36C23 36 16 30 16 20Z" />
          <path d="M16 9H7V14C7 21 11 25 17 26V23C13 22 10 19 10 14V12H16Z" />
          <path d="M48 9H57V14C57 21 53 25 47 26V23C51 22 54 19 54 14V12H48Z" />
          <rect x="28" y="35" width="8" height="10" />
          <rect x="20" y="45" width="24" height="5" />
          <rect x="16" y="50" width="32" height="8" rx="1.5" />
        </clipPath>
      </defs>
      <g clipPath={`url(#trophy-${tone})`}>
        {Array.from({ length: total }, (_, i) => (
          <rect
            key={i}
            x="0"
            y={BOTTOM - (i + 1) * h}
            width="64"
            height={h}
            fill={i < won ? '#ffb020' : empty}
            stroke={seam}
            strokeWidth="0.8"
            className="transition-[fill] duration-700"
          />
        ))}
      </g>
    </svg>
  );
}
