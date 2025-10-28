export const runtime = 'edge';
export const preferredRegion = ['iad1'];
export const revalidate = 0;

const body = JSON.stringify({
  user: { fid: 0 },
  location: { type: 'launcher' },
  client: { platformType: 'web', clientFid: 9152, added: false },
  features: { haptics: false }
});

const baseHeaders = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,HEAD,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

export async function GET() {
  return new Response(body, { status: 200, headers: baseHeaders });
}
export async function HEAD() { return GET(); }
export async function OPTIONS() {
  const h = { ...baseHeaders }; delete (h as any)['Content-Type'];
  return new Response(null, { status: 204, headers: h });
}
