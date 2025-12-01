import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "@coinbase/onchainkit/styles.css";
import OnchainKitProviderClient from "./OnchainKitProviderClient";

const inter = Inter({ subsets: ["latin"] });

// 👇 VOTRE URL DE BASE
const APP_URL = "https://base-miniapp-gamma.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: "DailyWheel",
  description: "Spin daily to earn Brain Points on Base.",
  
  openGraph: {
    title: "DailyWheel",
    description: "Spin daily to earn Brain Points on Base.",
    url: APP_URL,
    siteName: "DailyWheel",
    images: [
      {
        url: "/base-logo-in-blue.png", // On teste avec le LOGO pour être sûr (plus léger)
        width: 400,
        height: 400,
        alt: "DailyWheel Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  
  other: {
    "fc:frame": JSON.stringify({
      version: "next",
      imageUrl: `${APP_URL}/base-logo-in-blue.png`, // Idem ici
      button: {
        title: "Launch App 🚀",
        action: {
          type: "launch_frame",
          name: "DailyWheel",
          url: APP_URL,
          splashImageUrl: `${APP_URL}/base-logo-in-blue.png`,
          splashBackgroundColor: "#0f172a",
        },
      },
    }),
  },
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
