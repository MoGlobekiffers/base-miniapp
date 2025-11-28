import { NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import BrainScoreABI from "../../../types/BrainScoreSigned.json";
import { kv } from "@vercel/kv";

const rawKey = process.env.SIGNER_PRIVATE_KEY || "";
const PRIVATE_KEY = (rawKey.startsWith("0x") ? rawKey : "0x" + rawKey) as `0x${string}`;

const BRAIN_SCORE_CONTRACT = process.env.NEXT_PUBLIC_BRAIN_CONTRACT as `0x${string}`;
const BADGE_CONTRACT = process.env.NEXT_PUBLIC_BADGE_CONTRACT as `0x${string}`;

const publicClient = createPublicClient({ 
  chain: base, 
  transport: http(process.env.NEXT_PUBLIC_RPC_URL || "https://base.llamarpc.com") 
});

export async function POST(request: Request) {
  try {
    const { userAddress, badgeId } = await request.json();
    const player = userAddress.toLowerCase();

    if (!userAddress || !badgeId) return NextResponse.json({ error: "Missing parameters" }, { status: 400 });

    // 1. Lire le score Blockchain
    const data = await publicClient.readContract({
      address: BRAIN_SCORE_CONTRACT,
      abi: BrainScoreABI.abi,
      functionName: "getPlayer", 
      args: [userAddress],
    });
    const currentScore = Array.isArray(data) ? Number(data[0]) : Number(data);

    // 2. Vérification des conditions
    let isEligible = false;

    switch (badgeId) {
      // --- Score Tiers ---
      case 1: isEligible = currentScore >= 25; break;   
      case 2: isEligible = currentScore >= 50; break;   
      case 3: isEligible = currentScore >= 100; break;  
      case 4: isEligible = currentScore >= 500; break;  
      case 5: isEligible = currentScore >= 1000; break; 

      // --- Gameplay ---
      case 10: isEligible = currentScore > 0; break; // First Blood (Avoir joué au moins une fois)
      
      case 11: // 🐦 PHOENIX : Avoir fait faillite
        const hasBankrupted = await kv.get(`has_bankrupted:${player}`);
        isEligible = !!hasBankrupted; // Doit être vrai
        break;
      
      case 12: // 🎲 GAMBLER : 50 Spins
        const spins = await kv.get(`total_spins:${player}`);
        isEligible = Number(spins) >= 50; 
        break;

      case 13: // 🍀 LUCKY BASTARD : 10 Bonus Spins
        const bonusSpins = await kv.get(`bonus_spins:${player}`);
        isEligible = Number(bonusSpins) >= 10;
        break;

      // --- Spéciaux ---
      case 20: isEligible = true; break; // Early Adopter
      
      case 21: // ⚔️ WEEKEND WARRIOR : 8 Weekends
        const weekends = await kv.get(`weekend_score:${player}`);
        isEligible = Number(weekends) >= 8; 
        break;

      default: isEligible = false;
    }

    if (!isEligible) {
      return NextResponse.json({ error: `Condition not met.` }, { status: 400 });
    }

    // 3. Signature
    const account = privateKeyToAccount(PRIVATE_KEY);
    const domain = { name: "BrainBadges", version: "1", chainId: 8453, verifyingContract: BADGE_CONTRACT };
    const types = { MintBadge: [{ name: "user", type: "address" }, { name: "badgeId", type: "uint256" }, { name: "nonce", type: "uint256" }] };
    const nonce = Date.now(); 

    const signature = await account.signTypedData({
      domain, types, primaryType: "MintBadge",
      message: { user: userAddress, badgeId: BigInt(badgeId), nonce: BigInt(nonce) },
    });

    return NextResponse.json({ signature, nonce, badgeId });

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
