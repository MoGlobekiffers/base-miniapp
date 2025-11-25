// Fichier : app/wheel/page.tsx (Côté Serveur - NETTOYÉ)

// Importe le nouveau nom du fichier client (Étape 1)
import WheelClientComponent from './WheelClientComponent'; 

// 🛑 Les METADATA doivent être exportées ici (côté serveur).
export const metadata = {
  title: 'DailyWheel - Gagnez des points sur Base',
  description: 'Faites tourner la roue pour des quêtes quotidiennes et gagnez des Brain Points!',
  
  // Tags Open Graph standard
  openGraph: {
    title: 'DailyWheel - Spin and Earn Brain Points',
    images: ['https://base-miniapp-gamma.vercel.app/images/wheel-preview.png'],
  },
  
  // Tags Farcaster Frame CRITIQUES
 other: {
  'fc:frame': 'vNext',
  'fc:frame:image': 'https://base-miniapp-gamma.vercel.app/images/wheel-preview.png', 
  'fc:frame:post_url': 'https://base-miniapp-gamma.vercel.app/api/frame-handler', 
  'fc:frame:button:1': 'Spin the Wheel ⚡',
  'fc:frame:button:1:action': 'post',
};

// Ceci est le composant par défaut qui rend le composant client
export default function WheelPage() {
  // Utilise le nouveau nom du composant client
  return <WheelClientComponent />;
}
