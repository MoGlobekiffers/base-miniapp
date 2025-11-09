import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "@coinbase/onchainkit/styles.css";
import OnchainKitProviderClient from "./OnchainKitProviderClient";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DailyWheel",
  description: "Spin a daily quest wheel for Farcaster / Base mini app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <OnchainKitProviderClient>{children}</OnchainKitProviderClient>
      </body>
    </html>
  );
}

