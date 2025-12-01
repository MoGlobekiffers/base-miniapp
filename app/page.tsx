import { Metadata } from "next";
import WheelClientPage from "./wheel/WheelClientComponent"; // Vérifiez que le chemin est bon

// 👇 VOTRE URL
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

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950">
      <WheelClientPage />
    </main>
  );
}
