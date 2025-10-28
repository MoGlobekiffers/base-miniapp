'use client'
import { useEffect, useMemo, useRef, useState } from 'react'

type Seg = { id: string; label: string }
type Props = {
  segments: Seg[]
  targetId?: string
  spinTrigger?: number
  onEnd?: () => void
}

export default function Wheel({ segments, targetId, spinTrigger = 0, onEnd }: Props) {
  const N = segments.length || 1
  const baseTurns = 6
  const [deg, setDeg] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  const gradient = useMemo(() => {
    const colors = ['#2563eb','#16a34a','#f59e0b','#ef4444','#9333ea','#06b6d4','#84cc16','#f43f5e']
    const step = 360 / N
    const parts = segments.map((_, i) => `${colors[i % colors.length]} ${i*step}deg ${(i+1)*step}deg`).join(', ')
    return `conic-gradient(${parts})`
  }, [segments])

  useEffect(() => {
    if (!targetId) return
    const idx = Math.max(0, segments.findIndex(s => s.id === targetId))
    const slice = 360 / N
    const aim = 360 - (idx + 0.5) * slice
    const total = baseTurns * 360 + aim
    void ref.current?.offsetHeight
    setDeg(total)
  }, [spinTrigger, targetId, N, segments])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const h = () => onEnd && onEnd()
    el.addEventListener('transitionend', h)
    return () => el.removeEventListener('transitionend', h)
  }, [onEnd])

  return (
    <div className="relative mx-auto my-4 h-64 w-64 select-none">
      <div className="absolute left-1/2 top-[-10px] -translate-x-1/2 h-0 w-0 border-l-[10px] border-r-[10px] border-b-[18px] border-l-transparent border-r-transparent border-b-white drop-shadow" />
      <div
        ref={ref}
        className="h-full w-full rounded-full border-8 border-white shadow-xl transition-transform duration-[2800ms] ease-out"
        style={{ background: gradient, transform: `rotate(${deg}deg)` }}
      />
      <div className="pointer-events-none absolute inset-0 grid place-items-center text-xs font-medium text-white">
        <div className="grid grid-cols-2 gap-2 text-center">
          {segments.map(s => (
            <div key={s.id} className="rounded bg-black/30 px-2 py-1">{s.label}</div>
          ))}
        </div>
      </div>
    </div>
  )
}
