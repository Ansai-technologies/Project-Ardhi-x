import { NextRequest, NextResponse } from 'next/server'
import { SupabaseAuthService } from '@/lib/supabase-auth'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Password is required' },
        { status: 400 }
      )
    }

    // Validate password strength (same as registration)
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

    // Update password via Supabase (user must be authenticated)
    await SupabaseAuthService.updatePassword(password)

    logger.info('Password reset successful')

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully',
    })
  } catch (error) {
    logger.error('Reset password error', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update password' },
      { status: 500 }
    )
  }
}
