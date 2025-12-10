import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "@coinbase/onchainkit/styles.css";
// Vérifiez que ce fichier existe bien à cet endroit, sinon ajustez le chemin (ex: ./components/...)
import OnchainKitProviderClient from "./OnchainKitProviderClient";
import AppKitProvider from "@/app/context/AppKitProvider";
import { headers } from "next/headers";

const inter = Inter({ subsets: ["latin"] });

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
        url: "/preview-wheel.png",
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
      imageUrl: `${APP_URL}/preview-wheel.png`,
      button: {
        title: "Launch App 🚀",
        action: {
          type: "launch_frame",
          name: "DailyWheel",
          url: APP_URL,
          splashImageUrl: `${APP_URL}/preview-wheel.png`,
          splashBackgroundColor: "#0f172a",
        },
      },
    }),
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersObj = await headers();
  const cookies = headersObj.get('cookie');

  return (
    <html lang="en">
      <body className={inter.className}>
        <AppKitProvider cookies={cookies}>
          <OnchainKitProviderClient>{children}</OnchainKitProviderClient>
        </AppKitProvider>
      </body>
    </html>
  );
}
