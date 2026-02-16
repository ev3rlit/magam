import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const httpPort = process.env.MAGAM_HTTP_PORT || '3002';

  try {
    // TODO: confirm backend path when Local AI Chat API contract is finalized.
    const res = await fetch(`http://localhost:${httpPort}/chat/providers`, {
      cache: 'no-store',
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to fetch chat providers: ${message}` },
      { status: 502 },
    );
  }
}
