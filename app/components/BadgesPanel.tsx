"use client";

import { useState } from "react";
import { useWriteContract, useReadContract } from "wagmi";
import { BADGES } from "@/app/config/badges";
import BrainBadgesABI from "@/types/BrainBadges.json"; // Assurez-vous que ce chemin est bon

const BADGE_CONTRACT = process.env.NEXT_PUBLIC_BADGE_CONTRACT as `0x${string}`;

// ABI Minimale pour la lecture (si le JSON complet pose problème)
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

export default function BadgesPanel({ userAddress, currentScore }: { userAddress: `0x${string}`, currentScore?: number }) {
  const { writeContract } = useWriteContract();
  const [loadingId, setLoadingId] = useState<number | null>(null);

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
        abi: BrainBadgesABI.abi || MINIMAL_BADGE_ABI, // Fallback sur l'ABI minimale
        functionName: "mint",
        args: [BigInt(badgeId), BigInt(data.nonce), data.signature],
      }, {
        onSuccess: () => {
           console.log("Mint submitted!");
           setTimeout(() => setLoadingId(null), 5000); // Reset loading après 5s
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
    // GRILLE COMPACTE (Style Croquis) : 4 colonnes sur mobile, 6 sur ordi
    <div className="grid grid-cols-4 md:grid-cols-6 gap-3 p-2">
      {BADGES.map((badge) => (
        <BadgeItem 
          key={badge.id} 
          badge={badge} 
          userAddress={userAddress} 
          currentScore={currentScore || 0}
          onMint={() => mintBadge(badge.id)}
          loading={loadingId === badge.id}
        />
      ))}
    </div>
  );
}

function BadgeItem({ badge, userAddress, currentScore, onMint, loading }: any) {
  // Lecture de la balance
  const { data: hasBadge } = useReadContract({
    address: BADGE_CONTRACT,
    abi: MINIMAL_BADGE_ABI,
    functionName: "balanceOf",
    args: [userAddress, BigInt(badge.id)],
    query: { staleTime: 0, enabled: !!userAddress }
  });

  const isOwned = Number(hasBadge) > 0;
  // Logique de verrouillage
  const isScoreBadge = badge.category === "Score";
  const isUnlockable = !isOwned && isScoreBadge && (currentScore >= badge.minScore);
  const isLocked = !isOwned && !isUnlockable;

  // Click handler : seulement si déblocable et pas possédé
  const handleClick = () => {
    if (isUnlockable || (!isOwned && !isScoreBadge)) {
      onMint();
    }
  };

  return (
    <div 
      onClick={handleClick}
      className={`
        relative aspect-square rounded-lg border-2 flex items-center justify-center overflow-hidden cursor-pointer transition-all
        ${isOwned 
          ? "border-emerald-500 bg-emerald-900/30 shadow-[0_0_10px_rgba(16,185,129,0.4)]" // POSSÉDÉ
          : isUnlockable 
            ? "border-yellow-400 bg-yellow-900/20 animate-pulse" // PRÊT À MINT
            : "border-slate-800 bg-slate-900/50 opacity-50 grayscale" // VERROUILLÉ
        }
      `}
    >
      {/* Image du Badge */}
      <img 
        src={badge.image} 
        alt={badge.name} 
        className="w-3/4 h-3/4 object-contain" 
      />

      {/* Indicateur de chargement */}
      {loading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Indicateur "Check" si possédé */}
      {isOwned && (
        <div className="absolute bottom-0 right-0 bg-emerald-500 text-white p-[2px] rounded-tl-md">
          <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"></path></svg>
        </div>
      )}
    </div>
  );
}
