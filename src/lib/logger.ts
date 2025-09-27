/**
 * Production-optimized logging utility
 * Conditionally logs based on environment and log levels
 */

export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: Record<string, unknown>;
  context?: string;
  requestId?: string;
  userId?: string;
  sessionId?: string;
  tags?: string[];
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  enableRemote: boolean;
  maxLogSize: number;
  enabledContexts: string[];
}

// Log levels hierarchy (lower number = higher priority)
const LOG_LEVELS: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
  trace: 4,
};

// Default configuration based on environment
const DEFAULT_CONFIG: LoggerConfig = {
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  enableConsole: process.env.NODE_ENV !== 'production',
  enableFile: false,
  enableRemote: process.env.NODE_ENV === 'production',
  maxLogSize: 1000, // Max characters per log entry
  enabledContexts: process.env.LOG_CONTEXTS?.split(',') ?? ['*'],
};

class Logger {
  private config: LoggerConfig;
  private buffer: LogEntry[] = [];
  private maxBufferSize = 100;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  private get isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  private shouldLog(level: LogLevel, context?: string): boolean {
    // Check log level
    if (LOG_LEVELS[level] > LOG_LEVELS[this.config.level]) {
      return false;
    }

    // Check context filter
    if (context && this.config.enabledContexts.length > 0) {
      const enabledContexts = this.config.enabledContexts;
      if (!enabledContexts.includes('*') && !enabledContexts.includes(context)) {
        return false;
      }
    }

    return true;
  }

