"use client";

import { useEffect, useMemo, useState } from "react";
import { ConnectWallet } from "@coinbase/onchainkit/wallet";
import { useAccount, useDisconnect } from "wagmi";

// Quiz pools (inchangé)
import type { QuizQuestion } from "./quizPools";
import { getRandomBaseQuiz, getRandomFarcasterQuiz } from "./quizPools";

// Brain (nouveau)
import { useBrain, addBrain, setDoubleNext } from "../brain";

/* =======================
 *  Quêtes & apparence
 * ======================= */

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

const POINTER_Y = 40; // ↑ augmente pour descendre la flèche (ex: 40, 56, 72…)
const SEGMENTS = QUESTS.length;
const COLORS = [
  "#f97316", "#3b82f6", "#22c55e", "#a855f7", "#eab308",
  "#38bdf8", "#f97316", "#22c55e", "#3b82f6", "#f97316"
];
const BG_COLOR = "#020617";

// Dimensions roue (inchangé)
const R_OUT = 260;
const R_IN  = 78;

// Angle du pointeur (inchangé : flèche au-dessus, pointe vers le bas)
const POINTER_ANGLE = 0;

// Spin & cooldown (inchangé)
const SPIN_DURATION_MS = 4500;
const COOLDOWN_SEC = 24 * 3600;

// Dev mode (inchangé)
const DEV_MODE =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_DW_DEV === "1") ||
  (typeof window !== "undefined" && window.location.hostname === "localhost");

/* =======================
 *  Barème Brain (nouveau)
 * ======================= */

const QUEST_POINTS: Record<string, number> = {
  "Base quiz": 5,
  "Farcaster quiz": 5,
  "Mini app quiz": 4,
  "Post original cast": 3,
  "Like 3 mini app casts": 3,
  "Reply to a random cast": 3,
  "Share 1 mini app link": 3,
  "Test a top mini app": 4,
  "Read thread & share": 3,
  "Post a web3 meme": 4,
  "Screenshot a mini app": 3,
  "Mini apps mashup": 4,
  "Crazy promo": 4,
  "Find a weird stat": 3,
  "Creative #gm": 3,
  "Daily check-in": 2,
  "Cast + reply combo": 4,
  "Bonus spin": 0,       // pas de points, juste bonus UX
  "Double points": 0,    // active x2 pour la prochaine validation
  "Web3 Survivor": 8,
};

/* =======================
 *  Utilitaires géométrie
 * ======================= */

function deg2rad(d: number) { return (d * Math.PI) / 180; }

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

/* =======================
 *  Page
 * ======================= */

