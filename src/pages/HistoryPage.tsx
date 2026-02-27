import { ArrowLeft, Calendar, Flame } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { getLocalDateKey } from '../lib/date'
import { roundTo } from '../lib/numbers'
import { listHistorySummaries } from '../lib/storage'

export function HistoryPage() {
  const todayKey = getLocalDateKey()
  const history = listHistorySummaries({ includeToday: true, todayKey })
  const format1 = (v: number) => roundTo(v, 1).toFixed(1)

  return (
    <div className="min-h-full">
      <div className="pointer-events-none fixed inset-0 opacity-70 bg-cyber-grid" />

      <div className="relative mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 text-xs tracking-[0.35em] uppercase text-zinc-300/70">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400/80 shadow-[0_0_22px_rgba(168,85,247,0.55)]" />
              history
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-semibold text-zinc-50 neon-text">Macro History</h1>
            <div className="mt-1 text-sm text-zinc-300/70">Your previous days, stored locally on this device.</div>
          </div>

          <NavLink
            to="/"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-zinc-950/40 px-3 text-sm font-semibold text-zinc-100/90 hover:bg-zinc-950/55 hover:border-purple-400/40"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </NavLink>
        </header>

        <main className="mt-6 grid gap-4">
          {history.length === 0 ? (
            <div className="cyber-panel rounded-2xl p-5">
              <div className="text-sm text-zinc-300/70">No history yet. Log food for a few days and come back.</div>
            </div>
          ) : (
            <div className="grid gap-3">
              {history.map((d) => (
                <div key={d.dateKey} className="cyber-panel rounded-2xl p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
                        <Calendar className="h-4 w-4 text-emerald-300/90" />
                        <span className="tabular-nums">{d.dateKey}</span>
                        {d.dateKey === todayKey ? (
                          <span className="ml-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-200/90">
                            Today
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-1 text-xs text-zinc-300/60 tabular-nums">{d.entryCount} entr{d.entryCount === 1 ? 'y' : 'ies'}</div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-950/30 px-3 py-2 text-sm text-zinc-100 tabular-nums">
                        <Flame className="h-4 w-4 text-purple-300/90" />
                        {format1(d.calories)} kcal
                      </div>
                      <div className="rounded-xl border border-white/10 bg-zinc-950/30 px-3 py-2 text-xs text-zinc-200/90 tabular-nums">
                        P {format1(d.protein)}g · C {format1(d.carbs)}g · F {format1(d.fat)}g
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

