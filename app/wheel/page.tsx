import { Metadata } from 'next'; // On importe le type pour être sûr
import WheelClientComponent from './WheelClientComponent'; 

// On type explicitement l'objet metadata
export const metadata: Metadata = {
  title: 'DailyWheel',
  description: 'Spin daily to earn Brain Points and badges.',
  
  openGraph: {
    title: 'DailyWheel', 
    description: 'Spin daily to earn Brain Points and badges.', 
    url: 'https://base-miniapp-gamma.vercel.app/wheel',
    siteName: 'DailyWheel',
    images: [
      {
        url: 'https://base-miniapp-gamma.vercel.app/images/wheel-preview.png',
        width: 1200,
        height: 630,
      },
    ],
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
