import { NextRequest, NextResponse } from 'next/server'
import { SupabaseAuthService } from '@/lib/supabase-auth'
import { rateLimiter } from '@/lib/rate-limiter'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Check rate limit
    const rateLimit = rateLimiter.checkLimit(email.toLowerCase())
    if (!rateLimit.allowed) {
      const lockMinutes = rateLimit.lockUntil 
        ? Math.ceil((rateLimit.lockUntil - Date.now()) / 60000)
        : 15
      
      logger.warn('Login attempt blocked by rate limiter', { email })
      
      return NextResponse.json(
        { 
          success: false, 
          error: `Too many failed login attempts. Account locked for ${lockMinutes} minutes.` 
        },
        { status: 429 }
      )
    }

    // Sign in with Supabase
    const { user, session, profile } = await SupabaseAuthService.signIn(email, password)

    if (!user || !session || !profile) {
      logger.warn('Failed login attempt', { email })
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid email or password',
          remainingAttempts: rateLimit.remaining - 1
        },
        { status: 401 }
      )
    }

    // Reset rate limit on successful login
    rateLimiter.reset(email.toLowerCase())
    
    logger.info('Successful login', { userId: user.id, email })

    // Convert profile to user format for compatibility
    const userData = SupabaseAuthService.profileToUser(profile)

    const response = NextResponse.json({
      success: true,
      user: userData,
      token: session.access_token,
    })

    // Set HTTP-only cookie for token
    response.cookies.set('auth-token', session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: session.expires_in || 7 * 24 * 60 * 60, // Use session expiry or 7 days
      path: '/',
    })

    return response
  } catch (error) {
    logger.error('Login error', error)
    return NextResponse.json(
      { success: false, error: 'Invalid email or password' },
      { status: 401 }
    )
  }
}
