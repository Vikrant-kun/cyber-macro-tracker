export type FatSecretFood = {
  id: string
  name: string
  brand?: string
  serving?: string
  protein: number
  carbs: number
  fat: number
  calories?: number
  baseWeightGrams?: number
}

export async function searchFatSecret(query: string): Promise<FatSecretFood[]> {
  const q = query.trim()
  if (q.length < 2) return []

  const res = await fetch(`/api/fatsecret/search?query=${encodeURIComponent(q)}`)
  if (!res.ok) return []

  const data: unknown = await res.json()
  return Array.isArray(data) ? (data as FatSecretFood[]) : []
}

