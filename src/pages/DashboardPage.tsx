import { useEffect, useMemo, useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { Beef, Droplet, Flame, History, RotateCcw, Share2, Target, Wheat } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { CircularProgress } from '../components/CircularProgress'
import { FoodLogList } from '../components/FoodLogList'
import { LogFoodForm } from '../components/LogFoodForm'
import { MacroCard } from '../components/MacroCard'
import { getLocalDateKey } from '../lib/date'
import { roundTo } from '../lib/numbers'
import { createDefaultDayState, loadDayState, saveDayState } from '../lib/storage'
import type { DayState } from '../types'

async function dataUrlToFile(dataUrl: string, filename: string) {
  const res = await fetch(dataUrl)
  const blob = await res.blob()
  return new File([blob], filename, { type: blob.type || 'image/png' })
}

export function DashboardPage() {
  const shareRef = useRef<HTMLDivElement | null>(null)
  const [isSharing, setIsSharing] = useState(false)

  const [day, setDay] = useState<DayState>(() => {
    const key = getLocalDateKey()
    return loadDayState(key) ?? createDefaultDayState(key)
  })

  useEffect(() => {
    saveDayState(day)
  }, [day])

  useEffect(() => {
    const t = window.setInterval(() => {
      const key = getLocalDateKey()
      setDay((d) => (d.dateKey === key ? d : createDefaultDayState(key)))
    }, 60_000)
    return () => window.clearInterval(t)
  }, [])

  const totals = useMemo(() => {
    const protein = day.entries.reduce((acc, e) => acc + e.protein, 0)
    const carbs = day.entries.reduce((acc, e) => acc + e.carbs, 0)
    const fat = day.entries.reduce((acc, e) => acc + e.fat, 0)
    const calories = protein * 4 + carbs * 4 + fat * 9
    return { protein, carbs, fat, calories }
  }, [day.entries])

  const format1 = (value: number) => roundTo(value, 1).toFixed(1)

  return (
    <div className="min-h-full">
      <div className="pointer-events-none fixed inset-0 opacity-70 bg-cyber-grid" />

      <div className="relative mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 text-xs tracking-[0.35em] uppercase text-zinc-300/70">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80 shadow-[0_0_22px_rgba(34,197,94,0.55)]" />
              daily macros
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-semibold text-zinc-50 neon-text">Neon Macro Tracker</h1>
            <div className="mt-1 text-sm text-zinc-300/70">
              Today: <span className="tabular-nums">{day.dateKey}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <NavLink
              to="/history"
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-zinc-950/40 px-3 text-sm font-semibold text-zinc-100/90 hover:bg-zinc-950/55 hover:border-purple-400/40"
            >
              <History className="h-4 w-4" />
              History
            </NavLink>

            <button
              type="button"
              disabled={isSharing}
              onClick={async () => {
                const node = shareRef.current
                if (!node) return
                setIsSharing(true)
                try {
                  const dataUrl = await toPng(node, {
                    cacheBust: true,
                    pixelRatio: 2,
                    backgroundColor: '#05060a',
                  })

                  const filename = `neon-macros-${day.dateKey}.png`

                  if (navigator.share && 'canShare' in navigator) {
                    try {
                      const file = await dataUrlToFile(dataUrl, filename)
                      if (navigator.canShare?.({ files: [file] })) {
                        await navigator.share({ files: [file], title: 'Neon Macro Tracker' })
                        return
                      }
                    } catch {
                      // fall back to download
                    }
                  }

                  const a = document.createElement('a')
                  a.href = dataUrl
                  a.download = filename
                  a.click()
                } finally {
                  setIsSharing(false)
                }
              }}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-zinc-950/40 px-3 text-sm font-semibold text-zinc-100/90 hover:bg-zinc-950/55 hover:border-emerald-400/40 disabled:opacity-50"
            >
              <Share2 className="h-4 w-4" />
              {isSharing ? 'Sharing…' : 'Share'}
            </button>

            <button
              type="button"
              onClick={() => setDay(createDefaultDayState(getLocalDateKey()))}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-zinc-950/40 px-3 text-sm font-semibold text-zinc-100/90 hover:bg-zinc-950/55 hover:border-purple-400/40"
            >
              <RotateCcw className="h-4 w-4" />
              Reset day
            </button>
          </div>
        </header>

        <main className="mt-6 grid gap-4">
          <div
            ref={shareRef}
            className="rounded-3xl border border-white/10 bg-zinc-950/20 p-4 sm:p-6 shadow-[0_30px_140px_rgba(0,0,0,0.55)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs tracking-[0.35em] uppercase text-zinc-300/70">CYBER-HUD</div>
                <div className="mt-1 text-lg font-semibold text-zinc-50 neon-text">Daily Macro Snapshot</div>
                <div className="mt-1 text-xs text-zinc-300/60 tabular-nums">{day.dateKey}</div>
              </div>
              <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-950/40 px-3 py-2 text-xs text-zinc-200/80 tabular-nums">
                <Flame className="h-4 w-4 text-emerald-300/90" />
                {format1(totals.calories)} / {format1(day.goals.calories)} kcal
              </div>
            </div>

            <div className="mt-4 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(360px,100%),1fr))]">
              <div className="cyber-panel rounded-2xl p-4 neon-ring min-w-0">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
                      <Flame className="h-4 w-4 text-emerald-300/90" />
                      Calories
                    </div>
                    <div className="mt-1 text-xs text-zinc-300/70">Circular progress for your daily total.</div>
                  </div>
                </div>

                <div className="mt-5 grid place-items-center">
                  <CircularProgress
                    value={totals.calories}
                    max={day.goals.calories}
                    label="kcal"
                    subtitle={`${format1(Math.max(0, day.goals.calories - totals.calories))} kcal left`}
                  />
                </div>

                <div className="mt-5 rounded-xl border border-white/10 bg-zinc-950/30 p-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200/90">
                    <Target className="h-4 w-4 text-purple-300/90" />
                    Daily goals
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <label className="grid gap-1">
                      <span className="text-[11px] text-zinc-300/70">Calories</span>
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={day.goals.calories}
                        onChange={(e) => {
                          const v = Number(e.target.value)
                          setDay((d) => ({
                            ...d,
                            goals: { ...d.goals, calories: Number.isFinite(v) && v >= 0 ? v : d.goals.calories },
                          }))
                        }}
                        className="h-10 w-full rounded-xl bg-zinc-950/40 border border-white/10 px-3 text-sm text-zinc-100 outline-none focus:border-purple-400/60 focus:ring-2 focus:ring-purple-400/15"
                      />
                    </label>

                    <label className="grid gap-1">
                      <span className="text-[11px] text-zinc-300/70">Protein (g)</span>
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={day.goals.protein}
                        onChange={(e) => {
                          const v = Number(e.target.value)
                          setDay((d) => ({
                            ...d,
                            goals: { ...d.goals, protein: Number.isFinite(v) && v >= 0 ? v : d.goals.protein },
                          }))
                        }}
                        className="h-10 w-full rounded-xl bg-zinc-950/40 border border-white/10 px-3 text-sm text-zinc-100 outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/15"
                      />
                    </label>

                    <label className="grid gap-1">
                      <span className="text-[11px] text-zinc-300/70">Carbs (g)</span>
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={day.goals.carbs}
                        onChange={(e) => {
                          const v = Number(e.target.value)
                          setDay((d) => ({
                            ...d,
                            goals: { ...d.goals, carbs: Number.isFinite(v) && v >= 0 ? v : d.goals.carbs },
                          }))
                        }}
                        className="h-10 w-full rounded-xl bg-zinc-950/40 border border-white/10 px-3 text-sm text-zinc-100 outline-none focus:border-purple-400/60 focus:ring-2 focus:ring-purple-400/15"
                      />
                    </label>

                    <label className="grid gap-1">
                      <span className="text-[11px] text-zinc-300/70">Fat (g)</span>
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={day.goals.fat}
                        onChange={(e) => {
                          const v = Number(e.target.value)
                          setDay((d) => ({
                            ...d,
                            goals: { ...d.goals, fat: Number.isFinite(v) && v >= 0 ? v : d.goals.fat },
                          }))
                        }}
                        className="h-10 w-full rounded-xl bg-zinc-950/40 border border-white/10 px-3 text-sm text-zinc-100 outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/15"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 min-w-0">
                <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(240px,100%),1fr))]">
                  <MacroCard
                    title="Protein"
                    icon={<Beef className="h-5 w-5 text-emerald-300/90" />}
                    value={totals.protein}
                    goal={day.goals.protein}
                    accent="green"
                  />
                  <MacroCard
                    title="Carbs"
                    icon={<Wheat className="h-5 w-5 text-purple-300/90" />}
                    value={totals.carbs}
                    goal={day.goals.carbs}
                    accent="purple"
                  />
                  <MacroCard
                    title="Fats"
                    icon={<Droplet className="h-5 w-5 text-emerald-300/90" />}
                    value={totals.fat}
                    goal={day.goals.fat}
                    accent="green"
                  />
                </div>

                <div className="cyber-panel rounded-2xl p-4">
                  <div className="grid gap-2 sm:grid-cols-3">
                    <div className="rounded-xl border border-white/10 bg-zinc-950/30 p-3">
                      <div className="text-xs text-zinc-300/70">Calories</div>
                      <div className="mt-1 text-lg font-semibold text-zinc-50 tabular-nums">
                        {format1(totals.calories)} kcal
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-zinc-950/30 p-3">
                      <div className="text-xs text-zinc-300/70">Macro split</div>
                      <div className="mt-1 text-sm text-zinc-100 tabular-nums">
                        P {format1(totals.protein)}g · C {format1(totals.carbs)}g · F {format1(totals.fat)}g
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-zinc-950/30 p-3">
                      <div className="text-xs text-zinc-300/70">Formula</div>
                      <div className="mt-1 text-sm text-zinc-100 tabular-nums">4P + 4C + 9F</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <section className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(360px,100%),1fr))]">
            <div className="min-w-0">
              <LogFoodForm
                onAdd={({ name, protein, carbs, fat }) => {
                  const id =
                    typeof crypto !== 'undefined' && 'randomUUID' in crypto
                      ? crypto.randomUUID()
                      : `${Date.now()}-${Math.random().toString(16).slice(2)}`

                  setDay((d) => ({
                    ...d,
                    entries: [
                      ...d.entries,
                      {
                        id,
                        name,
                        protein,
                        carbs,
                        fat,
                        createdAt: Date.now(),
                      },
                    ],
                  }))
                }}
              />
            </div>
            <div className="min-w-0">
              <FoodLogList
                entries={day.entries}
                onRemove={(id) => setDay((d) => ({ ...d, entries: d.entries.filter((e) => e.id !== id) }))}
              />
            </div>
          </section>
        </main>

        <footer className="mt-8 text-xs text-zinc-300/50">
          Data is stored locally in your browser (LocalStorage) and resets automatically when the date changes.
        </footer>
      </div>
    </div>
  )
}

