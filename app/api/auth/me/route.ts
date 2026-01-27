import { NextRequest, NextResponse } from 'next/server'
import { SupabaseAuthService } from '@/lib/supabase-auth'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No authentication token' },
        { status: 401 }
      )
    }

    // Verify token with Supabase
    const { user, profile } = await SupabaseAuthService.verifySession(token)
    if (!user || !profile) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Convert profile to user format for compatibility
    const userData = SupabaseAuthService.profileToUser(profile)

    return NextResponse.json({
      success: true,
      user: userData,
    })
  } catch (error) {
    logger.error('Me endpoint error', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
