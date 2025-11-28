import { NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import BrainScoreABI from "../../../types/BrainScoreSigned.json";
// 👇 CHANGEMENT ICI AUSSI
import Redis from "ioredis";

const rawKey = process.env.SIGNER_PRIVATE_KEY || "";
const PRIVATE_KEY = (rawKey.startsWith("0x") ? rawKey : "0x" + rawKey) as `0x${string}`;
const BRAIN_SCORE_CONTRACT = process.env.NEXT_PUBLIC_BRAIN_CONTRACT as `0x${string}`;
const BADGE_CONTRACT = process.env.NEXT_PUBLIC_BADGE_CONTRACT as `0x${string}`;

// Connexion Redis
const redis = new Redis(process.env.REDIS_URL!);

const publicClient = createPublicClient({ 
  chain: base, 
  transport: http(process.env.NEXT_PUBLIC_RPC_URL || "https://base.llamarpc.com") 
});

export async function POST(request: Request) {
  try {
    const { userAddress, badgeId } = await request.json();
    const player = userAddress.toLowerCase();

    if (!userAddress || !badgeId) return NextResponse.json({ error: "Missing parameters" }, { status: 400 });

    // 1. Lire Score
    const data = await publicClient.readContract({
      address: BRAIN_SCORE_CONTRACT,
      abi: BrainScoreABI.abi,
      functionName: "getPlayer", 
      args: [userAddress],
    } as any);
    const currentScore = Array.isArray(data) ? Number(data[0]) : Number(data);

    // 2. Vérification
    let isEligible = false;

    switch (badgeId) {
      case 1: isEligible = currentScore >= 25; break;   
      case 2: isEligible = currentScore >= 50; break;   
      case 3: isEligible = currentScore >= 100; break;  
      case 4: isEligible = currentScore >= 500; break;  
      case 5: isEligible = currentScore >= 1000; break; 

      case 10: isEligible = currentScore > 0; break; 
      
      case 11: // Phoenix
        const hasBankrupted = await redis.get(`has_bankrupted:${player}`);
        isEligible = !!hasBankrupted;
        break;
      
      case 12: // Gambler
        const spins = await redis.get(`total_spins:${player}`);
        isEligible = Number(spins) >= 50; 
        break;

      case 13: // Lucky Bastard
        const bonusSpins = await redis.get(`bonus_spins:${player}`);
        isEligible = Number(bonusSpins) >= 10;
        break;

      case 20: isEligible = true; break; 
      
      case 21: // Weekend Warrior
        const weekends = await redis.get(`weekend_score:${player}`);
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
    return NextResponse.json({ error: error.message || "Server Error" }, { status: 500 });
  }
}
