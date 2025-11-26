import { NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
// 👇 IMPORT IMPORTANT
import { kv } from "@vercel/kv"; 

const rawKey = process.env.SIGNER_PRIVATE_KEY || "";
const PRIVATE_KEY = (rawKey.startsWith("0x") ? rawKey : "0x" + rawKey) as `0x${string}`;
const BRAIN_CONTRACT = process.env.NEXT_PUBLIC_BRAIN_CONTRACT as `0x${string}`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { player, questId, delta, nonce, deadline } = body;

    // --- 🧠 LOGIQUE DE MÉMOIRE (Redis/KV) ---
    try {
      const playerKey = player.toLowerCase();
      const today = new Date();
      const dayOfWeek = today.getDay(); // 6 = Samedi, 0 = Dimanche
      
      // 1. Compteur total de Spins (Pour le badge Gambler)
      await kv.incr(`total_spins:${playerKey}`);

      // 2. Logique Weekend Warrior
      if (dayOfWeek === 6) {
        // C'est Samedi : On note qu'il a joué. Expire dans 48h.
        await kv.set(`played_sat:${playerKey}`, "true", { ex: 48 * 3600 });
      } 
      else if (dayOfWeek === 0) {
        // C'est Dimanche : A-t-il joué Samedi ?
        const playedSaturday = await kv.get(`played_sat:${playerKey}`);
        
        if (playedSaturday) {
          // OUI ! Week-end validé. On incrémente le score de week-ends.
          await kv.incr(`weekend_score:${playerKey}`);
          // On supprime la note du samedi pour ne pas compter double
          await kv.del(`played_sat:${playerKey}`);
        }
      }

    } catch (dbError) {
      console.error("Erreur Base de Données (Non bloquant):", dbError);
    }
    // ------------------------------------------

    // Signature Blockchain (Code standard)
    const account = privateKeyToAccount(PRIVATE_KEY);
    const domain = {
      name: "BrainScore",
      version: "1",
      chainId: 8453, 
      verifyingContract: BRAIN_CONTRACT,
    };
    
    const types = {
      Claim: [
        { name: "user", type: "address" },
        { name: "amount", type: "uint256" },
        { name: "isNegative", type: "bool" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    };

    const signature = await account.signTypedData({
      domain,
      types,
      primaryType: "Claim",
      message: {
        user: player,
        amount: BigInt(Math.abs(delta)),
        isNegative: delta < 0,
        nonce: BigInt(nonce),
        deadline: BigInt(deadline),
      },
    });

    return NextResponse.json({ signature });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
