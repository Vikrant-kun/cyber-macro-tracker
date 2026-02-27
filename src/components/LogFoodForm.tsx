import { useEffect, useMemo, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { searchFatSecret, type FatSecretFood } from '../lib/fatsecret'
import { roundTo } from '../lib/numbers'

type FormState = {
  name: string
  protein: string
  carbs: string
  fat: string
  weight: string
}

type Props = {
  onAdd: (entry: { name: string; protein: number; carbs: number; fat: number }) => void
}

function parseNonNegativeNumber(raw: string) {
  const n = parseFloat(raw)
  if (!Number.isFinite(n) || n < 0) return null
  return n
}

export function LogFoodForm({ onAdd }: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const [state, setState] = useState<FormState>({
    name: '',
    protein: '',
    carbs: '',
    fat: '',
    weight: '',
  })

  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<FatSecretFood[]>([])
  const [activeIndex, setActiveIndex] = useState<number>(-1)
  const [weighMode, setWeighMode] = useState(false)
  const [base, setBase] = useState<{
    weight: number | null
    protein: number
    carbs: number
    fat: number
  }>({
    weight: null,
    protein: 0,
    carbs: 0,
    fat: 0,
  })

  const format1 = (value: number) => roundTo(value, 1).toFixed(1)

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      const root = rootRef.current
      if (!root) return
      if (e.target instanceof Node && root.contains(e.target)) return
      setIsOpen(false)
      setActiveIndex(-1)
    }

    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [])

  useEffect(() => {
    const q = state.name.trim()
    if (!isOpen) return
    if (q.length < 2) {
      setResults([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    const t = window.setTimeout(() => {
      searchFatSecret(q)
        .then((r) => setResults(r))
        .finally(() => setIsLoading(false))
    }, 220)

    return () => window.clearTimeout(t)
  }, [state.name, isOpen])

  const parsed = useMemo(() => {
    const name = state.name.trim()
    const protein = parseNonNegativeNumber(state.protein) ?? 0
    const carbs = parseNonNegativeNumber(state.carbs) ?? 0
    const fat = parseNonNegativeNumber(state.fat) ?? 0
    return { name, protein, carbs, fat }
  }, [state])

  const canSubmit = parsed.name.length > 0

  return (
    <div ref={rootRef} className="cyber-panel rounded-2xl p-4 neon-ring min-w-0">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-zinc-100">Log Food</div>
          <div className="text-xs text-zinc-300/70">Add macros, we’ll calculate calories.</div>
        </div>
      </div>

      <form
        className="mt-4 grid grid-cols-1 gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          if (!canSubmit) return
          onAdd(parsed)
          setState({ name: '', protein: '', carbs: '', fat: '', weight: '' })
          setResults([])
          setIsOpen(false)
          setActiveIndex(-1)
          setBase({ weight: null, protein: 0, carbs: 0, fat: 0 })
          setWeighMode(false)
        }}
      >
        <div className="relative">
          <label className="grid gap-1">
            <span className="text-xs text-zinc-300/70">Quick Search</span>
            <input
              value={state.name}
              onChange={(e) => {
                const v = e.target.value
                setState((s) => ({ ...s, name: v }))
                setIsOpen(true)
                setActiveIndex(-1)
              }}
              onFocus={() => setIsOpen(true)}
              onKeyDown={(e) => {
                if (!isOpen) return
                if (e.key === 'Escape') {
                  setIsOpen(false)
                  setActiveIndex(-1)
                  return
                }
                if (e.key === 'ArrowDown') {
                  e.preventDefault()
                  setActiveIndex((i) => Math.min(i + 1, results.length - 1))
                  return
                }
                if (e.key === 'ArrowUp') {
                  e.preventDefault()
                  setActiveIndex((i) => Math.max(i - 1, 0))
                  return
                }
                if (e.key === 'Enter' && activeIndex >= 0 && activeIndex < results.length) {
                  e.preventDefault()
                  const picked = results[activeIndex]
                  const baseWeight = picked.baseWeightGrams && picked.baseWeightGrams > 0 ? picked.baseWeightGrams : null
                  setBase({
                    weight: baseWeight,
                    protein: picked.protein,
                    carbs: picked.carbs,
                    fat: picked.fat,
                  })
                  setState((s) => ({
                    ...s,
                    name: `${picked.name}${picked.brand ? ` — ${picked.brand}` : ''}`,
                    protein: format1(picked.protein),
                    carbs: format1(picked.carbs),
                    fat: format1(picked.fat),
                    weight: baseWeight !== null ? format1(baseWeight) : s.weight,
                  }))
                  setIsOpen(false)
                  setActiveIndex(-1)
                }
              }}
              placeholder="Type to search… e.g., Chicken Biryani"
              className="h-11 w-full rounded-xl bg-zinc-950/40 border border-white/10 px-3 text-sm text-zinc-100 outline-none focus:border-purple-400/60 focus:ring-2 focus:ring-purple-400/20"
              aria-expanded={isOpen}
              aria-autocomplete="list"
            />
          </label>

          {isOpen ? (
            <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-white/10 bg-zinc-950/70 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.55)]">
              <div className="max-h-64 overflow-auto">
                {state.name.trim().length < 2 ? (
                  <div className="px-3 py-2 text-xs text-zinc-300/70">Type 2+ characters to search.</div>
                ) : isLoading ? (
                  <div className="px-3 py-2 text-xs text-zinc-300/70">Searching…</div>
                ) : results.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-zinc-300/70">No results.</div>
                ) : (
                  <ul className="p-1">
                    {results.map((r, idx) => {
                      const isActive = idx === activeIndex
                      return (
                        <li key={r.id}>
                          <button
                            type="button"
                            className={[
                              'w-full rounded-lg px-3 py-2 text-left',
                              isActive ? 'bg-white/10' : 'hover:bg-white/5',
                            ].join(' ')}
                            onMouseEnter={() => setActiveIndex(idx)}
                            onClick={() => {
                              const baseWeight = r.baseWeightGrams && r.baseWeightGrams > 0 ? r.baseWeightGrams : null
                              setBase({
                                weight: baseWeight,
                                protein: r.protein,
                                carbs: r.carbs,
                                fat: r.fat,
                              })
                              setState((s) => ({
                                ...s,
                                name: `${r.name}${r.brand ? ` — ${r.brand}` : ''}`,
                                protein: format1(r.protein),
                                carbs: format1(r.carbs),
                                fat: format1(r.fat),
                                weight: baseWeight !== null ? format1(baseWeight) : s.weight,
                              }))
                              setIsOpen(false)
                              setActiveIndex(-1)
                            }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="truncate text-sm font-medium text-zinc-100">
                                  {r.name}
                                  {r.brand ? <span className="text-zinc-300/70"> · {r.brand}</span> : null}
                                </div>
                                <div className="mt-0.5 text-xs text-zinc-300/70 tabular-nums">
                                  P {format1(r.protein)}g · C {format1(r.carbs)}g · F {format1(r.fat)}g
                                  {r.serving ? <span className="text-zinc-300/50"> · {r.serving}</span> : null}
                                </div>
                              </div>
                              <div className="shrink-0 text-xs text-zinc-300/60 tabular-nums">
                                {format1(r.protein * 4 + r.carbs * 4 + r.fat * 9)} kcal
                              </div>
                            </div>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-xs text-zinc-300/80">
            <input
              type="checkbox"
              className="h-3 w-3 rounded border border-white/20 bg-zinc-950/60"
              checked={weighMode}
              onChange={(e) => {
                const next = e.target.checked
                setWeighMode(next)
                if (!next) return

                setState((s) => {
                  const w = parseNonNegativeNumber(s.weight)
                  if (w === null || !base.weight || base.weight <= 0) return s
                  const factor = w / base.weight
                  return {
                    ...s,
                    protein: format1(base.protein * factor),
                    carbs: format1(base.carbs * factor),
                    fat: format1(base.fat * factor),
                  }
                })
              }}
            />
            <span>Weighing Machine Mode</span>
          </label>
          {base.weight ? (
            <div className="text-[11px] text-zinc-300/60 tabular-nums">
              Base serving: {format1(base.weight)} g
            </div>
          ) : null}
        </div>

        <label className="grid gap-1">
          <span className="text-xs text-zinc-300/70">Weight (g)</span>
          <input
            inputMode="decimal"
            type="number"
            min={0}
            step="any"
            value={state.weight}
            onChange={(e) => {
              const next = e.target.value
              setState((s) => {
                const updated: FormState = { ...s, weight: next }
                const w = parseNonNegativeNumber(next)
                if (!weighMode || w === null || !base.weight || base.weight <= 0) return updated
                const factor = w / base.weight
                return {
                  ...updated,
                  protein: format1(base.protein * factor),
                  carbs: format1(base.carbs * factor),
                  fat: format1(base.fat * factor),
                }
              })
            }}
            placeholder={base.weight ? format1(base.weight) : 'e.g., 150'}
            className="h-11 w-full rounded-xl bg-zinc-950/40 border border-white/10 px-3 text-sm text-zinc-100 outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/15"
          />
        </label>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="grid gap-1">
            <span className="text-xs text-zinc-300/70">Protein (g)</span>
            <input
              inputMode="numeric"
              type="number"
              min={0}
              step="any"
              value={state.protein}
              onChange={(e) => setState((s) => ({ ...s, protein: e.target.value }))}
              placeholder="0"
              className="h-11 w-full rounded-xl bg-zinc-950/40 border border-white/10 px-3 text-sm text-zinc-100 outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/15"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs text-zinc-300/70">Carbs (g)</span>
            <input
              inputMode="numeric"
              type="number"
              min={0}
              step="any"
              value={state.carbs}
              onChange={(e) => setState((s) => ({ ...s, carbs: e.target.value }))}
              placeholder="0"
              className="h-11 w-full rounded-xl bg-zinc-950/40 border border-white/10 px-3 text-sm text-zinc-100 outline-none focus:border-purple-400/60 focus:ring-2 focus:ring-purple-400/15"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs text-zinc-300/70">Fat (g)</span>
            <input
              inputMode="numeric"
              type="number"
              min={0}
              step="any"
              value={state.fat}
              onChange={(e) => setState((s) => ({ ...s, fat: e.target.value }))}
              placeholder="0"
              className="h-11 w-full rounded-xl bg-zinc-950/40 border border-white/10 px-3 text-sm text-zinc-100 outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/15"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="mt-1 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500/90 via-violet-500/85 to-emerald-500/80 px-4 text-sm font-semibold text-zinc-950 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4" />
          Add entry
        </button>
      </form>
    </div>
  )
}

