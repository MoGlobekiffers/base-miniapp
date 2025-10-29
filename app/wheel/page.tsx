"use client";
import { useRef, useState } from "react";
import Image from "next/image";

const SEGMENTS = 12;
const SEGMENT_ANGLE = 360 / SEGMENTS;
const POINTER_OFFSET_DEG = 0;
const LABELS = ["1","2","3","4","5","6","7","8","9","10","11","12"];

export default function WheelPage() {
  const [angle, setAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const target = useRef(0);

  function spin() {
    if (spinning) return;
    setResult(null);
    const extra = 6 * 360;
    const rand = Math.floor(Math.random() * 360);
    target.current = angle + extra + rand;
    setSpinning(true);
    setAngle(target.current);
  }

  function onEnd() {
    const a = ((target.current % 360) + 360) % 360;
    const normalized = (360 - a + POINTER_OFFSET_DEG) % 360;
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
              Résultat: <span className="font-semibold">{result}</span>
            </div>
          )}
        </div>

        <div className="relative w-full max-w-[520px] mx-auto aspect-square">
          {/* Pointeur fixe */}
          <Image
            src="/wheel-pointer.svg"
            alt="Pointeur"
            width={56}
            height={56}
            priority
            style={{ position:"absolute", top:-6, left:"50%", transform:"translateX(-50%)", zIndex:10 }}
          />

          {/* Anneau/bord */}
          <div className="absolute inset-0 rounded-full ring-8 ring-[#0f172a]/60 z-[1]" />

          {/* Masque circulaire + zone qui tourne */}
          <div
            className="absolute inset-0 rounded-full overflow-hidden"
            style={{
              WebkitMaskImage: "radial-gradient(circle at 50% 50%, #000 99%, transparent 100%)",
              maskImage: "radial-gradient(circle at 50% 50%, #000 99%, transparent 100%)",
              transform: `rotate(${angle}deg)`,
              transition: spinning ? "transform 4.2s cubic-bezier(0.16, 1, 0.3, 1)" : "none",
              willChange: "transform",
            }}
            onTransitionEnd={onEnd}
          >
            {/* L'image tourne, mais CLIPPÉE dans un disque parfait */}
            <Image
              src="/dailywheel.png"
              alt="DailyWheel"
              fill
              priority
              sizes="(max-width: 520px) 90vw, 520px"
              style={{
                objectFit: "contain",
                transform: "scale(0.9)",    // ajuste si besoin
                transformOrigin: "50% 50%",
              }}
            />
          </div>

          {/* Moyeu fixe au-dessus */}
          <div className="absolute inset-0 grid place-items-center z-[2]">
            <div className="w-16 h-16 rounded-full bg-[#0f172a] ring-8 ring-zinc-200/80 shadow-xl" />
          </div>
        </div>

        <p className="text-center text-white/50 text-xs mt-6">
          Si le pointeur ne tombe pas juste, ajuste <code>POINTER_OFFSET_DEG</code>.
        </p>
      </div>
    </main>
  );
}
