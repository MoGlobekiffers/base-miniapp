export const runtime = 'edge';
import { kv } from '@vercel/kv';
const TASKS = [
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
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const dayKey = d => d.toISOString().slice(0, 10);
export async function POST(req) {
  try {
    const { fid } = await req.json();
    if (!fid || typeof fid !== 'number') return Response.json({ error: 'missing fid' }, { status: 400 });
    const today = dayKey(new Date());
    const key = `spin:${fid}:${today}`;
    const existing = await kv.get(key);
    if (existing) {
      const nextSpinAt = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate() + 1, 0, 0, 0)).toISOString();
      return Response.json({ task: existing, already: true, nextSpinAt }, { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
    }
    const task = pick(TASKS);
    const now = new Date();
    const expires = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0);
    const ttlSeconds = Math.max(1, Math.floor((expires - now.getTime()) / 1000));
    await kv.set(key, task, { ex: ttlSeconds });
    const nextSpinAt = new Date(expires).toISOString();
    return Response.json({ task, nextSpinAt }, { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ error: 'server_error' }, { status: 500 });
  }
}
