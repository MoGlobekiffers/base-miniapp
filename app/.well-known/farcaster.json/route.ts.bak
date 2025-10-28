export const runtime = 'edge';
export const preferredRegion = ['iad1'];
export const revalidate = 0;

const ORIGIN = 'https://base-miniapp-gamma.vercel.app';

const ICON   = `${ORIGIN}/icon-wheel-1024.png`;   // 1024x1024 PNG
const HERO   = `${ORIGIN}/preview-wheel.png`;     // 1200x800 PNG (3:2)
const SPLASH = `${ORIGIN}/splash-wheel-200.png`;  // 200x200 PNG

const body = JSON.stringify({
  name: 'DailyWheel',
  version: '1',
  iconUrl: ICON,
  imageUrl: HERO,
  homeUrl: `${ORIGIN}/embed`,
  splashImageUrl: SPLASH,
  splashBackgroundColor: '#111111',
  primaryCategory: 'utility',
  tags: ['daily', 'wheel', 'base'],
  publisher: 'Globekiffers',
  description: 'Spin the wheel once a day on Base.',
  accountAssociation: {
    header: 'eyJmaWQiOjIxNzYyNiwidHlwZSI6ImF1dGgiLCJrZXkiOiIweDg5MDVCMjIzNjlBOUUzNWFFMTMwQmVhOTlEMjU4OENkYTU3MENBMTUifQ',
    payload: 'eyJkb21haW4iOiJiYXNlLW1pbmlhcHAtZ2FtbWEudmVyY2VsLmFwcCJ9',
    signature: '3wc+sSUSIKVfjdfGO+VrZIlTxkdPoPWC9WshygEn0wJRJBOIYT7oxEKc6DPOIbab5IqAO4a7oHmQK0PkNqN0gBs='
  }
});

const headers = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Access-Control-Allow-Origin': '*'
};

export async function GET() {
  return new Response(body, { status: 200, headers });
}
