import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function chatBaseUrl() {
  const httpPort = process.env.MAGAM_HTTP_PORT || '3002';
  return `http://localhost:${httpPort}`;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const upstreamUrl = new URL('/chat/sessions', chatBaseUrl());
    for (const [key, value] of url.searchParams.entries()) {
      upstreamUrl.searchParams.set(key, value);
    }

    const res = await fetch(upstreamUrl, { cache: 'no-store' });
    const text = await res.text();
    const payload = text ? JSON.parse(text) : {};
    return NextResponse.json(payload, { status: res.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to fetch sessions: ${message}` }, { status: 502 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const res = await fetch(`${chatBaseUrl()}/chat/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': request.headers.get('content-type') || 'application/json',
      },
      body,
      cache: 'no-store',
    });

    const text = await res.text();
    const payload = text ? JSON.parse(text) : {};
    return NextResponse.json(payload, { status: res.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to create session: ${message}` }, { status: 502 });
  }
}
