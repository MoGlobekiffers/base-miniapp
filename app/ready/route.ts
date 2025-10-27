export const dynamic = 'force-dynamic';
export const revalidate = 0;
// export const runtime = 'edge';

import { ok, preflight } from '../lib/health';

export async function GET() { return ok(); }
export async function HEAD() { return ok(); }
export async function OPTIONS() { return preflight(); }
