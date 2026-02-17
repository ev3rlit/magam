import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function chatBaseUrl() {
  const httpPort = process.env.MAGAM_HTTP_PORT || '3002';
  return `http://localhost:${httpPort}`;
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    const res = await fetch(`${chatBaseUrl()}/chat/sessions/${encodeURIComponent(id)}`, {
      cache: 'no-store',
    });

    const text = await res.text();
    const payload = text ? JSON.parse(text) : {};
    return NextResponse.json(payload, { status: res.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to fetch session: ${message}` }, { status: 502 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    const body = await request.text();
    const res = await fetch(`${chatBaseUrl()}/chat/sessions/${encodeURIComponent(id)}`, {
      method: 'PATCH',
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
    return NextResponse.json({ error: `Failed to update session: ${message}` }, { status: 502 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    const res = await fetch(`${chatBaseUrl()}/chat/sessions/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      cache: 'no-store',
    });

    const text = await res.text();
    const payload = text ? JSON.parse(text) : {};
    return NextResponse.json(payload, { status: res.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to delete session: ${message}` }, { status: 502 });
  }
}
