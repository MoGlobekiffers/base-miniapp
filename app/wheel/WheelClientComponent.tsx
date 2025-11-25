"use client";

import { useEffect, useMemo, useState } from "react";
import { ConnectWallet } from "@coinbase/onchainkit/wallet";
import { useAccount, useDisconnect, useWalletClient, useReadContract } from "wagmi"; 
import sdk from '@farcaster/frame-sdk';

import type { QuizQuestion } from "./quizPools";
import {
  getRandomBaseQuiz,
  getRandomFarcasterQuiz,
  getRandomMiniAppQuiz,
} from "./quizPools";

import { useBrain, addBrain, setDoubleNext } from "../brain";

// 🔗 Onchain + signature
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
import BrainScoreSigned from "@/types/BrainScoreSigned.json"; // Votre ABI

// 👇 NOS NOUVEAUX COMPOSANTS (Leaderboard et Badges)
import Leaderboard from "../components/Leaderboard";
import BadgesPanel from "../components/BadgesPanel"; 

/* =======================
 * Quests & appearance
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
  "Bonus spin",
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

const R_OUT = 260;
const R_IN = 78;

const POINTER_ANGLE = 0;

const SPIN_DURATION_MS = 4500;
const COOLDOWN_SEC = 12 * 3600;
const DEV_MODE =
  typeof process !== "undefined" &&
  process.env.NEXT_PUBLIC_DW_DEV === "1";

/* =======================
 * Brain points
 * ======================= */

const QUEST_POINTS: Record<string, number> = {
  "Base Speed Quiz": 5,
  "Farcaster Flash Quiz": 5,
  "Mini app quiz": 5,
  "Cast Party": 3,
  "Like Storm": 3,
  "Reply Sprint": 3,
  "Invite & Share": 3,
  "Test a top mini app": 4,
  "Bonus spin": 1,
  "Meme Factory": 4,
  "Mint my NFT Free": 5,
  "Mini apps mashup": 4,
  "Crazy promo": 4,
  Bankruptcy: -20,
  "Creative #gm": 3,
  "Daily check-in": 2,
  "Mystery Challenge": 4,
  "Double points": 0,
  "Web3 Survivor": 8,
};

/* =======================
 * Quest descriptions
 * ======================= */

const QUEST_DESCRIPTIONS: Record<string, string> = {
  "Base Speed Quiz":
    "Open the Base Speed Quiz card below and answer the multiple-choice question. One try only. A correct answer awards Brain points.",
  "Farcaster Flash Quiz":
    "Open the Farcaster Flash Quiz card below and answer the question about the social protocol. One shot: get it right to earn Brain.",
  "Mini app quiz":
    "Answer the question about mini apps and frames on Base and Farcaster. One correct answer = Brain points.",
  "Cast Party":
    "Post one fun cast that mentions at least one mini app or onchain action. Make it playful, not spammy.",
  "Like Storm":
    "Like at least 10 casts in your favorite channels to spread some love across the feed.",
  "Reply Sprint":
    "Reply to 5 different casts with something useful, kind, or funny. No low-effort spam.",
  "Invite & Share":
    "Invite a friend to try a mini app or Farcaster, then share the link or a quick screenshot with them.",
  "Test a top mini app":
    "Open a popular mini app, try a real action (mint, vote, play, etc.) and note what you liked or disliked.",
  "Bonus spin":
    "You win +1 Brain and an extra spin of the wheel. Use your free spin wisely.",
  "Meme Factory":
    "Create and post a new onchain or crypto meme (image, text, or frame) and share it on Farcaster.",
  "Mint my NFT Free":
    "Mint a free or low-cost NFT on Base today and keep it as a small onchain souvenir.",
  "Mini apps mashup":
    "Imagine a funny fusion of two existing mini apps and describe it in one cast.",
  "Crazy promo":
    "Write an over-the-top, funny promotional cast for the mini app of your choice.",
  Bankruptcy:
    "Oh no! You lose 20 Brain points. Take a breath, then plan your comeback with the next quests.",
  "Creative #gm":
    "Post an original ‘gm’ cast with a twist: image, joke, drawing, or onchain action.",
  "Daily check-in":
    "Cast a short update about what you plan to build, learn, or test today onchain.",
  "Mystery Challenge":
    "Invent your own small onchain or social challenge for today, complete it, and write a short recap.",
  "Double points":
    "Your next validated quest will give double Brain points. Pick a good one to cash in.",
  "Web3 Survivor":
    "Do 3 different web3 actions today (cast, like, mint, play a mini app) and survive the chaos.",
};

