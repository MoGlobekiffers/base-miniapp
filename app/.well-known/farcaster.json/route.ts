export const runtime = 'edge';
export const preferredRegion = ['iad1'];

const ORIGIN = 'https://base-miniapp-gamma.vercel.app';

export async function GET() {
  const body = JSON.stringify({
    name: "DailyWheel",
    version: "1",
    iconUrl: `${ORIGIN}/icon-wheel-1024.png`,
    imageUrl: `${ORIGIN}/preview-wheel.png`,
    homeUrl: `${ORIGIN}/embed`,
    splashImageUrl: `${ORIGIN}/splash-wheel-200.png`,
    splashBackgroundColor: "#111111",
    primaryCategory: "utility",
    tags: ["daily", "wheel", "base"],
    publisher: "Globekiffers",
    description: "Spin the wheel once a day on Base.",
    accountAssociation: {
      header: "eyJmaWQiOiJxNzYyNiwidHlwZSI6ImF1dGgiLCJrZXkiOiIweDg5MDVCMjIzNjlBOUUzNWFFMTMwQmVhOTlEMjU4OENkYTU3MENBMTUiFQ",
      payload: "eyJkb21haW4iOiJiYXNlLW1pbmlhcHAtZ2FtbWEudmVyY2VsLmFwcCJ9",
      signature: "3wc+sSUSIKVfjdFG0+VrZIITxkdPoPWC9WshygEn0wJRJBOlYT7oxEKc6DPOIbb5IqAO4a7oHmQK0PKNqN0gBs="
    }
  });

  return new Response(body, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

