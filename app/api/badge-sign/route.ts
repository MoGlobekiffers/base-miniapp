import { NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import BrainScoreABI from "@/types/BrainScoreSigned.json"; 

// Gestion de la clé privée avec ou sans 0x
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

    if (!userAddress || !badgeId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // 1. Lire le score
    const data = await publicClient.readContract({
      address: BRAIN_SCORE_CONTRACT,
      abi: BrainScoreABI.abi,
      functionName: "getPlayer", 
      args: [userAddress],
    });

    const currentScore = Array.isArray(data) ? Number(data[0]) : Number(data);

    console.log(`User: ${userAddress} | Score: ${currentScore} | Badge: ${badgeId}`);

    // 2. Vérification des conditions (Mises à jour)
    let isEligible = false;

    switch (badgeId) {
      // --- Paliers de Score ---
      case 1: isEligible = currentScore >= 25; break;   // MAJ: 25 pts
      case 2: isEligible = currentScore >= 50; break;   
      case 3: isEligible = currentScore >= 100; break;  
      case 4: isEligible = currentScore >= 500; break;  
      case 5: isEligible = currentScore >= 1000; break; 

      // --- Gameplay ---
      case 10: isEligible = currentScore > 0; break; 
      case 11: isEligible = currentScore > 0; break; 
      case 12: isEligible = currentScore > 0; break; // TODO: Vérifier via DB
      case 13: isEligible = currentScore > 0; break; // TODO: Vérifier via DB

      // --- Spéciaux ---
      case 20: isEligible = true; break; // Early Adopter
      case 21: isEligible = true; break; // Weekend Warrior (TODO: DB check)

      default: isEligible = false;
    }

    if (!isEligible) {
      return NextResponse.json({ error: `Not enough points (${currentScore}) or conditions not met` }, { status: 400 });
    }

    // 3. Signature
    const account = privateKeyToAccount(PRIVATE_KEY);
    
    const domain = {
      name: "BrainBadges",
      version: "1",
      chainId: 8453, // Base Mainnet
      verifyingContract: BADGE_CONTRACT,
    };

    const types = {
      MintBadge: [
        { name: "user", type: "address" },
        { name: "badgeId", type: "uint256" },
        { name: "nonce", type: "uint256" },
      ],
    };

    const nonce = Date.now(); 

    const signature = await account.signTypedData({
      domain,
      types,
      primaryType: "MintBadge",
      message: {
        user: userAddress,
        badgeId: BigInt(badgeId),
        nonce: BigInt(nonce),
      },
    });

    return NextResponse.json({ signature, nonce, badgeId });

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message || "Server Error" }, { status: 500 });
  }
}
