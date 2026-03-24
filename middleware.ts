import { NextRequest, NextResponse } from 'next/server';
import { getOsSessionCookieName, verifyOsSessionToken } from '@/lib/os/server/session-token';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const isOsPage = pathname.startsWith('/os');
    const isOsApi = pathname.startsWith('/api/os');

    // Protect OS pages and OS API routes.
    if (!isOsPage && !isOsApi) {
        return NextResponse.next();
    }

    // Allow login page and auth API routes through
    if (pathname === '/os/login' || pathname.startsWith('/os/login/')) {
        return NextResponse.next();
    }
    if (pathname.startsWith('/api/os/auth/')) {
        return NextResponse.next();
    }

    const token = request.cookies.get(getOsSessionCookieName())?.value ?? null;
    const secret = process.env.ELIE_OS_SECRET;

    if (!secret) {
        console.error('[Middleware] ELIE_OS_SECRET not configured.');
        if (isOsApi) {
            return NextResponse.json({ error: 'Server auth secret is missing.' }, { status: 500 });
        }
        return NextResponse.redirect(new URL('/os/login', request.url));
    }

    const session = await verifyOsSessionToken({ secret, token });
    if (!session) {
        if (isOsApi) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const loginUrl = new URL('/os/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/os/:path*', '/api/os/:path*'],
};
