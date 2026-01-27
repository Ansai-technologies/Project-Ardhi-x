import { supabase, supabaseAdmin } from './supabase'
import { User } from '@/types/auth'
import { logger } from './logger'

export interface UserProfile {
  id: string
  email: string
  name: string
  role: string
  avatar?: string
  phone?: string
  national_id?: string
  bio?: string
  location?: string
  date_joined: string
  is_verified: boolean
  created_at: string
  updated_at: string
}

export class SupabaseAuthService {
  // Sign up a new user
  static async signUp(userData: {
    name: string
    email: string
    password: string
    phone?: string
    nationalId?: string
  }) {
    try {
      // Create user in Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            phone: userData.phone,
            national_id: userData.nationalId,
          }
        }
      })

      if (error) throw error

      if (data.user) {
        // Create profile in profiles table
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: data.user.id,
            email: userData.email,
            name: userData.name,
            role: 'user',
            phone: userData.phone,
            national_id: userData.nationalId,
            avatar: '/placeholder-user.jpg',
            bio: '',
            location: '',
            date_joined: new Date().toISOString().split('T')[0],
            is_verified: false,
          })

        if (profileError) {
          logger.error('Profile creation error', profileError)
          throw profileError
        }
      }

      return { user: data.user, session: data.session }
    } catch (error) {
      logger.error('Sign up error', error)
      throw error
    }
  }

  // Sign in user
  static async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Get user profile
      if (data.user) {
        const profile = await this.getUserProfile(data.user.id)
        return { user: data.user, session: data.session, profile }
      }

      return { user: data.user, session: data.session, profile: null }
    } catch (error) {
      logger.error('Sign in error', error)
      throw error
    }
  }

  // Sign out user
  static async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      logger.error('Sign out error', error)
      throw error
    }
  }

  // Get current user
  static async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error

      if (user) {
        const profile = await this.getUserProfile(user.id)
        return { user, profile }
      }

      return { user: null, profile: null }
    } catch (error) {
      logger.error('Get current user error', error)
      return { user: null, profile: null }
    }
  }

  // Get user profile
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        logger.error('Get user profile error', error)
        return null
      }

      return data
    } catch (error) {
      logger.error('Get user profile error', error)
      return null
    }
  }

  // Update user profile
  static async updateUserProfile(userId: string, updates: Partial<UserProfile>) {
    try {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      logger.error('Update user profile error', error)
      throw error
    }
  }

  // Reset password
  static async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
      })

      if (error) throw error
    } catch (error) {
      logger.error('Reset password error', error)
      throw error
    }
  }

  // Update password
  static async updatePassword(newPassword: string) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error
    } catch (error) {
      logger.error('Update password error', error)
      throw error
    }
  }

  // Verify session token (for middleware)
  static async verifySession(token: string) {
    try {
      const { data, error } = await supabaseAdmin.auth.getUser(token)
      if (error) throw error

      if (data.user) {
        const profile = await this.getUserProfile(data.user.id)
        return { user: data.user, profile }
      }

      return { user: null, profile: null }
    } catch (error) {
      logger.error('Verify session error', error)
      return { user: null, profile: null }
    }
  }

  // Convert to User type for compatibility
  static profileToUser(profile: UserProfile): User {
    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role as 'user' | 'admin',
      avatar: profile.avatar,
      phone: profile.phone,
      nationalId: profile.national_id,
      bio: profile.bio,
      location: profile.location,
      dateJoined: profile.date_joined,
      isVerified: profile.is_verified,
    }
  }
}