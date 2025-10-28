export const runtime = 'edge'
export const preferredRegion = ['iad1']

export async function GET() {
  return new Response(JSON.stringify({ ready: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
