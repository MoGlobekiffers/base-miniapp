import { NextRequest, NextResponse } from "next/server";
import { privateKeyToAccount } from "viem/accounts";

// Points par quête
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
    const { player, questId, delta, nonce, deadline } = body;

    // 1. Récupération de la clé privée
    let rawKey = process.env.BRAIN_SIGNER_PRIVATE_KEY || process.env.SIGNER_PRIVATE_KEY;
    if (!rawKey) return NextResponse.json({ error: "Server Key Missing" }, { status: 500 });

    let cleanKey = rawKey.trim().replace(/"/g, '');
    if (!cleanKey.startsWith("0x")) cleanKey = `0x${cleanKey}`;
    const account = privateKeyToAccount(cleanKey as `0x${string}`);

    // 2. Vérification des points
    const officialPoints = QUEST_POINTS[questId];
    if (delta !== officialPoints) return NextResponse.json({ error: "Points mismatch" }, { status: 403 });

    // 3. CONSTRUCTION DE LA SIGNATURE EIP-712 (Le cœur du correctif)
    
    // Le Domaine : Doit correspondre au constructeur du Smart Contract
    const domain = {
      name: "BrainScoreSigned", // On parie sur ce nom vu vos fichiers
      version: "1",
      chainId: 8453, // Base Mainnet
      verifyingContract: process.env.NEXT_PUBLIC_BRAIN_CONTRACT as `0x${string}`,
    } as const;

    // Les Types : Doivent correspondre à la struct dans le Smart Contract
    const types = {
      Claim: [
        { name: "player", type: "address" },
        { name: "amount", type: "uint256" },
        { name: "isNegative", type: "bool" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    } as const;

    const isNegative = delta < 0;
    const absAmount = BigInt(Math.abs(delta));

    // Signature structurée
    const signature = await account.signTypedData({
      domain,
      types,
      primaryType: "Claim",
      message: {
        player: player as `0x${string}`,
        amount: absAmount,
        isNegative: isNegative,
        nonce: BigInt(nonce),
        deadline: BigInt(deadline),
      },
    });

    console.log("✅ Signed EIP-712 message for", player);

    return NextResponse.json({ signature });

  } catch (error: any) {
    console.error("Error signing:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
