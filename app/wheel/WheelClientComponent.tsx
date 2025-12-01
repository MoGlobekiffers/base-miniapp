"use client";

import { useEffect, useMemo, useState } from "react";
import { ConnectWallet } from "@coinbase/onchainkit/wallet";
import { useAccount, useDisconnect, useWalletClient, useReadContract } from "wagmi"; 
import sdk from '@farcaster/frame-sdk';

import { getRandomBaseQuiz, getRandomFarcasterQuiz, getRandomMiniAppQuiz, type QuizQuestion } from "./quizPools";
import { useBrain, addBrain } from "../brain";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
import BadgesPanel from "../components/BadgesPanel"; 
import Leaderboard from "../components/Leaderboard";

// Design de la roue (Ajustement CSS pour recentrer)
const R_OUT = 260;
const R_IN = 78;
const POINTER_ANGLE = 0;
const SPIN_DURATION_MS = 4500;
const COOLDOWN_SEC = 12 * 3600;
const DEV_MODE = typeof process !== "undefined" && process.env.NEXT_PUBLIC_DW_DEV === "1";

const NFT_CONTRACT_ADDRESS = "0x5240e300f0d692d42927602bc1f0bed6176295ed";
const NFT_COLLECTION_LINK = "https://opensea.io/collection/pixel-brainiac";
const MINI_APP_1 = "https://cast-my-vibe.vercel.app/";
const MINI_APP_2 = "https://farcaster.xyz/miniapps/OPdWRfCjGFXR/otc-swap";
const BRAIN_CONTRACT = process.env.NEXT_PUBLIC_BRAIN_CONTRACT as `0x${string}`;

const SOCIAL_QUESTS = ["Cast Party", "Like Storm", "Reply Sprint", "Invite & Share", "Creative #gm", "Meme Factory", "Crazy promo", "Mini apps mashup"];
const COMING_SOON_QUESTS = ["Web3 Survivor", "Mystery Challenge"];

const QUEST_INSTRUCTIONS: Record<string, string> = {
  "Cast Party": "🎙️ Post a new cast on Warpcast to share your vibes.",
  "Like Storm": "❤️ Go like 1 recent cast from your feed.", 
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
};

const QUESTS = ["Base Speed Quiz", "Farcaster Flash Quiz", "Mini app quiz", "Cast Party", "Like Storm", "Reply Sprint", "Invite & Share", "Test a top mini app", "Bonus spin", "Meme Factory", "Mint My Nft", "Mini apps mashup", "Crazy promo", "Bankruptcy", "Creative #gm", "Daily check-in", "Mystery Challenge", "Bonus spin", "Double points", "Web3 Survivor"];
const QUEST_POINTS: Record<string, number> = { "Base Speed Quiz": 5, "Farcaster Flash Quiz": 5, "Mini app quiz": 5, "Cast Party": 3, "Like Storm": 3, "Reply Sprint": 3, "Invite & Share": 3, "Test a top mini app": 3, "Bonus spin": 1, "Meme Factory": 4, "Mint My Nft": 3, "Mini apps mashup": 4, "Crazy promo": 4, "Bankruptcy": -10, "Creative #gm": 3, "Daily check-in": 2, "Mystery Challenge": 4, "Double points": 0, "Web3 Survivor": 8 };
const SEGMENTS = QUESTS.length;
const COLORS = ["#f97316", "#3b82f6", "#22c55e", "#a855f7", "#eab308", "#38bdf8", "#f97316", "#22c55e", "#3b82f6", "#f97316"];

// ABI : On utilise 'nonces' pour lire le compteur
const CORRECT_ABI = [
  {
    "inputs": [
      {
        "components": [
          { "name": "player", "type": "address" },
          { "name": "questId", "type": "string" },
          { "name": "delta", "type": "int256" },
          { "name": "nonce", "type": "uint256" },
          { "name": "deadline", "type": "uint256" }
        ],
        "name": "r",
        "type": "tuple"
      },
      { "name": "signature", "type": "bytes" }
    ],
    "name": "claim",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "user", "type": "address"}],
    "name": "getPlayer",
    "outputs": [{"name": "total", "type": "uint256"}, {"name": "quests", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "owner", "type": "address"}],
    "name": "nonces",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

