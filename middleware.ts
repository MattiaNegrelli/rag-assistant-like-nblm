import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const adminKey = process.env.ADMIN_KEY;

    // Skip logic if no admin key is set (development convenience, though risky)
    if (!adminKey) return NextResponse.next();

    // Allow login page
    if (request.nextUrl.pathname === '/login') {
        return NextResponse.next();
    }

    // Check Cookie
    const cookieKey = request.cookies.get('admin-key')?.value;

    if (cookieKey === adminKey) {
        return NextResponse.next();
    }

    // Redirect to login if unauthorized for protected routes
    return NextResponse.redirect(new URL('/login', request.url));
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
