export const runtime = 'edge';
export const preferredRegion = ['iad1'];
export const revalidate = 0;

import { corsHeaders } from '../../lib/cors';

const payload = {
  ready: true,
  name: 'Base Miniapp',
  description: 'Miniapp de test',
  homepageUrl: 'https://base-miniapp-gamma.vercel.app',
  iconUrl: 'https://placehold.co/512x512/png',
  imageUrl: 'https://placehold.co/1200x630/png'
};

export async function GET() {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: corsHeaders(),
  });
}
export async function HEAD() { return GET(); }
export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders({ Allow: 'GET,HEAD,OPTIONS' }) });
}
