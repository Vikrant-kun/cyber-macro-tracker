export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function safeNumber(value: unknown, fallback = 0) {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : fallback
}

export function roundTo(value: number, digits = 0) {
  const p = 10 ** digits
  return Math.round(value * p) / p
}

