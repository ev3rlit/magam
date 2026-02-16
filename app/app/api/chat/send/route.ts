export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  const httpPort = process.env.MAGAM_HTTP_PORT || '3002';

  try {
    const body = await request.text();

    const upstream = await fetch(`http://localhost:${httpPort}/chat/send`, {
      method: 'POST',
      headers: {
        'Content-Type': request.headers.get('content-type') || 'application/json',
        Accept: 'text/event-stream',
      },
      body,
      cache: 'no-store',
    });

    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        'Content-Type':
          upstream.headers.get('content-type') ||
          'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    return new Response(
      JSON.stringify({ error: `Failed to stream chat response: ${message}` }),
      {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