function wedgePath(rOut: number, rIn: number, a0: number, a1: number) {
  const largeArc = a1 - a0 <= 180 ? 0 : 1;
  const rad = (d: number) => (d * Math.PI) / 180;
  return `M ${rOut * Math.cos(rad(a0))} ${rOut * Math.sin(rad(a0))} A ${rOut} ${rOut} 0 ${largeArc} 1 ${rOut * Math.cos(rad(a1))} ${rOut * Math.sin(rad(a1))} L ${rIn * Math.cos(rad(a1))} ${rIn * Math.sin(rad(a1))} A ${rIn} ${rIn} 0 ${largeArc} 0 ${rIn * Math.cos(rad(a0))} ${rIn * Math.sin(rad(a0))} Z`;
}

// Lecture du nonce : On prend celui du contrat
async function getNonce(player: string) {
  const publicClient = createPublicClient({ chain: base, transport: http(process.env.NEXT_PUBLIC_RPC_URL) });
  
  const nonce = await publicClient.readContract({
    address: BRAIN_CONTRACT,
    abi: CORRECT_ABI,
    functionName: "nonces",
    args: [player as `0x${string}`],
  }) as bigint;
  
  // Le contrat check r.nonce == nonces[player], donc on envoie le nonce actuel
  return Number(nonce); 
}

async function signReward(player: string, questId: string, delta: number, nonce: number, proof?: any) {
  const deadline = Math.floor(Date.now() / 1000) + 300; 
  const res = await fetch("/api/brain-sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ player, questId, delta, nonce, deadline }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to sign");
  return { signature: data.signature, deadline };
}

async function sendClaim(walletClient: any, player: string, questId: string, delta: number, nonce: number, deadline: number, signature: `0x${string}`) {
  if(walletClient.chain?.id !== base.id) await walletClient.switchChain({ id: base.id });
  
  const rewardStruct = {
      player: player as `0x${string}`,
      questId: questId,
      delta: BigInt(delta),
      nonce: BigInt(nonce),
      deadline: BigInt(deadline)
  };

  return await walletClient.writeContract({
    account: player as `0x${string}`,
    address: BRAIN_CONTRACT,
    abi: CORRECT_ABI,
    functionName: "claim",
    args: [rewardStruct, signature],
  });
}

