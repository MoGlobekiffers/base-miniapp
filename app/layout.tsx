import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import { OnchainKitProviderClient } from "./OnchainKitProviderClient";

export const metadata: Metadata = {
  title: "DailyWheel",
  description: "DailyWheel miniapp on Base / Farcaster",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <OnchainKitProviderClient>
          {children}
        </OnchainKitProviderClient>
      </body>
    </html>
  );
}
