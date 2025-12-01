
import { NextRequest, NextResponse } from "next/server";
import { privateKeyToAccount } from "viem/accounts";

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
    const { player, questId, delta, nonce } = body;

    let rawKey = process.env.BRAIN_SIGNER_PRIVATE_KEY || process.env.SIGNER_PRIVATE_KEY;
    if (!rawKey) return NextResponse.json({ error: "Server Key Missing" }, { status: 500 });

    let cleanKey = rawKey.trim().replace(/"/g, '');
    if (!cleanKey.startsWith("0x")) cleanKey = `0x${cleanKey}`;
    const account = privateKeyToAccount(cleanKey as `0x${string}`);

    const officialPoints = QUEST_POINTS[questId];
    if (delta !== officialPoints) return NextResponse.json({ error: "Points mismatch" }, { status: 403 });

    // Le nom exact trouvé dans votre contrat
    const domain = {
      name: "DailyWheelBrain", 
      version: "1",
      chainId: 8453, 
      verifyingContract: process.env.NEXT_PUBLIC_BRAIN_CONTRACT as `0x${string}`,
    } as const;

    const types = {
      Reward: [
        { name: "player", type: "address" },
        { name: "questId", type: "string" },
        { name: "delta", type: "int256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    } as const;

    // Calcul de la deadline (1h)
    const validDeadline = BigInt(Math.floor(Date.now() / 1000) + 3600); 

    const signature = await account.signTypedData({
      domain,
      types,
      primaryType: "Reward",
      message: {
        player: player as `0x${string}`,
        questId: questId,
        delta: BigInt(delta),
        nonce: BigInt(nonce),
        deadline: validDeadline,
      },
    });

    // 👇 LA CORRECTION EST ICI : On renvoie la deadline au frontend !
    return NextResponse.json({ signature, deadline: validDeadline.toString() });

  } catch (error: any) {
    console.error("Error signing:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
