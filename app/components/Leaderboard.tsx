"use client";

import { useEffect, useState } from "react";
import { createPublicClient, http, parseAbiItem } from "viem";
import { base } from "viem/chains";

// RPC Public
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.ankr.com/base";

const publicClient = createPublicClient({
  chain: base,
  transport: http(RPC_URL),
});

const BRAIN_CONTRACT = process.env.NEXT_PUBLIC_BRAIN_CONTRACT as `0x${string}`;
const SAFE_BLOCK_RANGE = 10000n; 

type LeaderboardItem = {
  user: string;
  score: number;
};

export default function Leaderboard() {
  const [leaders, setLeaders] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);
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
          if (user && score !== undefined) scoresMap[user] = Number(score);
        });

        const sorted = Object.entries(scoresMap)
          .map(([user, score]) => ({ user, score }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 20);

        if (isMounted) {
          setLeaders(sorted);
          setLoading(false);
        }
      } catch (err) {
        console.error("Leaderboard error:", err);
        if (isMounted) setLoading(false);
      }
    }
    fetchLeaderboard();
    return () => { isMounted = false; };
  }, []);

  // 🛑 J'AI ENLEVÉ LA LIGNE QUI CACHAIT LE COMPOSANT EN CAS D'ERREUR
  
  return (
    <>
      {/* --- MINI PANEL (TOUJOURS VISIBLE) --- */}
      <div 
        onClick={() => setIsOpen(true)} 
        className="w-full mt-8 px-4 pb-10 cursor-pointer group animate-in fade-in slide-in-from-bottom-8"
      >
        <div className="bg-slate-900/80 border border-slate-800 group-hover:border-purple-500/50 rounded-xl p-4 backdrop-blur-md transition-all shadow-lg">
          
          <div className="flex justify-center items-center gap-2 mb-3">
             <h3 className="text-[10px] font-black text-slate-500 group-hover:text-purple-400 uppercase tracking-[0.2em] transition-colors">
               LIVE MOVERS
             </h3>
          </div>

          {loading ? (
             <div className="flex justify-center py-2 text-[10px] text-slate-600 font-mono animate-pulse">
               Scanning chain...
             </div>
          ) : leaders.length === 0 ? (
             <div className="text-center text-[10px] text-slate-600 py-2">
               No recent activity. Be the first!
             </div>
          ) : (
            <div className="space-y-1.5">
              {leaders.slice(0, 3).map((item, index) => (
                <div key={item.user} className="flex justify-between items-center text-[11px] px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700/30">
                  <div className="flex items-center gap-2">
                    <span className={`font-mono font-bold w-4 text-center ${index === 0 ? "text-yellow-400" : "text-slate-500"}`}>
                      #{index + 1}
                    </span>
                    <span className="font-mono text-slate-300">
                      {item.user.slice(0, 6)}...{item.user.slice(-4)}
                    </span>
                  </div>
                  <span className="font-black text-emerald-400">{item.score}</span>
                </div>
              ))}
              <div className="text-center text-[9px] text-slate-600 mt-2 pt-2 border-t border-slate-800 group-hover:text-slate-400 transition-colors">
                 Tap to see full ranking
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- MODALE --- */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsOpen(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full max-h-[70vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50 rounded-t-2xl">
              <h2 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 uppercase tracking-wider">
                Top Brains
              </h2>
              <button onClick={() => setIsOpen(false)} className="p-1 bg-slate-800 rounded-full text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="overflow-y-auto p-4 space-y-2">
              {leaders.map((item, index) => (
                <div key={item.user} className="flex justify-between items-center p-3 rounded-xl border bg-slate-900 border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-slate-500">{index + 1}</div>
                    <span className="font-mono text-sm text-slate-300">{item.user.slice(0, 6)}...{item.user.slice(-4)}</span>
                  </div>
                  <span className="font-black text-emerald-400">{item.score}</span>
                </div>
              ))}
               {leaders.length === 0 && <div className="text-center py-8 text-slate-500">No data yet.</div>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
