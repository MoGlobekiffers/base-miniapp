"use client";

import { useEffect, useMemo, useState } from "react";
import { ConnectWallet } from "@coinbase/onchainkit/wallet";
import { useAccount, useDisconnect, useWalletClient, useReadContract } from "wagmi"; 
import sdk from '@farcaster/frame-sdk';
// 👇 IMPORT DE L'IMAGE POUR ÊTRE SÛR QU'ELLE S'AFFICHE
import BaseLogo from '../../public/base-logo-in-blue.png'; 

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
import BrainScoreSigned from "@/types/BrainScoreSigned.json"; 

import Leaderboard from "../components/Leaderboard";
import BadgesPanel from "../components/BadgesPanel"; 

/* =======================
 * Quests & appearance
 * ======================= */

const QUESTS: string[] = [
  "Base Speed Quiz", "Farcaster Flash Quiz", "Mini app quiz", "Cast Party",
  "Like Storm", "Reply Sprint", "Invite & Share", "Test a top mini app",
  "Bonus spin", "Meme Factory", "Mint my NFT Free", "Mini apps mashup",
  "Crazy promo", "Bankruptcy", "Creative #gm", "Daily check-in",
  "Mystery Challenge", "Bonus spin", "Double points", "Web3 Survivor",
];

const POINTER_Y = 40;
const SEGMENTS = QUESTS.length;
const COLORS = [
  "#f97316", "#3b82f6", "#22c55e", "#a855f7", "#eab308",
  "#38bdf8", "#f97316", "#22c55e", "#3b82f6", "#f97316",
];
const BG_COLOR = "#020617";
const R_OUT = 260;
const R_IN = 78;
const POINTER_ANGLE = 0;
const SPIN_DURATION_MS = 4500;
const COOLDOWN_SEC = 12 * 3600;
const DEV_MODE = typeof process !== "undefined" && process.env.NEXT_PUBLIC_DW_DEV === "1";

/* =======================
 * Brain points
 * ======================= */
const QUEST_POINTS: Record<string, number> = {
  "Base Speed Quiz": 5, "Farcaster Flash Quiz": 5, "Mini app quiz": 5,
  "Cast Party": 3, "Like Storm": 3, "Reply Sprint": 3, "Invite & Share": 3,
  "Test a top mini app": 4, "Bonus spin": 1, "Meme Factory": 4,
  "Mint my NFT Free": 5, "Mini apps mashup": 4, "Crazy promo": 4,
  Bankruptcy: -20, "Creative #gm": 3, "Daily check-in": 2,
  "Mystery Challenge": 4, "Double points": 0, "Web3 Survivor": 8,
};

const QUEST_DESCRIPTIONS: Record<string, string> = {
  "Base Speed Quiz": "Open the Base Speed Quiz card below and answer...",
  // ... (Gardez vos descriptions longues ici, je raccourcis pour la lisibilité du code ici)
};

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
  return `M ${x0} ${y0} A ${rOut} ${rOut} 0 ${largeArc} 1 ${x1} ${y1} L ${x2} ${y2} A ${rIn} ${rIn} 0 ${largeArc} 0 ${x3} ${y3} Z`;
}

/* =======================
 * Onchain helpers
 * ======================= */
async function getPlayerNonce(player: string) {
  const publicClient = createPublicClient({ chain: base, transport: http(process.env.NEXT_PUBLIC_RPC_URL) });
  const [total, quests] = (await publicClient.readContract({
    address: process.env.NEXT_PUBLIC_BRAIN_CONTRACT as `0x${string}`,
    abi: BrainScoreSigned.abi,
    functionName: "getPlayer",
    args: [player],
  })) as readonly [bigint, bigint];
  return Number(quests) + 1;
}

async function signReward(player: string, questId: string, delta: number, nonce: number) {
  const deadline = Math.floor(Date.now() / 1000) + 300; 
  const res = await fetch("/api/brain-sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ player, questId, delta, nonce, deadline }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to sign reward");
  return { signature: data.signature as `0x${string}`, deadline };
}

async function sendClaim(walletClient: any, delta: number, nonce: number, deadline: number, signature: `0x${string}`, userAddress: `0x${string}`) {
  try {
    if(walletClient.chain?.id !== base.id) await walletClient.switchChain({ id: base.id });
  } catch (e) { console.log("Chain switch skipped", e); }
  const isNegative = delta < 0;
  const absAmount = BigInt(Math.abs(delta));
  return await walletClient.writeContract({
    account: userAddress,
    address: process.env.NEXT_PUBLIC_BRAIN_CONTRACT as `0x${string}`,
    abi: BrainScoreSigned.abi,
    functionName: "claim",
    args: [absAmount, isNegative, BigInt(nonce), BigInt(deadline), signature],
  });
}

/* =======================
 * Page component
 * ======================= */
