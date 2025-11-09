"use client";

import type { ReactNode } from "react";
import { OnchainKitProvider } from "@coinbase/onchainkit";
import { base } from "wagmi/chains";

type Props = {
  children: ReactNode;
};

export default function OnchainKitProviderClient({ children }: Props) {
  return (
    <OnchainKitProvider
      apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
      chain={base}
      config={{
        appearance: { theme: "dark" },
      }}
    >
      {children}
    </OnchainKitProvider>
  );
}