/* =======================
 * Geometry helpers
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
 * Onchain helpers
 * ======================= */

async function getPlayerNonce(player: string) {
  const publicClient = createPublicClient({
    chain: base,
    transport: http(process.env.NEXT_PUBLIC_RPC_URL),
  });

  const [total, quests] = (await publicClient.readContract({
    address: process.env.NEXT_PUBLIC_BRAIN_CONTRACT as `0x${string}`,
    abi: BrainScoreSigned.abi,
    functionName: "getPlayer",
    args: [player],
  })) as readonly [bigint, bigint];

  return Number(quests) + 1;
}

async function signReward(
  player: string,
  questId: string,
  delta: number,
  nonce: number
) {
  const deadline = Math.floor(Date.now() / 1000) + 300; 

  const res = await fetch("/api/brain-sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      player,
      questId,
      delta,
      nonce,
      deadline,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to sign reward");
  }

  return { signature: data.signature as `0x${string}`, deadline };
}

async function sendClaim(
  walletClient: any,
  delta: number,
  nonce: number,
  deadline: number,
  signature: `0x${string}`,
  userAddress: `0x${string}`
) {
  try {
    if(walletClient.chain?.id !== base.id) {
       await walletClient.switchChain({ id: base.id });
    }
  } catch (e) {
    console.log("Chain switch skipped or failed", e);
  }

  const isNegative = delta < 0;
  const absAmount = BigInt(Math.abs(delta));

  const hash = await walletClient.writeContract({
    account: userAddress,
    address: process.env.NEXT_PUBLIC_BRAIN_CONTRACT as `0x${string}`,
    abi: BrainScoreSigned.abi,
    functionName: "claim",
    args: [absAmount, isNegative, BigInt(nonce), BigInt(deadline), signature],
  });

  return hash;
}

/* =======================
 * Page component
 * ======================= */

const BRAIN_CONTRACT = process.env.NEXT_PUBLIC_BRAIN_CONTRACT as `0x${string}`;

