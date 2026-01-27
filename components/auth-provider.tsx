"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { User, AuthContextType, RegisterData, Property, UserStats } from "@/types/auth"
import { PropertyService } from "@/lib/property-service"
import { logger } from "@/lib/logger"

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const redirectingRef = useRef(false)

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Check session via API
        const response = await fetch('/api/auth/me', {
          credentials: 'include'
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.user) {
            setUser(data.user)
          }
        }
      } catch (error) {
        logger.error('Session check failed', error)
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [])

  // Protect routes
  useEffect(() => {
    if (!loading && !redirectingRef.current) {
      const publicPaths = ["/", "/auth/sign-up", "/auth/forgot-password", "/auth/reset-password"]
      const isPublicPath = publicPaths.some((path) => pathname === path || pathname.startsWith(path))

      if (!user && !isPublicPath) {
        logger.debug('Redirecting to login - no user on protected route', { pathname })
        redirectingRef.current = true
        router.replace("/")
        setTimeout(() => { redirectingRef.current = false }, 1000)
      }
    }
  }, [user, loading, pathname, router])

  const login = async (email: string, password: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (data.success && data.user) {
        setUser(data.user)
        setLoading(false)
        
        // Direct redirect after successful login
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.location.href = "/dashboard"
          }
        }, 100)
        
        return { success: true }
      } else {
        setLoading(false)
        return { success: false, error: data.error || 'Login failed' }
      }
    } catch (error) {
      logger.error('Login error', error)
      setLoading(false)
      return { success: false, error: 'Login failed' }
    }
  }

  const register = async (userData: RegisterData) => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(userData)
      })

      const data = await response.json()

      if (data.success && data.user) {
        setUser(data.user)
        return { success: true }
      } else {
        return { success: false, error: data.error || 'Registration failed' }
      }
    } catch (error) {
      logger.error('Registration failed', error)
      return { success: false, error: 'Network error. Please try again.' }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
    } catch (error) {
      logger.error('Logout error', error)
    } finally {
      setUser(null)
      router.push("/")
    }
  }

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return { success: false, error: 'No user logged in' }

    try {
      // For now, just update locally - in production, make API call
      const updatedUser = { ...user, ...updates }
      setUser(updatedUser)
      return { success: true }
    } catch (error) {
      logger.error('Update user failed', error)
      return { success: false, error: 'Failed to update user' }
    }
  }

  const uploadAvatar = async (file: File): Promise<string> => {
    // Simulate file upload - in production, upload to cloud storage
    return new Promise((resolve) => {
      setTimeout(() => {
        const newAvatarUrl = `/placeholder-user.jpg?${Date.now()}`
        if (user) {
          setUser({ ...user, avatar: newAvatarUrl })
        }
        resolve(newAvatarUrl)
      }, 1000)
    })
  }

  const resetPassword = async (email: string) => {
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()
      return data
    } catch (error) {
      logger.error('Reset password failed', error)
      return { success: false, error: 'Network error. Please try again.' }
    }
  }

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword })
      })

      const data = await response.json()
      return data
    } catch (error) {
      logger.error('Change password failed', error)
      return { success: false, error: 'Failed to change password' }
    }
  }

  const getUserStats = (): UserStats => {
    if (!user) {
      return {
        totalProperties: 0,
        verifiedProperties: 0,
        pendingProperties: 0,
        pendingDocuments: 0,
        totalValue: 0,
        currency: 'KES'
      }
    }
    // This should be async in production but keeping sync for compatibility
    return {
      totalProperties: 0,
      verifiedProperties: 0,
      pendingProperties: 0,
      pendingDocuments: 0,
      totalValue: 0,
      currency: 'KES'
    }
  }

  const getUserProperties = (): Property[] => {
    if (!user) return []
    // This should be async in production but keeping sync for compatibility
    return []
  }

  const addProperty = async (propertyData: Omit<Property, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return { success: false, error: 'No user logged in' }

    try {
      const property = await PropertyService.addProperty(user.id, propertyData)
      return { success: !!property }
    } catch (error) {
      logger.error('Add property failed', error)
      return { success: false, error: 'Failed to add property' }
    }
  }

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    updateUser,
    uploadAvatar,
    resetPassword,
    changePassword,
    getUserStats,
    getUserProperties,
    addProperty,
    loading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
