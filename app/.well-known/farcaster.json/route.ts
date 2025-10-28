export const runtime = 'edge';
export const preferredRegion = ['iad1'];

export async function GET() {
  const body = {
    accountAssociation: {
      header: 'eyJmaWQiOjIxNzYyNiwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweDZjNjA3NDRENjlmOTI2YzRiODhEMzBmMzU5QzgxM2IzREU3YzRCNjgifQ',
      payload: 'eyJkb21haW4iOiJiYXNlLW1pbmlhcHAtZ2FtbWEudmVyY2VsLmFwcCJ9',
      signature: 'JNgA4IsSYwoOkRKvFILtxQv3I6jamuHDGQFy6u+K3uEbSuQiO8hD5Q+ZveuZRzO6wU4TUZ4WjpqV2gB+KywtXBw='
    },
    miniapp: {
      version: '1',
      name: 'DailyWheel',
      iconUrl: 'https://base-miniapp-gamma.vercel.app/icon-wheel-1024.png',
      imageUrl: 'https://base-miniapp-gamma.vercel.app/preview-wheel.png',
      splashImageUrl: 'https://base-miniapp-gamma.vercel.app/splash-wheel-200.png',
      splashBackgroundColor: '#111111',
      description: 'Spin the wheel once a day on Base.',
      requiredChains: ['eip155:8453'],
      tags: ['daily','wheel','base'],
      subtitle: 'Mini app roulette',
      primaryCategory: 'utility',
      homeUrl: 'https://base-miniapp-gamma.vercel.app/embed'
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
