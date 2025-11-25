// File: app/wheel/page.tsx (Server Side)

import WheelClientComponent from './WheelClientComponent'; 

export const metadata = {
  // Base Metadata
  title: 'DailyWheel - Earn Points on Base',
  description: 'Spin the wheel for daily quests and earn Brain Points!',
  
  // 👇 This is where the validator looks for "ogTitle", "ogDescription", "ogImageUrl"
  openGraph: {
    title: 'DailyWheel - Spin and Earn Brain Points', // ogTitle
    description: 'Join the daily quest, spin the wheel, and collect on-chain badges.', // ogDescription
    url: 'https://base-miniapp-gamma.vercel.app/wheel',
    siteName: 'DailyWheel',
    images: [
      {
        url: 'https://base-miniapp-gamma.vercel.app/images/wheel-preview.png', // ogImageUrl
        width: 1200,
        height: 630,
        alt: 'DailyWheel Preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },

  // Farcaster Configuration (Frame)
  other: {
    'fc:frame': 'vNext',
    'fc:frame:image': 'https://base-miniapp-gamma.vercel.app/images/wheel-preview.png',
    'fc:frame:post_url': 'https://base-miniapp-gamma.vercel.app/api/frame-handler',
    'fc:frame:button:1': 'Spin the Wheel ⚡',
    'fc:frame:button:1:action': 'post',
  },
};

export default function WheelPage() {
  return <WheelClientComponent />;
}
