/**
 * Production-ready logging service
 * Replaces console.log statements with proper logging
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: any
}

class Logger {
  private isDevelopment = process.env.NODE_ENV !== 'production'

  private formatLog(level: LogLevel, message: string, context?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(context && { context })
    }
  }

  private writeLog(entry: LogEntry) {
    // In production, this could send to a logging service
    // For now, we use console in development only
    if (this.isDevelopment) {
      const logString = `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}`
      
      switch (entry.level) {
        case 'error':
          console.error(logString, entry.context || '')
          break
        case 'warn':
          console.warn(logString, entry.context || '')
          break
        case 'debug':
          console.debug(logString, entry.context || '')
          break
        default:
          console.log(logString, entry.context || '')
      }
    }
    
    // In production, send to logging service (e.g., CloudWatch, Sentry, etc.)
    // This is a placeholder for future implementation
  }

  info(message: string, context?: any) {
    this.writeLog(this.formatLog('info', message, context))
  }

  warn(message: string, context?: any) {
    this.writeLog(this.formatLog('warn', message, context))
  }

  error(message: string, context?: any) {
    this.writeLog(this.formatLog('error', message, context))
  }

  debug(message: string, context?: any) {
    this.writeLog(this.formatLog('debug', message, context))
  }
}

export const logger = new Logger()
