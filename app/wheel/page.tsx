// Fichier : app/wheel/page.tsx (Côté Serveur - FINAL)

import WheelClientPage from './wheel'; // Importe le composant client renommé

// 🛑 EXPORT METADATA : C'est ici qu'il doit être, côté serveur.
export const metadata = {
  title: 'DailyWheel - Gagnez des points sur Base',
  description: 'Faites tourner la roue pour des quêtes quotidiennes et gagnez des Brain Points!',
  
  // Tags Open Graph standard
  openGraph: {
    title: 'DailyWheel - Spin and Earn Brain Points',
    images: ['https://base-miniapp-gamma.vercel.app/images/wheel-preview.png'],
  },
  
  // Tags Farcaster Frame CRITIQUES
  'fc:frame': 'vNext',
  'fc:frame:image': 'https://base-miniapp-gamma.vercel.app/images/wheel-preview.png', 
  'fc:frame:post_url': 'https://base-miniapp-gamma.vercel.app/api/frame-handler', 
  'fc:frame:button:1': 'Faire Tourner la Roue ⚡',
};

// Le composant par défaut qui est côté serveur (et qui appelle le client)
export default function WheelPage() {
  return <WheelClientPage />;
}