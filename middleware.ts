import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SupabaseAuthService } from './lib/supabase-auth'
import { logger } from './lib/logger'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public paths that don't require authentication
  const publicPaths = [
    '/',
    '/auth/sign-up',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/forgot-password',
    '/privacy',
  ]

  // Allow public paths and static assets
  if (
    publicPaths.some(path => pathname === path || pathname.startsWith(path)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Check authentication for protected routes
  const token = request.cookies.get('auth-token')?.value

  if (!token) {
    logger.debug('Middleware: No auth token, redirecting to login', { pathname })
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Verify token
  const { user, profile } = await SupabaseAuthService.verifySession(token)

  if (!user || !profile) {
    logger.debug('Middleware: Invalid token, redirecting to login', { pathname })
    const response = NextResponse.redirect(new URL('/', request.url))
    // Clear invalid token
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    })
    return response
  }

  // Check admin routes
  if (pathname.startsWith('/admin') && profile.role !== 'admin') {
    logger.warn('Middleware: Unauthorized admin access attempt', { 
      userId: user.id, 
      role: profile.role,
      pathname 
    })
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  logger.debug('Middleware: Authentication successful', { 
    userId: user.id, 
    pathname 
  })

  return NextResponse.next()
}

// Configure which paths the middleware should run on
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
