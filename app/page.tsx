'use client'
import { useEffect, useMemo, useState } from 'react'
import Wheel from './components/Wheel'

type SpinResponse = {
  task?: { id: string; label: string; url: string }
  nextSpinAt?: string
  error?: string
}

const SEGMENTS = [
  { id: 'daily-log', label: 'Daily log' },
  { id: 'cast', label: 'Cast' },
  { id: 'like', label: 'Like' },
  { id: 'bridge', label: 'Bridge' },
  { id: 'follow', label: 'Follow' },
  { id: 'quest', label: 'Quest' },
]

export default function Page() {
  const [fid, setFid] = useState<string>('')
  const [spinning, setSpinning] = useState(false)
  const [angle, setAngle] = useState(0)
  const [result, setResult] = useState<SpinResponse | null>(null)

  const canSpin = useMemo(() => !spinning, [spinning])

  async function onSpin() {
    if (!canSpin || !fid.trim()) return
    setSpinning(true)
    setResult(null)

    const res = await fetch('/api/spin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fid: Number(fid) }),
    })
    const data: SpinResponse = await res.json()

    const winId = data.task?.id
    const idx = Math.max(0, SEGMENTS.findIndex(s => s.id === winId))
    const n = SEGMENTS.length
    const center = (360 / n) * (idx + 0.5)
    const turns = 5
    const target = turns * 360 + (360 - center)

    requestAnimationFrame(() => setAngle(target))

    setTimeout(() => {
      setSpinning(false)
      setResult(data)
    }, 4300)
  }

  useEffect(() => {
    const p = new URLSearchParams(location.search)
    const initialFid = p.get('fid')
    if (initialFid) setFid(initialFid)
  }, [])

  return (
    <main className="max-w-md mx-auto px-4 py-8 space-y-6">
      <h1 className="text-3xl font-bold text-center">DailyWheel</h1>

      <Wheel segments={SEGMENTS} angle={angle} spinning={spinning} />

      <div className="space-y-3">
        <label className="block text-sm font-medium">FID</label>
        <input
          value={fid}
          onChange={e => setFid(e.target.value)}
          inputMode="numeric"
          placeholder="ex: 1234"
          className="w-full rounded-md border border-black/10 px-3 py-2 bg-gray-100"
        />
        <button
          onClick={onSpin}
          disabled={!fid || spinning}
          className="w-full rounded-md bg-blue-600 text-white py-3 font-semibold disabled:opacity-50"
        >
          {spinning ? 'Spinning…' : 'Spin'}
        </button>
      </div>

      {result && (
        <section className="space-y-2">
          <p className="text-sm text-gray-500">Prochain spin</p>
          <p className="text-right text-lg font-semibold">
            {result.nextSpinAt
              ? new Date(result.nextSpinAt).toLocaleTimeString()
              : '—'}
          </p>

          {result.task && (
            <div className="mt-2">
              <h2 className="text-xl font-semibold">{result.task.label}</h2>
              <a
                href={result.task.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex mt-3 items-center gap-2 rounded-md bg-emerald-600 text-white px-4 py-2"
              >
                Ouvrir la tâche
              </a>
            </div>
          )}
        </section>
      )}
    </main>
  )
}
