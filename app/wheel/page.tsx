"use client";

import { useEffect, useMemo, useState } from "react";
import { ConnectWallet } from "@coinbase/onchainkit/wallet";
import { useAccount, useDisconnect } from "wagmi";

// Quiz pools
import type { QuizQuestion } from "./quizPools";
import {
  getRandomBaseQuiz,
  getRandomFarcasterQuiz,
  getRandomMiniAppQuiz,
} from "./quizPools";

// Brain
import { useBrain, addBrain, setDoubleNext } from "../brain";

/* =======================
 *  Quests & appearance
 * ======================= */

const QUESTS: string[] = [
  "Base Speed Quiz",
  "Farcaster Flash Quiz",
  "Mini app quiz",
  "Cast Party",
  "Like Storm",
  "Reply Sprint",
  "Invite & Share",
  "Test a top mini app",
  "Bonus Spin",
  "Meme Factory",
  "Mint my NFT Free",
  "Mini apps mashup",
  "Crazy promo",
  "Bankruptcy",
  "Creative #gm",
  "Daily check-in",
  "Mystery Challenge",
  "Bonus spin",
  "Double points",
  "Web3 Survivor",
];

const POINTER_Y = 40;
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

// Wheel dimensions
const R_OUT = 260;
const R_IN = 78;

// Pointer angle (arrow drawn at the top, pointing down)
const POINTER_ANGLE = 0;

// Spin & cooldown
const SPIN_DURATION_MS = 4500;
const COOLDOWN_SEC = 24 * 3600;

// Dev mode
const DEV_MODE =
  (typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_DW_DEV === "1") ||
  (typeof window !== "undefined" &&
    window.location.hostname === "localhost");

/* =======================
 *  Brain points table
 * ======================= */

const QUEST_POINTS: Record<string, number> = {
  "Base Speed Quiz": 5,
  "Farcaster Flash Quiz": 5,
  "Mini app quiz": 4,
  "Cast Party": 3,
  "Like Storm": 3,
  "Reply Sprint": 3,
  "Invite & Share": 3,
  "Test a top mini app": 4,
  "Bonus Spin": 1, // 1 Brain + respin
  "Meme Factory": 4,
  "Mint my NFT Free": 5,
  "Mini apps mashup": 4,
  "Crazy promo": 4,
  "Bankruptcy": -20,
  "Creative #gm": 3,
  "Daily check-in": 2,
  "Mystery Challenge": 5,
  "Bonus spin": 1, // 1 Brain + respin
  "Double points": 0,
  "Web3 Survivor": 8,
};

/* =======================
 *  Quest descriptions (EN)
 * ======================= */

const QUEST_DESCRIPTIONS: Record<string, string> = {
  "Base Speed Quiz":
    "Answer a quick question about Base to prove you really know the ecosystem.",
  "Farcaster Flash Quiz":
    "Answer a fast question about Farcaster, its frames, and the culture around the protocol.",
  "Mini app quiz":
    "Answer a question about mini apps / frames to better understand how they work onchain.",
  "Cast Party":
    "Post a fun or useful cast about onchain life, a mini app you like, or something you are building.",
  "Like Storm":
    "Like several relevant casts (for example about mini apps or Base) to support builders and creators.",
  "Reply Sprint":
    "Reply to a few casts with real value (tips, ideas, feedback) — not just a random emoji.",
  "Invite & Share":
    "Invite someone to discover Farcaster or share a link to this mini app with a new person.",
  "Test a top mini app":
    "Open a popular mini app, really use it, and perform at least one meaningful action inside.",
  "Bonus Spin":
    "You gain 1 Brain and the right to respin the wheel today. Choose your next spin wisely.",
  "Meme Factory":
    "Create or share a real web3/Base/Farcaster meme (not just a random picture) and cast it.",
  "Mint my NFT Free":
    "Mint a free or low-cost NFT related to the ecosystem (mini app, fun collection, badge, etc.).",
  "Mini apps mashup":
    "Imagine a funny fusion of two mini apps and share the idea in a cast or description.",
  "Crazy promo":
    "Make a humorous or over-the-top promotion about any mini app of your choice. Go all-in on the hype.",
  "Bankruptcy":
    "Ouch… you lose 20 Brain. Optionally share your worst onchain mistake or ‘rug’ story and laugh it off.",
  "Creative #gm":
    "Post a creative #gm (image, phrase, joke, or mini story) connected to Base or Farcaster.",
  "Daily check-in":
    "Cast a simple daily check-in telling what you’ll explore, test, or build onchain today.",
  "Mystery Challenge":
    "Invent your own mini-challenge for today (e.g. test a brand new frame, follow a new builder, etc.).",
  "Bonus spin":
    "You gain 1 Brain and the right to respin the wheel again today. Second chance unlocked.",
  "Double points":
    "Activate x2 Brain for your next validated quest. Pick a juicy quest before you claim.",
  "Web3 Survivor":
    "Complete a slightly ‘hardcore’ action: long thread, deep mini app test, or useful debugging session.",
};

/* =======================
 *  Geometry helpers
 * ======================= */

function deg2rad(d: number) {
  return (d * Math.PI) / 180;
}

