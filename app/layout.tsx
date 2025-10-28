import type { Metadata } from 'next';
import './globals.css';
import { miniapp } from './lib/miniapp';

export async function generateMetadata(): Promise<Metadata> {
  return {
    metadataBase: new URL(miniapp.homeUrl),
    title: miniapp.name,
    description: miniapp.description,
    other: {
      'fc:miniapp': JSON.stringify({
        version: miniapp.version,                 // <-- "1"
        imageUrl: miniapp.heroImageUrl,
        button: {
          title: `Open ${miniapp.name}`,
          action: { type: 'launch_frame', url: miniapp.homeUrl, name: miniapp.name },
        },
      }),
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body>{children}</body></html>);
}
