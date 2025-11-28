"use client";

import { useEffect, useState } from "react";
import { createPublicClient, http, parseAbiItem } from "viem";
import { base } from "viem/chains";

// RPC Public (Fallback sur Ankr)
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.ankr.com/base";

const publicClient = createPublicClient({
  chain: base,
  transport: http(RPC_URL),
});

const BRAIN_CONTRACT = process.env.NEXT_PUBLIC_BRAIN_CONTRACT as `0x${string}`;

// On scanne les 10 000 derniers blocs (environ 5h) pour la stabilité
const SAFE_BLOCK_RANGE = BigInt(10000); 

type LeaderboardItem = {
  user: string;
  score: number;
};

export default function Leaderboard() {
  const [leaders, setLeaders] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false); // État pour ouvrir/fermer la modale

  useEffect(() => {
    let isMounted = true;

    async function fetchLeaderboard() {
      try {
        const latestBlock = await publicClient.getBlockNumber();
        const fromBlock = latestBlock - SAFE_BLOCK_RANGE;

        const logs = await publicClient.getLogs({
          address: BRAIN_CONTRACT,
          event: parseAbiItem("event ScoreUpdated(address indexed user, uint256 newTotal)"),
          fromBlock: fromBlock, 
          toBlock: latestBlock
        });

        const scoresMap: Record<string, number> = {};

        logs.forEach((log) => {
          const user = log.args.user;
          const score = log.args.newTotal;
          if (user && score !== undefined) {
            scoresMap[user] = Number(score);
          }
        });

        // On garde le TOP 20
        const sorted = Object.entries(scoresMap)
          .map(([user, score]) => ({ user, score }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 20);

        if (isMounted) {
          setLeaders(sorted);
          setLoading(false);
        }
      } catch (err) {
        console.error("Leaderboard error (Silent):", err);
        if (isMounted) setLoading(false);
      }
    }

    fetchLeaderboard();
    return () => { isMounted = false; };
  }, []);

  // Si pas de données, on cache le composant
  if (leaders.length === 0 && !loading) return null;

  return (
    <>
      {/* --- 1. APERÇU (MINI) EN BAS DE PAGE --- */}
      <div 
        onClick={() => setIsOpen(true)} 
        className="w-full max-w-lg mt-4 px-4 animate-in fade-in duration-700 cursor-pointer group pb-8"
      >
        <div className="bg-slate-900/60 border border-slate-800 group-hover:border-blue-500/50 rounded-xl p-3 backdrop-blur-sm transition-all">
          
          <div className="flex justify-center items-center gap-2 mb-2">
             <h3 className="text-[10px] font-bold text-slate-500 group-hover:text-blue-400 uppercase tracking-widest transition-colors">
               🔥 Live Movers (Last Hours)
             </h3>
          </div>

          {loading ? (
             <div className="flex justify-center py-2">
               <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
             </div>
          ) : (
            <div className="space-y-1">
              {/* On affiche seulement le TOP 3 */}
              {leaders.slice(0, 3).map((item, index) => (
                <div key={item.user} className="flex justify-between items-center text-[10px] px-2 py-1 bg-slate-800/40 rounded border border-slate-700/30">
                  <div className="flex items-center gap-2">
                    <span className={`font-mono font-bold w-3 text-center ${index === 0 ? "text-yellow-400" : "text-slate-500"}`}>
                      #{index + 1}
                    </span>
                    <span className="font-mono text-slate-300">
                      {item.user.slice(0, 6)}...{item.user.slice(-4)}
                    </span>
                  </div>
                  <span className="font-bold text-emerald-400">{item.score} 🧠</span>
                </div>
              ))}
              <div className="text-center text-[9px] text-slate-600 mt-1 pt-1 border-t border-slate-800">
                 Tap to see full ranking
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- 2. MODALE (POP-UP) --- */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsOpen(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full max-h-[70vh] flex flex-col shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            
            {/* Header Modale */}
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50 rounded-t-2xl">
              <h2 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 uppercase tracking-wider">
                Top Brains
              </h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Liste Défilante */}
            <div className="overflow-y-auto p-4 space-y-2">
              {leaders.map((item, index) => (
                <div key={item.user} className={`flex justify-between items-center p-3 rounded-xl border ${
                  index === 0 ? "bg-yellow-900/10 border-yellow-500/30" : 
                  index === 1 ? "bg-slate-800/50 border-slate-600/30" :
                  index === 2 ? "bg-orange-900/10 border-orange-500/30" :
                  "bg-slate-900 border-slate-800"
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 flex items-center justify-center rounded-full font-bold text-xs ${
                        index === 0 ? "bg-yellow-500 text-black" : 
                        index === 1 ? "bg-slate-400 text-black" :
                        index === 2 ? "bg-orange-500 text-black" :
                        "bg-slate-800 text-slate-500"
                    }`}>
                      {index + 1}
                    </div>
                    <span className={`font-mono text-sm ${index < 3 ? "text-white font-bold" : "text-slate-400"}`}>
                      {item.user.slice(0, 6)}...{item.user.slice(-4)}
                    </span>
                  </div>
                  <span className="font-black text-emerald-400">{item.score} 🧠</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