function wedgePath(
  rOut: number,
  rIn: number,
  a0: number,
  a1: number
): string {
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
 *  Page component
 * ======================= */

export default function WheelPage() {
  const { address } = useAccount();
  const { disconnect } = useDisconnect();

  // Brain
  const { brain, refresh, hasDouble } = useBrain(address);

  // main states
  const [mounted, setMounted] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState<number>(0);

  // quiz
  const [activeQuiz, setActiveQuiz] = useState<QuizQuestion | null>(
    null
  );
  const [selectedChoice, setSelectedChoice] = useState<number | null>(
    null
  );
  const [quizResult, setQuizResult] = useState<
    "correct" | "wrong" | null
  >(null);

  // claim guard
  const [claimed, setClaimed] = useState(false);

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

  /* Cooldown (ignored in DEV) */
  useEffect(() => {
    if (!address) {
      setCooldown(0);
      return;
    }
    if (DEV_MODE) {
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
      const left = Math.max(
        0,
        COOLDOWN_SEC * 1000 - (Date.now() - last)
      );
      setCooldown(Math.ceil(left / 1000));
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [address]);

  /* Spin */
  const handleSpin = () => {
    if (!address) {
      alert("Connect your wallet to spin.");
      return;
    }
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
      const normalized =
        ((POINTER_ANGLE - final) % 360 + 360) % 360;
      const idx =
        Math.floor(normalized / anglePerSegment) % SEGMENTS;

      const questLabel = QUESTS[idx];
      setResult(questLabel);

      // automatic loss for Bankruptcy
      if (address && questLabel === "Bankruptcy") {
        addBrain(address, "Bankruptcy", -20);
        setClaimed(true);
        refresh();
      }

      // prepare quiz if needed
      if (questLabel === "Base Speed Quiz") {
        setActiveQuiz(getRandomBaseQuiz());
      } else if (questLabel === "Farcaster Flash Quiz") {
        setActiveQuiz(getRandomFarcasterQuiz());
      } else if (questLabel === "Mini app quiz") {
        setActiveQuiz(getRandomMiniAppQuiz());
      } else {
        setActiveQuiz(null);
      }

      // activate x2 for next gain
      if (address && questLabel === "Double points") {
        setDoubleNext(address);
      }

      // store timestamp (prod only)
      if (address && !DEV_MODE) {
        const key = `dw:lastSpin:${address.toLowerCase()}`;
        localStorage.setItem(key, String(Date.now()));
      }

      setSpinning(false);
    }, SPIN_DURATION_MS);
  };

  /* Quiz answer */
  const handleAnswer = (index: number) => {
    if (!activeQuiz || quizResult) return;

    const isCorrect = index === activeQuiz.correctIndex;
    setSelectedChoice(index);
    setQuizResult(isCorrect ? "correct" : "wrong");

    if (isCorrect && address && !claimed) {
      const questName =
        result ??
        (activeQuiz.category === "base"
          ? "Base Speed Quiz"
          : activeQuiz.category === "farcaster"
          ? "Farcaster Flash Quiz"
          : "Mini app quiz");
      const base = QUEST_POINTS[questName] ?? 4;

      addBrain(address, questName, base);
      setClaimed(true);
      refresh();
    }
  };

  /* New question, same topic (plus utilisé en UI, mais on garde si besoin futur) */
  const newQuestionSameTopic = () => {
    if (!activeQuiz) return;
    let q: QuizQuestion;
    if (activeQuiz.category === "base") {
      q = getRandomBaseQuiz();
    } else if (activeQuiz.category === "farcaster") {
      q = getRandomFarcasterQuiz();
    } else {
      q = getRandomMiniAppQuiz();
    }
    setActiveQuiz(q);
    setSelectedChoice(null);
    setQuizResult(null);
  };

  /* Cooldown label */
  const cooldownLabel = useMemo(() => {
    if (!address) return "Connect your wallet to start";
    if (DEV_MODE) return "DEV mode: unlimited spins";
    if (cooldown <= 0) return "You can spin now";
    const h = Math.floor(cooldown / 3600);
    const m = Math.floor((cooldown % 3600) / 60);
    const s = cooldown % 60;
    return `Next spin in ${String(h).padStart(2, "0")}:${String(
      m
    ).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
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
    address && address.length > 10
      ? `${address.slice(0, 6)}…${address.slice(-4)}`
      : address ?? "";

  const resetDaily = () => {
    if (!address) return;
    localStorage.removeItem(`dw:lastSpin:${address.toLowerCase()}`);
    setCooldown(0);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col items-center pt-10 px-4">
      <h1 className="text-5xl font-extrabold tracking-tight mb-4">
        DailyWheel
      </h1>

      {/* Address + Brain + Disconnect */}
      <div className="mb-4 flex flex-col items-center gap-2">
        {address ? (
          <>
            <div className="px-4 py-1 rounded-full bg-slate-900 border border-slate-700 text-xs font-mono">
              {shortAddress}
            </div>
            <div className="text-xs text-amber-300 font-semibold">
              Brain: {brain} 🧠{" "}
              {hasDouble && (
                <span className="text-emerald-400">(x2 ready)</span>
              )}
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

      {/* Spin / Reset dev */}
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={handleSpin}
          disabled={
            spinning ||
            (!DEV_MODE && (cooldown > 0 || !address)) ||
            !address
          }
          className={`px-6 py-2 rounded-xl text-base font-semibold transition ${
            spinning ||
            (!DEV_MODE && (cooldown > 0 || !address))
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

      <span className="text-xs text-slate-400 mb-4">
        {cooldownLabel}
      </span>

      {/* HAVE TO DO + description + quiz panel */}
      <div className="w-full max-w-xl mb-4">
        <div className="text-center mb-3">
          {result ? (
            <>
              <div className="text-sm font-semibold">
                Have to do:{" "}
                <span className="font-bold">{result}</span>
              </div>
              <div className="mt-1 text-xs text-slate-400">
                {QUEST_DESCRIPTIONS[result] ??
                  "Complete this quest today to validate it and earn Brain points."}
              </div>
            </>
          ) : (
            <span className="text-slate-400">
              Spin the wheel to get today&apos;s quest
            </span>
          )}
        </div>

        {activeQuiz && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wide text-slate-400">
                {activeQuiz.category === "base"
                  ? "BASE SPEED QUIZ"
                  : activeQuiz.category === "farcaster"
                  ? "FARCASTER FLASH QUIZ"
                  : "MINI APP QUIZ"}
              </span>
              <div className="flex items-center gap-2">
                {quizResult === "correct" && (
                  <span className="text-xs font-semibold text-emerald-400">
                    Correct ✅
                  </span>
                )}
                {quizResult === "wrong" && (
                  <span className="text-xs font-semibold text-rose-400">
                    Not this time ❌
                  </span>
                )}
              </div>
            </div>

            <p className="text-sm font-medium mb-3">
              {activeQuiz.question}
            </p>

            <div className="flex flex-col gap-2">
              {activeQuiz.choices.map((choice, idx) => {
                const isSelected = selectedChoice === idx;
                const isCorrect =
                  quizResult === "correct" &&
                  idx === activeQuiz.correctIndex;
                const isWrongSelected =
                  quizResult === "wrong" && isSelected;
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
                      ${
                        quizResult ? "cursor-default" : "cursor-pointer"
                      }
                    `}
                  >
                    {choice}
                  </button>
                );
              })}
            </div>

            {activeQuiz.explain && quizResult && (
              <p className="mt-3 text-[11px] text-slate-400">
                {activeQuiz.explain}
              </p>
            )}

            {!quizResult && (
              <p className="mt-3 text-[11px] text-slate-500">
                Pick one answer. Only one shot 😄
              </p>
            )}
          </div>
        )}
      </div>

      {/* Manual claim for non-quiz quests (except Bankruptcy) */}
      {result &&
        result !== "Base Speed Quiz" &&
        result !== "Farcaster Flash Quiz" &&
        result !== "Mini app quiz" &&
        result !== "Bankruptcy" && (
          <div className="w-full max-w-xl mb-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 flex items-center justify-between">
              <div className="text-sm">
                <div className="font-medium">Quest action</div>
                <div className="text-xs text-slate-400">
                  {hasDouble
                    ? "Double points is active for this wallet."
                    : "Click to validate and earn Brain."}
                </div>
              </div>
              <button
                disabled={
                  !address ||
                  claimed ||
                  (QUEST_POINTS[result] ?? 0) <= 0
                }
                onClick={() => {
                  if (!address) return;
                  const base = QUEST_POINTS[result] ?? 0;
                  if (base <= 0) return;
                  addBrain(address, result, base);
                  setClaimed(true);
                  refresh();
                }}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition
                  ${
                    !address ||
                    claimed ||
                    (QUEST_POINTS[result] ?? 0) <= 0
                      ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                      : "bg-emerald-500 text-white hover:bg-emerald-400"
                  }`}
              >
                {claimed
                  ? "Claimed ✓"
                  : `Validate (+${QUEST_POINTS[result] ?? 0} 🧠)`}
              </button>
            </div>
          </div>
        )}

      {/* Arrow + wheel */}
      <div className="relative w-[640px] h-[640px] max-w-full">
        {/* Arrow */}
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

        {/* Wheel */}
        <svg
          viewBox="-300 -300 600 600"
          className="w-full h-full drop-shadow-[0_0_40px_rgba(15,23,42,0.8)]"
        >
          <circle r={R_OUT + 10} fill={BG_COLOR} />
          <circle
            r={R_OUT + 6}
            fill="none"
            stroke="#020617"
            strokeWidth={6}
          />

          <g
            style={{
              transform: `rotate(${rotation}deg)`,
              transformOrigin: "center",
              transformBox: "fill-box" as any,
              transition: `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.23, 1, 0.32, 1)`,
            }}
          >
            {/* Segments */}
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
                <g
                  key={`label-${i}`}
                  transform={`rotate(${mid}) translate(0, -${radiusText}) rotate(90)`}
                >
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

            {/* Center */}
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
        1 spin per day per wallet. DEV mode disables the limit locally.
      </p>
    </main>
  );
}

