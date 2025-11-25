import { NextRequest, NextResponse } from 'next/server';

// L'URL de base est nécessaire pour construire les chemins d'images absolus
const APP_BASE_URL = 'https://base-miniapp-gamma.vercel.app'; 
// 🚨 Assurez-vous que cette URL correspond à votre URL Vercel !

// Cette fonction gère toutes les requêtes POST (clics de bouton)
export async function POST(req: NextRequest): Promise<Response> {
  
  // 1. Lire les données de la requête Farcaster
  const body = await req.json();
  const { untrustedData } = body;
  
  const buttonIndex = untrustedData?.buttonIndex;

  // 2. Définir le résultat basé sur le clic
  let resultText = "Merci d'avoir tourné !";
  let buttonText = "Voir les stats (Pas encore implémenté)";

  if (buttonIndex === 1) {
    resultText = "Résultat : BRAIN GAINED ! (Quête non simulée)";
    buttonText = "Recommencer";
  }

  // 3. Construire les métadonnées de réponse (le nouveau Frame)
  const frameResponse = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>DailyWheel Result</title>
        <meta property="fc:frame" content="vNext" />
        
        <meta property="fc:frame:image" content="${APP_BASE_URL}/images/result-frame.png" />
        
        <meta property="og:title" content="${resultText}" />

        <meta property="fc:frame:post_url" content="${APP_BASE_URL}/api/frame-handler" />
        
        <meta property="fc:frame:button:1" content="${buttonText}" />
        <meta property="fc:frame:button:1:action" content="post" />

      </head>
      <body>
        <p>Frame Handler Executed. Result: ${resultText}</p>
      </body>
    </html>
  `;

  // Renvoyer la réponse HTML
  return new Response(frameResponse, {
    status: 200,
    headers: {
      'Content-Type': 'text/html',
    },
  });
}

