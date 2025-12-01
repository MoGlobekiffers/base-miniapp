import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, http, toHex, keccak256, encodePacked } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";

const QUEST_POINTS: Record<string, number> = {
  "Base Speed Quiz": 5,
  "Farcaster Flash Quiz": 5,
  "Mini app quiz": 5,
  "Cast Party": 3,
  "Like Storm": 3,
  "Reply Sprint": 3,
  "Invite & Share": 3,
  "Test a top mini app": 3,
  "Bonus spin": 1,
  "Meme Factory": 4,
  "Mint My Nft": 3,
  "Mini apps mashup": 4,
  "Crazy promo": 4,
  "Bankruptcy": -10,
  "Creative #gm": 3,
  "Daily check-in": 2,
  "Mystery Challenge": 4,
  "Double points": 0,
  "Web3 Survivor": 8,
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { player, questId, delta, nonce, deadline, proof } = body;

    // 1. Vérifications de base
    if (!player || !questId || delta === undefined || !nonce || !deadline) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const officialPoints = QUEST_POINTS[questId];
    
    if (officialPoints === undefined) {
      return NextResponse.json({ error: "Invalid Quest ID" }, { status: 400 });
    }

    if (delta !== officialPoints) {
       return NextResponse.json({ error: "Cheating attempt: Points mismatch" }, { status: 403 });
    }

    // --- ZONE DE DEBUG ET RECUPERATION CLE ---
    let rawKey = process.env.BRAIN_SIGNER_PRIVATE_KEY;
    
    // Debug dans les logs Vercel (Fonction > Logs)
    console.log(`[DEBUG] Checking BRAIN_SIGNER_PRIVATE_KEY... Found? ${!!rawKey}`);

    // Si pas trouvée, on essaie l'autre nom possible
    if (!rawKey) {
        console.log(`[DEBUG] Key missing. Trying fallback: SIGNER_PRIVATE_KEY`);
        rawKey = process.env.SIGNER_PRIVATE_KEY;
    }

    if (!rawKey) {
      console.error("!!! CRITICAL ERROR: No private key found in env vars !!!");
      // On renvoie une erreur explicite pour le client
      return NextResponse.json({ error: "Server Error: Private Key Config Missing" }, { status: 500 });
    }

    // Nettoyage de la clé (parfois des espaces ou des guillemets traînent)
    // On s'assure qu'elle commence par 0x
    let cleanKey = rawKey.trim().replace(/"/g, '');
    if (!cleanKey.startsWith("0x")) {
        cleanKey = `0x${cleanKey}`;
    }
    
    const privateKey = cleanKey as `0x${string}`;
    // ------------------------------------------

    const account = privateKeyToAccount(privateKey);
    
    const absAmount = BigInt(Math.abs(delta));
    const isNegative = delta < 0;

    const messageHash = keccak256(
      encodePacked(
        ["address", "uint256", "bool", "uint256", "uint256"],
        [player as `0x${string}`, absAmount, isNegative, BigInt(nonce), BigInt(deadline)]
      )
    );

    const signature = await account.signMessage({
        message: { raw: messageHash }
    });

    return NextResponse.json({ signature });

  } catch (error: any) {
    console.error("Error signing reward:", error);
    return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 });
  }
}
