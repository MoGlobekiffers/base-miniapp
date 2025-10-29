"use client";
import { useRef, useState } from "react";

const SEGMENTS = 12;
const SEGMENT_ANGLE = 360 / SEGMENTS;
const POINTER_OFFSET_DEG = 0;
const LABELS = ["1","2","3","4","5","6","7","8","9","10","11","12"];

// Palette proche de ton visuel
const COLORS = [
  "#ef4444", "#f59e0b", "#3b82f6", "#fbbf24",
  "#a3e635", "#93c5fd", "#f97316", "#fde68a",
  "#22c55e", "#60a5fa", "#a78bfa", "#94a3b8"
];

function conicFromColors(cols: string[]) {
  const step = 360 / cols.length;
  return `conic-gradient(${cols.map((c, i) => `${c} ${i*step}deg ${(i+1)*step}deg`).join(",")})`;
}

export default function WheelPage() {
  const [angle, setAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const target = useRef(0);

  function spin() {
    if (spinning) return;
    setResult(null);
    const extra = 6 * 360;                   // nb de tours
    const rand = Math.floor(Math.random() * 360);
    target.current = angle + extra + rand;
    setSpinning(true);
    setAngle(target.current);
  }

  function onEnd() {
    const a = ((target.current % 360) + 360) % 360;
    const normalized = (360 - a + POINTER_OFFSET_DEG) % 360;  // 0° = haut
    const index = Math.floor(normalized / SEGMENT_ANGLE) % SEGMENTS;
    setResult(LABELS[index]);
    setSpinning(false);
  }

  return (
    <main className="min-h-screen bg-[#0b1220] text-white">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-3xl md:text-4xl font-semibold text-center mb-6">DailyWheel</h1>

        <div className="flex items-center justify-center gap-4 mb-6">
          <button
            onClick={spin}
            disabled={spinning}
            className="px-6 py-3 rounded-xl bg-white text-black font-medium disabled:opacity-50 shadow"
          >
            {spinning ? "Spinning..." : "Spin"}
          </button>
          {result && (
            <div className="text-sm md:text-base bg-white/10 px-3 py-2 rounded-lg border border-white/10">
              Résultat : <span className="font-semibold">{result}</span>
            </div>
          )}
        </div>

        <div className="relative w-full max-w-[520px] mx-auto aspect-square">
          {/* Pointeur fixe */}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-20">
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M28 8L38 28H18L28 8Z" fill="#2563eb" stroke="#0b1220" strokeWidth="4"/>
            </svg>
          </div>

          {/* Conteneur de la roue (tourne) */}
          <div
            className="absolute inset-0 rounded-full overflow-hidden z-10"
            style={{
              transform: `rotate(${angle}deg)`,
              transition: spinning ? "transform 4.2s cubic-bezier(0.16, 1, 0.3, 1)" : "none",
              willChange: "transform"
            }}
            onTransitionEnd={onEnd}
          >
            {/* Segments */}
            <div
              className="absolute inset-0"
              style={{ background: conicFromColors(COLORS) }}
            />
            {/* Séparateurs fins */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "repeating-conic-gradient(from 0deg, rgba(0,0,0,.22) 0deg 0.6deg, transparent 0.6deg 30deg)"
              }}
            />
          </div>

          {/* Bord, ombre interne, moyeu (fixes) */}
          <div className="absolute inset-0 rounded-full ring-8 ring-[#0f172a]/60 z-0" />
          <div className="absolute inset-0 rounded-full shadow-[inset_0_20px_60px_rgba(0,0,0,0.35)] z-20 pointer-events-none" />
          <div className="absolute inset-0 grid place-items-center z-30 pointer-events-none">
            <div className="w-16 h-16 rounded-full bg-[#0f172a] ring-8 ring-zinc-200/80 shadow-xl" />
          </div>
        </div>

        <p className="text-center text-white/50 text-xs mt-6">
          Ajuste <code>POINTER_OFFSET_DEG</code> si le pointeur est décalé.
        </p>
      </div>
    </main>
  );
}
