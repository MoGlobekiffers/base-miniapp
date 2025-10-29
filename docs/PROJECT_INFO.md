# base-miniapp — Snapshot d'informations

Genere le: mer. 29 oct. 2025 06:47:21 CET

## A) Environnement local
- Node: v22.10.0
- NPM: 11.6.2
- Yarn: 1.22.22
- PNPM: N/A

## B) package.json (scripts et deps)
---- package.json ----
{
  "name": "base-miniapp",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --webpack",
    "build": "next build --webpack",
    "start": "next start",
    "lint": "eslint"
  },
  "dependencies": {
    "@coinbase/onchainkit": "^1.1.1",
    "@farcaster/miniapp-sdk": "^0.2.1",
    "@vercel/kv": "^1.0.1",
    "@vercel/og": "^0.8.5",
    "canvas-confetti": "^1.9.4",
    "next": "16.0.0",
    "react": "19.2.0",
    "react-dom": "19.2.0",
    "viem": "^2.38.4"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20.19.23",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.0.0",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}

## C) Next/Tailwind/TS config

---- next.config.js ----
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias['@react-native-async-storage/async-storage'] = require.resolve('./shims/empty.js');
    config.resolve.alias['pino-pretty'] = require.resolve('./shims/empty.js');
    return config;
  },
};
module.exports = nextConfig;

---- next.config.mjs ----
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/.well-known/farcaster.json',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, max-age=0' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Content-Type', value: 'application/json' }
        ],
      },
      {
        source: '/farcaster.json',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, max-age=0' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Content-Type', value: 'application/json' }
        ],
      },
      {
        source: '/.well-known/context.json',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, max-age=0' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Content-Type', value: 'application/json' }
        ],
      },
    ];
  },
};
export default nextConfig;

---- next.config.ts ----
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;

---- tsconfig.json ----
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts",
    "**/*.mts"
  ],
  "exclude": ["node_modules"]
}

## D) Arborescence (selection)

### Dossiers de routage
---- app/ ----
app
app/ready
app/ready/route.ts
app/favicon.ico
app/.DS_Store
app/context
app/context/route.ts
app/embed
app/embed/page.tsx
app/.well-known
app/.well-known/farcaster.json
app/providers
app/providers/ClientProviders.tsx
app/providers/ReadyClient.tsx
app/components
app/components/Wheel.tsx
app/layout.tsx
app/lib
app/lib/miniapp.ts
app/lib/net.ts
app/lib/health.ts
app/lib/cors.ts
app/api
app/api/ready
app/api/context
app/api/spin
app/api/healthz
app/api/og
app/healthz
app/healthz/ready
app/farcaster.json
app/farcaster.json/route.ts
app/farcaster.json/route.ts.bak
app/page.tsx
app/globals.css
app/layout.tsx.bak
---- pages/ ----

### Public/
public
public/icon-wheel-1024.png
public/file.svg
public/.well-known
public/.well-known/context.json
public/.well-known/farcaster.json
public/splash.png
public/splash-wheel-200.png
public/Image PNG.png
public/vercel.svg
public/context.json
public/next.svg
public/wheel-pointer.svg
public/preview-wheel.png
public/farcaster.json
public/globe.svg
public/window.svg

## E) Manifest Farcaster
---- farcaster.json ----
{
  "name": "Base Miniapp",
  "version": "1",
  "iconUrl": "https://placehold.co/1024x1024/png?bg=111111&text=ICON",
  "imageUrl": "https://placehold.co/1200x800/png?bg=111111&text=PREVIEW",
  "homeUrl": "https://base-miniapp-gamma.vercel.app/embed",
  "splashImageUrl": "https://placehold.co/200x200/png?bg=111111&text=BASE",
  "splashBackgroundColor": "#111111",
  "primaryCategory": "utility",
  "tags": ["demo","base","miniapp"],
  "publisher": "Your Name",
  "description": "Miniapp de test avec endpoints healthz/ready",
  "accountAssociation": {
    "header": "eyJmaWQiOjIxNzYyNiwidHlwZSI6ImF1dGgiLCJrZXkiOiIweDg5MDVCMjIzNjlBOUUzNWFFMTMwQmVhOTlEMjU4OENkYTU3MENBMTUifQ",
    "payload": "eyJkb21haW4iOiJiYXNlLW1pbmlhcHAtZ2FtbWEudmVyY2VsLmFwcCJ9",
    "signature": "3wc+sSUSIKVfjdfGO+VrZIlTxkdPoPWC9WshygEn0wJRJBOIYT7oxEKc6DPOIbab5IqAO4a7oHmQK0PkNqN0gBs="
  }
}

## F) Routes utiles (dev local)
- /wheel
- /embed
- /preview-wheel.png, /dailywheel.png, /wheel-pointer.svg
- /.well-known/farcaster.json

## G) Variables d'environnement attendues (NOMS seulement)
Renseigner ici les noms sans valeurs, ex: NEXT_PUBLIC_BASE_URL, BASE_API_KEY

## H) TODO / Decisions
- UI roue: image finale ou CSS segments
- Logique spin: aleatoire, seede, API
- 1 spin par jour par FID, stockage et anti-abus
- Webhook/Base events si besoin