  private formatMessage(entry: LogEntry): string {
    let message = entry.message;
    
    // Truncate if too long
    if (message.length > this.config.maxLogSize) {
      message = message.substring(0, this.config.maxLogSize - 3) + '...';
    }

    return message;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    data?: Record<string, unknown>,
    context?: string,
    requestId?: string
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message: this.formatMessage({ timestamp: '', level, message }),
      data,
      context,
      requestId,
    };
  }

  private writeToConsole(entry: LogEntry): void {
    if (!this.config.enableConsole) return;

    // Skip non-error console output in production
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction && entry.level !== 'error') return;

    try {
      const emoji = this.getLevelEmoji(entry.level);
      const prefix = `${emoji} [${entry.level.toUpperCase()}]`;
      const timestamp = new Date(entry.timestamp).toLocaleTimeString();
      const context = entry.context ? ` [${entry.context}]` : '';
      const requestId = entry.requestId ? ` [${entry.requestId}]` : '';

      const fullMessage = `${prefix} ${timestamp}${context}${requestId} ${entry.message}`;

      switch (entry.level) {
        case 'error':
          console.error(fullMessage, entry.data);
          break;
        case 'warn':
          console.warn(fullMessage, entry.data);
          break;
        case 'info':
          console.info(fullMessage, entry.data);
          break;
        case 'debug':
        case 'trace':
          console.log(fullMessage, entry.data);
          break;
      }
    } catch {
      // Gracefully handle console errors - fallback to basic console.log (only for errors in production)
      try {
        if (!isProduction || entry.level === 'error') {
          console.log(`Logger Error: Failed to write log entry: ${entry.message}`);
        }
      } catch {
        // If even basic console.log fails, fail silently to prevent infinite loops
      }
    }
  }

  private getLevelEmoji(level: LogLevel): string {
    const emojis: Record<LogLevel, string> = {
      error: '🚨',
      warn: '⚠️',
      info: 'ℹ️',
      debug: '🐛',
      trace: '🔬',
    };
    return emojis[level] || '📝';
  }

  private addToBuffer(entry: LogEntry): void {
    this.buffer.push(entry);
    
    // Maintain buffer size - truncate to maxBufferSize if exceeded
    if (this.buffer.length > this.maxBufferSize) {
      const excessEntries = this.buffer.length - this.maxBufferSize;
      this.buffer.splice(0, excessEntries);
    }
  }

  private async sendToRemote(entry: LogEntry): Promise<void> {
    // Disable remote logging in development to prevent recursion issues
    if (!this.config.enableRemote || process.env.NODE_ENV === 'development') return;

    try {
      // Import remote logger dynamically to avoid circular dependencies
      const { remoteLogger } = await import('./remote-logging');
      
      // Send to remote logging service
      await remoteLogger.log(
        entry.level === 'trace' ? 'debug' : entry.level,
        entry.message,
        entry.data,
        entry.context,
        {
          requestId: entry.requestId,
          userId: entry.userId,
          sessionId: entry.sessionId,
          tags: entry.tags
        }
      );
    } catch (error) {
      // Fail silently to prevent logging loops
      if (this.config.enableConsole && process.env.NODE_ENV !== 'production') {
        console.error('Failed to send log to remote service:', error);
      }
    }
  }

  private log(
    level: LogLevel,
    message: string,
    data?: Record<string, unknown>,
    context?: string,
    requestId?: string
  ): void {
    if (!this.shouldLog(level, context)) {
      return;
    }

    const entry = this.createLogEntry(level, message, data, context, requestId);
    
    // Add to buffer for debugging
    this.addToBuffer(entry);
    
    // Write to console
    this.writeToConsole(entry);
    
    // Send to remote (async, fire-and-forget) - disabled in development
    if (process.env.NODE_ENV !== 'development') {
      this.sendToRemote(entry).catch(() => {
        // Silently ignore remote logging errors
      });
    }
  }

  // Public logging methods
  error(message: string, data?: Record<string, unknown>, context?: string, requestId?: string): void {
    this.log('error', message, data, context, requestId);
  }

  warn(message: string, data?: Record<string, unknown>, context?: string, requestId?: string): void {
    this.log('warn', message, data, context, requestId);
  }

  info(message: string, data?: Record<string, unknown>, context?: string, requestId?: string): void {
    this.log('info', message, data, context, requestId);
  }

  debug(message: string, data?: Record<string, unknown>, context?: string, requestId?: string): void {
    this.log('debug', message, data, context, requestId);
  }

  trace(message: string, data?: Record<string, unknown>, context?: string, requestId?: string): void {
    this.log('trace', message, data, context, requestId);
  }

  // Console grouping methods (only in development)
  group(label: string): void {
    if (this.isProduction) return;
    if (typeof console !== 'undefined' && console.group) {
      console.group(label);
    }
  }

  groupEnd(): void {
    if (this.isProduction) return;
    if (typeof console !== 'undefined' && console.groupEnd) {
      console.groupEnd();
    }
  }

  table(data: unknown): void {
    if (this.isProduction) return;
    if (typeof console !== 'undefined' && console.table) {
      console.table(data);
    }
  }

  // Utility methods
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  getBuffer(): LogEntry[] {
    return [...this.buffer];
  }

  clearBuffer(): void {
    this.buffer = [];
  }

  // Performance logging helpers
  time(label: string, context?: string): () => void {
    const start = performance.now();
    const startMessage = `⏱️ Timer started: ${label}`;
    
    this.debug(startMessage, undefined, context);
    
    return () => {
      const duration = performance.now() - start;
      const endMessage = `⏱️ Timer ended: ${label} (${duration.toFixed(2)}ms)`;
      this.debug(endMessage, { duration }, context);
    };
  }
}

// Export Logger class for custom instances
export { Logger };

// Create singleton logger instance
export const logger = new Logger();

// Convenience functions for backward compatibility
export function logError(message: string, data?: Record<string, unknown>, context?: string): void {
  logger.error(message, data, context);
}

export function logWarn(message: string, data?: Record<string, unknown>, context?: string): void {
  logger.warn(message, data, context);
}

export function logInfo(message: string, data?: Record<string, unknown>, context?: string): void {
  logger.info(message, data, context);
}

export function logDebug(message: string, data?: Record<string, unknown>, context?: string): void {
  logger.debug(message, data, context);
}

// Production-safe console replacement
export const productionConsole = {
  log: (message: string, ...args: unknown[]) => logger.info(message, { args }),
  error: (message: string, ...args: unknown[]) => logger.error(message, { args }),
  warn: (message: string, ...args: unknown[]) => logger.warn(message, { args }),
  info: (message: string, ...args: unknown[]) => logger.info(message, { args }),
  debug: (message: string, ...args: unknown[]) => logger.debug(message, { args }),
};

export default logger;
