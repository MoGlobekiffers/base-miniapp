"use client";

import { ReactNode } from "react";
import { OnchainKitProvider } from "@coinbase/onchainkit";
import { base } from "viem/chains";

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <OnchainKitProvider chain={base}>
      {children}
    </OnchainKitProvider>
  );
}
