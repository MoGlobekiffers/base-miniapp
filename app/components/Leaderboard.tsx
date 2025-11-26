"use client";

import { useEffect, useState } from "react";
import { createPublicClient, http, parseAbiItem } from "viem";
import { base } from "viem/chains";

// RPC Public (Fallback sur Ankr si la variable d'env est vide)
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.ankr.com/base";

const publicClient = createPublicClient({
  chain: base,
  transport: http(RPC_URL),
});

const BRAIN_CONTRACT = process.env.NEXT_PUBLIC_BRAIN_CONTRACT as `0x${string}`;

// On scanne environ les 4-5 dernières heures pour ne pas surcharger le RPC gratuit
const SAFE_BLOCK_RANGE = 10000n; 

type LeaderboardItem = {
  user: string;
  score: number;
};

export default function Leaderboard() {
  const [leaders, setLeaders] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchLeaderboard() {
      try {
        // 1. Récupérer le bloc actuel
        const latestBlock = await publicClient.getBlockNumber();
        const fromBlock = latestBlock - SAFE_BLOCK_RANGE;

        // 2. Récupérer les événements récents
        const logs = await publicClient.getLogs({
          address: BRAIN_CONTRACT,
          event: parseAbiItem("event ScoreUpdated(address indexed user, uint256 newTotal)"),
          fromBlock: fromBlock, 
          toBlock: latestBlock
        });

        // 3. Traiter les données (Gardez le score le plus haut vu pour chaque user)
        const scoresMap: Record<string, number> = {};

        logs.forEach((log) => {
          const user = log.args.user;
          const score = log.args.newTotal;
          if (user && score !== undefined) {
            // On convertit le BigInt en nombre
            scoresMap[user] = Number(score);
          }
        });

        // 4. Trier et prendre le Top 5
        const sorted = Object.entries(scoresMap)
          .map(([user, score]) => ({ user, score }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 5);

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

  // Si erreur ou vide, on n'affiche rien pour ne pas polluer l'interface
  if (error || (leaders.length === 0 && !loading)) return null;

  return (
    <div className="w-full mt-6 px-4 animate-in fade-in duration-700">
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 backdrop-blur-sm">
        <h3 className="text-xs font-bold text-center text-slate-500 uppercase tracking-widest mb-3">
          🔥 Live Movers (Last Hours)
        </h3>

        {loading ? (
           <div className="flex justify-center py-2">
             <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
           </div>
        ) : (
          <div className="space-y-2">
            {leaders.map((item, index) => (
              <div key={item.user} className="flex justify-between items-center text-xs p-2 bg-slate-800/40 rounded border border-slate-700/50">
                <div className="flex items-center gap-3">
                  <span className={`font-mono font-bold w-4 text-center ${index === 0 ? "text-yellow-400" : "text-slate-500"}`}>
                    #{index + 1}
                  </span>
                  <span className="font-mono text-slate-300">
                    {item.user.slice(0, 6)}...{item.user.slice(-4)}
                  </span>
                </div>
                <span className="font-bold text-emerald-400">{item.score} 🧠</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
