'use client'

import { useEffect, useMemo, useState } from 'react'

type SpinResponse = {
  task: { id: string; label: string; url: string }
  nextSpinAt: string
}

function useNow(tickMs = 1000) {
  const [now, setNow] = useState<Date>(() => new Date())
  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), tickMs)
    return () => clearInterval(i)
  }, [tickMs])
  return now
}

function Countdown({ to }: { to: string }) {
  const now = useNow(1000)
  const text = useMemo(() => {
    const target = new Date(to)
    const diff = target.getTime() - now.getTime()
    if (diff <= 0) return 'disponible'
    const s = Math.floor(diff / 1000)
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }, [now, to])
  return <span className="font-mono">{text}</span>
}

export default function Embed() {
  const [fid, setFid] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<SpinResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    const f = p.get('fid') || ''
    setFid(f)
  }, [])

  async function onSpin() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fid: Number(fid || 0) }),
      })
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error || 'request_failed')
      setData(json as SpinResponse)
    } catch (e: any) {
      setError(e?.message || 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-[60vh] grid place-items-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6 space-y-6">
        <h1 className="text-2xl font-semibold text-center">DailyWheel</h1>

        <div className="space-y-2">
          <label className="text-sm opacity-80">FID</label>
          <input
            value={fid}
            onChange={(e) => setFid(e.target.value)}
            inputMode="numeric"
            className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 outline-none"
            placeholder="ex: 1234"
          />
        </div>

        <button
          onClick={onSpin}
          disabled={loading}
          className="w-full rounded-xl px-4 py-3 font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? 'Spin…' : 'Spin'}
        </button>

        {error && <p className="text-red-400 text-sm break-words">{error}</p>}

        {data && (
          <div className="rounded-xl border border-white/10 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm opacity-80">Prochain spin</div>
              <Countdown to={data.nextSpinAt} />
            </div>
            <div className="space-y-2">
              <div className="text-lg font-medium">{data.task.label}</div>
              <a
                href={data.task.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex rounded-xl px-4 py-2 bg-emerald-600 hover:bg-emerald-700"
              >
                Ouvrir la tâche
              </a>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
