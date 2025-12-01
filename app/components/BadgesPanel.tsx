"use client";

import { useState } from "react";
import { useWriteContract, useReadContract } from "wagmi";
import { BADGES } from "../config/badges"; 
import BrainBadgesABI from "../../types/BrainBadges.json"; 

const BADGE_CONTRACT = process.env.NEXT_PUBLIC_BADGE_CONTRACT as `0x${string}`;

// 👇 AJOUT : L'adresse de votre collection NFT pour la vérification
const NFT_CONTRACT_ADDRESS = "0x5240e300f0d692d42927602bc1f0bed6176295ed";

const MINIMAL_BADGE_ABI = [{
  "inputs": [{"internalType":"address","name":"account","type":"address"}, {"internalType":"uint256","name":"id","type":"uint256"}],
  "name": "balanceOf",
  "outputs": [{"internalType":"uint256","name":"","type":"uint256"}],
  "stateMutability": "view",
  "type": "function"
}, {
  "inputs": [{"internalType":"uint256","name":"id","type":"uint256"}, {"internalType":"uint256","name":"amount","type":"uint256"}, {"internalType":"bytes","name":"data","type":"bytes"}],
  "name": "mint",
  "outputs": [],
  "stateMutability": "nonpayable",
  "type": "function"
}] as const;

// ABI Minimal pour lire le solde du NFT externe (Pixel Brainiac)
const NFT_BALANCE_ABI = [{
  "inputs": [{"internalType":"address","name":"owner","type":"address"}],
  "name": "balanceOf",
  "outputs": [{"internalType":"uint256","name":"","type":"uint256"}],
  "stateMutability": "view",
  "type": "function"
}] as const;

