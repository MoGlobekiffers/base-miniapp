import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, http, toHex, keccak256, encodePacked } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";

// ⚠️ C'est ici que la synchronisation est importante
// Cette liste doit être EXACTEMENT la même que dans WheelClientComponent.tsx
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
  "Mint My Nft": 3,       // <--- Mis à jour ici
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

    // 2. Vérification de sécurité : Est-ce que les points demandés sont corrects ?
    // On vérifie si la quête existe et si les points correspondent à notre tableau officiel
    const officialPoints = QUEST_POINTS[questId];
    
    if (officialPoints === undefined) {
      return NextResponse.json({ error: "Invalid Quest ID" }, { status: 400 });
    }

    // On accepte si le delta envoyé correspond aux points officiels
    // (Note: pour "Bankruptcy" c'est -10, donc on vérifie l'égalité stricte)
    if (delta !== officialPoints) {
       return NextResponse.json({ error: "Cheating attempt: Points mismatch" }, { status: 403 });
    }

    // 3. Préparation de la signature avec la clé privée du serveur
    // La clé doit être dans le fichier .env (BRAIN_SIGNER_PRIVATE_KEY)
    const privateKey = process.env.BRAIN_SIGNER_PRIVATE_KEY as `0x${string}`;
    if (!privateKey) {
      console.error("Missing BRAIN_SIGNER_PRIVATE_KEY");
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
    }

    const account = privateKeyToAccount(privateKey);
    
    // Pour la signature, on traite les valeurs négatives (ex: Bankruptcy)
    // Le contrat s'attend à recevoir un uint256 pour le montant (valeur absolue)
    // et un booléen pour le signe.
    const absAmount = BigInt(Math.abs(delta));
    const isNegative = delta < 0;

    // Hachage des données (doit correspondre exactement au Smart Contract)
    // keccak256(abi.encodePacked(player, amount, isNegative, nonce, deadline))
    const messageHash = keccak256(
      encodePacked(
        ["address", "uint256", "bool", "uint256", "uint256"],
        [player as `0x${string}`, absAmount, isNegative, BigInt(nonce), BigInt(deadline)]
      )
    );

    // Signature du hash
    const signature = await account.signMessage({
        message: { raw: messageHash }
    });

    return NextResponse.json({ signature });

  } catch (error: any) {
    console.error("Error signing reward:", error);
    return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 });
  }
}
