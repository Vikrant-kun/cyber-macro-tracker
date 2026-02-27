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
  const endpoints = ['/api/fatsecret', '/api/fatsecret/search']

  for (const base of endpoints) {
    try {
      const res = await fetch(`${base}?query=${encodeURIComponent(q)}`)
      if (!res.ok) continue

      const data: any = await res.json()
      // eslint-disable-next-line no-console
      console.log('Search Data:', data)

      let rawFoods: any[] = []
      if (data?.foods?.food) {
        rawFoods = Array.isArray(data.foods.food) ? data.foods.food : [data.foods.food]
      } else if (Array.isArray(data)) {
        rawFoods = data
      } else if (data?.foods) {
        rawFoods = Array.isArray(data.foods) ? data.foods : [data.foods]
      }

      if (!rawFoods.length) continue

      return rawFoods.map((f: any) => ({
        id: f.food_id || f.id,
        name: f.food_name || f.name,
        brand: f.brand_name || f.brand,
        serving: f.food_description || f.serving,
        protein: parseFloat(f.protein ?? f.protein_grams) || 0,
        carbs: parseFloat(f.carbs ?? f.carbohydrate ?? f.carbohydrate_grams) || 0,
        fat: parseFloat(f.fat ?? f.fat_grams) || 0,
        calories: parseFloat(f.calories) || 0,
        baseWeightGrams: f.baseWeightGrams,
      }))
    } catch {
      // try the next endpoint
    }
  }

  return []
}