export default function WheelClientPage() { 
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: walletClient } = useWalletClient(); 

  useEffect(() => {
    const load = async () => { await sdk.actions.ready(); };
    if (sdk && !isSDKLoaded) { setIsSDKLoaded(true); load(); }
  }, [isSDKLoaded]);

  const { data: scoreData, refetch: refetchScore } = useReadContract({
    address: BRAIN_CONTRACT, abi: CORRECT_ABI, functionName: "getPlayer", args: [address as `0x${string}`], query: { staleTime: 0, enabled: !!address }
  });
  const currentOnChainScore = (scoreData && Array.isArray(scoreData)) ? Number(scoreData[0]) : 0; 
  
  const [mounted, setMounted] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState<number>(0);
  const [activeQuiz, setActiveQuiz] = useState<QuizQuestion | null>(null);
  const [quizResult, setQuizResult] = useState<"correct" | "wrong" | null>(null);
  const [claimed, setClaimed] = useState(false);
  const [hasClickedMint, setHasClickedMint] = useState(false);
  const [proofLink, setProofLink] = useState("");

  useEffect(() => { setMounted(true); }, []);

  const anglePerSegment = 360 / SEGMENTS;
  const segments = useMemo(() => Array.from({ length: SEGMENTS }, (_, i) => ({ i, a0: i * anglePerSegment, a1: (i + 1) * anglePerSegment, color: COLORS[i % COLORS.length], label: QUESTS[i] })), [anglePerSegment]);

  useEffect(() => {
    if (!address || DEV_MODE) { setCooldown(0); return; }
    const tick = () => {
      const last = Number(localStorage.getItem(`dw:lastSpin:${address.toLowerCase()}`) || "0");
      if (!last) { setCooldown(0); return; }
      const left = Math.max(0, COOLDOWN_SEC * 1000 - (Date.now() - last));
      setCooldown(Math.ceil(left / 1000));
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [address]);

  const handleSpin = () => {
    if (!address) { alert("Connect wallet."); return; }
    if (!DEV_MODE && (spinning || cooldown > 0)) return;
    setSpinning(true); setActiveQuiz(null); setQuizResult(null); setClaimed(false); setResult(null); setHasClickedMint(false); setProofLink("");
    
    const randomDeg = Math.random() * 360;
    const finalRotation = rotation + 8 * 360 + randomDeg;
    setRotation(finalRotation);
    
    setTimeout(() => {
      const idx = Math.floor(((POINTER_ANGLE - ((finalRotation % 360) + 360) % 360) % 360 + 360) % 360 / anglePerSegment) % SEGMENTS;
      const q = QUESTS[idx]; setResult(q);
      
      if (q === "Base Speed Quiz") setActiveQuiz(getRandomBaseQuiz());
      else if (q === "Farcaster Flash Quiz") setActiveQuiz(getRandomFarcasterQuiz());
      else if (q === "Mini app quiz") setActiveQuiz(getRandomMiniAppQuiz());
      
      if (address && !DEV_MODE && !COMING_SOON_QUESTS.includes(q) && q !== "Bonus spin") {
          localStorage.setItem(`dw:lastSpin:${address.toLowerCase()}`, String(Date.now()));
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

  const setSelectedChoice = (val: any) => {};

  const cooldownLabel = useMemo(() => {
    if (!address) return "Connect wallet"; if (cooldown <= 0) return "Ready!";
    const h = Math.floor(cooldown / 3600), m = Math.floor((cooldown % 3600) / 60), s = cooldown % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, [cooldown, address]);

  if (!mounted) return <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Loading...</main>;
  
  const isSocial = SOCIAL_QUESTS.includes(result || "");
  const isSoon = COMING_SOON_QUESTS.includes(result || "");
  const showClaim = result && (QUEST_POINTS[result] ?? 0) !== 0 && (!["Base Speed Quiz", "Farcaster Flash Quiz", "Mini app quiz"].includes(result || "") || quizResult === "correct");

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col items-center pt-2 px-2 overflow-x-hidden relative">
      <div className="w-full bg-slate-900/80 border-b border-slate-800 p-2 flex justify-between items-center sticky top-0 z-50 backdrop-blur-sm">
        {address ? <div className="flex items-center gap-2 bg-slate-800 rounded-full px-3 py-1.5 border border-slate-700"><span className="text-xs font-mono text-slate-300">{address.slice(0,6)}...{address.slice(-4)}</span><span className="text-xs text-amber-400 font-bold border-l border-slate-600 pl-2">{currentOnChainScore} 🧠</span></div> : <ConnectWallet className="!h-8 !px-3 !text-xs" />}
        {address && <button onClick={() => disconnect()} className="text-xs text-slate-400">Disconnect</button>}
      </div>

      <div className="mt-4 mb-2 text-center"><h1 className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">DailyWheel</h1></div>
      <div className="flex justify-center items-center gap-2 mb-4 h-4 font-mono text-[10px] text-slate-500">{DEV_MODE && address && <button onClick={() => {localStorage.removeItem(`dw:lastSpin:${address.toLowerCase()}`); setCooldown(0);}} className="border border-emerald-500/50 text-emerald-300 px-1 rounded">Reset</button>}<span>{cooldownLabel}</span></div>

      {activeQuiz && !quizResult && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in zoom-in-95">
          <div className="bg-slate-900 border-2 border-blue-500 rounded-2xl p-6 max-w-sm w-full shadow-lg">
            <div className="text-blue-400 text-xs font-bold uppercase text-center mb-2">Quiz Challenge</div>
            <h3 className="text-xl font-black text-white mb-8 text-center leading-snug">{activeQuiz.question}</h3>
            <div className="flex flex-col gap-3">{activeQuiz.choices.map((c, i) => <button key={i} onClick={() => {if(i===activeQuiz.correctIndex){setQuizResult("correct")}else{setQuizResult("wrong")}}} className="w-full py-4 px-4 bg-slate-800 hover:bg-blue-600 border border-slate-600 rounded-xl text-left text-sm font-bold text-slate-200">{c}</button>)}</div>
          </div>
        </div>
      )}

      {quizResult === "wrong" && (
         <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-slate-900 border border-red-500/50 p-6 rounded-2xl max-w-xs w-full text-center"><div className="text-4xl mb-4">❌</div><h3 className="text-xl font-bold text-red-400 mb-2">Wrong!</h3><button onClick={() => {setQuizResult(null); setResult(null);}} className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold">Close</button></div>
         </div>
      )}

      {showClaim && (
        <div className="w-full max-w-xs mb-6 z-50 animate-in fade-in slide-in-from-bottom-4">
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-900/90 p-3 flex flex-col items-center justify-between shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <div className="text-sm font-bold text-emerald-400 mb-2">{result === "Mint My Nft" ? "NFT Unlocked! 🎨" : isSoon ? "Coming Soon 🚧" : "Quest Complete!"}</div>
            {result && QUEST_INSTRUCTIONS[result] && !claimed && !isSoon && <div className="mb-4 p-2 bg-slate-950/50 rounded border border-slate-700/50 text-center"><p className="text-xs text-slate-300 italic">{QUEST_INSTRUCTIONS[result]}</p></div>}
            
            {isSocial && !claimed && !isSoon && (
                <div className="mb-3 w-full"><label className="text-[10px] text-slate-400 uppercase tracking-widest mb-1 block">Proof of Work</label><input type="text" placeholder="Paste Warpcast link" value={proofLink} onChange={(e) => setProofLink(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-white" /></div>
            )}

            {result === "Mint My Nft" && !hasClickedMint ? (
              <a href={NFT_COLLECTION_LINK} target="_blank" rel="noopener noreferrer" onClick={() => setHasClickedMint(true)} className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded text-center">🚀 Step 1: Mint NFT</a>
            ) : result === "Test a top mini app" && !hasClickedMint ? (
              <a href={Math.floor(Date.now()/(12*3600000))%2===0?MINI_APP_1:MINI_APP_2} target="_blank" rel="noopener noreferrer" onClick={() => setHasClickedMint(true)} className="w-full py-3 bg-gradient-to-r from-pink-500 to-orange-500 text-white font-bold rounded text-center">📱 Step 1: Open App</a>
            ) : isSoon ? (
              <button onClick={() => {setResult(null); setCooldown(0);}} className="w-full py-3 bg-slate-800 text-white font-bold rounded-lg">Spin Again 🔄</button>
            ) : (
              <button disabled={!address || claimed || !walletClient || (isSocial && proofLink.length < 10)} onClick={async () => {
                  if (!address || !result || !walletClient) return;
                  if (result === "Mint My Nft") {
                    try { const balance = await createPublicClient({chain:base,transport:http(process.env.NEXT_PUBLIC_RPC_URL)}).readContract({address:NFT_CONTRACT_ADDRESS as `0x${string}`,abi:[{inputs:[{name:"owner",type:"address"}],name:"balanceOf",outputs:[{type:"uint256"}],stateMutability:"view",type:"function"}],functionName:'balanceOf',args:[address]}) as bigint; if(Number(balance)===0){alert("No NFT found!"); setHasClickedMint(false); return;} } catch{alert("Error checking NFT"); return;}
                  }
                  try {
                    const delta = QUEST_POINTS[result] ?? 0;
                    const nonce = await getNonce(address);
                    const { signature, deadline } = await signReward(address, result, delta, nonce);
                    await sendClaim(walletClient, address, result, delta, nonce, deadline, signature);
                    addBrain(address, result, delta); setClaimed(true); refetchScore();
                  } catch (err: any) { console.error(err); alert(err.message || "Error claiming"); }
                }} className={`w-full px-4 py-2 rounded text-xs font-bold uppercase ${!address||claimed||(isSocial&&proofLink.length<10)?"bg-slate-800 text-slate-500":"bg-emerald-500 text-white"}`}>{claimed?"Done ✅":"Claim Points"}</button>
            )}
          </div>
        </div>
      )}

      {/* ROUE RECENTRÉE VISUELLEMENT */}
      <div className="relative w-full max-w-[360px] aspect-square md:max-w-[500px] mb-8">
        {/* Flèche légèrement descendue pour mordre sur la roue */}
        <div className="absolute left-1/2 -translate-x-1/2 z-20 pointer-events-none" style={{ top: -5 }}>
          <svg width="50" height="40" viewBox="0 0 50 40" className="drop-shadow-[0_0_10px_rgba(56,189,248,0.8)]">
            <path d="M25 40 L10 10 H40 Z" fill="#3b82f6" stroke="#cffafe" strokeWidth={2} strokeLinejoin="round" />
          </svg>
        </div>

        <svg viewBox="-300 -300 600 600" className="w-full h-full drop-shadow-2xl">
          <circle r={R_OUT+12} fill="#0f172a"/><circle r={R_OUT+8} fill="none" stroke="#1e293b" strokeWidth={4}/>
          <g style={{transform:`rotate(${rotation}deg)`,transformOrigin:"center",transition:`transform ${SPIN_DURATION_MS}ms cubic-bezier(0.2,0.8,0.2,1)`}}>{segments.map((s)=><path key={`w-${s.i}`} d={wedgePath(R_OUT,R_IN,s.a0,s.a1)} fill={s.color} stroke="#0f172a" strokeWidth={2}/>)}{segments.map((s)=><g key={`l-${s.i}`} transform={`rotate(${s.a0+anglePerSegment/2}) translate(0, -${(R_OUT+R_IN)/2}) rotate(90)`}><text textAnchor="middle" dominantBaseline="middle" fill="#2e1065" fontSize="13" fontWeight={900}>{s.label}</text></g>)}</g>
          <circle r={R_IN} fill="#0f172a" stroke="#38bdf8" strokeWidth={4} />
        </svg>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <button onClick={handleSpin} disabled={!(!spinning&&(!cooldown||DEV_MODE))} className={`pointer-events-auto w-28 h-28 rounded-full border-4 border-blue-500 overflow-hidden relative ${!(!spinning&&(!cooldown||DEV_MODE))?"opacity-50":""}`}>
            <img src="/base-logo-in-blue.png" className="absolute inset-0 w-full h-full object-cover"/>
            <span className="relative z-10 text-2xl font-black text-white">SPIN</span>
          </button>
        </div>
      </div>

      <div className="w-full max-w-lg border-t border-slate-800/50 pt-4 px-4"><h2 className="text-sm font-bold mb-4 text-center text-slate-500 uppercase">Your Trophy Room</h2>{address ? <BadgesPanel userAddress={address} currentScore={currentOnChainScore} /> : <p className="text-center text-xs text-slate-600">Connect wallet</p>}</div>
      <div className="w-full max-w-lg pb-10"><Leaderboard /></div>
    </main>
  );
}
