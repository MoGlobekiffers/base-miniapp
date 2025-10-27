export const dynamic = 'force-dynamic';
export const revalidate = 0;
// export const runtime = 'edge';

import { corsHeaders } from '../../lib/cors';

export async function GET() {
  const res = await fetch(new URL('/context', process.env.NEXT_PUBLIC_BASE_URL ?? 'https://base-miniapp-gamma.vercel.app'), { cache: 'no-store' });
  const json = await res.json().catch(() => ({}));
  return new Response(JSON.stringify(json), { status: 200, headers: corsHeaders() });
}
export async function HEAD() { return GET(); }
export async function OPTIONS() { return new Response(null, { status: 204, headers: corsHeaders({ Allow: 'GET,HEAD,OPTIONS' }) }); }
