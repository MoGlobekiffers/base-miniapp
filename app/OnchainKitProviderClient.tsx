"use client";

import { ReactNode } from "react";
import { OnchainKitProvider } from "@coinbase/onchainkit";

export function OnchainKitProviderClient({ children }: { children: ReactNode }) {
  return (
    <OnchainKitProvider
      apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
      chain={{
        id: 8453,
        name: "Base",
        // structure compatible avec le type Chain (rpcUrls au lieu de rpcUrl)
        rpcUrls: {
          default: {
            http: ["https://mainnet.base.org"],
          },
        },
      } as any}
      config={{
        appearance: { theme: "dark" },
      }}
    >
      {children}
    </OnchainKitProvider>
  );
}
