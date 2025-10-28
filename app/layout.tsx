import type { Metadata } from 'next';
import './globals.css';
import { miniapp } from './lib/miniapp';

export const metadata: Metadata = {
  // metadataBase pour générer des URL absolues si besoin
  metadataBase: new URL(miniapp.homeUrl),
  title: miniapp.name,
  description: miniapp.description,
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: miniapp.name,
    description: miniapp.description,
    other: {
      'fc:miniapp': JSON.stringify({
        version: miniapp.version,
        imageUrl: miniapp.heroImageUrl, // 3:2 recommandé (ex: 1200x800)
        button: {
          title: `Open ${miniapp.name}`,
          action: {
            type: 'launch_frame',
            url: miniapp.homeUrl,
            name: miniapp.name,
          },
        },
      }),
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
