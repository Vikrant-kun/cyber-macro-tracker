import { clamp, roundTo } from '../lib/numbers'

type Props = {
  value: number
  max: number
  label: string
  subtitle?: string
  size?: number
  strokeWidth?: number
}

export function CircularProgress({
  value,
  max,
  label,
  subtitle,
  size = 180,
  strokeWidth = 14,
}: Props) {
  const safeMax = max > 0 ? max : 1
  const pct = clamp(value / safeMax, 0, 1)
  const radius = (size - strokeWidth) / 2
  const c = 2 * Math.PI * radius
  const dashOffset = c * (1 - pct)
  const gradientId = `grad-${Math.round(size)}-${Math.round(strokeWidth)}`
  const format1 = (v: number) => roundTo(v, 1).toFixed(1)

  return (
    <div className="relative grid place-items-center max-w-full">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-[0_0_20px_rgba(168,85,247,0.18)]">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgb(168 85 247)" stopOpacity="0.95" />
            <stop offset="55%" stopColor="rgb(139 92 246)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="rgb(34 197 94)" stopOpacity="0.95" />
          </linearGradient>
        </defs>

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
        />

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>

      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="text-xs tracking-[0.25em] text-zinc-300/80 uppercase">{label}</div>
          <div className="mt-1 text-3xl font-semibold text-zinc-50 neon-text tabular-nums">
            {format1(value)}
            <span className="text-base font-medium text-zinc-300/80"> / {format1(max)}</span>
          </div>
          {subtitle ? <div className="mt-1 text-xs text-zinc-300/70">{subtitle}</div> : null}
        </div>
      </div>
    </div>
  )
}

