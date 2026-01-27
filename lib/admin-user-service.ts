import { User } from '@/types/auth'
import { supabaseAdmin } from './supabase'
import { logger } from './logger'

class AdminUserService {
  static async getAllUsers(): Promise<User[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .order('date_joined', { ascending: false })

      if (error) {
        logger.error('Error fetching all users', error)
        throw error
      }

      return this.mapProfilesToUsers(data || [])
    } catch (error) {
      logger.error('Error in getAllUsers', error)
      return []
    }
  }

  static async getUserById(id: string): Promise<User | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        logger.error('Error fetching user by ID', { id, error })
        return null
      }

      return this.mapProfileToUser(data)
    } catch (error) {
      logger.error('Error in getUserById', { id, error })
      return null
    }
  }

  static async searchUsers(query: string): Promise<User[]> {
    try {
      const lowerQuery = query.toLowerCase()
      
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .or(`name.ilike.%${lowerQuery}%,email.ilike.%${lowerQuery}%,national_id.ilike.%${lowerQuery}%,phone.ilike.%${lowerQuery}%`)
        .order('date_joined', { ascending: false })

      if (error) {
        logger.error('Error searching users', { query, error })
        throw error
      }

      return this.mapProfilesToUsers(data || [])
    } catch (error) {
      logger.error('Error in searchUsers', { query, error })
      return []
    }
  }

  static async updateUserRole(userId: string, newRole: 'user' | 'admin'): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) {
        logger.error('Error updating user role', { userId, newRole, error })
        throw error
      }

      logger.info('User role updated', { userId, newRole })
      return true
    } catch (error) {
      logger.error('Error in updateUserRole', { userId, newRole, error })
      return false
    }
  }

  static async updateUserVerification(userId: string, isVerified: boolean): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ is_verified: isVerified })
        .eq('id', userId)

      if (error) {
        logger.error('Error updating user verification', { userId, isVerified, error })
        throw error
      }

      logger.info('User verification updated', { userId, isVerified })
      return true
    } catch (error) {
      logger.error('Error in updateUserVerification', { userId, isVerified, error })
      return false
    }
  }

  static async getUserStats() {
    try {
      const users = await this.getAllUsers()
      const total = users.length
      const admins = users.filter(user => user.role === 'admin').length
      const verified = users.filter(user => user.isVerified).length
      const unverified = total - verified

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const recentJoins = users.filter(user => {
        const joinDate = new Date(user.dateJoined)
        return joinDate > thirtyDaysAgo
      }).length

      return {
        total,
        admins,
        users: total - admins,
        verified,
        unverified,
        recentJoins
      }
    } catch (error) {
      logger.error('Error in getUserStats', error)
      return {
        total: 0,
        admins: 0,
        users: 0,
        verified: 0,
        unverified: 0,
        recentJoins: 0
      }
    }
  }

  static async filterUsers(filters: {
    role?: 'user' | 'admin' | 'all'
    verified?: boolean | 'all'
    joinedAfter?: string
    joinedBefore?: string
  }): Promise<User[]> {
    try {
      let query = supabaseAdmin.from('profiles').select('*')

      if (filters.role && filters.role !== 'all') {
        query = query.eq('role', filters.role)
      }

      if (filters.verified !== 'all' && typeof filters.verified === 'boolean') {
        query = query.eq('is_verified', filters.verified)
      }

      if (filters.joinedAfter) {
        query = query.gte('date_joined', filters.joinedAfter)
      }

      if (filters.joinedBefore) {
        query = query.lte('date_joined', filters.joinedBefore)
      }

      const { data, error } = await query.order('date_joined', { ascending: false })

      if (error) {
        logger.error('Error filtering users', { filters, error })
        throw error
      }

      return this.mapProfilesToUsers(data || [])
    } catch (error) {
      logger.error('Error in filterUsers', { filters, error })
      return []
    }
  }

  // Helper methods to map database profiles to User type
  private static mapProfileToUser(profile: any): User {
    return {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      avatar: profile.avatar,
      phone: profile.phone,
      nationalId: profile.national_id,
      bio: profile.bio,
      location: profile.location,
      dateJoined: profile.date_joined,
      isVerified: profile.is_verified,
    }
  }

  private static mapProfilesToUsers(profiles: any[]): User[] {
    return profiles.map(profile => this.mapProfileToUser(profile))
  }
}

export { AdminUserService }