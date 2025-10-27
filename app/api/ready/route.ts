export const dynamic = 'force-dynamic';
export const revalidate = 0;
// export const runtime = 'edge';

type CheckResult = { name: string; ok: boolean; detail?: string };

async function withTimeout<T>(p: Promise<T>, ms: number, label = 'timeout'): Promise<T> {
  return Promise.race([
    p,
    new Promise<never>((_, rej) => setTimeout(() => rej(new Error(label)), ms)),
  ]);
}

async function checkRpc(): Promise<CheckResult> {
  const url = process.env.RPC_URL;
  if (!url) return { name: 'rpc', ok: false, detail: 'RPC_URL manquante' };
  try {
    const res = await withTimeout(fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'web3_clientVersion', params: [] }),
    }), 2500, `timeout(2500ms): ${url}`);

    if (!res.ok) return { name: 'rpc', ok: false, detail: `status ${res.status}` };
    // On n'analyse pas la réponse en profondeur : 200 suffit à valider la reachability
    return { name: 'rpc', ok: true };
  } catch (e: any) {
    return { name: 'rpc', ok: false, detail: e?.message ?? 'erreur' };
  }
}

async function checkExampleDb(): Promise<CheckResult> {
  if (!process.env.DB_URL) return { name: 'db', ok: true };
  await withTimeout(Promise.resolve(true), 500);
  return { name: 'db', ok: true };
}

export async function GET() {
  const started = Date.now();
  const checks = await Promise.all([checkRpc(), checkExampleDb()]);
  const ok = checks.every(c => c.ok);
  return new Response(JSON.stringify({
    ready: ok,
    status: ok ? 'ready' : 'not-ready',
    duration_ms: Date.now() - started,
    checks,
  }), {
    status: ok ? 200 : 503,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

export async function HEAD() { return GET(); }
export async function OPTIONS() {
  return new Response(null, { status: 204, headers: { Allow: 'GET,HEAD,OPTIONS' } });
}
