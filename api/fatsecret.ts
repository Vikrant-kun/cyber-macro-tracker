import type { VercelRequest, VercelResponse } from '@vercel/node'

type TokenResponse = {
  access_token: string
  token_type: string
  expires_in: number
}

type FatSecretSearchFood = {
  food_id: string | number
  food_name?: string
  brand_name?: string
  food_description?: string
}

function toNumber(v: unknown, fallback = 0) {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : fallback
}

function asArray<T>(v: T | T[] | undefined | null): T[] {
  if (!v) return []
  return Array.isArray(v) ? v : [v]
}

function parseMacrosFromDescription(desc: string | undefined) {
  const d = (desc ?? '').toString()
  const calories = toNumber(d.match(/Calories:\s*([\d.]+)\s*kcal/i)?.[1], 0)
  const fat = toNumber(d.match(/Fat:\s*([\d.]+)\s*g/i)?.[1], 0)
  const carbs = toNumber(d.match(/Carbs:\s*([\d.]+)\s*g/i)?.[1], 0)
  const protein = toNumber(d.match(/Protein:\s*([\d.]+)\s*g/i)?.[1], 0)

  const serving = d.includes('-') ? d.split('-')[0]?.trim() : undefined
  const weightMatch = d.match(/Per\s*([\d.]+)\s*(g|gram|grams)\b/i)
  const baseWeightGrams = weightMatch ? toNumber(weightMatch[1], 0) : 0

  return { calories, fat, carbs, protein, serving, baseWeightGrams }
}

async function getAccessToken(): Promise<string> {
  const clientId = process.env.FATSECRET_CLIENT_ID
  const clientSecret = process.env.FATSECRET_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('Missing FATSECRET_CLIENT_ID or FATSECRET_CLIENT_SECRET')
  }

  const body = new URLSearchParams()
  body.set('grant_type', 'client_credentials')
  body.set('scope', 'basic')

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  const resp = await fetch('https://oauth.fatsecret.com/connect/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })

  if (!resp.ok) {
    const text = await resp.text().catch(() => '')
    throw new Error(`FatSecret token request failed (${resp.status}): ${text}`)
  }

  const json = (await resp.json()) as TokenResponse
  return json.access_token
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const q = (req.query.query || req.query.q || '').toString().trim()
  if (q.length < 2) {
    res.status(200).json([])
    return
  }

  try {
    const token = await getAccessToken()
    const maxResults = 12

    const body = new URLSearchParams()
    body.set('method', 'foods.search')
    body.set('search_expression', q)
    body.set('format', 'json')
    body.set('max_results', String(maxResults))
    body.set('page_number', '0')

    const resp = await fetch('https://platform.fatsecret.com/rest/server.api', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    })

    if (!resp.ok) {
      const text = await resp.text().catch(() => '')
      res.status(resp.status).json({ error: text || 'FatSecret search failed' })
      return
    }

    const data: any = await resp.json()
    const foodsRaw = data?.foods?.food
    const foods = asArray<FatSecretSearchFood>(foodsRaw)

    const mapped = foods
      .map((f) => {
        const parsed = parseMacrosFromDescription(f.food_description)
        return {
          id: String(f.food_id),
          name: String(f.food_name ?? ''),
          brand: f.brand_name ? String(f.brand_name) : undefined,
          serving: parsed.serving,
          protein: parsed.protein,
          carbs: parsed.carbs,
          fat: parsed.fat,
          calories: parsed.calories,
          baseWeightGrams: parsed.baseWeightGrams > 0 ? parsed.baseWeightGrams : undefined,
        }
      })
      .filter((x) => x.name.length > 0)

    res.setHeader('Cache-Control', 'no-store')
    res.status(200).json(mapped)
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'FatSecret proxy error' })
  }
}

