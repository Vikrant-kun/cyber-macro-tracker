# Neon Macro Tracker

High-end, responsive daily macro + calorie tracker with a cyberpunk dark UI (purple/green neon), plus FatSecret-powered quick search and a shareable “Cyber-HUD” snapshot.

## Tech stack

- React + Vite + TypeScript
- Tailwind CSS v4 (via `@tailwindcss/vite`)
- `lucide-react` icons
- LocalStorage persistence (+ History)
- FatSecret OAuth2 via **Vite proxy**

## Run locally

```bash
cd macro-tracker
npm install --cache ./.npm-cache
npm run dev
```

## Core technical achievements

### 1) Secure FatSecret OAuth2 integration (no secrets in the browser)

FatSecret OAuth2 uses the **client credentials** flow and explicitly requires requesting tokens through a **proxy/server**.

This project implements that proxy inside Vite itself:

- **Token endpoint**: `https://oauth.fatsecret.com/connect/token` (Basic Auth with your Client ID/Secret)
- **Food search** (Free tier / basic): `POST https://platform.fatsecret.com/rest/server.api` with `method=foods.search`
- **UI search function**: `src/lib/fatsecret.ts` → `searchFatSecret(query)` calls `GET /api/fatsecret/search?query=...`
- **Proxy implementation**: `vite.config.ts` registers the `/api/fatsecret/search` middleware and attaches the Bearer token server-side

Because the browser only calls your local `/api/...` route, your **Client Secret never ships to the frontend bundle**.

### 2) LocalStorage persistence + multi-day History

- Current day and previous days are stored locally under `macroTracker.v2`
- A History page shows totals for previous days without needing a backend

### 3) “Cyber-HUD” share image export

- The Dashboard has a **Share** button that exports a PNG of the HUD panel (great for social posts)

## FatSecret setup

Create `.env.local` (not committed) based on `.env.example`:

```bash
cp .env.example .env.local
```

Fill in:

- `FATSECRET_CLIENT_ID`
- `FATSECRET_CLIENT_SECRET`

Then restart `npm run dev`.

## Notes

- Calories are computed as `4P + 4C + 9F`.

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
