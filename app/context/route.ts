export const runtime = 'edge';
export const preferredRegion = ['iad1'];
export const revalidate = 0;

const payload = {
  user: { fid: 0 },                 // anonymisé tant que non authentifié
  location: { type: 'launcher' },   // lancé depuis le launcher par défaut
  client: {
    platformType: 'web',
    clientFid: 9152,                // FID de référence (ex. Farcaster)
    added: false
  },
  features: { haptics: false }
};

const headers = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,HEAD,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

export async function GET() {
  return new Response(JSON.stringify(payload), { status: 200, headers });
}
export async function HEAD() { return GET(); }
export async function OPTIONS() {
  return new Response(null, { status: 204, headers: { ...headers, 'Content-Type': undefined as any } });
}
