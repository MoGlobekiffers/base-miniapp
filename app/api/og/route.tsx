import { ImageResponse } from 'next/og';
export const runtime = 'edge';
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0b1220',
          color: '#ffffff',
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif',
          fontSize: 72,
          fontWeight: 800,
          letterSpacing: 1,
        }}
      >
        DailyWheel
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
