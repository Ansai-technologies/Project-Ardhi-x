import { NextRequest, NextResponse } from 'next/server'
import { SupabaseAuthService } from '@/lib/supabase-auth'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    // Sign out from Supabase
    await SupabaseAuthService.signOut()

    logger.info('User logged out successfully')

    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    })

    // Clear the auth token cookie
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    })

    return response
  } catch (error) {
    logger.error('Logout error', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
