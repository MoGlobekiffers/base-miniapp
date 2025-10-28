'use client'
import { useMemo, useState } from 'react'
import Wheel from './components/Wheel'

type SpinTask = { id: string; label: string; url: string }
type SpinResult = { task: SpinTask; nextSpinAt: string }

const SEGMENTS: SpinTask[] = [
  { id: 'daily-log', label: 'Daily log', url: 'https://warpcast.com/compose' },
  { id: 'reply', label: 'Reply', url: 'https://warpcast.com' },
  { id: 'tx', label: 'Onchain tx', url: 'https://bridge.base.org' },
  { id: 'quest', label: 'Quest', url: 'https://guild.xyz' },
]

const COLORS = ['#34d399', '#60a5fa', '#fbbf24', '#f472b6']

export default function Page() {
  const [fid, setFid] = useState('')
  const [spinning, setSpinning] = useState(false)
  const [angle, setAngle] = useState(0)
  const [result, setResult] = useState<SpinResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const segments = useMemo(
    () => SEGMENTS.map((s, i) => ({ label: s.label, color: COLORS[i % COLORS.length] })),
    []
  )

  const centerAngles = useMemo(() => {
    const slice = 360 / SEGMENTS.length
    return SEGMENTS.map((_, i) => i * slice + slice / 2)
  }, [])

  async function handleSpin() {
    setError(null)
    if (!fid.trim()) return setError('Entre un FID')
    try {
      setSpinning(true)
      const res = await fetch('/api/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fid: Number(fid) }),
      })
      if (!res.ok) throw new Error('Server error')
      const data: SpinResult = await res.json()
      setResult(data)

      const idx = SEGMENTS.findIndex((s) => s.id === data.task.id)
      const targetCenter = centerAngles[idx]
      const turns = 5
      // pointeur en haut (0°), on doit amener le centre du segment sous le pointeur
      const final = turns * 360 + (360 - targetCenter)
      setAngle(final)
    } catch (e: any) {
      setError(e.message ?? 'Erreur')
    } finally {
      // laisser la transition se jouer
      setTimeout(() => setSpinning(false), 4300)
    }
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="mb-6 text-center text-3xl font-bold">DailyWheel</h1>

      <div className="mb-6 flex flex-col items-center gap-4">
        <Wheel segments={segments} angle={angle} spinning={spinning} />
      </div>

      <label className="mb-2 block text-sm text-zinc-400">FID</label>
      <input
        className="mb-4 w-full rounded-lg border border-zinc-700/60 bg-zinc-800/40 px-3 py-3 outline-none"
        placeholder="ex: 1234"
        value={fid}
        onChange={(e) => setFid(e.target.value)}
        inputMode="numeric"
      />

      <button
        className="mb-6 w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white disabled:opacity-60"
        onClick={handleSpin}
        disabled={spinning}
      >
        {spinning ? 'Spinning…' : 'Spin'}
      </button>

      {error && <p className="mb-3 text-red-400">{error}</p>}

      {result && (
        <div className="space-y-2 rounded-xl border border-zinc-700/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Prochain spin</span>
            <time className="tabular-nums">
              {new Date(result.nextSpinAt).toLocaleTimeString()}
            </time>
          </div>
          <h2 className="text-xl font-semibold">{result.task.label}</h2>
          <a
            href={result.task.url}
            target="_blank"
            className="inline-block rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white"
          >
            Ouvrir la tâche
          </a>
        </div>
      )}
    </main>
  )
}
