import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  const httpPort = process.env.MAGAM_HTTP_PORT || '3002';

  try {
    const body = await request.text();

    const res = await fetch(`http://localhost:${httpPort}/chat/stop`, {
      method: 'POST',
      headers: {
        'Content-Type': request.headers.get('content-type') || 'application/json',
      },
      body,
      cache: 'no-store',
    });

    const text = await res.text();
    let payload: unknown = {};

    try {
      payload = text ? JSON.parse(text) : {};
    } catch {
      payload = { ok: res.ok, raw: text };
    }

    return NextResponse.json(payload, { status: res.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to stop chat stream: ${message}` },
      { status: 502 },
    );
  }
}
