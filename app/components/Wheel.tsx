'use client'
import React from 'react'

type Segment = { id: string; label: string }

export default function Wheel({
  segments,
  angle,
  spinning,
}: {
  segments: Segment[]
  angle: number
  spinning: boolean
}) {
  const colors = [
    '#3b82f6','#10b981','#f59e0b','#ef4444',
    '#8b5cf6','#06b6d4','#22c55e','#eab308'
  ]
  const stops = segments
    .map((_, i) => {
      const start = (360 / segments.length) * i
      const end = (360 / segments.length) * (i + 1)
      const c = colors[i % colors.length]
      return `${c} ${start}deg ${end}deg`
    })
    .join(', ')
  return (
    <div className="relative w-64 h-64 mx-auto">
      <div
        className="absolute inset-0 rounded-full border border-black/10 shadow-lg"
        style={{
          background: `conic-gradient(${stops})`,
          transform: `rotate(${angle}deg)`,
          transition: spinning ? 'transform 4.2s cubic-bezier(0.17,0.67,0.2,1)' : 'none',
        }}
        aria-label="wheel"
      />
      <div className="absolute -top-2 left-1/2 -translate-x-1/2">
        <div className="w-0 h-0 border-l-8 border-r-8 border-b-[14px] border-l-transparent border-r-transparent border-b-emerald-500 drop-shadow" />
      </div>
      <div className="absolute inset-0">
        {segments.map((s, i) => {
          const mid = (360 / segments.length) * (i + 0.5)
          const r = (mid * Math.PI) / 180
          const radius = 100
          const x = 128 + radius * Math.sin(r)
          const y = 128 - radius * Math.cos(r)
          return (
            <span
              key={s.id}
              className="absolute text-xs font-medium select-none"
              style={{
                left: x,
                top: y,
                transform: `translate(-50%,-50%) rotate(${mid}deg)`,
              }}
            >
              <span className="block -rotate-90 bg-white/80 px-2 py-0.5 rounded">
                {s.label}
              </span>
            </span>
          )
        })}
      </div>
      <div className="absolute inset-0 rounded-full border-4 border-white pointer-events-none" />
    </div>
  )
}
