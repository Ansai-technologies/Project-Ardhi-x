import { NextRequest, NextResponse } from 'next/server'
import { SupabaseAuthService } from '@/lib/supabase-auth'
import { rateLimiter } from '@/lib/rate-limiter'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, phone, nationalId } = await request.json()

    if (!validateInput(name, email, password)) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and password are required' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }
    
    if (!/[a-z]/.test(password)) {
      return NextResponse.json(
        { success: false, error: 'Password must contain at least one lowercase letter' },
        { status: 400 }
      )
    }
    
    if (!/[A-Z]/.test(password)) {
      return NextResponse.json(
        { success: false, error: 'Password must contain at least one uppercase letter' },
        { status: 400 }
      )
    }
    
    if (!/[0-9]/.test(password)) {
      return NextResponse.json(
        { success: false, error: 'Password must contain at least one number' },
        { status: 400 }
      )
    }
    
    if (!/[^a-zA-Z0-9]/.test(password)) {
      return NextResponse.json(
        { success: false, error: 'Password must contain at least one special character' },
        { status: 400 }
      )
    }

    // Check rate limit for registration (prevent spam)
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimit = rateLimiter.checkLimit(`register:${clientIp}`, 3) // Max 3 registrations per IP per time window
    
    if (!rateLimit.allowed) {
      logger.warn('Registration attempt blocked by rate limiter', { ip: clientIp })
      
      return NextResponse.json(
        { success: false, error: 'Too many registration attempts. Please try again later.' },
        { status: 429 }
      )
    }

    // Sign up with Supabase
    const { user, session } = await SupabaseAuthService.signUp({
      name,
      email: email.toLowerCase(),
      password,
      phone,
      nationalId,
    })

    if (!user || !session) {
      return NextResponse.json(
        { success: false, error: 'Failed to create user account' },
        { status: 500 }
      )
    }

    // Get the created profile
    const profile = await SupabaseAuthService.getUserProfile(user.id)
    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Failed to create user profile' },
        { status: 500 }
      )
    }

    logger.info('New user registered', { userId: user.id, email })

    // Convert profile to user format for compatibility
    const userData = SupabaseAuthService.profileToUser(profile)

    const response = NextResponse.json({
      success: true,
      user: userData,
      token: session.access_token,
    })

    response.cookies.set('auth-token', session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: session.expires_in || 7 * 24 * 60 * 60, // Use session expiry or 7 days
      path: '/',
    })

    return response
  } catch (error: any) {
    logger.error('Registration error', error)
    
    // Handle specific Supabase errors
    if (error.message?.includes('already registered')) {
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create account. Please try again.' },
      { status: 500 }
    )
  }
}

function validateInput(name: string, email: string, password: string): boolean {
  return !!name && !!email && !!password;
}
