import { Trash2 } from 'lucide-react'
import type { FoodEntry } from '../types'
import { roundTo } from '../lib/numbers'

function calcCalories(e: Pick<FoodEntry, 'protein' | 'carbs' | 'fat'>) {
  return e.protein * 4 + e.carbs * 4 + e.fat * 9
}

type Props = {
  entries: FoodEntry[]
  onRemove: (id: string) => void
}

export function FoodLogList({ entries, onRemove }: Props) {
  const format1 = (v: number) => roundTo(v, 1).toFixed(1)
  return (
    <div className="cyber-panel rounded-2xl p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-zinc-100">Today’s log</div>
          <div className="text-xs text-zinc-300/70">{entries.length} item{entries.length === 1 ? '' : 's'}</div>
        </div>
      </div>

      <div className="mt-4">
        {entries.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-zinc-950/30 p-4 text-sm text-zinc-300/70">
            No entries yet. Log your first meal to light up the dashboard.
          </div>
        ) : (
          <ul className="grid gap-2">
            {entries
              .slice()
              .sort((a, b) => b.createdAt - a.createdAt)
              .map((e) => (
                <li
                  key={e.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-white/10 bg-zinc-950/30 px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-zinc-100">{e.name}</div>
                    <div className="mt-0.5 text-xs text-zinc-300/70 tabular-nums">
                      P {format1(e.protein)}g · C {format1(e.carbs)}g · F {format1(e.fat)}g ·{' '}
                      {format1(calcCalories(e))} kcal
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemove(e.id)}
                    className="shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-zinc-950/40 text-zinc-200/80 hover:text-zinc-50 hover:border-purple-400/40 hover:bg-zinc-950/60"
                    aria-label={`Remove ${e.name}`}
                    title="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  )
}

