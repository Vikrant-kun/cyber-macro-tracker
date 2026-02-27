import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

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
  baseWeightGrams?: number
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

function createFatSecretProxyPlugin(env: Record<string, string>): Plugin {
  const clientId = env.FATSECRET_CLIENT_ID
  const clientSecret = env.FATSECRET_CLIENT_SECRET
  const scope = 'basic'
  const maxResults = Math.min(Math.max(Number(env.FATSECRET_MAX_RESULTS || '12') || 12, 1), 50)

  let cachedToken: { token: string; expiresAtMs: number } | null = null

  async function getAccessToken() {
    if (!clientId || !clientSecret) {
      throw new Error('Missing FATSECRET_CLIENT_ID or FATSECRET_CLIENT_SECRET')
    }

    const now = Date.now()
    if (cachedToken && now < cachedToken.expiresAtMs - 60_000) return cachedToken.token

    const body = new URLSearchParams()
    body.set('grant_type', 'client_credentials')
    body.set('scope', scope)

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
    const expiresAtMs = Date.now() + (json.expires_in ?? 0) * 1000
    cachedToken = { token: json.access_token, expiresAtMs }
    return json.access_token
  }

  async function searchFoodsBasic(query: string) {
    const token = await getAccessToken()
    const body = new URLSearchParams()
    body.set('method', 'foods.search')
    body.set('search_expression', query)
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
      throw new Error(`FatSecret search failed (${resp.status}): ${text}`)
    }

    const data: any = await resp.json()
    // Let the user see the full API payload/errors in the terminal.
    console.log('FatSecret Response:', JSON.stringify(data, null, 2))

    const foodsRaw = data?.foods?.food
    const foods = asArray<FatSecretSearchFood>(foodsRaw)

    return foods
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
  }

  async function handleSearch(req: any, res: any) {
    try {
      const url = new URL(req.url, 'http://localhost')
      const q = (url.searchParams.get('query') || url.searchParams.get('q') || '').trim()

      if (req.method !== 'GET') {
        res.statusCode = 405
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: 'Method not allowed' }))
        return
      }

      if (q.length < 2) {
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify([]))
        return
      }

      const out = await searchFoodsBasic(q)
      res.statusCode = 200
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Cache-Control', 'no-store')
      res.end(JSON.stringify(out))
    } catch (e: any) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Cache-Control', 'no-store')
      res.end(JSON.stringify({ error: e?.message || 'FatSecret proxy error' }))
    }
  }

  return {
    name: 'fatsecret-proxy',
    configureServer(server) {
      server.middlewares.use('/api/fatsecret/search', (req, res) => {
        void handleSearch(req, res)
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/fatsecret/search', (req, res) => {
        void handleSearch(req, res)
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss(), createFatSecretProxyPlugin(env)],
  }
})
