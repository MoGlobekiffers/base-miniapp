'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import miniapp from '@farcaster/miniapp-sdk';
import confetti from 'canvas-confetti';

type Task = { id: string; label: string; url: string };

const TASKS: Task[] = [
  { id: 'quest',         label: 'Quest',          url: 'https://guild.xyz' },
  { id: 'daily-log',     label: 'Daily log',      url: 'https://warpcast.com/compose' },
  { id: 'recast',        label: 'Recast',         url: 'https://warpcast.com/~/search?q=' },
  { id: 'like-cast',     label: 'Like a cast',    url: 'https://warpcast.com/~/search?q=' },
  { id: 'contribute',    label: 'Contribute repo',url: 'https://github.com/MoGlobekiffers/base-miniapp' },
  { id: 'follow-base',   label: 'Follow Base',    url: 'https://warpcast.com/base' },
];

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
const dayKey = (d = new Date()) => d.toISOString().slice(0, 10);

export default function Home() {
  const [fid, setFid] = useState<string>('');
  const [spinning, setSpinning] = useState(false);
  const [nextSpinAt, setNextSpinAt] = useState<string | null>(null);
  const [result, setResult] = useState<Task | null>(null);

  const canSpin = useMemo(() => !spinning && (!nextSpinAt || new Date(nextSpinAt) <= new Date()), [spinning, nextSpinAt]);

  // Auto-détection du FID via miniapp SDK (si dans Base App)
  useEffect(() => {
    (async () => {
      try {
        await miniapp.ready();
        // @ts-ignore – certains bundles exposent user().fid ou context().fid
        const sdkFid = miniapp.user?.fid ?? miniapp.context?.fid;
        if (sdkFid && !fid) setFid(String(sdkFid));
      } catch {
        // hors Base App : on laisse le champ FID manuel
      }
    })();
  }, [fid]);

  // Charger “prochain spin” local (fausse persistance)
  useEffect(() => {
    const k = localStorage.getItem('dw:next:' + dayKey());
    if (k) setNextSpinAt(k);
  }, []);

  // Animation confetti
  const fireConfetti = () => {
    const end = Date.now() + 600;
    const frame = () => {
      confetti({ particleCount: 20, startVelocity: 35, spread: 50, origin: { y: 0.3 } });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  };

  const onSpin = async () => {
    if (!fid || !canSpin) return;
    setSpinning(true);
    setResult(null);

    try {
      const res = await fetch('/api/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fid: Number(fid) }),
      });

      if (!res.ok) throw new Error('server_error');
      const data = await res.json() as { task: Task; nextSpinAt: string };

      setResult(data.task);
      setNextSpinAt(data.nextSpinAt);
      localStorage.setItem('dw:next:' + dayKey(), data.nextSpinAt);

      fireConfetti();
    } catch (e) {
      alert('Erreur serveur');
    } finally {
      setSpinning(false);
    }
  };

  // Angle visuel aléatoire (juste pour faire tourner la roue)
  const [angle, setAngle] = useState(0);
  const spinVisual = () => {
    const full = 360 * 6; // 6 tours
    const offset = Math.floor(Math.random() * 360);
    setAngle(full + offset);
  };

  const handleSpinClick = async () => {
    spinVisual();
    await onSpin();
  };

  return (
    <main className="min-h-screen bg-[#0b0f16] text-white flex flex-col items-center py-10">
      <h1 className="text-3xl font-semibold mb-8">DailyWheel</h1>

      <div className="w-full max-w-xl px-4">
        <label className="text-sm text-neutral-300">FID</label>
        <input
          className="w-full mt-2 mb-6 rounded-md bg-neutral-800/70 border border-neutral-700 px-3 py-2 outline-none"
          placeholder="ex: 1234"
          value={fid}
          onChange={(e) => setFid(e.target.value)}
          disabled={!!fid && fid.length > 0} // auto-rempli => verrouille
        />

        <div className="relative flex flex-col items-center">
          {/* Pointeur */}
          <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-b-[18px] border-l-transparent border-r-transparent border-b-blue-500 mb-2" />
          {/* Roue (image locale) */}
          <div
            className="w-[420px] h-[420px] rounded-full overflow-hidden"
            style={{
              backgroundImage: 'url(/preview-wheel.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              transform: `rotate(${angle}deg)`,
              transition: 'transform 1.6s cubic-bezier(.2,.7,.1,1)',
            }}
          />
        </div>

        <button
          onClick={handleSpinClick}
          disabled={!canSpin || !fid}
          className={`w-full mt-8 rounded-md py-3 text-lg font-medium ${canSpin && fid
            ? 'bg-blue-600 hover:bg-blue-500'
            : 'bg-neutral-700 cursor-not-allowed'}`}
        >
          {spinning ? 'Spinning…' : 'Spin'}
        </button>

        <div className="mt-6 text-sm text-neutral-300">
          {nextSpinAt
            ? <>Prochain spin : <span className="font-mono">{new Date(nextSpinAt).toLocaleTimeString()}</span></>
            : <>Prochain spin disponible</>}
        </div>

        {result && (
          <div className="mt-6 border border-neutral-700 rounded-lg p-4">
            <div className="text-lg font-medium mb-2">{result.label}</div>
            <a
              className="inline-block bg-emerald-600 hover:bg-emerald-500 rounded-md px-4 py-2"
              href={result.url}
              target="_blank"
              rel="noreferrer"
            >
              Ouvrir la tâche
            </a>
          </div>
        )}
      </div>
    </main>
  );
}

