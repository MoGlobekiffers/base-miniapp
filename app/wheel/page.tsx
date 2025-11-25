// Fichier : app/wheel/page.tsx (Côté Serveur)

import WheelClientComponent from './WheelClientComponent'; 

export const metadata = {
  title: 'DailyWheel - Gagnez des points sur Base',
  description: 'Faites tourner la roue pour des quêtes quotidiennes et gagnez des Brain Points!',
  
  openGraph: {
    title: 'DailyWheel - Spin and Earn Brain Points',
    images: ['https://base-miniapp-gamma.vercel.app/images/wheel-preview.png'],
  },
  
  // Dans Next.js App Router, les tags spécifiques comme fc:frame doivent être dans 'other'
  other: {
    'fc:frame': 'vNext',
    'fc:frame:image': 'https://base-miniapp-gamma.vercel.app/images/wheel-preview.png',
    'fc:frame:post_url': 'https://base-miniapp-gamma.vercel.app/api/frame-handler',
    'fc:frame:button:1': 'Spin the Wheel ⚡',
    'fc:frame:button:1:action': 'post',
  }, // ⬅️ Attention à bien fermer 'other' avec une accolade et une virgule
}; // ⬅️ Et bien fermer l'objet metadata ici

export default function WheelPage() {
  return <WheelClientComponent />;
}
