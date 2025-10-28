export function withTimeout<T>(p: Promise<T>, ms: number, label = 'timeout'): Promise<T> {
  return Promise.race([
    p,
    new Promise<never>((_, rej) => setTimeout(() => rej(new Error(label)), ms)),
  ]);
}

export async function head(url: string, ms = 2500): Promise<Response> {
  return withTimeout(fetch(url, { method: 'HEAD', cache: 'no-store' }), ms, `timeout(${ms}ms): ${url}`);
}
