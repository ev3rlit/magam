import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function GET() {
    const httpPort = process.env.MAGAM_HTTP_PORT || '3002';

    try {
        const res = await fetch(`http://localhost:${httpPort}/file-tree`, {
            cache: 'no-store',
            next: { revalidate: 0 },
            headers: {
                'x-magam-proxy': 'file-tree',
            },
        });
        const data = await res.json();

        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[API Proxy] FileTree Error:', message);

        return NextResponse.json(
            { error: `Failed to connect to render server: ${message}` },
            { status: 502 }
        );
    }
}