export default function WheelClientPage() { 
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      await sdk.actions.ready(); 
    };
    if (sdk && !isSDKLoaded) {
      setIsSDKLoaded(true);
      load();
    }
  }, [isSDKLoaded]);

  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: walletClient } = useWalletClient(); 

  const { data: scoreData, refetch: refetchScore } = useReadContract({
    address: BRAIN_CONTRACT,
    abi: BrainScoreSigned.abi, 
    functionName: "getPlayer", 
    args: [address],
    query: {
        staleTime: 0, 
        enabled: !!address, 
    }
  });

  const currentOnChainScore = (scoreData && Array.isArray(scoreData)) ? Number(scoreData[0]) : 0; 
  const brain = currentOnChainScore; 
  const hasDouble = false; 
  
  const [mounted, setMounted] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState<number>(0);

  const [activeQuiz, setActiveQuiz] = useState<QuizQuestion | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [quizResult, setQuizResult] = useState<"correct" | "wrong" | null>(
    null
  );

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

  /* Cooldown */
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
      const left = Math.max(0, COOLDOWN_SEC * 1000 - (Date.now() - last));
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

    setResult(null);

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

      if (questLabel === "Base Speed Quiz") {
        setActiveQuiz(getRandomBaseQuiz());
      } else if (questLabel === "Farcaster Flash Quiz") {
        setActiveQuiz(getRandomFarcasterQuiz());
      } else if (questLabel === "Mini app quiz") {
        setActiveQuiz(getRandomMiniAppQuiz());
      } else {
        setActiveQuiz(null);
      }

      if (address && !DEV_MODE) {
        const key = `dw:lastSpin:${address.toLowerCase()}`;
        if (questLabel !== "Bonus spin") {
          localStorage.setItem(key, String(Date.now()));
        }
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
  };

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

  const canSpin =
    !!address && !(spinning || (!DEV_MODE && (cooldown > 0 || !address)));

  // Logique d'affichage du bouton valider
  const isQuiz = [
    "Base Speed Quiz", 
    "Farcaster Flash Quiz", 
    "Mini app quiz"
  ].includes(result || "");

  const showClaimPanel =
    result &&                           
    (QUEST_POINTS[result] ?? 0) !== 0 &&              
    (!isQuiz || quizResult === "correct");

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col items-center pt-2 md:pt-8 px-4 overflow-x-hidden">
      
      {/* TITRE */}
      <h1 className="text-2xl md:text-5xl font-black tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
        DailyWheel
      </h1>

      {/* BOUTON CONNECT */}
      <div className="mb-2 flex flex-col items-center gap-1 scale-90 origin-top">
        {address ? (
          <>
            <div className="px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700 text-[10px] font-mono text-slate-400">
              {shortAddress}
            </div>
            <div className="text-sm text-amber-300 font-bold flex items-center gap-2 bg-slate-800/50 px-3 py-1 rounded-lg">
              <span>Brain: {currentOnChainScore} 🧠</span>
              {hasDouble && <span className="text-emerald-400 text-xs animate-pulse">(x2 Active)</span>}
            </div>
            <button
              onClick={() => disconnect()}
              className="text-[10px] px-2 py-0.5 rounded text-slate-500 hover:text-slate-300 underline decoration-dotted"
            >
              Disconnect
            </button>
          </>
        ) : (
          <div className="opacity-90 hover:opacity-100 transition-opacity">
             <ConnectWallet />
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 mb-1">
        {DEV_MODE && address && (
          <button onClick={resetDaily} className="px-2 py-1 rounded text-[10px] border border-emerald-500/50 text-emerald-300">
            Reset Limit
          </button>
        )}
      </div>

      <span className="text-xs text-slate-400 mb-3 font-semibold">
        {cooldownLabel}
      </span>

      {showClaimPanel && (
        <div className="w-full max-w-xs mb-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-900/20 p-3 flex items-center justify-between shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            <div className="text-xs">
              <div className="font-bold text-emerald-400">Quest Complete!</div>
              <div className="text-[10px] text-emerald-200/70">Tap to claim your points</div>
            </div>
            <button
              disabled={!address || claimed || !walletClient}
              onClick={async () => {
                if (!address || !result || !walletClient) return;
                const basePoints = QUEST_POINTS[result] ?? 0;
                if (basePoints === 0) return;
                try {
                  const delta = basePoints;
                  const nonce = await getPlayerNonce(address);
                  const { signature, deadline } = await signReward(address, result, delta, nonce);
                  await sendClaim(walletClient, delta, nonce, deadline, signature, address);
                  console.log("Claim tx sent");
                  addBrain(address, result, basePoints);
                  setClaimed(true);
                  refetchScore(); 
                } catch (err) { console.error(err); alert("Error sending onchain claim"); }
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider shadow-lg transition-all
                  ${!address || claimed ? "bg-slate-800 text-slate-500" : "bg-emerald-500 text-white hover:bg-emerald-400 hover:scale-105"}`}
            >
              {claimed ? "Done" : `Claim +${QUEST_POINTS[result] ?? 0}`}
            </button>
          </div>
        </div>
      )}

      {/* LA ROUE */}
      <div className="relative w-full max-w-[340px] aspect-square md:max-w-[600px]">
        
        {/* POINTEUR NÉON (REMONTÉ) */}
        <div
          className="absolute left-1/2 -translate-x-1/2 z-20 pointer-events-none"
          style={{ top: 5 }} 
        >
          <svg width="50" height="40" viewBox="0 0 50 40" className="drop-shadow-[0_0_10px_rgba(56,189,248,0.8)]">
            <defs>
              <linearGradient id="neonArrow" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#22d3ee" /> 
                <stop offset="100%" stopColor="#3b82f6" /> 
              </linearGradient>
            </defs>
            <path
              d="M25 40 L10 10 H40 Z" 
              fill="url(#neonArrow)"
              stroke="#cffafe"
              strokeWidth={2}
              strokeLinejoin="round"
            />
          </svg>
        </div>
        
        <svg
          viewBox="-300 -300 600 600"
          className="w-full h-full drop-shadow-2xl"
        >
          <circle r={R_OUT + 12} fill="#0f172a" />
          <circle r={R_OUT + 8} fill="none" stroke="#1e293b" strokeWidth={4} />
          <circle r={R_OUT + 2} fill="none" stroke="#38bdf8" strokeWidth={2} strokeOpacity={0.5} />

          <g
            style={{
              transform: `rotate(${rotation}deg)`,
              transformOrigin: "center",
              transformBox: "fill-box" as any,
              transition: `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.2, 0.8, 0.2, 1)`,
            }}
          >
            {Array.from({ length: SEGMENTS }, (_, i) => {
              const a0 = i * (360 / SEGMENTS);
              const a1 = (i + 1) * (360 / SEGMENTS);
              return (
                <path
                  key={`wedge-${i}`}
                  d={wedgePath(R_OUT, R_IN, a0, a1)}
                  fill={COLORS[i % COLORS.length]}
                  stroke="#0f172a"
                  strokeWidth={2}
                />
              );
            })}

            {Array.from({ length: SEGMENTS }, (_, i) => {
              const a0 = i * anglePerSegment;
              const mid = a0 + anglePerSegment / 2;
              const radiusText = (R_OUT + R_IN) / 2;
              return (
                <g
                  key={`label-${i}`}
                  transform={`rotate(${mid}) translate(0, -${radiusText}) rotate(90)`}
                >
                  {/* TEXTE EN VIOLET FONCÉ */}
                  <text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#2e1065" 
                    fontSize="14" 
                    fontWeight={900}
                    style={{ textShadow: "0 1px 0px rgba(255,255,255,0.2)" }}
                  >
                    {QUESTS[i]}
                  </text>
                </g>
              );
            })}

            {/* Centre de la roue */}
            <circle r={R_IN} fill="#0f172a" stroke="#38bdf8" strokeWidth={4} />
          </g>
        </svg>

        {/* BOUTON SPIN CENTRAL AVEC LOGO ET CHEMIN CORRIGÉ */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <button
            onClick={handleSpin}
            disabled={!canSpin}
            className={`pointer-events-auto w-24 h-24 rounded-full flex items-center justify-center
              border-4 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.6)] overflow-hidden relative
              transition-transform active:scale-95
              ${!canSpin ? "opacity-50 grayscale cursor-not-allowed" : "cursor-pointer hover:scale-105"}`}
          >
            <img
              src="/base-logo-in-blue.png" 
              alt="Spin"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <span className="relative z-10 text-xl font-black text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] uppercase tracking-widest">
              Spin
            </span>
          </button>
        </div>
      </div>

      {/* --- BADGES --- */}
      <div className="w-full max-w-4xl mt-6 border-t border-slate-800/50 pt-6 pb-20">
        <h2 className="text-lg font-bold mb-4 text-center text-slate-400 uppercase tracking-widest text-[10px]">
          Your Trophy Room
        </h2>
        {address ? (
          <BadgesPanel userAddress={address} currentScore={currentOnChainScore} /> 
        ) : (
          <p className="text-center text-xs text-slate-600">Connect wallet to view badges</p>
        )}
      </div>

    </main>
  );
}
