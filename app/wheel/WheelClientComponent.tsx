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
import BrainScoreSigned from "@/types/BrainScoreSigned.json"; 

import Leaderboard from "../components/Leaderboard";
import BadgesPanel from "../components/BadgesPanel"; 

/* =======================
 * Configuration & Constantes
 * ======================= */
const NFT_CONTRACT_ADDRESS = "0x5240e300f0d692d42927602bc1f0bed6176295ed";
const NFT_COLLECTION_LINK = "https://opensea.io/collection/pixel-brainiac";

const MINI_APP_1 = "https://cast-my-vibe.vercel.app/";
const MINI_APP_2 = "https://farcaster.xyz/miniapps/OPdWRfCjGFXR/otc-swap";

// 👇 QUÊTES SOCIALES (Proof of Work requis)
const SOCIAL_QUESTS = [
  "Cast Party", 
  "Like Storm", 
  "Reply Sprint", 
  "Invite & Share", 
  "Creative #gm", 
  "Meme Factory", 
  "Crazy promo",
  "Mini apps mashup"
];

// 👇 QUÊTES "EN TRAVAUX"
const COMING_SOON_QUESTS = [
  "Web3 Survivor",
  "Mystery Challenge"
];

// 👇 NOUVEAU : INSTRUCTIONS DÉTAILLÉES PAR QUÊTE
const QUEST_INSTRUCTIONS: Record<string, string> = {
  "Cast Party": "🎙️ Post a new cast on Warpcast to share your vibes.",
  "Like Storm": "❤️ Go like15 recent cass from your feed.",
  "Reply Sprint": "💬 Reply to 1 cast with something meaningful.",
  "Invite & Share": "🔗 Share this frame or invite a friend to play.",
  "Creative #gm": "☀️ Cast a creative 'gm' with a cool photo.",
  "Meme Factory": "🐸 Create and cast a meme about Base or Farcaster.",
  "Crazy promo": "📢 Check out the latest promo on /base channel.",
  "Mini apps mashup": "📱 Use 1 other mini-app today and paste proof.",
  "Daily check-in": "✅ Simply claim your daily reward point.",
  "Bankruptcy": "📉 Ouch! Market crash. You lose points.",
  "Double points": "✖️ Multiplier activated! (No points this turn).",
  "Mint My Nft": "🎨 Unlock the exclusive Pixel Brainiac NFT on OpenSea.",
  "Test a top mini app": "🔭 Discover a partner app to earn points.",
  // Les Quiz n'ont pas besoin de texte ici car ils ont leur propre fenêtre
};

const QUESTS: string[] = [
  "Base Speed Quiz", "Farcaster Flash Quiz", "Mini app quiz", "Cast Party",
  "Like Storm", "Reply Sprint", "Invite & Share", "Test a top mini app",
  "Bonus spin", "Meme Factory", "Mint My Nft", "Mini apps mashup",
  "Crazy promo", "Bankruptcy", "Creative #gm", "Daily check-in",
  "Mystery Challenge", "Bonus spin", "Double points", "Web3 Survivor",
];

const POINTER_Y = 40;
const SEGMENTS = QUESTS.length;
const COLORS = [
  "#f97316", "#3b82f6", "#22c55e", "#a855f7", "#eab308",
  "#38bdf8", "#f97316", "#22c55e", "#3b82f6", "#f97316",
];
const R_OUT = 260;
const R_IN = 78;
const POINTER_ANGLE = 0;
const SPIN_DURATION_MS = 4500;
const COOLDOWN_SEC = 12 * 3600;
const DEV_MODE = typeof process !== "undefined" && process.env.NEXT_PUBLIC_DW_DEV === "1";

