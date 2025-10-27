export const dynamic = 'force-dynamic';
export const revalidate = 0;
// export const runtime = 'edge';

import { corsHeaders } from '../lib/cors';

const payload = {
  ready: true,
  name: 'Base Miniapp',
  description: 'Miniapp de test avec endpoints healthz/ready',
  homepageUrl: 'https://base-miniapp-gamma.vercel.app',
  iconUrl: 'https://placehold.co/512x512/png',
  imageUrl: 'https://placehold.co/1200x630/png',
  endpoints: {
    ready: '/ready',
    healthz: '/api/healthz'
  }
};

export async function GET() {
  return new Response(JSON.stringify(payload), { status: 200, headers: corsHeaders() });
}
export async function HEAD() { return GET(); }
export async function OPTIONS() { return new Response(null, { status: 204, headers: corsHeaders({ Allow: 'GET,HEAD,OPTIONS' }) }); }
