'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

type Segment = { id: string; label: string; color: string };

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg - 90) * (Math.PI / 180);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const large = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${large} 0 ${end.x} ${end.y} Z`;
}

export default function Wheel({
  segments,
  winningId,
  onEnd,
  spinTrigger,
}: {
  segments: Segment[];
  winningId?: string | null;
  onEnd?: (id: string) => void;
  spinTrigger: number;
}) {
  const size = 320;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 8;

  const [angle, setAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const segAngle = 360 / segments.length;

  const indexOfWin = useMemo(
    () => (winningId ? Math.max(0, segments.findIndex(s => s.id === winningId)) : null),
    [winningId, segments]
  );

  useEffect(() => {
    if (indexOfWin == null) return;
    const centerOfSeg = indexOfWin * segAngle + segAngle / 2;
    const turns = 5 + Math.floor(Math.random() * 2);
    const target = turns * 360 + (360 - centerOfSeg);
    setSpinning(true);
    // force reflow to apply transition from current angle
    requestAnimationFrame(() => setAngle(target));
  }, [spinTrigger]); // trigger on each spin request

  const onTransitionEnd = () => {
    if (!spinning) return;
    setSpinning(false);
    // normalize angle
    setAngle(a => a % 360);
    if (indexOfWin != null) {
      onEnd?.(segments[indexOfWin].id);
    }
  };

  return (
    <div className="relative w-full flex items-center justify-center">
      <div
        className="relative"
        style={{ width: size, height: size }}
      >
        <div
          className="transition-[transform] ease-out"
          style={{
            width: size,
            height: size,
            transform: `rotate(${angle}deg)`,
            transitionDuration: spinning ? '3000ms' : '0ms',
          }}
          onTransitionEnd={onTransitionEnd}
        >
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {segments.map((s, i) => {
              const start = i * segAngle;
              const end = (i + 1) * segAngle;
              const d = arcPath(cx, cy, r, start, end);
              // text position
              const mid = start + segAngle / 2;
              const tp = polarToCartesian(cx, cy, r * 0.62, mid);
              return (
                <g key={s.id}>
                  <path d={d} fill={s.color} />
                  <text
                    x={tp.x}
                    y={tp.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="12"
                    fill="#111"
                    style={{ userSelect: 'none' }}
                  >
                    {s.label}
                  </text>
                </g>
              );
            })}
            <circle cx={cx} cy={cy} r={22} fill="#fff" stroke="#e5e7eb" />
          </svg>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 -top-2">
          <svg width="28" height="28" viewBox="0 0 28 28">
            <polygon points="14,0 28,28 0,28" fill="#1d4ed8" />
          </svg>
        </div>
      </div>
    </div>
  );
}
