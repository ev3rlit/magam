import { NextResponse } from 'next/server';

export async function GET() {
  const httpPort = process.env.MAGAM_HTTP_PORT || '3002';

  try {
    const res = await fetch(`http://localhost:${httpPort}/files`);
    const data = await res.json();

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API Proxy] Error:', message);

    return NextResponse.json(
      { error: `Failed to connect to render server: ${message}` },
      { status: 502 }
    );
  }
}
