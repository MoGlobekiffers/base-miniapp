"use client";

import { useEffect, useState } from "react";
import { createPublicClient, http, parseAbiItem } from "viem";
import { base } from "viem/chains";

// Type pour un joueur
type Leader = {
  address: string;
  score: number;
};

export default function Leaderboard() {
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const publicClient = createPublicClient({
          chain: base,
          transport: http(process.env.NEXT_PUBLIC_RPC_URL),
        });

        // 1. Récupérer tous les événements "ScoreUpdated" depuis le début
        // On récupère l'historique pour savoir qui a combien de points
        const logs = await publicClient.getLogs({
          address: process.env.NEXT_PUBLIC_BRAIN_CONTRACT as `0x${string}`,
          event: parseAbiItem(
            "event ScoreUpdated(address indexed user, uint256 newTotal)"
          ),
          fromBlock: 38609587n,
        });

        // 2. Traiter les données : on veut le DERNIER score connu par joueur
        const scoresMap = new Map<string, number>();

        logs.forEach((log) => {
          const user = log.args.user;
          const newTotal = Number(log.args.newTotal);
          
          if (user) {
            // Comme les logs sont chronologiques, le dernier événement écrase les précédents
            scoresMap.set(user, newTotal);
          }
        });

        // 3. Convertir en tableau et trier (Le plus gros score en premier)
        const sortedLeaders = Array.from(scoresMap.entries())
          .map(([address, score]) => ({ address, score }))
          .sort((a, b) => b.score - a.score) // Tri décroissant
          .slice(0, 10); // On garde le TOP 10

        setLeaders(sortedLeaders);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  // Fonction pour raccourcir l'adresse (0x12...34)
  const shorten = (addr: string) => 
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div className="w-full max-w-md bg-slate-900/50 border border-slate-800 rounded-2xl p-6 mt-8 mb-12">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        🏆 Top Brains (Onchain)
      </h2>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-slate-800 rounded-lg w-full" />
          ))}
        </div>
      ) : leaders.length === 0 ? (
        <p className="text-slate-500 text-sm">No players yet. Be the first!</p>
      ) : (
        <div className="flex flex-col gap-2">
          {leaders.map((leader, index) => (
            <div
              key={leader.address}
              className={`flex items-center justify-between p-3 rounded-xl border 
                ${index === 0 ? "bg-amber-500/10 border-amber-500/30" : 
                  index === 1 ? "bg-slate-700/30 border-slate-600/30" :
                  index === 2 ? "bg-orange-700/20 border-orange-700/30" :
                  "bg-slate-800/30 border-transparent hover:border-slate-700"}
              `}
            >
              <div className="flex items-center gap-3">
                <span className={`
                  font-bold w-6 text-center
                  ${index === 0 ? "text-amber-400 text-lg" : 
                    index === 1 ? "text-slate-300" : 
                    index === 2 ? "text-orange-400" : "text-slate-500"}
                `}>
                  {index + 1}
                </span>
                <div className="flex flex-col">
                  <span className="text-slate-200 text-sm font-mono">
                    {shorten(leader.address)}
                  </span>
                </div>
              </div>
              <div className="font-bold text-emerald-400">
                {leader.score} <span className="text-xs text-slate-500">🧠</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
