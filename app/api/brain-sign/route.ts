import { NextResponse } from "next/server";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";

export const runtime = "nodejs";

const SIGNER_PRIVATE_KEY = process.env.BRAIN_SIGNER_KEY as `0x${string}`;

export async function POST(request: Request) {
  try {
    if (!SIGNER_PRIVATE_KEY) {
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
    }

    const body = await request.json();
    const { delta, nonce, deadline } = body;

    // LOGIQUE IMPORTANTE :
    // Si delta est négatif (ex: -20), on envoie "20" au contrat mais avec isNegative = true
    const isNegative = delta < 0;
    const absAmount = BigInt(Math.abs(delta));

    const account = privateKeyToAccount(SIGNER_PRIVATE_KEY);
    const client = createWalletClient({
      account,
      chain: base,
      transport: http(),
    });

    const domain = {
      name: "BrainScore",
      version: "1",
      chainId: base.id,
      verifyingContract: process.env.NEXT_PUBLIC_BRAIN_CONTRACT as `0x${string}`,
    } as const;

    const types = {
      Reward: [
        { name: "amount", type: "uint256" },
        { name: "isNegative", type: "bool" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    } as const;

    const signature = await client.signTypedData({
      domain,
      types,
      primaryType: "Reward",
      message: {
        amount: absAmount,
        isNegative: isNegative,
        nonce: BigInt(nonce),
        deadline: BigInt(deadline),
      },
    });

    return NextResponse.json({ signature, nonce, deadline });

  } catch (error: any) {
    console.error("Sign error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
