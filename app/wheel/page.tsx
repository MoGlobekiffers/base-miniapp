import WheelClientComponent from './WheelClientComponent'; 

export const metadata = {
  // Titre court pour passer la validation (< 30 chars)
  title: 'DailyWheel', 
  description: 'Spin daily to earn Brain Points and badges.',
  
  openGraph: {
    // Titre court pour OG (< 30 chars)
    title: 'DailyWheel', 
    // Description courte (< 100 chars)
    description: 'Spin daily to earn Brain Points and badges.', 
    url: 'https://base-miniapp-gamma.vercel.app/wheel',
    siteName: 'DailyWheel',
    images: [
      {
        url: 'https://base-miniapp-gamma.vercel.app/images/wheel-preview.png',
        width: 1200,
        height: 630,
        alt: 'DailyWheel Preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },

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
