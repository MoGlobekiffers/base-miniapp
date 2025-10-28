'use client'
import { useState } from 'react'
import Wheel from './components/Wheel'

type SpinRes = {
  task: { id: string; label: string; url: string }
  nextSpinAt: string
}

const SEGMENTS = [
  { id: 'daily-log', label: 'Daily log' },
  { id: 'like-cast', label: 'Like a cast' },
  { id: 'follow-builder', label: 'Follow a builder' },
  { id: 'quest', label: 'Quest' }
]

export default function Page() {
  const [fid, setFid] = useState('')
  const [loading, setLoading] = useState(false)
  const [spinKey, setSpinKey] = useState(0)
  const [targetId, setTargetId] = useState<string | undefined>(undefined)
  const [result, setResult] = useState<SpinRes | null>(null)

  async function spin() {
    if (loading) return
    setResult(null)
    setLoading(true)
    setTargetId(undefined)
    setSpinKey(k => k + 1)
    try {
      const res = await fetch('/api/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fid: Number(fid || 0) })
      })
      const data: SpinRes = await res.json()
      setTargetId(data.task.id)
      setResult(data)
    } catch (e) {
      setResult(null)
    }
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="mb-6 text-center text-2xl font-bold">DailyWheel</h1>

      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium">FID</label>
        <input
          value={fid}
          onChange={e => setFid(e.target.value)}
          placeholder="ex: 1234"
          className="w-full rounded-lg border border-white/20 bg-white/5 p-3 outline-none focus:ring-2 focus:ring-blue-500"
          inputMode="numeric"
        />
      </div>

      <Wheel segments={SEGMENTS} targetId={targetId} spinTrigger={spinKey} onEnd={() => setLoading(false)} />

      <button
        onClick={spin}
        disabled={loading}
        className="mt-2 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white disabled:opacity-50"
      >
        {loading ? 'Spinning…' : 'Spin'}
      </button>

      {result && (
        <div className="mt-6 space-y-2 rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="text-sm opacity-70">Your task</div>
          <div className="text-lg font-semibold">{result.task.label}</div>
          <a
            href={result.task.url}
            target="_blank"
            rel="noreferrer"
            className="inline-block rounded-lg bg-white/10 px-3 py-2 text-sm underline"
          >
            Open link
          </a>
          <div className="text-xs opacity-60">Next spin at: {new Date(result.nextSpinAt).toLocaleString()}</div>
        </div>
      )}
    </main>
  )
}
