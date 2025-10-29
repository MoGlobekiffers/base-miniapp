"use client";
import { useRef, useState } from "react";
import Image from "next/image";

const SEGMENTS = 12;                 // nombre de parts
const SEGMENT_ANGLE = 360 / SEGMENTS;
const POINTER_OFFSET_DEG = 0;        // ajuste si le pointeur n'indique pas le bon segment

const LABELS = [
  "1", "2", "3", "4", "5", "6",
  "7", "8", "9", "10", "11", "12"
];

export default function WheelPage() {
  const [angle, setAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const targetAngleRef = useRef(0);

  function spin() {
    if (spinning) return;
    setResult(null);
    const extraTurns = 6 * 360; // 6 tours
    const randomWithinCircle = Math.floor(Math.random() * 360); // 0..359
    targetAngleRef.current = angle + extraTurns + randomWithinCircle;
    setSpinning(true);
    setAngle(targetAngleRef.current);
  }

  function onEnd() {
    // Angle final normalisé (0..359)
    const a = ((targetAngleRef.current % 360) + 360) % 360;
    // Convertit pour "pointer vers le haut"
    const normalized = (360 - a + POINTER_OFFSET_DEG) % 360;
    const index = Math.floor(normalized / SEGMENT_ANGLE) % SEGMENTS;
    setResult(LABELS[index]);
    setSpinning(false);
  }

  return (
    <main className="min-h-screen bg-[#0b1220] text-white">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-3xl md:text-4xl font-semibold text-center mb-6">DailyWheel</h1>

        <div className="flex items-center justify-center gap-4 mb-4">
          <button
            onClick={spin}
            disabled={spinning}
            className="px-6 py-3 rounded-xl bg-white text-black font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow"
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
          {/* Roue qui tourne */}
          <div
            className="absolute inset-0"
            style={{
              transform: `rotate(${angle}deg)`,
              transition: spinning ? "transform 4.2s cubic-bezier(0.16, 1, 0.3, 1)" : "none",
              willChange: "transform",
            }}
            onTransitionEnd={onEnd}
          >
            <Image
              src="/dailywheel.png"
              alt="DailyWheel"
              fill
              priority
              sizes="(max-width: 520px) 90vw, 520px"
              style={{ objectFit: "contain", filter: spinning ? "drop-shadow(0 12px 40px rgba(0,0,0,.35))" : "none" }}
            />
          </div>

          {/* Pointeur (fixe en haut) */}
          <Image
            src="/wheel-pointer.svg"
            alt="Pointeur"
            width={56}
            height={56}
            priority
            style={{ position: "absolute", top: "-6px", left: "50%", transform: "translateX(-50%)" }}
          />
        </div>

        <p className="text-center text-white/50 text-xs mt-6">
          Astuce: si le pointeur ne tombe pas sur la bonne case, ajuste <code>POINTER_OFFSET_DEG</code>.
        </p>
      </div>
    </main>
  );
}
