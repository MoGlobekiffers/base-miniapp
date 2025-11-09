"use client";

import { useEffect, useMemo, useState } from "react";
import { ConnectWallet } from "@coinbase/onchainkit/wallet";
import { useAccount, useDisconnect } from "wagmi";

/* ========= Quests / roue ========= */

const QUESTS: string[] = [
  "Base quiz",
  "Farcaster quiz",
  "Mini app quiz",
  "Post original cast",
  "Like 3 mini app casts",
  "Reply to a random cast",
  "Share 1 mini app link",
  "Test a top mini app",
  "Read thread & share",
  "Post a web3 meme",
  "Screenshot a mini app",
  "Mini apps mashup",
  "Crazy promo",
  "Find a weird stat",
  "Creative #gm",
  "Daily check-in",
  "Cast + reply combo",
  "Bonus spin",
  "Double points",
  "Web3 Survivor",
];

const SEGMENTS = QUESTS.length;
const COLORS = [
  "#f97316",
  "#3b82f6",
  "#22c55e",
  "#a855f7",
  "#eab308",
  "#38bdf8",
  "#f97316",
  "#22c55e",
  "#3b82f6",
  "#f97316",
];
const BG_COLOR = "#020617";

const R_OUT = 230;
const R_IN = 70; // cercle intérieur + proche => segments plus larges
const POINTER_ANGLE = 90;
const SPIN_DURATION_MS = 4500;
const COOLDOWN_SEC = 24 * 3600;

/* ========= Helpers géométrie ========= */

function deg2rad(d: number) {
  return (d * Math.PI) / 180;
}

function wedgePath(rOut: number, rIn: number, a0: number, a1: number): string {
  const largeArc = a1 - a0 <= 180 ? 0 : 1;

  const a0r = deg2rad(a0);
  const a1r = deg2rad(a1);

  const x0 = rOut * Math.cos(a0r);
  const y0 = rOut * Math.sin(a0r);
  const x1 = rOut * Math.cos(a1r);
  const y1 = rOut * Math.sin(a1r);

  const x2 = rIn * Math.cos(a1r);
  const y2 = rIn * Math.sin(a1r);
  const x3 = rIn * Math.cos(a0r);
  const y3 = rIn * Math.sin(a0r);

  return [
    `M ${x0} ${y0}`,
    `A ${rOut} ${rOut} 0 ${largeArc} 1 ${x1} ${y1}`,
    `L ${x2} ${y2}`,
    `A ${rIn} ${rIn} 0 ${largeArc} 0 ${x3} ${y3}`,
    "Z",
  ].join(" ");
}

/* ========= Composant ========= */

