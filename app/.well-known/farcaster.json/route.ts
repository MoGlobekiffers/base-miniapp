export const runtime = 'edge';
export const preferredRegion = ['iad1'];

const ORIGIN = 'https://base-miniapp-gamma.vercel.app';

export async function GET() {
  const body = {
    // ---- account association (root) ----
    accountAssociation: {
      header: "eyJmaWQiOjIxNzYyNiwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweDZjNjA3NDRENjlmOTI2YzRiODhEMzBmMzU5QzgxM2IzREU3YzRCNjgifQ",
      payload: "eyJkb21haW4iOiJiYXNlLW1pbmlhcHAtZ2FtbWEudmVyY2VsLmFwcCJ9",
      signature: "JNgA4IsSYwoOkRKvFILtxQv3I6jamuHDGQFy6u+K3uEbSuQiO8hD5Q+ZveuZRzO6wU4TUZ4WjpqV2gB+KywtXBw="
    },

    // ---- miniapp metadata (what Base Build reads) ----
    miniapp: {
      version: "1",
      name: "DailyWheel",
      iconUrl: `${ORIGIN}/icon-wheel-1024.png`,
      homeUrl: `${ORIGIN}/embed`,
      imageUrl: `${ORIGIN}/preview-wheel.png`,
      splashImageUrl: `${ORIGIN}/splash-wheel-200.png`,
      splashBackgroundColor: "#111111",
      description: "Spin the wheel once a day on Base.",
      requiredChains: ["eip155:8453"],
      tags: ["daily","wheel","base"],
      subtitle: "Mini app roulette",
      primaryCategory: "utility"
    }
  };

  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
