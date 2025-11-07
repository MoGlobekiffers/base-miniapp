"use client";

import { ReactNode } from "react";
import { OnchainKitProvider } from "@coinbase/onchainkit";

export function OnchainKitProviderClient({ children }: { children: ReactNode }) {
  // On force la chain Base mainnet, mais tu peux ajuster plus tard
  return (
    <OnchainKitProvider
      apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
      chain={{ id: 8453, name: "Base", rpcUrl: "https://mainnet.base.org" }}
      config={{
        appearance: { theme: "dark" },
      }}
    >
      {children}
    </OnchainKitProvider>
  );
}
