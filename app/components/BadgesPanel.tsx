"use client";

import { useState } from "react";
import { useWriteContract, useReadContract, useAccount } from "wagmi";
import { BADGES } from "@/app/config/badges";
import BrainBadgesABI from "@/types/BrainBadges.json";

const BADGE_CONTRACT = process.env.NEXT_PUBLIC_BADGE_CONTRACT as `0x${string}`;

// 👇 NOUVEAU : ABI minimale pour la lecture (balanceOf)
const MINIMAL_BADGE_ABI = [{
  "inputs": [{"internalType":"address","name":"account","type":"address"}, {"internalType":"uint256","name":"id","type":"uint256"}],
  "name": "balanceOf",
  "outputs": [{"internalType":"uint256","name":"","type":"uint256"}],
  "stateMutability": "view",
  "type": "function"
}] as const; // Le 'as const' est important pour Wagmi

export default function BadgesPanel({ userAddress, currentScore }: { userAddress: `0x${string}`, currentScore?: number }) {
  const { writeContract, error: writeError } = useWriteContract();
  const [loadingId, setLoadingId] = useState<number | null>(null);

  // Cette fonction sera passée aux cartes pour qu'elles puissent se rafraîchir
  // (C'est géré individuellement dans le composant BadgeCard plus bas)

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
      {BADGES.map((badge) => (
        <BadgeCard 
          key={badge.id} 
          badge={badge} 
          userAddress={userAddress} 
          currentScore={currentScore || 0}
          writeContract={writeContract}
          setLoadingId={setLoadingId}
          loadingId={loadingId}
        />
      ))}
    </div>
  );
}

// J'ai sorti BadgeCard et ajouté la logique de rafraichissement
function BadgeCard({ badge, userAddress, currentScore, writeContract, setLoadingId, loadingId }: any) {
  
  // 1. On récupère la fonction 'refetch' en plus de la donnée
  const { data: hasBadge, refetch } = useReadContract({
    address: BADGE_CONTRACT,
    abi: MINIMAL_BADGE_ABI,
    functionName: "balanceOf",
    args: [userAddress, BigInt(badge.id)],
    query: {
      staleTime: 0, // Ne jamais mettre en cache, toujours vérifier
    }
  });

  const isOwned = Number(hasBadge) > 0;
  const isLocked = !isOwned && (badge.minScore && currentScore < badge.minScore);
  const isLoading = loadingId === badge.id;

  const handleMint = async () => {
    setLoadingId(badge.id);
    try {
      // Appel API
      const res = await fetch("/api/badge-sign", {
        method: "POST",
        body: JSON.stringify({ userAddress, badgeId: badge.id }),
      });
      const data = await res.json();

      if (data.error) {
        alert("Error : " + data.error);
        setLoadingId(null);
        return;
      }

      // Appel Blockchain
      writeContract({
        address: BADGE_CONTRACT,
        abi: BrainBadgesABI.abi || BrainBadgesABI,
        functionName: "mint",
        args: [BigInt(badge.id), BigInt(data.nonce), data.signature],
      }, {
        onSuccess: async () => {
          console.log("Succès ! Rafraîchissement en cours...");
          // 👇 C'EST ICI LA MAGIE : On attend 2s puis on force la vérification
          setTimeout(() => {
             refetch(); 
             setLoadingId(null);
          }, 4000); // 4 secondes pour être sûr que la blockchain a indexé
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
    <div className={`border rounded-lg p-4 flex flex-col items-center text-center transition-all duration-500
      ${isOwned ? "bg-green-900/20 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)] scale-105" : 
        isLocked ? "bg-slate-900 border-slate-800 opacity-60" : "bg-slate-800 border-slate-600"
      }`}>
      
      <div className={`w-16 h-16 mb-3 rounded-full flex items-center justify-center overflow-hidden border-2 
        ${isOwned ? "border-green-400" : isLocked ? "border-slate-700 bg-slate-950" : "border-slate-500 bg-slate-900"}`}>
         
         {isLocked ? (
           <span className="text-2xl">🔒</span>
         ) : (
           <img src={badge.image} alt={badge.name} className={`w-full h-full object-cover ${!isOwned ? "grayscale opacity-80" : ""}`} 
                onError={(e) => e.currentTarget.src = "https://placehold.co/100x100/333/FFF?text=?"}/> 
         )}
      </div>
      
      <h3 className="font-bold text-sm mb-1">{badge.name}</h3>
      <p className="text-[10px] text-slate-400 mb-3 h-8 leading-tight">{badge.description}</p>
      
      {isOwned ? (
        <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full border border-green-500/50 animate-pulse">
          OWNED ✅
        </span>
      ) : (
        <button 
          onClick={handleMint}
          disabled={isLoading || isLocked}
          className={`px-4 py-1.5 text-xs rounded-lg font-semibold transition-all w-full
            ${isLocked 
              ? "bg-slate-700 text-slate-500 cursor-not-allowed"
              : "bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/50 hover:scale-105"
            }
          `}
        >
          {isLoading 
      ? "Minting..." /* CHANGÉ */
      : isLocked 
        ? `${badge.minScore} pts required` /* CHANGÉ (ex: 10 pts required) */
        : badge.category === "Score" ? "Claim" : "Check Eligibility" /* CHANGÉ */
    }
  </button>
      )}
    </div>
  );
}
