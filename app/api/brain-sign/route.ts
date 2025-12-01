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

    // --- ZONE DE VERIFICATION DE LA CLE ---
    let rawKey = process.env.BRAIN_SIGNER_PRIVATE_KEY;
    if (!rawKey) rawKey = process.env.SIGNER_PRIVATE_KEY;

    if (!rawKey) {
      console.error("❌ CRITICAL: No Private Key found in Env Vars");
      return NextResponse.json({ error: "Server Key Missing" }, { status: 500 });
    }

    // Nettoyage clé
    let cleanKey = rawKey.trim().replace(/"/g, '');
    if (!cleanKey.startsWith("0x")) cleanKey = `0x${cleanKey}`;
    
    const privateKey = cleanKey as `0x${string}`;
    const account = privateKeyToAccount(privateKey);

    // 👇 LE MOUCHARD : Regardez les logs Vercel pour voir ces lignes !
    console.log("==========================================");
    console.log("👮‍♂️ SERVER SIGNING REPORT:");
    console.log("🔑 Signer Address (Vercel):", account.address); 
    console.log("👤 Player Address:", player);
    console.log("🔢 Nonce Signed:", nonce);
    console.log("💰 Amount:", BigInt(Math.abs(delta)).toString());
    console.log("==========================================");
    // ----------------------------------------

    const officialPoints = QUEST_POINTS[questId];
    if (delta !== officialPoints) return NextResponse.json({ error: "Points mismatch" }, { status: 403 });

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
    console.error("Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
