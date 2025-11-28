import { NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
// 👇 CHANGEMENT : On utilise ioredis au lieu de @vercel/kv
import Redis from "ioredis";

const rawKey = process.env.SIGNER_PRIVATE_KEY || "";
const PRIVATE_KEY = (rawKey.startsWith("0x") ? rawKey : "0x" + rawKey) as `0x${string}`;
const BRAIN_CONTRACT = process.env.NEXT_PUBLIC_BRAIN_CONTRACT as `0x${string}`;
const NFT_COLLECTION_ADDRESS = "0x8d653170f33e485b4b375c5bcd67c58cc42db397"; 

const QUIZ_ANSWERS: Record<string, number> = {
  "Base Speed Quiz": 0, "Farcaster Flash Quiz": 1, "Mini app quiz": 2,         
};

// 👇 CONNEXION REDIS STANDARD
const redis = new Redis(process.env.REDIS_URL!);

const publicClient = createPublicClient({ 
  chain: base, 
  transport: http(process.env.NEXT_PUBLIC_RPC_URL || "https://base.llamarpc.com") 
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { player, questId, delta, nonce, deadline, proof } = body; 
    const playerKey = player.toLowerCase();

    // --- 1. VÉRIFICATION ANTI-TRICHE (Cooldown) ---
    if (questId !== "Bonus spin") { 
      const lastSpin = await redis.get(`last_spin_ts:${playerKey}`);
      const now = Date.now();
      if (lastSpin && (now - Number(lastSpin) < 43200000)) {
         return NextResponse.json({ error: "Cooldown actif ! Revenez plus tard." }, { status: 403 });
      }
    }

    // --- 2. VÉRIFICATION DES QUIZ ---
    if (QUIZ_ANSWERS[questId] !== undefined) {
      if (proof === undefined || proof !== QUIZ_ANSWERS[questId]) {
        return NextResponse.json({ error: "Mauvaise réponse au quiz !" }, { status: 400 });
      }
    }

    // --- 3. VÉRIFICATION ONCHAIN (NFT) ---
    if (questId === "Mint my NFT Free") {
      try {
        const balance = await publicClient.readContract({
          address: NFT_COLLECTION_ADDRESS as `0x${string}`,
          abi: [{ name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{name: 'owner', type: 'address'}], outputs: [{name: 'balance', type: 'uint256'}] }],
          functionName: 'balanceOf',
          args: [player],
        } as any);

        if (Number(balance) === 0) {
           return NextResponse.json({ error: "Vous ne possédez pas le NFT 'Pixel Brain Parade' !" }, { status: 400 });
        }
      } catch (e) {
        console.error("Erreur NFT:", e);
        return NextResponse.json({ error: "Impossible de vérifier le NFT." }, { status: 500 });
      }
    }

    // --- 4. ENREGISTREMENT REDIS ---
    try {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const now = Date.now();

      if (questId !== "Bonus spin") {
         await redis.set(`last_spin_ts:${playerKey}`, now);
      }

      await redis.incr(`total_spins:${playerKey}`);

      if (questId === "Bonus spin") await redis.incr(`bonus_spins:${playerKey}`);
      if (questId === "Bankruptcy") await redis.set(`has_bankrupted:${playerKey}`, "true");

      if (dayOfWeek === 6) await redis.set(`played_sat:${playerKey}`, "true", "EX", 48 * 3600);
      else if (dayOfWeek === 0) {
          const playedSaturday = await redis.get(`played_sat:${playerKey}`);
          if (playedSaturday) {
              await redis.incr(`weekend_score:${playerKey}`);
              await redis.del(`played_sat:${playerKey}`);
          }
      }
    } catch(e) { console.error("Erreur Redis:", e); }

    // --- 5. SIGNATURE ---
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
