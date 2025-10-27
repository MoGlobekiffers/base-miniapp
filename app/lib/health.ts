function corsHeaders(extra: Record<string,string> = {}) {
  return {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,HEAD,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    ...extra,
  };
}

export function ok() {
  return new Response(JSON.stringify({ ready: true, status: 'ready' }), {
    status: 200,
    headers: corsHeaders(),
  });
}

export function preflight() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders({ Allow: 'GET,HEAD,OPTIONS' }),
  });
}
