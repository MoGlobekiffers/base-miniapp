'use client'
import React from 'react'

type Segment = { label: string; color: string }
export default function Wheel({
  segments,
  angle,
  spinning,
}: {
  segments: Segment[]
  angle: number
  spinning: boolean
}) {
  const step = 100 / segments.length
  let acc = 0
  const stops: string[] = []
  for (const s of segments) {
    const from = acc
    const to = acc + step
    stops.push(`${s.color} ${from}% ${to}%`)
    acc = to
  }
  const bg = `conic-gradient(${stops.join(',')})`

  return (
    <div className="relative flex items-center justify-center">
      {/* pointeur */}
      <div className="absolute -top-3 z-10 h-0 w-0 border-l-8 border-r-8 border-b-[14px] border-l-transparent border-r-transparent border-b-emerald-500" />
      {/* roue */}
      <div
        className="rounded-full border-4 border-zinc-800/30"
        style={{
          width: 280,
          height: 280,
          background: bg,
          transform: `rotate(${angle}deg)`,
          transition: spinning ? 'transform 4.2s cubic-bezier(0.22, 0.7, 0, 1)' : undefined,
        }}
      />
      {/* moyeu */}
      <div className="absolute h-10 w-10 rounded-full border-2 border-white/40 bg-white/80 backdrop-blur" />
    </div>
  )
}
