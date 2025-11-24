import { NextResponse } from 'next/server';

export function middleware(req: Request) {
  const url = new URL(req.url);
  const p = url.pathname;
  const isManifest = p === '/.well-known/farcaster.json' || p === '/farcaster.json';
  if (!isManifest) return NextResponse.next();

  const res = NextResponse.next();
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Content-Type', 'application/json');
  return res;
}

export const config = {
  matcher: ['/.well-known/farcaster.json', '/farcaster.json'],
};
