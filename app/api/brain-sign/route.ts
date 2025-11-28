import { NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import { kv } from "@vercel/kv"; 

const rawKey = process.env.SIGNER_PRIVATE_KEY || "";
const PRIVATE_KEY = (rawKey.startsWith("0x") ? rawKey : "0x" + rawKey) as `0x${string}`;
const BRAIN_CONTRACT = process.env.NEXT_PUBLIC_BRAIN_CONTRACT as `0x${string}`;

// --- CONFIGURATION DE LA VALIDATION ---

// 1. ADRESSE DE VOTRE COLLECTION NFT (Pixel Brain Parade)
const NFT_COLLECTION_ADDRESS = "0x8d653170f33e485b4b375c5bcd67c58cc42db397"; 

// 2. RÉPONSES CORRECTES DES QUIZ (Index: 0=A, 1=B, 2=C)
// (À adapter selon l'ordre de vos réponses dans quizPools.ts)
const QUIZ_ANSWERS: Record<string, number> = {
  "Base Speed Quiz": 0,       
  "Farcaster Flash Quiz": 1,  
  "Mini app quiz": 2,         
};

const publicClient = createPublicClient({ 
  chain: base, 
  transport: http(process.env.NEXT_PUBLIC_RPC_URL || "https://base.llamarpc.com") 
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { player, questId, delta, nonce, deadline, proof } = body; 
    const playerKey = player.toLowerCase();

    // --- 🕵️‍♂️ 1. VÉRIFICATION ANTI-TRICHE (Cooldown) ---
    if (questId !== "Bonus spin") { 
      const lastSpin = await kv.get(`last_spin_ts:${playerKey}`);
      const now = Date.now();
      // 12 heures = 43200000 ms
      if (lastSpin && (now - Number(lastSpin) < 43200000)) {
         return NextResponse.json({ error: "Cooldown actif ! Revenez plus tard." }, { status: 403 });
      }
    }

    // --- 🧠 2. VÉRIFICATION DES QUIZ ---
    if (QUIZ_ANSWERS[questId] !== undefined) {
      if (proof === undefined || proof !== QUIZ_ANSWERS[questId]) {
        return NextResponse.json({ error: "Mauvaise réponse au quiz !" }, { status: 400 });
      }
    }

    // --- 💎 3. VÉRIFICATION ONCHAIN (Pixel Brain Parade) ---
    if (questId === "Mint my NFT Free") {
      try {
        // On vérifie la balance (combien de NFT il possède)
        const balance = await publicClient.readContract({
          address: NFT_COLLECTION_ADDRESS as `0x${string}`,
          abi: [{ 
            name: 'balanceOf', 
            type: 'function', 
            stateMutability: 'view',
            inputs: [{name: 'owner', type: 'address'}], 
            outputs: [{name: 'balance', type: 'uint256'}] 
          }],
          functionName: 'balanceOf',
          args: [player],
        });

        if (Number(balance) === 0) {
           return NextResponse.json({ error: "Vous ne possédez pas le NFT 'Pixel Brain Parade' !" }, { status: 400 });
        }
      } catch (e) {
        console.error("Erreur vérification NFT:", e);
        // En cas d'erreur RPC, on bloque par sécurité (ou on laisse passer selon votre choix)
        return NextResponse.json({ error: "Impossible de vérifier le NFT. Réessayez." }, { status: 500 });
      }
    }

    // --- ✅ 4. ENREGISTREMENT STATS (Redis) ---
    try {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const now = Date.now();

      // Mise à jour du cooldown
      if (questId !== "Bonus spin") {
         await kv.set(`last_spin_ts:${playerKey}`, now);
      }

      await kv.incr(`total_spins:${playerKey}`);

      if (questId === "Bonus spin") await kv.incr(`bonus_spins:${playerKey}`);
      if (questId === "Bankruptcy") await kv.set(`has_bankrupted:${playerKey}`, "true");

      // Weekend Warrior Logic
      if (dayOfWeek === 6) await kv.set(`played_sat:${playerKey}`, "true", { ex: 48 * 3600 });
      else if (dayOfWeek === 0) {
          const playedSaturday = await kv.get(`played_sat:${playerKey}`);
          if (playedSaturday) {
              await kv.incr(`weekend_score:${playerKey}`);
              await kv.del(`played_sat:${playerKey}`);
          }
      }
    } catch(e) { console.error("Erreur KV:", e); }

    // --- ✍️ 5. SIGNATURE ---
    const account = privateKeyToAccount(PRIVATE_KEY);
    const domain = { name: "BrainScore", version: "1", chainId: 8453, verifyingContract: BRAIN_CONTRACT };
    const types = { Claim: [{ name: "user", type: "address" }, { name: "amount", type: "uint256" }, { name: "isNegative", type: "bool" }, { name: "nonce", type: "uint256" }, { name: "deadline", type: "uint256" }] };

    const signature = await account.signTypedData({
      domain, types, primaryType: "Claim",
      message: { user: player, amount: BigInt(Math.abs(delta)), isNegative: delta < 0, nonce: BigInt(nonce), deadline: BigInt(deadline) },
    });

    return NextResponse.json({ signature });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || "Server Error" }, { status: 500 });
  }
}