export default function WheelPage() {
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const [mounted, setMounted] = useState(false);

  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState<number>(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const anglePerSegment = 360 / SEGMENTS;

  const segments = useMemo(
    () =>
      Array.from({ length: SEGMENTS }, (_, i) => {
        const a0 = i * anglePerSegment;
        const a1 = (i + 1) * anglePerSegment;
        const mid = a0 + anglePerSegment / 2;

        return {
          i,
          a0,
          a1,
          mid,
          color: COLORS[i % COLORS.length],
          label: QUESTS[i],
        };
      }),
    [anglePerSegment]
  );

  /* ===== Cooldown 1 spin / 24 h / wallet ===== */

  useEffect(() => {
    if (!address) {
      setCooldown(0);
      return;
    }

    const key = `dw:lastSpin:${address.toLowerCase()}`;

    const tick = () => {
      const last = Number(localStorage.getItem(key) || "0");
      if (!last) {
        setCooldown(0);
        return;
      }
      const left = Math.max(0, COOLDOWN_SEC * 1000 - (Date.now() - last));
      setCooldown(Math.ceil(left / 1000));
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [address]);

  /* ===== Spin ===== */

  const handleSpin = () => {
    if (!address) {
      alert("Connect your wallet to spin.");
      return;
    }
    if (spinning || cooldown > 0) return;

    setSpinning(true);

    const extraSpins = 8;
    const randomDeg = Math.random() * 360;
    const finalRotation = rotation + extraSpins * 360 + randomDeg;

    setRotation(finalRotation);

    window.setTimeout(() => {
      const final = ((finalRotation % 360) + 360) % 360;

      const normalized = ((POINTER_ANGLE - final) % 360 + 360) % 360;
      const idx = Math.floor(normalized / anglePerSegment) % SEGMENTS;

      const quest = QUESTS[idx];
      setResult(quest);

      if (address) {
        const key = `dw:lastSpin:${address.toLowerCase()}`;
        localStorage.setItem(key, String(Date.now()));
      }

      setSpinning(false);
    }, SPIN_DURATION_MS);
  };

  const cooldownLabel = useMemo(() => {
    if (!address) return "Connect your wallet to start";
    if (cooldown <= 0) return "You can spin now";

    const h = Math.floor(cooldown / 3600);
    const m = Math.floor((cooldown % 3600) / 60);
    const s = cooldown % 60;

    return `Next spin in ${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }, [cooldown, address]);

  if (!mounted) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold mb-4">DailyWheel</h1>
        <p className="text-slate-400 text-sm">Loading wheel…</p>
      </main>
    );
  }

  const shortAddress =
    address && address.length > 10
      ? `${address.slice(0, 6)}…${address.slice(-4)}`
      : address ?? "";

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col items-center pt-10">
      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
        DailyWheel
      </h1>

      {/* Wallet connect / disconnect */}
      <div className="mb-4 flex flex-col items-center gap-2">
        {address ? (
          <>
            <div className="px-4 py-1 rounded-full bg-slate-900 border border-slate-700 text-xs font-mono">
              {shortAddress}
            </div>
            <button
              onClick={() => disconnect()}
              className="text-xs px-3 py-1 rounded-full border border-slate-600 text-slate-300 hover:bg-slate-800 transition"
            >
              Disconnect
            </button>
          </>
        ) : (
          <ConnectWallet />
        )}
      </div>

      <div className="flex flex-col items-center gap-2 mb-3">
        <button
          onClick={handleSpin}
          disabled={spinning || cooldown > 0 || !address}
          className={`px-6 py-2 rounded-xl text-base font-semibold transition ${
            spinning || cooldown > 0 || !address
              ? "bg-slate-700 text-slate-400 cursor-not-allowed"
              : "bg-slate-100 text-slate-900 hover:bg-white"
          }`}
        >
          {spinning ? "Spinning…" : "Spin"}
        </button>
        <span className="text-xs text-slate-400">{cooldownLabel}</span>
      </div>

      <div className="h-6 mb-4 text-sm">
        {result ? (
          <span>
            Won quest:&nbsp;
            <span className="font-semibold">{result}</span>
          </span>
        ) : (
          <span className="text-slate-400">
            Spin the wheel to get today&apos;s quest
          </span>
        )}
      </div>

      {/* Wheel */}
      <div className="relative w-[520px] h-[520px] max-w-full">
        <div className="absolute left-1/2 -translate-x-1/2 -top-4 z-20">
          <svg width="48" height="32" viewBox="0 0 48 32">
            <path
              d="M24 30 L4 6 H44 Z"
              fill="#2563eb"
              stroke="#020617"
              strokeWidth={4}
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <svg
          viewBox="-260 -260 520 520"
          className="w-full h-full drop-shadow-[0_0_40px_rgba(15,23,42,0.8)]"
        >
          <circle r={R_OUT + 10} fill={BG_COLOR} />
          <circle r={R_OUT + 6} fill="none" stroke="#020617" strokeWidth={6} />

          <g
            style={{
              transform: `rotate(${rotation}deg)`,
              transformOrigin: "center",
              transformBox: "fill-box" as any,
              transition: `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.23, 1, 0.32, 1)`,
            }}
          >
            {segments.map((s) => (
              <path
                key={`wedge-${s.i}`}
                d={wedgePath(R_OUT, R_IN, s.a0, s.a1)}
                fill={s.color}
                stroke="#020617"
                strokeWidth={1.5}
              />
            ))}

            {/* texte centré dans la couronne élargie */}
            {segments.map((s) => {
              const radiusText = (R_OUT + R_IN) / 2;
              const angle = s.mid;
              return (
                <g
                  key={`label-${s.i}`}
                  transform={`rotate(${angle}) translate(0, -${radiusText}) rotate(90)`}
                >
                  <text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#ffffff"
                    stroke="#020617"
                    strokeWidth={0.8}
                    fontSize="12"
                    fontWeight={700}
                    paintOrder="stroke"
                  >
                    {s.label}
                  </text>
                </g>
              );
            })}

            <circle
              r={R_IN - 12}
              fill={BG_COLOR}
              stroke="#e5e7eb"
              strokeWidth={10}
            />
          </g>
        </svg>
      </div>

      <p className="mt-6 text-xs text-slate-500 max-w-md text-center">
        1 spin per day per wallet. Connect your Base wallet to unlock the full
        DailyWheel experience.
      </p>
    </main>
  );
}

