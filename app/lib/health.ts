// app/lib/health.ts
export function ok() {
  return new Response(
    JSON.stringify({ ready: true, status: 'ready' }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}
