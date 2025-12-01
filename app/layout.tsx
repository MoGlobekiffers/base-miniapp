import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "@coinbase/onchainkit/styles.css";
import OnchainKitProviderClient from "./OnchainKitProviderClient";

const inter = Inter({ subsets: ["latin"] });

// 👇 C'EST BIEN VOTRE URL
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
        url: "/preview-wheel.png", // ✅ La roue pour l'aperçu
        width: 1200,
        height: 630,
        alt: "DailyWheel Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  
  other: {
    "fc:frame": JSON.stringify({
      version: "next",
      imageUrl: `${APP_URL}/preview-wheel.png`, // ✅ La roue pour l'aperçu Farcaster
      button: {
        title: "Launch App 🚀",
        action: {
          type: "launch_frame",
          name: "DailyWheel",
          url: APP_URL,
          // 👇 La roue aussi pour le chargement
          splashImageUrl: `${APP_URL}/preview-wheel.png`, 
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
