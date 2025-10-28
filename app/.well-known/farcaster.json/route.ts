export const runtime = 'edge';
export const preferredRegion = ['iad1'];

export async function GET() {
  const body = {
    name: "DailyWheel",
    version: "1",
    iconUrl: "https://base-miniapp-gamma.vercel.app/icon-wheel-1024.png",
    imageUrl: "https://base-miniapp-gamma.vercel.app/preview-wheel.png",
    homeUrl: "https://base-miniapp-gamma.vercel.app/embed",
    splashImageUrl: "https://base-miniapp-gamma.vercel.app/splash-wheel-200.png",
    splashBackgroundColor: "#111111",
    primaryCategory: "utility",
    tags: ["daily", "wheel", "base"],
    publisher: "Globekiffers",
    description: "Spin the wheel once a day on Base.",
    accountAssociation: {
      header: "eyJmaWQiOjIxNzYyNiwidHlwZSI6ImF1dGgiLCJrZXkiOiIweDg5MDVCMjIzNjlBOUUzNWFFMTMwQmVhOTlEMjU4OENkYTU3MENBMTUifQ",
      payload: "eyJkb21haW4iOiJiYXNlLW1pbmlhcHAtZ2FtbWEudmVyY2VsLmFwcCJ9",
      signature: "3wc+sSUSIKVfjdfGO+VrZIlTxkdPoPWC9WshygEn0wJRJBOIYT7oxEKc6DPOIbab5IqAO4a7oHmQK0PkNqN0gBs="
    }
  };

  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      // pas de cache pour que Base Build voie toujours la dernière version
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
