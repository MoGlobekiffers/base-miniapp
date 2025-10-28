export const runtime = 'edge';
import { kv } from '@vercel/kv';

type Task = { id: string; label: string; url: string };

const TASKS: Task[] = [
  { id: 'try-miniapp', label: 'Try a Mini App', url: 'https://warpcast.com/~/developers/mini-apps' },
  { id: 'post-cast', label: 'Post a cast', url: 'https://warpcast.com/compose' },
  { id: 'collect-nft', label: 'Collect a NFT', url: 'https://zora.co' },
  { id: 'swap-5', label: 'Swap $5', url: 'https://baseswap.fi' },
  { id: 'bridge-10-usdc', label: 'Bridge 10 USDC', url: 'https://bridge.base.org' },
  { id: 'contribute-repo', label: 'Contribute repo', url: 'https://github.com/base-org' },
  { id: 'daily-log', label: 'Daily log', url: 'https://warpcast.com/compose' },
  { id: 'onboard-friend', label: 'Onboard a friend', url: 'https://smartwallet.coinbase.com' },
  { id: 'write-guide', label: 'Write miniapp-guide', url: 'https://docs.base.org' },
  { id: 'explore-dapp', label: 'Explore one dapp', url: 'https://base.org/ecosystem' },
  { id: 'try-lf', label: 'Try LF', url: 'https://www.lf.xyz' },
  { id: 'quest', label: 'Quest', url: 'https://guild.xyz' }
];

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const dayKey = (d: Date) => d.toISOString().slice(0, 10);

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { fid?: number };
    const fid = body?.fid;
    if (!fid || typeof fid !== 'number') {
      return Response.json({ error: 'missing fid' }, { status: 400 });
    }

    const today = dayKey(new Date());
    const key = `spin:${fid}:${today}`;
    const cached = await kv.get<Task>(key);
    if (cached) {
      const next = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate() + 1, 0, 0, 0)).toISOString();
      return Response.json({ task: cached, already: true, nextSpinAt: next }, { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
    }

    const task = pick<Task>(TASKS);
    const now = new Date();
    const midnightUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0);
    const ttl = Math.max(1, Math.floor((midnightUTC - now.getTime()) / 1000));
    await kv.set(key, task, { ex: ttl });
    const next = new Date(midnightUTC).toISOString();

    return Response.json({ task, nextSpinAt: next }, { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ error: 'server_error' }, { status: 500 });
  }
}
