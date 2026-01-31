import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const headers = new Headers(request.headers);
    const requestId = crypto.randomUUID();
    headers.set('X-Request-ID', requestId);

    console.log(JSON.stringify({
        level: 'info',
        msg: 'Request Started',
        requestId,
        method: request.method,
        url: request.nextUrl.pathname,
        time: Date.now()
    }));

    return NextResponse.next({
        request: {
            headers,
        },
    });
}

export const config = {
    matcher: '/api/:path*',
};
