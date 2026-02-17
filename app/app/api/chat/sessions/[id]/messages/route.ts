import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function chatBaseUrl() {
  const httpPort = process.env.MAGAM_HTTP_PORT || '3002';
  return `http://localhost:${httpPort}`;
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    const url = new URL(request.url);
    const upstream = new URL(`/chat/sessions/${encodeURIComponent(id)}/messages`, chatBaseUrl());
    for (const [key, value] of url.searchParams.entries()) {
      upstream.searchParams.set(key, value);
    }

    const res = await fetch(upstream, { cache: 'no-store' });
    const text = await res.text();
    const payload = text ? JSON.parse(text) : {};
    return NextResponse.json(payload, { status: res.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to fetch messages: ${message}` }, { status: 502 });
  }
}