export default function WheelPage() {
  const { address } = useAccount();
  const { disconnect } = useDisconnect();

  // Brain (nouveau)
  const { brain, refresh, hasDouble } = useBrain(address);

  // états principaux (inchangés)
  const [mounted, setMounted] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState<number>(0);

  // Quiz
  const [activeQuiz, setActiveQuiz] = useState<QuizQuestion | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [quizResult, setQuizResult] = useState<"correct" | "wrong" | null>(null);

  // Claim (nouveau : éviter double crédit sur un même spin)
  const [claimed, setClaimed] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const anglePerSegment = 360 / SEGMENTS;

  const segments = useMemo(
    () =>
      Array.from({ length: SEGMENTS }, (_, i) => {
        const a0 = i * anglePerSegment;
        const a1 = (i + 1) * anglePerSegment;
        const mid = a0 + anglePerSegment / 2;
        return { i, a0, a1, mid, color: COLORS[i % COLORS.length], label: QUESTS[i] };
      }),
    [anglePerSegment]
  );

  /* Cooldown (inchangé, ignoré en DEV) */
  useEffect(() => {
    if (!address) { setCooldown(0); return; }
    if (DEV_MODE) { setCooldown(0); return; }

    const key = `dw:lastSpin:${address.toLowerCase()}`;
    const tick = () => {
      const last = Number(localStorage.getItem(key) || "0");
      if (!last) { setCooldown(0); return; }
      const left = Math.max(0, COOLDOWN_SEC * 1000 - (Date.now() - last));
      setCooldown(Math.ceil(left / 1000));
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [address]);

  /* Spin */
  const handleSpin = () => {
    if (!address) { alert("Connect your wallet to spin."); return; }
    if (!DEV_MODE && (spinning || cooldown > 0)) return;

    setSpinning(true);
    setActiveQuiz(null);
    setSelectedChoice(null);
    setQuizResult(null);
    setClaimed(false);

    const extraSpins = 8;
    const randomDeg = Math.random() * 360;
    const finalRotation = rotation + extraSpins * 360 + randomDeg;

    setRotation(finalRotation);

    window.setTimeout(() => {
      const final = ((finalRotation % 360) + 360) % 360;
      const normalized = ((POINTER_ANGLE - final) % 360 + 360) % 360;
      const idx = Math.floor(normalized / anglePerSegment) % SEGMENTS;

      const questLabel = QUESTS[idx];
      setResult(questLabel);

      // Prépare quiz si nécessaire
      if (questLabel === "Base quiz") {
        setActiveQuiz(getRandomBaseQuiz());
      } else if (questLabel === "Farcaster quiz") {
        setActiveQuiz(getRandomFarcasterQuiz());
      } else {
        setActiveQuiz(null);
      }

      // Active x2 pour prochain gain si "Double points"
      if (address && questLabel === "Double points") {
        setDoubleNext(address);
      }

      // Sauvegarde timestamp (prod uniquement)
      if (address && !DEV_MODE) {
        const key = `dw:lastSpin:${address.toLowerCase()}`;
        localStorage.setItem(key, String(Date.now()));
      }

      setSpinning(false);
    }, SPIN_DURATION_MS);
  };

  /* Réponse quiz */
  const handleAnswer = (index: number) => {
    if (!activeQuiz || quizResult) return;

    const isCorrect = index === activeQuiz.correctIndex;
    setSelectedChoice(index);
    setQuizResult(isCorrect ? "correct" : "wrong");

    // Crédit auto sur bonne réponse (une seule fois)
    if (isCorrect && address && !claimed) {
      // détermine l'étiquette de quest pour le barème
      const questName =
        result ?? (activeQuiz.category === "base" ? "Base quiz" : "Farcaster quiz");
      const base = QUEST_POINTS[questName] ?? 4;

      addBrain(address, questName, base);
      setClaimed(true);
      refresh();
    }
  };

  /* Nouvelle question même thème */
  const newQuestionSameTopic = () => {
    if (!activeQuiz) return;
    const q =
      activeQuiz.category === "base" ? getRandomBaseQuiz() : getRandomFarcasterQuiz();
    setActiveQuiz(q);
    setSelectedChoice(null);
    setQuizResult(null);
  };

  /* Libellé cooldown (inchangé) */
  const cooldownLabel = useMemo(() => {
    if (!address) return "Connect your wallet to start";
    if (DEV_MODE) return "DEV mode: unlimited spins";
    if (cooldown <= 0) return "You can spin now";
    const h = Math.floor(cooldown / 3600);
    const m = Math.floor((cooldown % 3600) / 60);
    const s = cooldown % 60;
    return `Next spin in ${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  }, [cooldown, address]);

  if (!mounted) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold mb-4">DailyWheel</h1>
        <p className="text-slate-400 text-sm">Loading…</p>
      </main>
    );
  }

  const shortAddress =
    address && address.length > 10 ? `${address.slice(0,6)}…${address.slice(-4)}` : address ?? "";

  const resetDaily = () => {
    if (!address) return;
    localStorage.removeItem(`dw:lastSpin:${address.toLowerCase()}`);
    setCooldown(0);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col items-center pt-10 px-4">
      <h1 className="text-5xl font-extrabold tracking-tight mb-4">DailyWheel</h1>

      {/* Adresse + Brain + Disconnect */}
      <div className="mb-4 flex flex-col items-center gap-2">
        {address ? (
          <>
            <div className="px-4 py-1 rounded-full bg-slate-900 border border-slate-700 text-xs font-mono">
              {shortAddress}
            </div>
            <div className="text-xs text-amber-300 font-semibold">
              Brain: {brain} 🧠 {hasDouble && <span className="text-emerald-400">(x2 prêt)</span>}
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

      {/* Boutons Spin / Reset dev */}
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={handleSpin}
          disabled={spinning || (!DEV_MODE && (cooldown > 0 || !address)) || !address}
          className={`px-6 py-2 rounded-xl text-base font-semibold transition ${
            spinning || (!DEV_MODE && (cooldown > 0 || !address))
              ? "bg-slate-700 text-slate-400 cursor-not-allowed"
              : "bg-slate-100 text-slate-900 hover:bg-white"
          }`}
        >
          {spinning ? "Spinning…" : "Spin"}
        </button>

        {DEV_MODE && address && (
          <button
            onClick={resetDaily}
            className="px-3 py-2 rounded-xl text-xs border border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/10"
          >
            Reset daily limit
          </button>
        )}
      </div>

      <span className="text-xs text-slate-400 mb-4">{cooldownLabel}</span>

      {/* Résultat + panneau Quiz */}
      <div className="w-full max-w-xl mb-4">
        <div className="text-center mb-3 h-6">
          {result ? (
            <span>Won quest: <span className="font-semibold">{result}</span></span>
          ) : (
            <span className="text-slate-400">Spin the wheel to get today&apos;s quest</span>
          )}
        </div>

        {activeQuiz && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wide text-slate-400">
                {activeQuiz.category === "base" ? "BASE QUIZ" : "FARCASTER QUIZ"}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={newQuestionSameTopic}
                  className="text-[11px] px-2 py-1 rounded border border-slate-600 text-slate-300 hover:bg-slate-800"
                >
                  Try another question
                </button>
                {quizResult === "correct" && <span className="text-xs font-semibold text-emerald-400">Correct ✅</span>}
                {quizResult === "wrong" && <span className="text-xs font-semibold text-rose-400">Not this time ❌</span>}
              </div>
            </div>

            <p className="text-sm font-medium mb-3">{activeQuiz.question}</p>

            <div className="flex flex-col gap-2">
              {activeQuiz.choices.map((choice, idx) => {
                const isSelected = selectedChoice === idx;
                const isCorrect = quizResult === "correct" && idx === activeQuiz.correctIndex;
                const isWrongSelected = quizResult === "wrong" && isSelected;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAnswer(idx)}
                    disabled={!!quizResult}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs border transition
                      ${
                        isCorrect
                          ? "border-emerald-400/70 bg-emerald-500/10"
                          : isWrongSelected
                          ? "border-rose-400/70 bg-rose-500/10"
                          : isSelected
                          ? "border-slate-300 bg-slate-100 text-slate-900"
                          : "border-slate-700 bg-slate-900/60 text-slate-100 hover:bg-slate-800"
                      }
                      ${quizResult ? "cursor-default" : "cursor-pointer"}
                    `}
                  >
                    {choice}
                  </button>
                );
              })}
            </div>

            {activeQuiz.explain && quizResult && (
              <p className="mt-3 text-[11px] text-slate-400">{activeQuiz.explain}</p>
            )}

            {!quizResult && <p className="mt-3 text-[11px] text-slate-500">Pick one answer. Instant feedback 😄</p>}
          </div>
        )}
      </div>

      {/* Claim manuel pour les quêtes non-quiz */}
      {result &&
        result !== "Base quiz" &&
        result !== "Farcaster quiz" && (
          <div className="w-full max-w-xl mb-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 flex items-center justify-between">
              <div className="text-sm">
                <div className="font-medium">Quest action</div>
                <div className="text-xs text-slate-400">
                  {hasDouble ? "Double points actif pour ce wallet." : "Clique pour valider et gagner des Brain."}
                </div>
              </div>
              <button
                disabled={!address || claimed || (QUEST_POINTS[result] ?? 0) === 0}
                onClick={() => {
                  if (!address) return;
                  const base = QUEST_POINTS[result] ?? 0;
                  if (base <= 0) return; // Bonus spin / Double points => pas de crédit direct
                  addBrain(address, result, base);
                  setClaimed(true);
                  refresh();
                }}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition
                  ${!address || claimed || (QUEST_POINTS[result] ?? 0) === 0
                    ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                    : "bg-emerald-500 text-white hover:bg-emerald-400"}`}
              >
                {claimed ? "Claimed ✓" : `Valider (+${QUEST_POINTS[result] ?? 0} 🧠)`}
              </button>
            </div>
          </div>
        )
      }

      {/* Flèche (inchangé, au-dessus de la roue) */}
      <div className="relative w-[640px] h-[640px] max-w-full">
  {/* Flèche bleue — positionnée depuis le haut du conteneur */}
  <div
    className="absolute left-1/2 -translate-x-1/2 z-20 pointer-events-none"
    style={{ top: POINTER_Y }}
  >
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

        {/* Roue (inchangée) */}
        <svg viewBox="-300 -300 600 600" className="w-full h-full drop-shadow-[0_0_40px_rgba(15,23,42,0.8)]">
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
            {/* Tranches */}
            {Array.from({ length: SEGMENTS }, (_, i) => {
              const a0 = i * (360 / SEGMENTS);
              const a1 = (i + 1) * (360 / SEGMENTS);
              return (
                <path
                  key={`wedge-${i}`}
                  d={wedgePath(R_OUT, R_IN, a0, a1)}
                  fill={COLORS[i % COLORS.length]}
                  stroke="#020617"
                  strokeWidth={1.6}
                />
              );
            })}

            {/* Labels */}
            {Array.from({ length: SEGMENTS }, (_, i) => {
              const a0 = i * anglePerSegment;
              const mid = a0 + anglePerSegment / 2;
              const radiusText = (R_OUT + R_IN) / 2;
              return (
                <g key={`label-${i}`} transform={`rotate(${mid}) translate(0, -${radiusText}) rotate(90)`}>
                  <text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#ffffff"
                    stroke="#020617"
                    strokeWidth={0.9}
                    fontSize="12"
                    fontWeight={700}
                    paintOrder="stroke"
                  >
                    {QUESTS[i]}
                  </text>
                </g>
              );
            })}

            {/* Centre */}
            <circle r={R_IN - 12} fill={BG_COLOR} stroke="#e5e7eb" strokeWidth={10} />
          </g>
        </svg>
      </div>

      <p className="mt-6 text-xs text-slate-500 max-w-md text-center">
        1 spin per day per wallet. DEV mode disables the limit locally.
      </p>
    </main>
  );
}

