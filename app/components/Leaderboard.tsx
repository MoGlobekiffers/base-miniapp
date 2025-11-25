"use client";

import { useEffect, useState } from "react";
// Pas besoin de toHex ici si on passe le BigInt directement
import { createPublicClient, http, parseAbiItem } from "viem"; 
import { base } from "viem/chains";

// Changement de RPC de secours pour ANKR (souvent plus fiable que Llama/Subquery)
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.ankr.com/base";

const publicClient = createPublicClient({
  chain: base,
  transport: http(RPC_URL),
});

const BRAIN_CONTRACT = process.env.NEXT_PUBLIC_BRAIN_CONTRACT as `0x${string}`;

// Limite de la plage de blocs pour respecter le serveur (50 000 blocs = env. 12h)
const SAFE_SCAN_LIMIT = 50000n; 


type LeaderboardItem = {
  user: string;
  score: number;
};

export default function Leaderboard() {
  const [leaders, setLeaders] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        if (!BRAIN_CONTRACT) {
          console.warn("Adresse du contrat BrainScore manquante.");
          setLoading(false);
          return;
        }
        
        // 1. Déterminer la plage de blocs sécurisée
        const latestBlock = await publicClient.getBlockNumber();
        const fromBlock = latestBlock > SAFE_SCAN_LIMIT ? latestBlock - SAFE_SCAN_LIMIT : 0n;
        
        // 2. Appel protégé : la promesse doit résoudre à un tableau []
        // Si l'RPC est bon, logs est un tableau. Si l'RPC est mauvais, une erreur est lancée.
        const logs = await publicClient.getLogs({
          address: BRAIN_CONTRACT,
          event: parseAbiItem("event ScoreUpdated(address indexed user, uint256 newTotal)"),
          fromBlock: fromBlock, 
        });

        const scoresMap: Record<string, number> = {};

        // 3. Traitement
        logs.forEach((log) => {
          const user = log.args.user;
          const score = log.args.newTotal;
          if (user && score !== undefined) {
            scoresMap[user] = Number(score);
          }
        });

        const sorted = Object.entries(scoresMap)
          .map(([user, score]) => ({ user, score }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 10);

        setLeaders(sorted);
      } catch (err) {
        // En cas d'erreur de réseau/type (le cas actuel), on log et on affiche le message d'erreur.
        console.error("Erreur RPC Leaderboard (Type/Réseau):", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, []);

  // Affichage "Safe" en cas d'erreur ou chargement
  if (loading) return <div className="text-center text-xs text-gray-500 animate-pulse">Chargement du Top 10...</div>;
  
  if (error) return (
    <div className="text-center text-xs text-red-400 border border-red-900/30 p-2 rounded bg-red-900/10">
      Classement indisponible (Problème de connexion RPC). <br/> Veuillez redémarrer le serveur et vérifier votre `.env.local`.
    </div>
  );

  if (leaders.length === 0) return <div className="text-center text-xs text-gray-500">Aucun score enregistré.</div>;

  return (
    <div className="w-full max-w-md bg-slate-900/50 p-4 rounded-xl border border-slate-800 mt-8">
      <h3 className="text-center font-bold text-purple-400 mb-4">🏆 Top Brains (Onchain)</h3>
      <div className="space-y-2">
        {leaders.map((item, index) => (
          <div key={item.user} className="flex justify-between items-center text-sm p-2 bg-slate-800/50 rounded hover:bg-slate-800 transition">
            <div className="flex items-center gap-3">
              <span className={`font-mono font-bold w-6 text-center ${index === 0 ? "text-yellow-400 text-lg" : index === 1 ? "text-gray-300" : index === 2 ? "text-orange-400" : "text-slate-500"}`}>
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
    </div>
  );
}
