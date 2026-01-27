/**
 * CSRF (Cross-Site Request Forgery) Protection
 * Generates and validates CSRF tokens for form submissions
 */

import { randomBytes, createHash } from 'crypto'
import { logger } from './logger'

interface CSRFToken {
  token: string
  expires: number
}

class CSRFProtection {
  private tokens = new Map<string, CSRFToken>()
  
  // Token validity duration (1 hour)
  private readonly TOKEN_LIFETIME_MS = 60 * 60 * 1000

  /**
   * Generate a new CSRF token for a session
   * @param sessionId - Unique session identifier
   * @returns CSRF token string
   */
  generateToken(sessionId: string): string {
    // Generate random token
    const token = randomBytes(32).toString('hex')
    const expires = Date.now() + this.TOKEN_LIFETIME_MS

    // Store token with expiry
    this.tokens.set(sessionId, { token, expires })

    logger.debug('CSRF token generated', { sessionId })
    
    return token
  }

  /**
   * Validate a CSRF token
   * @param sessionId - Unique session identifier
   * @param token - Token to validate
   * @returns true if valid, false otherwise
   */
  validateToken(sessionId: string, token: string): boolean {
    const storedToken = this.tokens.get(sessionId)

    if (!storedToken) {
      logger.warn('CSRF validation failed: No token found', { sessionId })
      return false
    }

    // Check if token expired
    if (storedToken.expires < Date.now()) {
      this.tokens.delete(sessionId)
      logger.warn('CSRF validation failed: Token expired', { sessionId })
      return false
    }

    // Validate token
    if (storedToken.token !== token) {
      logger.warn('CSRF validation failed: Token mismatch', { sessionId })
      return false
    }

    logger.debug('CSRF token validated successfully', { sessionId })
    return true
  }

  /**
   * Remove token for a session
   * @param sessionId - Session identifier
   */
  removeToken(sessionId: string): void {
    this.tokens.delete(sessionId)
    logger.debug('CSRF token removed', { sessionId })
  }

  /**
   * Clean up expired tokens
   */
  cleanup(): void {
    const now = Date.now()
    let cleaned = 0

    for (const [sessionId, tokenData] of this.tokens.entries()) {
      if (tokenData.expires < now) {
        this.tokens.delete(sessionId)
        cleaned++
      }
    }

    if (cleaned > 0) {
      logger.debug('CSRF cleanup completed', { tokensRemoved: cleaned })
    }
  }

  /**
   * Generate a double-submit token (alternative CSRF protection)
   * This creates a hash that can be validated without server-side storage
   */
  generateDoubleSubmitToken(sessionId: string, secret: string): string {
    const timestamp = Date.now().toString()
    const data = `${sessionId}:${timestamp}:${secret}`
    const hash = createHash('sha256').update(data).digest('hex')
    
    return `${timestamp}.${hash}`
  }

  /**
   * Validate a double-submit token
   */
  validateDoubleSubmitToken(
    sessionId: string, 
    token: string, 
    secret: string,
    maxAge: number = this.TOKEN_LIFETIME_MS
  ): boolean {
    try {
      const [timestamp, hash] = token.split('.')
      
      if (!timestamp || !hash) {
        logger.warn('Invalid double-submit token format')
        return false
      }

      // Check if token is expired
      const tokenAge = Date.now() - parseInt(timestamp, 10)
      if (tokenAge > maxAge) {
        logger.warn('Double-submit token expired', { age: tokenAge })
        return false
      }

      // Validate hash
      const data = `${sessionId}:${timestamp}:${secret}`
      const expectedHash = createHash('sha256').update(data).digest('hex')
      
      if (hash !== expectedHash) {
        logger.warn('Double-submit token hash mismatch')
        return false
      }

      return true
    } catch (error) {
      logger.error('Double-submit token validation error', error)
      return false
    }
  }
}

export const csrfProtection = new CSRFProtection()

// Run cleanup every 30 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => csrfProtection.cleanup(), 30 * 60 * 1000)
}