export default function BadgesPanel({ userAddress, currentScore }: { userAddress: `0x${string}`, currentScore?: number }) {
  const { writeContract } = useWriteContract();
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [selectedBadgeData, setSelectedBadgeData] = useState<any | null>(null);

  const mintBadge = async (badgeId: number) => {
    setLoadingId(badgeId);
    try {
      const res = await fetch("/api/badge-sign", {
        method: "POST",
        body: JSON.stringify({ userAddress, badgeId }),
      });
      const data = await res.json();

      if (data.error) {
        alert("Error: " + data.error);
        setLoadingId(null);
        return;
      }

      writeContract({
        address: BADGE_CONTRACT,
        abi: BrainBadgesABI.abi || MINIMAL_BADGE_ABI,
        functionName: "mint",
        args: [BigInt(badgeId), BigInt(data.nonce), data.signature],
      }as any, {
        onSuccess: () => {
           console.log("Mint submitted!");
           setTimeout(() => {
             setLoadingId(null);
             setSelectedBadgeData(null); 
           }, 5000);
        },
        onError: (e: any) => {
          console.error(e);
          setLoadingId(null);
        }
      });
    } catch (e) {
      console.error(e);
      setLoadingId(null);
    }
  };

  return (
    <>
      {/* GRILLE DES BADGES */}
      <div className="grid grid-cols-4 md:grid-cols-6 gap-3 p-2">
        {BADGES.map((badge) => (
          <BadgeItem 
            key={badge.id} 
            badge={badge} 
            userAddress={userAddress} 
            currentScore={currentScore || 0}
            onSelect={(status: any) => setSelectedBadgeData({ ...badge, ...status })}
          />
        ))}
      </div>

      {/* MODALE (POP-UP) */}
      {selectedBadgeData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-6 relative shadow-2xl transform scale-100">
            
            <button 
              onClick={() => setSelectedBadgeData(null)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white p-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex flex-col items-center text-center">
              <div className={`w-32 h-32 mb-4 rounded-full border-4 flex items-center justify-center bg-slate-950 ${
                selectedBadgeData.isOwned ? "border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)]" : "border-slate-700 grayscale opacity-70"
              }`}>
                 <img src={selectedBadgeData.image} alt={selectedBadgeData.name} className="w-24 h-24 object-contain" />
              </div>

              <h3 className="text-2xl font-black text-white mb-2">{selectedBadgeData.name}</h3>
              
              <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                {selectedBadgeData.description}
              </p>

              {/* LOGIQUE DU BOUTON MODIFIÉE POUR GÉRER LE CAS NFT */}
              {selectedBadgeData.isOwned ? (
                <div className="px-6 py-2 bg-emerald-500/20 border border-emerald-500 text-emerald-400 rounded-full font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                  <span>Owned</span>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                </div>
              ) : selectedBadgeData.isUnlockable ? (
                <button
                  onClick={() => mintBadge(selectedBadgeData.id)}
                  disabled={loadingId === selectedBadgeData.id}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg hover:shadow-blue-500/25 transition-all active:scale-95"
                >
                  {loadingId === selectedBadgeData.id ? "Minting..." : "Mint Badge (Free)"}
                </button>
              ) : (
                <div className="px-4 py-2 bg-slate-800 rounded-lg text-slate-500 text-xs font-mono">
                  {/* Message personnalisé si c'est un badge NFT */}
                  {selectedBadgeData.category === "NFT" 
                    ? "🔒 Requires 'Pixel Brainiac' NFT"
                    : selectedBadgeData.category === "Score" 
                      ? `Requires ${selectedBadgeData.minScore} Brain Points`
                      : "Locked"}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function BadgeItem({ badge, userAddress, currentScore, onSelect }: any) {
  // 1. Est-ce que j'ai déjà le badge Interne (SBT) ?
  const { data: hasBadge } = useReadContract({
    address: BADGE_CONTRACT,
    abi: MINIMAL_BADGE_ABI,
    functionName: "balanceOf",
    args: [userAddress, BigInt(badge.id)],
    query: { staleTime: 0, enabled: !!userAddress }
  });

  // 2. Vérification spéciale : Est-ce que j'ai le NFT externe (si category == NFT) ?
  const { data: nftBalance } = useReadContract({
    address: NFT_CONTRACT_ADDRESS,
    abi: NFT_BALANCE_ABI,
    functionName: "balanceOf",
    args: [userAddress],
    query: { enabled: !!userAddress && badge.category === "NFT" }
  });

  const isOwned = Number(hasBadge) > 0;
  const isScoreBadge = badge.category === "Score";
  const isNftBadge = badge.category === "NFT";

  // LOGIQUE DE DÉVERROUILLAGE
  let isUnlockable = false;

  if (!isOwned) {
    if (isScoreBadge) {
      isUnlockable = currentScore >= (badge.minScore || 0);
    } else if (isNftBadge) {
      // Si c'est un badge NFT, on débloque seulement si le solde du NFT > 0
      isUnlockable = Number(nftBalance || 0) > 0;
    } else {
      // Pour les autres (Gameplay/Special), on laisse débloqué par défaut (ou à gérer manuellement)
      isUnlockable = true;
    }
  }

  return (
    <div 
      onClick={() => onSelect({ isOwned, isUnlockable })} 
      className={`
        relative aspect-square rounded-lg border-2 flex items-center justify-center overflow-hidden cursor-pointer transition-all active:scale-90
        ${isOwned 
          ? "border-emerald-500 bg-emerald-900/30 shadow-[0_0_10px_rgba(16,185,129,0.4)]" 
          : isUnlockable
            ? isNftBadge 
                ? "border-blue-400 bg-blue-900/20 animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.5)]" // Bleu Spécial pour le NFT débloqué
                : "border-yellow-400 bg-yellow-900/20 animate-pulse" // Jaune pour le Score débloqué
            : "border-slate-800 bg-slate-900/50 opacity-40 grayscale" 
        }
      `}
    >
      <img 
        src={badge.image} 
        alt={badge.name} 
        className="w-3/4 h-3/4 object-contain" 
      />
      
      {/* Icone Cadenas si verrouillé */}
      {!isOwned && !isUnlockable && (
         <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
             <span className="text-xl opacity-80">🔒</span>
         </div>
      )}

      {isOwned && (
        <div className="absolute bottom-0 right-0 bg-emerald-500 text-white p-[2px] rounded-tl-md">
          <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"></path></svg>
        </div>
      )}
    </div>
  );
}