const BRAIN_CONTRACT = process.env.NEXT_PUBLIC_BRAIN_CONTRACT as `0x${string}`;

export default function WheelClientPage() { 
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);

  useEffect(() => {
    const load = async () => { await sdk.actions.ready(); };
    if (sdk && !isSDKLoaded) { setIsSDKLoaded(true); load(); }
  }, [isSDKLoaded]);

  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: walletClient } = useWalletClient(); 

  const { data: scoreData, refetch: refetchScore } = useReadContract({
    address: BRAIN_CONTRACT,
    abi: BrainScoreSigned.abi, 
    functionName: "getPlayer", 
    args: [address],
    query: { staleTime: 0, enabled: !!address }
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
  const [quizResult, setQuizResult] = useState<"correct" | "wrong" | null>(null);
  const [claimed, setClaimed] = useState(false);
  
  useEffect(() => { setMounted(true); }, []);

  const anglePerSegment = 360 / SEGMENTS;
  const segments = useMemo(() => Array.from({ length: SEGMENTS }, (_, i) => {
    const a0 = i * anglePerSegment;
    const a1 = (i + 1) * anglePerSegment;
    const mid = a0 + anglePerSegment / 2;
    return { i, a0, a1, mid, color: COLORS[i % COLORS.length], label: QUESTS[i] };
  }), [anglePerSegment]);

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

  const handleSpin = () => {
    if (!address) { alert("Connect your wallet to spin."); return; }
    if (!DEV_MODE && (spinning || cooldown > 0)) return;
    setSpinning(true); setActiveQuiz(null); setSelectedChoice(null); setQuizResult(null); setClaimed(false); setResult(null);
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
      if (questLabel === "Base Speed Quiz") setActiveQuiz(getRandomBaseQuiz());
      else if (questLabel === "Farcaster Flash Quiz") setActiveQuiz(getRandomFarcasterQuiz());
      else if (questLabel === "Mini app quiz") setActiveQuiz(getRandomMiniAppQuiz());
      else setActiveQuiz(null);
      if (address && !DEV_MODE) {
        const key = `dw:lastSpin:${address.toLowerCase()}`;
        if (questLabel !== "Bonus spin") localStorage.setItem(key, String(Date.now()));
      }
      setSpinning(false);
    }, SPIN_DURATION_MS);
  };

  const handleAnswer = (index: number) => {
    if (!activeQuiz || quizResult) return;
    const isCorrect = index === activeQuiz.correctIndex;
    setSelectedChoice(index);
    setQuizResult(isCorrect ? "correct" : "wrong");
  };

  const cooldownLabel = useMemo(() => {
    if (!address) return "Connect wallet";
    if (DEV_MODE) return "DEV: Unlimited";
    if (cooldown <= 0) return "Ready!";
    const h = Math.floor(cooldown / 3600);
    const m = Math.floor((cooldown % 3600) / 60);
    const s = cooldown % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, [cooldown, address]);

  if (!mounted) return <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Loading...</main>;

  const shortAddress = address && address.length > 10 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address ?? "";
  const resetDaily = () => { if (!address) return; localStorage.removeItem(`dw:lastSpin:${address.toLowerCase()}`); setCooldown(0); };
  const canSpin = !!address && !(spinning || (!DEV_MODE && (cooldown > 0 || !address)));
const isQuiz = [
    "Base Speed Quiz", 
    "Farcaster Flash Quiz", 
    "Mini app quiz"
  ].includes(result || "");
  const showClaimPanel = result && (QUEST_POINTS[result] ?? 0) !== 0 && (!isQuiz || quizResult === "correct");

  return (
    // 👇 1. PADDING REDUIT AU MINIMUM
    <main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col items-center pt-2 px-2 overflow-x-hidden overflow-y-auto">
      
      <div className="flex w-full justify-between items-center px-2 max-w-md">
        {/* TITRE COMPACT */}
        <h1 className="text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
          DailyWheel
        </h1>
        {/* HEADER COMPACT (WALLET + SCORE) */}
        <div className="flex items-center gap-2 scale-90 origin-right">
          {address ? (
            <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700 rounded-full px-2 py-1">
               <span className="text-xs font-mono text-slate-400">{shortAddress}</span>
               <span className="text-xs text-amber-300 font-bold border-l border-slate-700 pl-2">{currentOnChainScore} 🧠</span>
            </div>
          ) : (
            <div className="scale-75 origin-right"><ConnectWallet /></div>
          )}
        </div>
      </div>

      {/* INFO BAR (Cooldown / Reset) */}
      <div className="flex justify-center items-center gap-2 my-1 h-4">
         {DEV_MODE && address && <button onClick={resetDaily} className="text-[9px] border border-emerald-500/50 text-emerald-300 px-1 rounded">Reset</button>}
         <span className="text-[10px] text-slate-500 font-mono tracking-widest">{cooldownLabel}</span>
      </div>

      {showClaimPanel && (
        /* PANEL DE RECLAMATION COMPACT */
        <div className="w-full max-w-xs mb-2 z-50 animate-in fade-in slide-in-from-bottom-4">
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-900/90 p-2 flex items-center justify-between shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <div className="text-xs font-bold text-emerald-400">Quest Complete!</div>
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
                  addBrain(address, result, basePoints);
                  setClaimed(true);
                  refetchScore(); 
                } catch (err) { console.error(err); alert("Error sending onchain claim"); }
              }}
              className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider shadow-lg
                  ${!address || claimed ? "bg-slate-800 text-slate-500" : "bg-emerald-500 text-white"}`}
            >
              {claimed ? "Done" : `Claim +${QUEST_POINTS[result] ?? 0}`}
            </button>
          </div>
        </div>
      )}

      {/* 👇 2. ROUE RÉDUITE POUR MOBILE (max-w-[300px]) */}
      <div className="relative w-full max-w-[300px] aspect-square md:max-w-[500px] my-1">
        
        {/* POINTEUR (Ajusté) */}
        <div className="absolute left-1/2 -translate-x-1/2 z-20 pointer-events-none" style={{ top: -5 }}>
          <svg width="40" height="30" viewBox="0 0 50 40" className="drop-shadow-[0_0_10px_rgba(56,189,248,0.8)]">
            <defs>
              <linearGradient id="neonArrow" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#22d3ee" /> 
                <stop offset="100%" stopColor="#3b82f6" /> 
              </linearGradient>
            </defs>
            <path d="M25 40 L10 10 H40 Z" fill="url(#neonArrow)" stroke="#cffafe" strokeWidth={2} strokeLinejoin="round" />
          </svg>
        </div>
        
        <svg viewBox="-300 -300 600 600" className="w-full h-full drop-shadow-2xl">
          <circle r={R_OUT + 12} fill="#0f172a" />
          <circle r={R_OUT + 8} fill="none" stroke="#1e293b" strokeWidth={4} />
          <circle r={R_OUT + 2} fill="none" stroke="#38bdf8" strokeWidth={2} strokeOpacity={0.5} />
          <g style={{ transform: `rotate(${rotation}deg)`, transformOrigin: "center", transformBox: "fill-box", transition: `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.2, 0.8, 0.2, 1)` }}>
            {Array.from({ length: SEGMENTS }, (_, i) => (
              <path key={`w-${i}`} d={wedgePath(R_OUT, R_IN, i * 360/SEGMENTS, (i+1) * 360/SEGMENTS)} fill={COLORS[i % COLORS.length]} stroke="#0f172a" strokeWidth={2} />
            ))}
            {Array.from({ length: SEGMENTS }, (_, i) => (
              <g key={`l-${i}`} transform={`rotate(${i * 360/SEGMENTS + 360/SEGMENTS/2}) translate(0, -${(R_OUT+R_IN)/2}) rotate(90)`}>
                <text textAnchor="middle" dominantBaseline="middle" fill="#2e1065" fontSize="13" fontWeight={900}>{QUESTS[i]}</text>
              </g>
            ))}
            <circle r={R_IN} fill="#0f172a" stroke="#38bdf8" strokeWidth={4} />
          </g>
        </svg>

        {/* 👇 3. BOUTON SPIN AVEC IMPORT D'IMAGE DIRECT */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <button onClick={handleSpin} disabled={!canSpin} className={`pointer-events-auto w-20 h-20 rounded-full flex items-center justify-center border-4 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.6)] overflow-hidden relative transition-transform active:scale-95 ${!canSpin ? "opacity-50 grayscale" : "cursor-pointer hover:scale-105"}`}>
            {/* On utilise la variable importée BaseLogo (ligne 7) */}
            <img src={BaseLogo.src} alt="Spin" className="absolute inset-0 w-full h-full object-cover" />
            <span className="relative z-10 text-lg font-black text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] uppercase tracking-widest">Spin</span>
          </button>
        </div>
      </div>

      {/* --- BADGES (COMPACT) --- */}
      <div className="w-full max-w-4xl mt-2 border-t border-slate-800/50 pt-2 pb-10 flex-1">
        <h2 className="text-xs font-bold mb-2 text-center text-slate-500 uppercase tracking-widest">Your Trophy Room</h2>
        {address ? (
          // On passe une classe pour réduire la taille des badges si le composant le permet, sinon c'est le CSS global
          <div className="scale-90 origin-top">
             <BadgesPanel userAddress={address} currentScore={currentOnChainScore} />
          </div>
        ) : (
          <p className="text-center text-[10px] text-slate-600">Connect wallet to view badges</p>
        )}
      </div>

    </main>
  );
}
