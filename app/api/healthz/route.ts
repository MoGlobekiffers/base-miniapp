export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  return Response.json({ ok: true, status: "healthy" }, { status: 200 });
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: { 'Allow': 'GET,HEAD,OPTIONS' } });
}

export async function HEAD() {
  return new Response(null, { status: 200 });
}
