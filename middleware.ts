import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    // Paths to protect
    const protectedPaths = ['/documents', '/chat', '/api/documents', '/api/chat']

    const path = request.nextUrl.pathname
    const isProtected = protectedPaths.some(p => path.startsWith(p))

    if (isProtected) {
        // Check for ADMIN_KEY in Header or Cookie
        const adminKey = process.env.ADMIN_KEY
        if (!adminKey) {
            // If not configured, allow (or block safe? MVP says allow or warn)
            // Let's block to force configuration
            return new NextResponse(
                JSON.stringify({ success: false, message: 'Server ADMIN_KEY not configured' }),
                { status: 500, headers: { 'content-type': 'application/json' } }
            )
        }

        // Check Headers (API usage)
        const headerKey = request.headers.get('x-admin-key')

        // Check Cookies (Browser usage)
        const cookieKey = request.cookies.get('admin-key')?.value

        if (headerKey === adminKey || cookieKey === adminKey) {
            return NextResponse.next()
        }

        // If browser request to page, redirect to login (or basic auth prompt for MVP)
        // As we don't have a login page yet, we can't easily redirect. 
        // For MVP, user asked for "Login semplice (anche admin password)".
        // So we need a way to set the cookie.

        // If it's an API call, return 401
        if (path.startsWith('/api/')) {
            return new NextResponse(
                JSON.stringify({ success: false, message: 'Unauthorized' }),
                { status: 401, headers: { 'content-type': 'application/json' } }
            )
        }

        // If it's a page, we should redirect to a login page, but we don't have one.
        // Let's create a simple login page logic or just rewrite to a login component.
        // Ideally I should create /app/login/page.tsx provided in the plan or just here.
        // The plan said "Login semplice".

        // Let's redirect to /login
        return NextResponse.redirect(new URL('/login', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}
