export const runtime = 'edge';
export const preferredRegion = ['iad1'];
export const revalidate = 0;

import { ok, preflight } from '../../lib/health';
export async function GET() { return ok(); }
export async function HEAD() { return ok(); }
export async function OPTIONS() { return preflight(); }
