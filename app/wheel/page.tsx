

import WheelClientPage from './wheel'; // Importe le composant client renommé

// 🛑 Les METADATA sont exportées ici, côté serveur, pour éviter l'erreur Vercel.
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
  'fc:frame:button:1:action': 'post', // AJOUTÉ : Action standard lors du clic
};

// Ceci est le composant par défaut qui rend le composant client
export default function WheelPage() {
  return <WheelClientPage />;
}