const QUEST_POINTS: Record<string, number> = {
  "Base Speed Quiz": 5, "Farcaster Flash Quiz": 5, "Mini app quiz": 5,
  "Cast Party": 3, "Like Storm": 3, "Reply Sprint": 3, "Invite & Share": 3,
  "Test a top mini app": 3, "Bonus spin": 1, "Meme Factory": 4,
  "Mint My Nft": 3, 
  "Mini apps mashup": 4, "Crazy promo": 4,
  "Bankruptcy": -10, "Creative #gm": 3, "Daily check-in": 2,
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

async function signReward(player: string, questId: string, delta: number, nonce: number, proof?: any) {
  const deadline = Math.floor(Date.now() / 1000) + 300; 
  const res = await fetch("/api/brain-sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ player, questId, delta, nonce, deadline, proof }),
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

const BRAIN_CONTRACT = process.env.NEXT_PUBLIC_BRAIN_CONTRACT as `0x${string}`;

export default function WheelClientPage() { 
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);

  useEffect(() => {
    const load = async () => { 
        await sdk.actions.ready(); 
        // Pas de expand() pour éviter l'erreur de build
    };
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
  const [hasClickedMint, setHasClickedMint] = useState(false);
  
  // State pour stocker le lien de preuve sociale
  const [proofLink, setProofLink] = useState("");

  useEffect(() => { setMounted(true); }, []);

  const anglePerSegment = 360 / SEGMENTS;
  const segments = useMemo(() => Array.from({ length: SEGMENTS }, (_, i) => {
    const a0 = i * anglePerSegment;
    const a1 = (i + 1) * anglePerSegment;
    return { i, a0, a1, color: COLORS[i % COLORS.length], label: QUESTS[i] };
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
    
    setSpinning(true); 
    setActiveQuiz(null); 
    setSelectedChoice(null); 
    setQuizResult(null); 
    setClaimed(false); 
    setResult(null);
    setHasClickedMint(false);
    setProofLink(""); 

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

      // On enregistre la date du spin SAUF si c'est un "Bonus spin" OU une quête "Coming Soon"
      const isComingSoon = COMING_SOON_QUESTS.includes(questLabel);
      if (address && !DEV_MODE) {
        const key = `dw:lastSpin:${address.toLowerCase()}`;
        if (questLabel !== "Bonus spin" && !isComingSoon) {
            localStorage.setItem(key, String(Date.now()));
        }
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
  const isQuiz = ["Base Speed Quiz", "Farcaster Flash Quiz", "Mini app quiz"].includes(result || "");
  const showClaimPanel = result && (QUEST_POINTS[result] ?? 0) !== 0 && (!isQuiz || quizResult === "correct");
  
  const isSocialQuest = SOCIAL_QUESTS.includes(result || "");
  const isComingSoon = COMING_SOON_QUESTS.includes(result || "");

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col items-center pt-2 px-2 overflow-x-hidden relative">

      {/* HEADER TOP BAR */}
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
          <button onClick={() => disconnect()} className="text-xs text-slate-400 hover:text-slate-200 transition-colors font-medium">
            Disconnect
          </button>
        )}
      </div>

      <div className="mt-4 mb-2 text-center">
        <h1 className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 drop-shadow-sm">
          DailyWheel
        </h1>
      </div>

      <div className="flex justify-center items-center gap-2 mb-4 h-4 font-mono tracking-widest text-[10px] text-slate-500">
         {DEV_MODE && address && <button onClick={resetDaily} className="border border-emerald-500/50 text-emerald-300 px-1 rounded hover:bg-emerald-500/10 transition-colors">Reset</button>}
         <span>{cooldownLabel}</span>
      </div>

      {/* QUIZ MODAL */}
      {activeQuiz && !quizResult && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in zoom-in-95">
          <div className="bg-slate-900 border-2 border-blue-500 rounded-2xl p-6 max-w-sm w-full shadow-[0_0_50px_rgba(59,130,246,0.5)]">
            <div className="text-blue-400 text-xs font-bold uppercase tracking-widest text-center mb-2">
              Quiz Challenge
            </div>
            <h3 className="text-xl font-black text-white mb-8 text-center leading-snug">
              {activeQuiz.question}
            </h3>
            <div className="flex flex-col gap-3">
              {activeQuiz.choices.map((choice, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(index)}
                  className="w-full py-4 px-4 bg-slate-800 hover:bg-blue-600 border border-slate-600 hover:border-blue-400 rounded-xl text-left text-sm font-bold text-slate-200 transition-all active:scale-95 shadow-lg"
                >
                  {choice}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* RESULTAT QUIZ */}
      {quizResult === "wrong" && (
         <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-slate-900 border border-red-500/50 p-6 rounded-2xl max-w-xs w-full text-center shadow-2xl">
               <div className="text-4xl mb-4">❌</div>
               <h3 className="text-xl font-bold text-red-400 mb-2">Wrong Answer!</h3>
               <p className="text-slate-400 text-sm mb-6">You missed the points this time. Try again in 12h!</p>
               <button 
                 onClick={() => { setQuizResult(null); setResult(null); }} 
                 className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold"
               >
                 Close
               </button>
            </div>
         </div>
      )}

      {/* PANEL RECLAMATION */}
      {showClaimPanel && (
        <div className="w-full max-w-xs mb-6 z-50 animate-in fade-in slide-in-from-bottom-4">
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-900/90 p-3 flex flex-col items-center justify-between shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            
            <div className="flex w-full justify-between items-center mb-2">
                <div className="text-sm font-bold text-emerald-400">
                  {result === "Mint My Nft" ? "NFT Unlocked! 🎨" : 
                   result === "Test a top mini app" ? "Discovery Time! 🔭" :
                   isComingSoon ? "Coming Soon 🚧" :
                   "Quest Complete!"}
                </div>
            </div>

            {/* 👇 NOUVEAU : DESCRIPTION DE LA QUÊTE */}
            {result && QUEST_INSTRUCTIONS[result] && !claimed && !isComingSoon && (
                <div className="mb-4 p-2 bg-slate-950/50 rounded border border-slate-700/50 text-center">
                    <p className="text-xs text-slate-300 italic">
                        {QUEST_INSTRUCTIONS[result]}
                    </p>
                </div>
            )}

            {/* --- CHAMP INPUT POUR QUETES SOCIALES --- */}
            {isSocialQuest && !claimed && !isComingSoon && (
                <div className="mb-3 w-full">
                    <label className="text-[10px] text-slate-400 uppercase tracking-widest mb-1 block">Proof of Work</label>
                    <input 
                        type="text" 
                        placeholder="Paste Warpcast link (http...)" 
                        value={proofLink}
                        onChange={(e) => setProofLink(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                    />
                </div>
            )}

            {/* --- LOGIQUE DES BOUTONS --- */}
            
            {result === "Mint My Nft" && !hasClickedMint ? (
              <a 
                href={NFT_COLLECTION_LINK}
                target="_blank" 
                rel="noopener noreferrer"
                onClick={() => setHasClickedMint(true)} 
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded text-center shadow-lg transform transition-all hover:scale-105 uppercase tracking-widest cursor-pointer flex items-center justify-center gap-2"
              >
                <span>🚀 Step 1: Mint NFT</span>
              </a>

            ) : result === "Test a top mini app" && !hasClickedMint ? (
              <a 
                href={Math.floor(Date.now() / (12 * 60 * 60 * 1000)) % 2 === 0 ? MINI_APP_1 : MINI_APP_2}
                target="_blank" 
                rel="noopener noreferrer"
                onClick={() => setHasClickedMint(true)} 
                className="w-full py-3 bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-400 hover:to-orange-400 text-white font-bold rounded text-center shadow-lg transform transition-all hover:scale-105 uppercase tracking-widest cursor-pointer flex items-center justify-center gap-2"
              >
                <span>📱 Step 1: Open App</span>
              </a>

            ) : isComingSoon ? (
              // BOUTON "COMING SOON" (Rejouer)
              <button
                onClick={() => {
                    setResult(null);
                    setCooldown(0);
                }}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg border border-slate-600 shadow-lg transform transition-all active:scale-95"
              >
                <span>See you soon 👋 (Spin Again 🔄)</span>
              </button>

            ) : (
              // BOUTON CLAIM CLASSIQUE
              <button
                disabled={!address || claimed || !walletClient || (isSocialQuest && proofLink.length < 10)}
                onClick={async () => {
                  if (!address || !result || !walletClient) return;
                  
                  // Verif NFT
                  if (result === "Mint My Nft") {
                    try {
                        const publicClient = createPublicClient({ chain: base, transport: http(process.env.NEXT_PUBLIC_RPC_URL) });
                        const balance = await publicClient.readContract({
                            address: NFT_CONTRACT_ADDRESS as `0x${string}`,
                            abi: [{"inputs": [{"internalType": "address","name": "owner","type": "address"}],"name": "balanceOf","outputs": [{"internalType": "uint256","name": "","type": "uint256"}],"stateMutability": "view","type": "function"}],
                            functionName: 'balanceOf',
                            args: [address],
                        }) as bigint;
                        if (Number(balance) === 0) {
                            alert("⚠️ Vous ne possédez pas encore le NFT !");
                            setHasClickedMint(false); return; 
                        }
                    } catch (error) { alert("Erreur vérification NFT"); return; }
                  }

                  if (isQuiz && selectedChoice === null) { alert("Please select an answer!"); return; }

                  const basePoints = QUEST_POINTS[result] ?? 0;
                  if (basePoints === 0) return;
                  
                  try {
                    const delta = basePoints;
                    const nonce = await getPlayerNonce(address);
                    const proof = isQuiz ? selectedChoice : (isSocialQuest ? proofLink : null);
                    
                    const { signature, deadline } = await signReward(address, result, delta, nonce, proof);
                    await sendClaim(walletClient, delta, nonce, deadline, signature, address);
                    addBrain(address, result, basePoints);
                    setClaimed(true);
                    refetchScore();
                  } catch (err: any) { 
                    console.error(err); 
                    alert(err.message || "Error sending onchain claim"); 
                  }
                }}
                className={`w-full px-4 py-2 rounded text-xs font-bold uppercase tracking-wider shadow-lg transition-transform active:scale-95
                    ${!address || claimed || (isSocialQuest && proofLink.length < 10)
                      ? "bg-slate-800 text-slate-500 cursor-not-allowed" 
                      : "bg-emerald-500 text-white hover:bg-emerald-400"
                    }`}
              >
                {claimed ? "Done ✅" : (
                    result === "Mint My Nft" ? "Step 2: Verify & Claim 💰" : 
                    result === "Test a top mini app" ? "Step 2: Claim Points 💰" :
                    isSocialQuest && proofLink.length < 10 ? "Paste Link to Claim 🔒" : 
                    `Claim +${QUEST_POINTS[result] ?? 0}`
                )}
              </button>
            )}

          </div>
        </div>
      )}

      {/* --- LA ROUE --- */}
      <div className="relative w-full max-w-[360px] aspect-square md:max-w-[500px] mb-8">

        <div className="absolute left-1/2 -translate-x-1/2 z-20 pointer-events-none" style={{ top: -2 }}>
          <svg width="50" height="40" viewBox="0 0 50 40" className="drop-shadow-[0_0_10px_rgba(56,189,248,0.8)]">
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
                <text textAnchor="middle" dominantBaseline="middle" fill="#2e1065" fontSize="13" fontWeight={900} style={{textShadow: '0px 1px 0px rgba(255,255,255,0.3)'}}>{QUESTS[i]}</text>
              </g>
            ))}
            <circle r={R_IN} fill="#0f172a" stroke="#38bdf8" strokeWidth={4} />
          </g>
        </svg>

        {/* BOUTON SPIN */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <button onClick={handleSpin} disabled={!canSpin} className={`pointer-events-auto w-28 h-28 rounded-full flex items-center justify-center border-4 border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.6)] overflow-hidden relative transition-transform active:scale-95 ${!canSpin ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:scale-105"}`}>
            <img src="/base-logo-in-blue.png" alt="Spin" className="absolute inset-0 w-full h-full object-cover z-0" />
            <span className="relative z-10 text-2xl font-black text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] uppercase tracking-widest">
              SPIN
            </span>
          </button>
        </div>
      </div>

      {/* --- SECTION BADGES COMPACTE --- */}
      <div className="w-full max-w-lg border-t border-slate-800/50 pt-4 px-4">
        <h2 className="text-sm font-bold mb-4 text-center text-slate-500 uppercase tracking-widest">
          Your Trophy Room
        </h2>
        {address ? (
           <BadgesPanel userAddress={address} currentScore={currentOnChainScore} />
        ) : (
          <p className="text-center text-xs text-slate-600 py-4">Connect wallet to view badges</p>
        )}
      </div>

      {/* LEADERBOARD */}
      <div className="w-full max-w-lg pb-10">
         <Leaderboard />
      </div>

    </main>
  );
}
