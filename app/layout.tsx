import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "@coinbase/onchainkit/styles.css";
import OnchainKitProviderClient from "./OnchainKitProviderClient";

const inter = Inter({ subsets: ["latin"] });

// 👇 VOTRE URL EXACTE
const APP_URL = "https://base-miniapp-gamma.vercel.app";

export const metadata: Metadata = {
  // 👇 CETTE LIGNE EST CRUCIALE POUR CORRIGER L'IMAGE
  metadataBase: new URL(APP_URL),
  
openGraph: {
    title: "DailyWheel",
    description: "Spin daily to earn Brain Points and badges.",
    images: [
      {
        // 👇 ON FORCE LE LIEN COMPLET ICI
        url: "https://base-miniapp-gamma.vercel.app/preview-wheel.png", 
        width: 1200,
        height: 630,
        alt: "DailyWheel Preview",
      },
    ],
  },
  other: {
    "fc:frame": JSON.stringify({
      version: "next",
      imageUrl: `${APP_URL}/preview-wheel.png`,
      button: {
        title: "Spin ⚡",
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
