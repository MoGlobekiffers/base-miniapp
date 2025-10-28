'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Wheel from './components/Wheel';

type SpinResp = { task: { id: string; label: string; url: string }; nextSpinAt: string };

const TASKS = [
  { id: 'daily-log', label: 'Daily log', url: 'https://warpcast.com/compose', color: '#fde047' },
  { id: 'contrib', label: 'Contribute repo', url: 'https://github.com/MoGlobekiffers/base-miniapp', color: '#86efac' },
  { id: 'follow', label: 'Follow Base', url: 'https://warpcast.com/base', color: '#93c5fd' },
  { id: 'like', label: 'Like a cast', url: 'https://warpcast.com/', color: '#fca5a5' },
  { id: 'recast', label: 'Recast', url: 'https://warpcast.com/', color: '#ddd6fe' },
  { id: 'quest', label: 'Quest', url: 'https://guild.xyz', color: '#a7f3d0' },
];

function msUntil(iso: string) {
  const t = new Date(iso).getTime() - Date.now();
  return Math.max(0, t);
}

export default function Home() {
  const [fid, setFid] = useState<string>('');
  const [result, setResult] = useState<SpinResp | null>(null);
  const [cooldownMs, setCooldownMs] = useState<number>(0);
  const [spinTrigger, setSpinTrigger] = useState(0);
  const canSpin = useMemo(() => fid && cooldownMs === 0, [fid, cooldownMs]);

  useEffect(() => {
    if (!result?.nextSpinAt) return;
    const tick = () => setCooldownMs(msUntil(result.nextSpinAt));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [result?.nextSpinAt]);

  const doSpin = useCallback(async () => {
    if (!fid) return;
    try {
      const r = await fetch('/api/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fid }),
      });
      if (!r.ok) throw new Error('spin failed');
      const data: SpinResp = await r.json();
      setResult(data);
      setSpinTrigger(x => x + 1);
    } catch (e) {
      console.error(e);
      alert('Erreur serveur');
    }
  }, [fid]);

  const winningId = result?.task?.id ?? null;
  const displayTask = winningId ? TASKS.find(t => t.id === winningId) : null;

  return (
    <main className="max-w-md mx-auto px-4 py-6 space-y-6">
      <h1 className="text-3xl font-bold text-center">DailyWheel</h1>

      <Wheel
        segments={TASKS}
        winningId={winningId}
        spinTrigger={spinTrigger}
      />

      <div className="space-y-3">
        <label className="text-sm font-medium block">FID</label>
        <input
          className="w-full rounded-md border border-gray-300 px-3 py-2"
          placeholder="ex: 1234"
          value={fid}
          onChange={(e) => setFid(e.target.value)}
        />
        <button
          onClick={doSpin}
          disabled={!canSpin}
          className={`w-full rounded-md px-4 py-3 text-white ${canSpin ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-300 cursor-not-allowed'}`}
        >
          Spin
        </button>
      </div>

      <div className="border-t pt-4 space-y-2">
        <div className="text-sm text-gray-600">
          Prochain spin&nbsp;{cooldownMs === 0 ? 'disponible' : new Date(cooldownMs).toISOString().slice(11, 19)}
        </div>

        {displayTask && (
          <div className="space-y-2">
            <div className="text-lg font-semibold">{displayTask.label}</div>
            <a
              href={displayTask.url}
              target="_blank"
              className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-white"
            >
              Ouvrir la tâche
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
