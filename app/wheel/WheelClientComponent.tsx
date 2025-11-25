// Fichier : app/wheel/wheel.tsx (Composant Client Final, SANS metadata)

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
 * Quests & appearance (Reste identique)
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
 * Brain points (Reste identique)
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
 * Quest descriptions (Reste identique)
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
 * Geometry helpers (Reste identique)
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
 * Onchain helpers (Reste identique)
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
 * Page component (MODIFIÉ)
 * ======================= */

// Votre adresse de contrat Score
const BRAIN_CONTRACT = process.env.NEXT_PUBLIC_BRAIN_CONTRACT as `0x${string}`;


export default function WheelClientPage() { // 🛑 RENOMMÉ EN WheelClientPage
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      // Signale à Farcaster que le Frame est prêt
      await sdk.actions.ready(); 
    };
    
    // On le lance uniquement si pas déjà chargé
    if (sdk && !isSDKLoaded) {
      setIsSDKLoaded(true);
      load();
    }
  }, [isSDKLoaded]);
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: walletClient } = useWalletClient(); 

  // 👇 NOUVEAU : Lecture directe de la blockchain pour obtenir le VRAI score
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

  // 👇 Extraction du score réel et assignation des anciennes variables
  const currentOnChainScore = (scoreData && Array.isArray(scoreData)) ? Number(scoreData[0]) : 0; 
  const brain = currentOnChainScore; 
  const hasDouble = false; 
  const refresh = refetchScore; 
  
  
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

      // La logique de double points utilise addBrain, que nous conservons.
      if (address && questLabel === "Double points") {
        // La logique ici doit être mise à jour pour utiliser la nouvelle fonction de rafraîchissement
        // setDoubleNext(address); 
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

  const currentPoints = result ? (QUEST_POINTS[result] ?? 0) : 0;

  const showClaimPanel =
    result &&                           
    currentPoints !== 0 &&              
    (!isQuiz || quizResult === "correct");

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col items-center pt-10 px-4">
      <h1 className="text-5xl font-extrabold tracking-tight mb-4">
        DailyWheel
      </h1>

      <div className="mb-4 flex flex-col items-center gap-2">
        {address ? (
          <>
            <div className="px-4 py-1 rounded-full bg-slate-900 border border-slate-700 text-xs font-mono">
              {shortAddress}
            </div>
            <div className="text-xs text-amber-300 font-semibold">
              Brain: {currentOnChainScore} 🧠{" "}{/* ⬅️ UTILISE LA NOUVELLE VARIABLE */}
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

      <div className="flex items-center gap-3 mb-2">
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

      {showClaimPanel && (
        <div className="w-full max-w-xl mb-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 flex items-center justify-between">
            <div className="text-sm">
              <div className="font-medium">Quest action</div>
              <div className="text-xs text-slate-400">
                {hasDouble
                  ? "Double points is active for this wallet."
                  : "Click when you have completed the quest to earn Brain."}
              </div>
            </div>
            <button
              disabled={
                !address ||
                claimed ||
                !walletClient
              }
              onClick={async () => {
                if (!address || !result || !walletClient) return;

                const basePoints = QUEST_POINTS[result] ?? 0;
                if (basePoints === 0) return;

                try {
                  const delta = basePoints;
                  const nonce = await getPlayerNonce(address);
                  const { signature, deadline } = await signReward(
                    address,
                    result,
                    delta,
                    nonce
                  );

                  const txHash = await sendClaim(
                    walletClient,
                    delta,
                    nonce,
                    deadline,
                    signature,
                    address 
                  );

                  console.log("Claim tx:", txHash);

                  addBrain(address, result, basePoints);
                  setClaimed(true);
                  // La fonction refresh originale du hook est remplacée par le refetch du score
                  refetchScore(); 
                } catch (err) {
                  console.error(err);
                  alert("Error sending onchain claim");
                }
              }}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition
                  ${
                    !address ||
                    claimed 
                      ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                      : "bg-emerald-500 text-white hover:bg-emerald-400"
                  }`}
            >
              {claimed
                ? "Claimed ✓"
                : `Validate (${QUEST_POINTS[result] > 0 ? "+" : ""}${QUEST_POINTS[result] ?? 0} 🧠)`}
            </button>
          </div>
        </div>
      )}

      <div className="relative w-[640px] h-[640px] max-w-full">
        {/*
          ==============================================
          POINTEUR : FLÈCHE NÉON (NEON ARROW) - OPTION 2
          ==============================================
        */}
        
        <div
          className="absolute left-1/2 -translate-x-1/2 z-20 pointer-events-none"
          style={{ top: 38 }} // Position ajustée pour la flèche
        >
          <svg width="48" height="32" viewBox="0 0 48 32">
            <defs>
              {/* Dégradé du Néon : Du cyan au violet */}
              <linearGradient id="neonGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" /> 
                <stop offset="100%" stopColor="#8b5cf6" /> 
              </linearGradient>
              {/* Filtre de lueur intense (Néon) */}
              <filter id="neonGlow">
                <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                <feFlood floodColor="#3b82f6" floodOpacity="1" result="color"/>
                <feComposite in="color" in2="blur" operator="in" result="glow"/>
                <feMerge>
                  <feMergeNode in="glow"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <path
              // Flèche moderne et élancée
              d="M24 30 L8 5 H40 Z" 
              fill="url(#neonGradient)"
              stroke="#020617"
              strokeWidth={4}
              strokeLinejoin="round"
              style={{ filter: 'url(#neonGlow)' }} 
            />
          </svg>
        </div>
        
        
        <svg
          viewBox="-300 -300 600 600"
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
                    fontSize="15"
                    fontWeight={700}
                    paintOrder="stroke"
                  >
                    {QUESTS[i]}
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

        {/* Spin button in the center, on top of the logo */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <button
            onClick={handleSpin}
            disabled={!canSpin}
            className={`pointer-events-auto rounded-full focus:outline-none focus:ring-2 focus:ring-sky-400 ${
              !canSpin ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            <div className="relative">
              <img
                src="/base-logo-in-blue.png"
                alt="Spin on Base"
                className="w-40 h-40 rounded-full shadow-2xl"
              />
              <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-white drop-shadow-[0_0_6px_rgba(0,0,0,0.7)]">
                Spin
              </span>
            </div>
          </button>
        </div>
      </div>

      <p className="mt-6 text-xs text-slate-500 max-w-md text-center">
        1 spin every 12 hours per wallet. DEV mode disables the limit locally.
      </p>

      {/* --- BADGES (INTEGRATION CORRIGÉE) --- */}
      <div className="w-full max-w-4xl mt-12 pt-8 border-t border-slate-800">
        <h2 className="text-2xl font-bold mb-6 text-center text-purple-400">
          🏆 Hall of Fame
        </h2>
        
        {address ? (
          <BadgesPanel userAddress={address} currentScore={currentOnChainScore} /> 
        ) : (
          <p className="text-center text-slate-500">
             Connecte ton wallet pour voir tes badges
          </p>
        )}
      </div>

      {/* --- LEADERBOARD --- */}
      <div className="w-full flex justify-center pb-20 mt-8">
        <Leaderboard />
      </div>

    </main>
  );
}
