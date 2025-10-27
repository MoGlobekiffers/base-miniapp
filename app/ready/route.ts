export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  return Response.json({ ready: true, status: "ready" }, { status: 200 });
}
