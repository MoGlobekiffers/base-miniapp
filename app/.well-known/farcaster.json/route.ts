export const runtime = 'edge'
export const preferredRegion = ['iad1']

const json = {
  name: 'DailyWheel',
  version: '1',
  iconUrl: 'https://base-miniapp-gamma.vercel.app/icon-wheel-1024.png',
  imageUrl: 'https://base-miniapp-gamma.vercel.app/preview-wheel.png',
  homeUrl: 'https://base-miniapp-gamma.vercel.app/embed',
  splashImageUrl: 'https://base-miniapp-gamma.vercel.app/splash-wheel-200.png',
  splashBackgroundColor: '#111111',
  primaryCategory: 'utility',
  tags: ['daily','wheel','base'],
  publisher: 'Globekiffers',
  description: 'Spin the wheel once a day on Base.'
}

export async function GET() {
  return new Response(JSON.stringify(json), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Access-Control-Allow-Origin': '*'
    }
  })
}
