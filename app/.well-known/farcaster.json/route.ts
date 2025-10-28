export const runtime = 'edge';
export const preferredRegion = ['iad1'];

const ORIGIN = 'https://base-miniapp-gamma.vercel.app';

export async function GET() {
  const body = {
    name: 'DailyWheel',
    version: '1',
    iconUrl: `${ORIGIN}/icon-wheel-1024.png`,
    imageUrl: `${ORIGIN}/preview-wheel.png`,
    homeUrl: `${ORIGIN}/embed`,
    splashImageUrl: `${ORIGIN}/splash-wheel-200.png`,
    splashBackgroundColor: '#111111',
    primaryCategory: 'utility',
    tags: ['daily', 'wheel', 'base'],
    publisher: 'Globekiffers',
    description: 'Spin the wheel once a day on Base.',
    accountAssociation: {
      header: 'eyJmaWQiOjIxNzYyNiwidHlwZSI6ImF1dGgiLCJrZXkiOiIweDg5MDVCMjIzNjlBOUUzNWFFMTMwQmVhOTlEMjU4OENkYTU3MENBMTUifQ',
      payload: 'eyJkb21haW4iOiJiYXNlLW1pbmlhcHAtZ2FtbWEudmVyY2VsLmFwcCJ9',
      signature: '3wc+sSUSIKVfjdfGO+VrZIlTxkdPoPWC9WshygEn0wJRJBOIYT7oxEKc6DPOIbab5IqAO4a7oHmQK0PkNqN0gBs='
    },
  };

  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Access-Control-Allow-Origin': '*',
  };

  return new Response(JSON.stringify(body), { status: 200, headers });
}
