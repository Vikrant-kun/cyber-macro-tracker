import type { ReactNode } from 'react'
import { clamp, roundTo } from '../lib/numbers'

type Props = {
  title: string
  icon: ReactNode
  value: number
  goal: number
  unit?: string
  accent: 'purple' | 'green'
}

export function MacroCard({ title, icon, value, goal, unit = 'g', accent }: Props) {
  const pct = goal > 0 ? clamp(value / goal, 0, 1) : 0
  const format1 = (v: number) => roundTo(v, 1).toFixed(1)
  const bar =
    accent === 'green'
      ? 'from-emerald-400/90 via-green-400/80 to-purple-400/80'
      : 'from-purple-400/90 via-violet-400/80 to-emerald-400/70'

  const ring =
    accent === 'green'
      ? 'border-emerald-400/25 shadow-[0_0_0_1px_rgba(34,197,94,0.16),0_0_40px_rgba(34,197,94,0.12)]'
      : 'border-purple-400/25 shadow-[0_0_0_1px_rgba(168,85,247,0.16),0_0_40px_rgba(168,85,247,0.12)]'

  return (
    <div className={`cyber-panel rounded-2xl p-4 ${ring}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-zinc-950/40 border border-white/10">
            <div className="text-zinc-100/90">{icon}</div>
          </div>
          <div>
            <div className="text-sm font-semibold text-zinc-100">{title}</div>
            <div className="text-xs text-zinc-300/70">Daily tracking</div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xl font-semibold tabular-nums text-zinc-50">
            {format1(value)}
            <span className="text-sm font-medium text-zinc-300/70"> {unit}</span>
          </div>
          <div className="text-xs text-zinc-300/60 tabular-nums">Goal {format1(goal)}{unit}</div>
        </div>
      </div>

      <div className="mt-4">
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${bar}`}
            style={{ width: `${Math.round(pct * 100)}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-zinc-300/60">
          <span className="tabular-nums">{Math.round(pct * 100)}%</span>
          <span className="tabular-nums">{format1(Math.max(0, goal - value))}{unit} left</span>
        </div>
      </div>
    </div>
  )
}

