import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, http, toHex, keccak256, encodePacked } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";

const QUEST_POINTS: Record<string, number> = {
  "Base Speed Quiz": 5, "Farcaster Flash Quiz": 5, "Mini app quiz": 5,
  "Cast Party": 3, "Like Storm": 3, "Reply Sprint": 3, "Invite & Share": 3,
  "Test a top mini app": 3, "Bonus spin": 1, "Meme Factory": 4,
  "Mint My Nft": 3, "Mini apps mashup": 4, "Crazy promo": 4,
  "Bankruptcy": -10, "Creative #gm": 3, "Daily check-in": 2,
  "Mystery Challenge": 4, "Double points": 0, "Web3 Survivor": 8,
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { player, questId, delta, nonce, deadline, proof } = body;

    // --- RECUPERATION CLE ---
    let rawKey = process.env.BRAIN_SIGNER_PRIVATE_KEY || process.env.SIGNER_PRIVATE_KEY;
    if (!rawKey) return NextResponse.json({ error: "Server Key Missing" }, { status: 500 });

    let cleanKey = rawKey.trim().replace(/"/g, '');
    if (!cleanKey.startsWith("0x")) cleanKey = `0x${cleanKey}`;
    
    const privateKey = cleanKey as `0x${string}`;
    const account = privateKeyToAccount(privateKey);

    // --- VERIFICATIONS ---
    const officialPoints = QUEST_POINTS[questId];
    if (delta !== officialPoints) return NextResponse.json({ error: "Points mismatch" }, { status: 403 });

    // --- PREPARATION DONNEES ---
    const absAmount = BigInt(Math.abs(delta));
    const isNegative = delta < 0;
    
    // 👇 ASTUCE TECHNIQUE : On convertit le Bool en Uint8 (0 ou 1) manuellement
    // Cela évite les bugs d'encodage entre JS et Solidity
    const negativeAsByte = isNegative ? 1 : 0; 

    // Hachage avec uint8 au lieu de bool
    const messageHash = keccak256(
      encodePacked(
        // On change "bool" par "uint8" pour être sûr du format (1 byte)
        ["address", "uint256", "uint8", "uint256", "uint256"], 
        [
            player as `0x${string}`, 
            absAmount, 
            negativeAsByte, // On envoie 0 ou 1
            BigInt(nonce), 
            BigInt(deadline)
        ]
      )
    );

    const signature = await account.signMessage({
        message: { raw: messageHash }
    });

    return NextResponse.json({ signature });

  } catch (error: any) {
    console.error("Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
