/** @type {import('next').NextConfig} */
import path from 'path';
import { fileURLToPath } from 'url';

// Nécessaire pour __dirname dans un module ES (.mjs)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig = {
  // 1. Configuration Webpack (fusionnée depuis next.config.js)
  // Cela résout les problèmes de dépendances manquantes pour certaines libs
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@react-native-async-storage/async-storage': path.resolve(__dirname, './shims/empty.js'),
      'pino-pretty': path.resolve(__dirname, './shims/empty.js'),
    };
    return config;
  },

  // 2. Headers pour Farcaster (fusionnés depuis votre version précédente)
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
