'use client'
import { useEffect, useMemo, useRef, useState } from 'react'

type Task = { id:string; label:string; url:string }
type SpinResponse = { task: Task; nextSpinAt: string }

function useCountdown(targetISO?: string) {
  const [now, setNow] = useState<number>(() => Date.now())
  useEffect(() => { const t = setInterval(()=>setNow(Date.now()), 1000); return ()=>clearInterval(t) }, [])
  const diff = useMemo(() => targetISO ? Math.max(0, new Date(targetISO).getTime() - now) : 0, [now, targetISO])
  const h = Math.floor(diff/36e5), m = Math.floor((diff%36e5)/6e4), s = Math.floor((diff%6e4)/1e3)
  return { h, m, s, finished: diff<=0 }
}

export default function Page() {
  const [fid, setFid] = useState<string>('12')
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<Task | null>(null)
  const [nextSpinAt, setNextSpinAt] = useState<string | undefined>(undefined)
  const { h, m, s, finished } = useCountdown(nextSpinAt)
  const wheelRef = useRef<HTMLDivElement>(null)

  async function spin() {
    setResult(null)
    setSpinning(true)
    // anime la roue (rotation CSS)
    const node = wheelRef.current
    if (node) {
      const turns = 6 + Math.floor(Math.random()*3)
      node.style.transition = 'transform 2.2s cubic-bezier(.22,.6,.28,1.2)'
      node.style.transform = `rotate(${turns*360}deg)`
    }
    try {
      const res = await fetch('/api/spin', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ fid: Number(fid) || 0 })
      })
      const json = await res.json() as SpinResponse | { error: string }
      if ('task' in json) {
        setResult(json.task)
        setNextSpinAt(json.nextSpinAt)
      } else {
        alert('Erreur serveur')
      }
    } catch {
      alert('Erreur serveur')
    } finally {
      // remet la rotation pour l’état idle
      setTimeout(() => {
        const node2 = wheelRef.current
        if (node2) {
          node2.style.transition = 'none'
          node2.style.transform = 'rotate(0deg)'
        }
        setSpinning(false)
      }, 2300)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-start gap-6 px-4 py-8">
      <h1 className="text-3xl font-bold">DailyWheel</h1>

      <div className="w-full max-w-md flex flex-col items-center gap-4">
        <label className="w-full text-sm font-medium">FID</label>
        <input
          className="w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-3 outline-none"
          placeholder="ex: 1234"
          value={fid}
          onChange={e=>setFid(e.target.value)}
        />
      </div>

      {/* Zone roue */}
      <div className="relative w-[360px] h-[360px] select-none">
        {/* pointeur */}
        <img src="/wheel-pointer.svg" alt="" className="absolute left-1/2 -translate-x-1/2 -top-3 z-20 w-8 h-9" />
        {/* roue (image de fond) */}
        <div
          ref={wheelRef}
          className="absolute inset-0 rounded-full bg-center bg-no-repeat bg-contain"
          style={{ backgroundImage: 'url(/preview-wheel.png)' }}
          aria-hidden
        />
      </div>

      <button
        onClick={spin}
        disabled={spinning || !finished}
        className="w-[360px] h-12 rounded-lg bg-blue-600 text-white font-medium disabled:opacity-50"
      >
        {spinning ? 'Spinning…' : 'Spin'}
      </button>

      {/* Compte à rebours & résultat */}
      <div className="w-[360px] mt-2">
        <p className="text-sm text-gray-500">
          Prochain spin {finished ? 'disponible' : `dans ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`}
        </p>
        {result && (
          <div className="mt-4 space-y-3">
            <h3 className="text-lg font-semibold">{result.label}</h3>
            <a
              href={result.url}
              target="_blank"
              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 text-white px-4 py-2"
            >
              Ouvrir la tâche
            </a>
          </div>
        )}
      </div>
    </main>
  )
}
