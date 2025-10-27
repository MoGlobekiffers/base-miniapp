// app/api/ready/route.ts
export const dynamic = 'force-dynamic';
export const revalidate = 0;
// export const runtime = 'edge';

import { ok } from '../../lib/health';

export async function GET() { return ok(); }
export async function HEAD() { return ok(); }
export async function OPTIONS() {
  return new Response(null, { status: 204, headers: { Allow: 'GET,HEAD,OPTIONS' } });
}
