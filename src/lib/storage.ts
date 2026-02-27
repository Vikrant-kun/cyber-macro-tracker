import type { DayState, FoodEntry, MacroGoals } from '../types'
import { safeNumber } from './numbers'

const STORAGE_KEY_V2 = 'macroTracker.v2'
const STORAGE_KEY_V1 = 'macroTracker.v1'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

type StorageV2 = {
  version: 2
  days: Record<string, DayState>
}

function coerceGoals(value: unknown): MacroGoals | null {
  if (!isRecord(value)) return null
  const calories = safeNumber(value.calories, NaN)
  const protein = safeNumber(value.protein, NaN)
  const carbs = safeNumber(value.carbs, NaN)
  const fat = safeNumber(value.fat, NaN)

  if (![calories, protein, carbs, fat].every((n) => Number.isFinite(n) && n >= 0)) return null
  return { calories, protein, carbs, fat }
}

function coerceEntry(value: unknown): FoodEntry | null {
  if (!isRecord(value)) return null
  const id = typeof value.id === 'string' ? value.id : null
  const name = typeof value.name === 'string' ? value.name : null
  const createdAt = safeNumber(value.createdAt, NaN)
  const protein = safeNumber(value.protein, NaN)
  const carbs = safeNumber(value.carbs, NaN)
  const fat = safeNumber(value.fat, NaN)

  if (!id || !name) return null
  if (![createdAt, protein, carbs, fat].every((n) => Number.isFinite(n) && n >= 0)) return null
  return { id, name, createdAt, protein, carbs, fat }
}

export function createDefaultDayState(dateKey: string): DayState {
  return {
    dateKey,
    goals: { calories: 2000, protein: 150, carbs: 250, fat: 70 },
    entries: [],
  }
}

function coerceDayState(value: unknown, expectedDateKey?: string): DayState | null {
  if (!isRecord(value)) return null
  const dateKey = typeof value.dateKey === 'string' ? value.dateKey : null
  if (!dateKey) return null
  if (expectedDateKey && dateKey !== expectedDateKey) return null

  const goals = coerceGoals(value.goals) ?? createDefaultDayState(dateKey).goals
  const entriesRaw = Array.isArray(value.entries) ? value.entries : []
  const entries = entriesRaw.map(coerceEntry).filter((e): e is FoodEntry => Boolean(e))
  return { dateKey, goals, entries }
}

function loadStorageV2(): StorageV2 | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_V2)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed)) return null
    if (parsed.version !== 2) return null
    if (!isRecord(parsed.days)) return null

    const days: Record<string, DayState> = {}
    for (const [k, v] of Object.entries(parsed.days)) {
      const day = coerceDayState(v, k)
      if (day) days[k] = day
    }

    return { version: 2, days }
  } catch {
    return null
  }
}

function saveStorageV2(storage: StorageV2) {
  try {
    localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(storage))
  } catch {
    // ignore storage failures (private mode, quota, etc.)
  }
}

function loadLegacyV1(todayKey: string): DayState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_V1)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return coerceDayState(parsed, todayKey)
  } catch {
    return null
  }
}

export function loadDayState(todayKey: string): DayState | null {
  const v2 = loadStorageV2()
  if (v2?.days?.[todayKey]) return v2.days[todayKey]

  const legacy = loadLegacyV1(todayKey)
  if (legacy) {
    const next: StorageV2 = { version: 2, days: { [todayKey]: legacy } }
    saveStorageV2(next)
    return legacy
  }

  return null
}

export function saveDayState(state: DayState) {
  const v2 = loadStorageV2() ?? { version: 2, days: {} }
  v2.days[state.dateKey] = state
  saveStorageV2(v2)
}

export function listHistorySummaries(options?: { includeToday?: boolean; todayKey?: string }) {
  const v2 = loadStorageV2()
  const days = v2?.days ?? {}
  const todayKey = options?.todayKey
  const includeToday = options?.includeToday ?? false

  const keys = Object.keys(days)
    .filter((k) => (includeToday ? true : todayKey ? k !== todayKey : true))
    .sort((a, b) => b.localeCompare(a))

  return keys.map((dateKey) => {
    const day = days[dateKey]
    const protein = day.entries.reduce((acc, e) => acc + e.protein, 0)
    const carbs = day.entries.reduce((acc, e) => acc + e.carbs, 0)
    const fat = day.entries.reduce((acc, e) => acc + e.fat, 0)
    const calories = protein * 4 + carbs * 4 + fat * 9
    return { dateKey, protein, carbs, fat, calories, entryCount: day.entries.length }
  })
}

