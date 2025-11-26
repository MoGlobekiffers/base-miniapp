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

// On scanne les dernières heures pour voir les joueurs actifs
const SAFE_BLOCK_RANGE = 10000n; 

type LeaderboardItem = {
  user: string;
  score: number;
};

export default function Leaderboard() {
  const [leaders, setLeaders] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  // 👇 Nouvel état pour gérer l'ouverture de la fenêtre
  const [isOpen, setIsOpen] = useState(false);

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

        // On garde le TOP 20 en mémoire
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
        if (isMounted) {
            setError(true);
            setLoading(false);
        }
      }
    }

    fetchLeaderboard();

    return () => { isMounted = false; };
  }, []);

  if (error || (leaders.length === 0 && !loading)) return null;

  return (
    <>
      {/* --- VERSION MINI (En bas de page) --- */}
      <div 
        onClick={() => setIsOpen(true)} // Ouvre la modale au clic
        className="w-full mt-6 px-4 animate-in fade-in duration-700 cursor-pointer group"
      >
        <div className="bg-slate-900/60 border border-slate-800 group-hover:border-blue-500/50 rounded-xl p-3 backdrop-blur-sm transition-all">
          
          <div className="flex justify-center items-center gap-2 mb-2">
             <h3 className="text-xs font-bold text-slate-500 group-hover:text-blue-400 uppercase tracking-widest transition-colors">
               🔥 Live Movers
             </h3>
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 text-slate-500 group-hover:text-blue-400">
               <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
             </svg>
          </div>

          {loading ? (
             <div className="flex justify-center py-2">
               <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
             </div>
          ) : (
            <div className="space-y-1">
              {/* On affiche seulement le TOP 3 dans le mini panneau */}
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

      {/* --- MODALE (PLEIN ÉCRAN) --- */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          {/* Container de la fenêtre */}
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full max-h-[80vh] flex flex-col shadow-2xl relative">
            
            {/* Header Modale */}
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50 rounded-t-2xl">
              <h2 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 uppercase tracking-wider">
                Top Brains (Live)
              </h2>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
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
                    {/* Badge de rang */}
                    <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm ${
                        index === 0 ? "bg-yellow-500 text-black" : 
                        index === 1 ? "bg-slate-400 text-black" :
                        index === 2 ? "bg-orange-500 text-black" :
                        "bg-slate-800 text-slate-500"
                    }`}>
                      {index + 1}
                    </div>
                    
                    <div className="flex flex-col">
                        <span className={`font-mono text-sm ${index < 3 ? "text-white font-bold" : "text-slate-400"}`}>
                        {item.user.slice(0, 6)}...{item.user.slice(-4)}
                        </span>
                        {index === 0 && <span className="text-[9px] text-yellow-500 uppercase font-bold tracking-wider">Current Leader</span>}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <span className="block font-black text-emerald-400 text-lg">{item.score}</span>
                    <span className="text-[9px] text-slate-600 uppercase">Points</span>
                  </div>
                </div>
              ))}
              
              {leaders.length === 0 && (
                <div className="text-center py-10 text-slate-500">
                  No recent activity found.
                </div>
              )}
            </div>

            {/* Footer Modale */}
            <div className="p-3 border-t border-slate-800 bg-slate-950/30 text-center">
              <p className="text-[10px] text-slate-500">
                Shows active players from the last ~6 hours.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
