export const runtime = 'edge';
export async function GET() {
  return new Response(JSON.stringify({ ready: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}
