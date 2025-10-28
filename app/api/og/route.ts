import { ImageResponse } from '@vercel/og';
export const runtime = 'edge';
export async function GET() {
  const size = { width: 1200, height: 630 };
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: 'linear-gradient(135deg,#0b1220 0%,#111827 100%)',
          color: '#fff',
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <div style={{ position: 'absolute', top: 48, left: 60, fontSize: 42, opacity: 0.9, letterSpacing: 1 }}>
          DailyWheel
        </div>
        <div style={{ display: 'flex', gap: 48, alignItems: 'center' }}>
          <div
            style={{
              width: 360,
              height: 360,
              borderRadius: '50%',
              background:
                'conic-gradient(#d1fae5 0 60deg,#fde68a 0 120deg,#bbf7d0 0 180deg,#bfdbfe 0 240deg,#fecaca 0 300deg,#ddd6fe 0 360deg)',
              boxShadow: '0 25px 80px rgba(0,0,0,.35), inset 0 0 12px rgba(0,0,0,.35)',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: -22,
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '18px solid transparent',
                borderRight: '18px solid transparent',
                borderBottom: '26px solid #60a5fa',
                filter: 'drop-shadow(0 4px 6px rgba(0,0,0,.4))',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%,-50%)',
                width: 54,
                height: 54,
                borderRadius: '50%',
                background: '#111827',
                border: '6px solid #fff',
              }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.05 }}>Spin the wheel once a day</div>
            <div style={{ fontSize: 28, color: '#9ca3af' }}>Tasks on Base • No rewards (for now)</div>
            <div
              style={{
                marginTop: 10,
                display: 'inline-flex',
                padding: '16px 26px',
                borderRadius: 14,
                background: '#2563eb',
                color: '#fff',
                fontSize: 28,
                fontWeight: 700,
              }}
            >
              Open DailyWheel
            </div>
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: 36, right: 48, fontSize: 22, color: '#9ca3af' }}>
          base-miniapp-gamma.vercel.app
        </div>
      </div>
    ),
    { width: size.width, height: size.height }
  );
}
