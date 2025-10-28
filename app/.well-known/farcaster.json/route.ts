export const runtime = 'edge';
export const preferredRegion = ['iad1'];

const json = {
  name: 'DailyWheel',
  version: '1',
  iconUrl: process.env.ICON_URL!,
  imageUrl: process.env.HERO_URL!,
  homeUrl: process.env.DOMAIN! + '/embed',
  splashImageUrl: process.env.SPLASH_URL!,
  splashBackgroundColor: '#111111',
  primaryCategory: 'utility',
  tags: ['daily','wheel','base'],
  publisher: 'Globekiffers',
  description: 'Spin the wheel once a day on Base.',
};

export async function GET() {
  const body = JSON.stringify(json);
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
