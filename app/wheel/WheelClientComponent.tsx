"use client";

import { useEffect, useMemo, useState } from "react";
import { ConnectWallet } from "@coinbase/onchainkit/wallet";
import { useAccount, useDisconnect, useWalletClient, useReadContract } from "wagmi";
import sdk from '@farcaster/frame-sdk';
// IMPORT IMAGE - Assurez-vous que le chemin est correct
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

const SEGMENTS = QUESTS.length;
const COLORS = [
  "#f97316", "#3b82f6", "#22c55e", "#a855f7", "#eab308",
  "#38bdf8", "#f97316", "#22c55e", "#3b82f6", "#f97316",
];
// Taille de la roue INCHANGÉE
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

/* =======================
 * Helpers
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
  return `M ${x0} ${y0} A ${rOut} ${rOut} 0 ${largeArc} 1 ${x1} ${y1} L ${x2} ${y2} A ${rIn} ${rIn} 0 ${largeArc} 0 ${x3} ${y3} Z`;
}

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
  const anglePerSegment = 360 / SEGMENTS;
  const isQuiz = ["Base Speed Quiz", "Farcaster Flash Quiz", "Mini app quiz"].includes(result || "");
  const showClaimPanel = result && (QUEST_POINTS[result] ?? 0) !== 0 && (!isQuiz || quizResult === "correct");

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col items-center overflow-x-hidden font-sans pb-10">

      {/* --- NOUVEAU HEADER TOP BAR --- */}
      <div className="w-full bg-slate-900/80 border-b border-slate-800 p-2 flex justify-between items-center sticky top-0 z-50 backdrop-blur-sm">
        {address ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-800 rounded-full px-3 py-1.5 border border-slate-700">
              <span className="text-xs font-mono text-slate-300">{shortAddress}</span>
              <span className="text-xs text-amber-400 font-bold border-l border-slate-600 pl-2 flex items-center">
                {currentOnChainScore} 🧠
              </span>
            </div>
          </div>
        ) : (
          <ConnectWallet className="!h-8 !px-3 !text-xs" />
        )}
        {address && (
          <button
            onClick={() => disconnect()}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors font-medium"
          >
            Disconnect
          </button>
        )}
      </div>

      {/* --- TITRE PRINCIPAL --- */}
      <div className="mt-6 mb-2 text-center">
        <h1 className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 drop-shadow-sm">
          DailyWheel
        </h1>
      </div>

      {/* --- INFO BAR (Cooldown / Reset) --- */}
      <div className="flex justify-center items-center gap-2 mb-6 h-4 font-mono tracking-widest text-[10px] text-slate-500">
         {DEV_MODE && address && <button onClick={resetDaily} className="border border-emerald-500/50 text-emerald-300 px-1 rounded hover:bg-emerald-500/10 transition-colors">Reset</button>}
         <span>{cooldownLabel}</span>
      </div>

      {/* --- PANEL RECLAMATION --- */}
      {showClaimPanel && (
        <div className="w-full max-w-xs mb-6 z-50 animate-in fade-in slide-in-from-bottom-4">
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-900/90 p-3 flex items-center justify-between shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <div className="text-sm font-bold text-emerald-400">Quest Complete!</div>
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
              className={`px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider shadow-lg transition-transform active:scale-95
                  ${!address || claimed ? "bg-slate-800 text-slate-500 cursor-not-allowed" : "bg-emerald-500 text-white hover:bg-emerald-400"}`}
            >
              {claimed ? "Done" : `Claim +${QUEST_POINTS[result] ?? 0}`}
            </button>
          </div>
        </div>
      )}

      {/* --- LA ROUE (Taille inchangée) --- */}
      <div className="relative w-full max-w-[380px] aspect-square md:max-w-[500px] mb-10">

        {/* POINTEUR EXTERNE SUPPRIMÉ */}

        {/* SVG ROUE */}
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
                <text textAnchor="middle" dominantBaseline="middle" fill="#2e1065" fontSize="13" fontWeight={900} style={{textShadow: '0px 1px 0px rgba(255,255,255,0.3)'}}>{QUESTS[i]}</text>
              </g>
            ))}
            <circle r={R_IN} fill="#0f172a" stroke="#38bdf8" strokeWidth={4} />
          </g>
        </svg>

        {/* --- BOUTON SPIN CENTRAL AVEC POINTEUR INTERNE --- */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <button onClick={handleSpin} disabled={!canSpin} className={`pointer-events-auto w-28 h-28 rounded-full flex items-center justify-center border-4 border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.6)] overflow-hidden relative transition-transform active:scale-95 ${!canSpin ? "opacity-50 grayscale cursor-not-allowed" : "cursor-pointer hover:scale-105"}`}>
            {/* Image de fond (Logo Base Bleu) */}
            <img src={BaseLogo.src} alt="Spin" className="absolute inset-0 w-full h-full object-cover z-0 opacity-90" />

            {/* NOUVEAU POINTEUR INTERNE (Triangle) */}
            <div className="absolute top-1 left-1/2 -translate-x-1/2 z-20 filter drop-shadow-md">
              <svg width="24" height="18" viewBox="0 0 20 15">
                <path d="M10 0 L20 15 L0 15 Z" fill="#60a5fa" stroke="#3b82f6" strokeWidth="2"/>
              </svg>
            </div>

            {/* Texte SPIN */}
            <span className="relative z-10 text-3xl font-black text-white drop-shadow-[0_3px_0_rgba(0,0,0,0.8)] uppercase tracking-widest mt-3">
              SPIN
            </span>
          </button>
        </div>
      </div>

      {/* --- NOUVELLE SECTION BADGES (Compact Grid) --- */}
      <div className="w-full max-w-lg border-t border-slate-800/50 pt-8 px-4">
        <h2 className="text-lg font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 uppercase tracking-widest">
          Your Trophy Room
        </h2>
        {address ? (
           <BadgesPanel userAddress={address} currentScore={currentOnChainScore} />
        ) : (
          <p className="text-center text-sm text-slate-500 py-4">Connect your wallet to view your collection.</p>
        )}
      </div>

    </main>
  );
}
