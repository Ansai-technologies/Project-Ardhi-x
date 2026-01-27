/**
 * Rate limiting service for API endpoints
 * Prevents brute force attacks and abuse
 */

import { logger } from './logger'

interface RateLimitEntry {
  count: number
  resetTime: number
  locked: boolean
  lockUntil?: number
}

class RateLimiter {
  private requests = new Map<string, RateLimitEntry>()
  
  // Maximum attempts before rate limiting
  private readonly MAX_ATTEMPTS = 5
  
  // Time window in milliseconds (5 minutes)
  private readonly WINDOW_MS = 5 * 60 * 1000
  
  // Lockout duration after max attempts (15 minutes)
  private readonly LOCKOUT_MS = 15 * 60 * 1000

  /**
   * Check if a request should be allowed based on rate limiting
   * @param identifier - Unique identifier (e.g., email or IP address)
   * @param maxAttempts - Optional custom max attempts (defaults to 5)
   * @returns Object with allowed status and remaining attempts
   */
  checkLimit(identifier: string, maxAttempts?: number): { 
    allowed: boolean
    remaining: number
    resetTime?: number
    lockUntil?: number
  } {
    const max = maxAttempts || this.MAX_ATTEMPTS
    const now = Date.now()
    const entry = this.requests.get(identifier)

    // Check if currently locked out
    if (entry?.locked && entry.lockUntil && entry.lockUntil > now) {
      logger.warn('Rate limit lockout active', { identifier, lockUntil: entry.lockUntil })
      return {
        allowed: false,
        remaining: 0,
        lockUntil: entry.lockUntil
      }
    }

    // If no entry or window expired, create/reset entry
    if (!entry || entry.resetTime < now) {
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + this.WINDOW_MS,
        locked: false
      })
      return {
        allowed: true,
        remaining: max - 1,
        resetTime: now + this.WINDOW_MS
      }
    }

    // Increment count
    entry.count++

    // Check if max attempts exceeded
    if (entry.count > max) {
      entry.locked = true
      entry.lockUntil = now + this.LOCKOUT_MS
      this.requests.set(identifier, entry)
      
      logger.warn('Rate limit exceeded - account locked', { 
        identifier, 
        attempts: entry.count,
        lockUntil: entry.lockUntil 
      })
      
      return {
        allowed: false,
        remaining: 0,
        lockUntil: entry.lockUntil
      }
    }

    this.requests.set(identifier, entry)
    
    return {
      allowed: true,
      remaining: max - entry.count,
      resetTime: entry.resetTime
    }
  }

  /**
   * Reset rate limit for an identifier (e.g., after successful login)
   */
  reset(identifier: string): void {
    this.requests.delete(identifier)
    logger.debug('Rate limit reset', { identifier })
  }

  /**
   * Manually lock an account
   */
  lock(identifier: string, durationMs?: number): void {
    const now = Date.now()
    const lockDuration = durationMs || this.LOCKOUT_MS
    
    this.requests.set(identifier, {
      count: this.MAX_ATTEMPTS + 1,
      resetTime: now + this.WINDOW_MS,
      locked: true,
      lockUntil: now + lockDuration
    })
    
    logger.warn('Account manually locked', { identifier, lockUntil: now + lockDuration })
  }

  /**
   * Manually unlock an account
   */
  unlock(identifier: string): void {
    this.requests.delete(identifier)
    logger.info('Account manually unlocked', { identifier })
  }

  /**
   * Clean up expired entries (call periodically)
   */
  cleanup(): void {
    const now = Date.now()
    let cleaned = 0
    
    for (const [identifier, entry] of this.requests.entries()) {
      // Remove if reset time has passed and not locked, or if lockout has expired
      if ((entry.resetTime < now && !entry.locked) || 
          (entry.locked && entry.lockUntil && entry.lockUntil < now)) {
        this.requests.delete(identifier)
        cleaned++
      }
    }
    
    if (cleaned > 0) {
      logger.debug('Rate limiter cleanup completed', { entriesRemoved: cleaned })
    }
  }
}

export const rateLimiter = new RateLimiter()

// Run cleanup every 10 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => rateLimiter.cleanup(), 10 * 60 * 1000)
}
