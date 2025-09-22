// Redis-based Rate Limiting for Production Scalability
import { logger } from '@/lib/logger';
import { config } from '@/lib/unified-config';

// Redis client interface (compatible with ioredis)
interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode?: string, duration?: number): Promise<string | null>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  del(key: string): Promise<number>;
  exists(key: string): Promise<number>;
  multi(): RedisMulti;
}

interface RedisMulti {
  incr(key: string): RedisMulti;
  expire(key: string, seconds: number): RedisMulti;
  exec(): Promise<Array<[Error | null, any]> | null>;
}

// Rate limiting configuration
export interface RateLimitConfig {
  windowMs: number;        // Time window in milliseconds
  maxRequests: number;     // Maximum requests per window
  keyPrefix?: string;      // Redis key prefix
  skipOnError?: boolean;   // Skip rate limiting if Redis fails
}

// Rate limiting result
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  totalHits: number;
}

// Default rate limiting configurations
export const RATE_LIMITS = {
  WEBHOOK: {
    windowMs: 60000,      // 1 minute
    maxRequests: 100,     // 100 requests per minute per IP
    keyPrefix: 'rl:webhook:'
  },
  API: {
    windowMs: 60000,      // 1 minute
    maxRequests: 200,     // 200 requests per minute per IP
    keyPrefix: 'rl:api:'
  },
  SEARCH: {
    windowMs: 60000,      // 1 minute
    maxRequests: 60,      // 60 searches per minute per session
    keyPrefix: 'rl:search:'
  },
  TRACKING: {
    windowMs: 60000,      // 1 minute
    maxRequests: 500,     // 500 tracking events per minute per session
    keyPrefix: 'rl:track:'
  }
} as const;

class RedisRateLimiter {
  private redisClient: RedisClient | null = null;
  private fallbackMap = new Map<string, { count: number; resetTime: number }>();

  constructor() {
    this.initializeRedis();
  }

  private async initializeRedis(): Promise<void> {
    try {
      // Skip Redis if not configured
      if (!config.redis || !config.redis.url) {
        logger.info('Redis not configured, using in-memory rate limiter');
        this.startFallbackCleanup();
        return;
      }

      // Dynamically import Redis client
      const Redis = (await import('ioredis')).default;

      // Parse Redis URL or use individual config
      if (config.redis.url) {
        this.redisClient = new Redis(config.redis.url, {
          maxRetriesPerRequest: 3,
          connectTimeout: 5000,
          lazyConnect: true,
          password: config.redis.password,
        }) as RedisClient;
      } else {
        // Redis config only supports URL format in unified config
        throw new Error('Redis host/port configuration not supported, use REDIS_URL instead');
      }

      // Test connection
      if (this.redisClient && 'ping' in this.redisClient) {
        await (this.redisClient as any).ping();
        logger.info('✅ Redis rate limiter connected successfully');
      }

    } catch (error) {
      logger.warn('⚠️ Redis connection failed, using in-memory fallback:', { error });
      this.redisClient = null;

      // Setup cleanup for fallback map
      this.startFallbackCleanup();
    }
  }

  /**
   * Check rate limit for a given identifier
   */
  async checkRateLimit(
    identifier: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    try {
      if (this.redisClient) {
        return await this.checkRedisRateLimit(identifier, config);
      } else {
        return this.checkFallbackRateLimit(identifier, config);
      }
    } catch (error) {
      logger.error('Rate limit check failed:', { error: error instanceof Error ? error.message : String(error) });

      if (config.skipOnError) {
        return {
          allowed: true,
          remaining: config.maxRequests,
          resetTime: Date.now() + config.windowMs,
          totalHits: 0
        };
      }

      // Fail closed - deny request on error
      return {
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + config.windowMs,
        totalHits: config.maxRequests + 1
      };
    }
  }

  /**
   * Redis-based rate limiting using sliding window
   */
  private async checkRedisRateLimit(
    identifier: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const key = `${config.keyPrefix}${identifier}`;
    const windowSeconds = Math.ceil(config.windowMs / 1000);
    const now = Date.now();
    const resetTime = now + config.windowMs;

    // Use Redis pipeline for atomic operations
    const multi = this.redisClient?.multi();
    if (!multi) {
      throw new Error('Redis multi operation not available');
    }

    multi.incr(key);
    multi.expire(key, windowSeconds);

    const results = await multi.exec();

    if (!results || results.length !== 2) {
      throw new Error('Redis pipeline execution failed');
    }

    const [incrResult, expireResult] = results;

    if (!incrResult || !expireResult || incrResult[0] || expireResult[0]) {
      throw new Error('Redis operation failed');
    }

    const totalHits = incrResult[1] as number;
    const allowed = totalHits <= config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - totalHits);

    return {
      allowed,
      remaining,
      resetTime,
      totalHits
    };
  }

  /**
   * In-memory fallback rate limiting
   */
  private checkFallbackRateLimit(
    identifier: string,
    config: RateLimitConfig
  ): RateLimitResult {
    const key = `${config.keyPrefix}${identifier}`;
    const now = Date.now();
    const _windowStart = now - config.windowMs;

    let limitData = this.fallbackMap.get(key);

    if (!limitData || limitData.resetTime <= now) {
      // Initialize or reset window
      limitData = {
        count: 1,
        resetTime: now + config.windowMs
      };
      this.fallbackMap.set(key, limitData);

      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime: limitData.resetTime,
        totalHits: 1
      };
    }

    limitData.count++;
    const allowed = limitData.count <= config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - limitData.count);

    return {
      allowed,
      remaining,
      resetTime: limitData.resetTime,
      totalHits: limitData.count
    };
  }

  /**
   * Reset rate limit for identifier (admin function)
   */
  async resetRateLimit(identifier: string, config: RateLimitConfig): Promise<void> {
    const key = `${config.keyPrefix}${identifier}`;

    try {
      if (this.redisClient) {
        await this.redisClient.del(key);
      } else {
        this.fallbackMap.delete(key);
      }
      logger.info(`Rate limit reset for: ${identifier}`);
    } catch (error) {
      logger.error(`Failed to reset rate limit for ${identifier}:`, { error: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * Get current rate limit status without incrementing
   */
  async getRateLimitStatus(
    identifier: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const key = `${config.keyPrefix}${identifier}`;

    try {
      if (this.redisClient) {
        const count = await this.redisClient.get(key);
        const totalHits = count ? parseInt(count, 10) : 0;
        const remaining = Math.max(0, config.maxRequests - totalHits);

        return {
          allowed: totalHits < config.maxRequests,
          remaining,
          resetTime: Date.now() + config.windowMs,
          totalHits
        };
      } else {
        const limitData = this.fallbackMap.get(key);
        if (!limitData) {
          return {
            allowed: true,
            remaining: config.maxRequests,
            resetTime: Date.now() + config.windowMs,
            totalHits: 0
          };
        }

        const remaining = Math.max(0, config.maxRequests - limitData.count);
        return {
          allowed: limitData.count < config.maxRequests,
          remaining,
          resetTime: limitData.resetTime,
          totalHits: limitData.count
        };
      }
    } catch (error) {
      logger.error('Failed to get rate limit status:', { error: error instanceof Error ? error.message : String(error) });
      return {
        allowed: true,
        remaining: config.maxRequests,
        resetTime: Date.now() + config.windowMs,
        totalHits: 0
      };
    }
  }

  /**
   * Cleanup expired entries in fallback map
   */
  private startFallbackCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, data] of this.fallbackMap.entries()) {
        if (data.resetTime <= now) {
          this.fallbackMap.delete(key);
        }
      }
    }, 60000); // Cleanup every minute
  }

  /**
   * Health check for rate limiter
   */
  async healthCheck(): Promise<{
    redis: boolean;
    fallback: boolean;
    entriesCount: number;
  }> {
    let redisHealthy = false;

    try {
      if (this.redisClient && 'ping' in this.redisClient) {
        await (this.redisClient as any).ping();
        redisHealthy = true;
      }
    } catch (error) {
      logger.warn('Redis health check failed:', { error });
    }

    return {
      redis: redisHealthy,
      fallback: !redisHealthy,
      entriesCount: this.fallbackMap.size
    };
  }

  /**
   * Get metrics for monitoring
   */
  getMetrics(): {
    redisConnected: boolean;
    fallbackEntries: number;
    lastError?: string;
  } {
    return {
      redisConnected: this.redisClient !== null,
      fallbackEntries: this.fallbackMap.size
    };
  }

  /**
   * Cleanup resources
   */
  async destroy(): Promise<void> {
    try {
      if (this.redisClient && 'quit' in this.redisClient) {
        await (this.redisClient as any).quit();
      }
      this.fallbackMap.clear();
      logger.info('Rate limiter destroyed');
    } catch (error) {
      logger.error('Error destroying rate limiter:', { error: error instanceof Error ? error.message : String(error) });
    }
  }
}

// Export singleton instance
export const rateLimiter = new RedisRateLimiter();

// Convenience functions for common rate limiting scenarios
export async function checkWebhookRateLimit(clientIp: string): Promise<RateLimitResult> {
  return rateLimiter.checkRateLimit(clientIp, RATE_LIMITS.WEBHOOK);
}

export async function checkAPIRateLimit(clientIp: string): Promise<RateLimitResult> {
  return rateLimiter.checkRateLimit(clientIp, RATE_LIMITS.API);
}

export async function checkSearchRateLimit(sessionId: string): Promise<RateLimitResult> {
  return rateLimiter.checkRateLimit(sessionId, RATE_LIMITS.SEARCH);
}

export async function checkTrackingRateLimit(sessionId: string): Promise<RateLimitResult> {
  return rateLimiter.checkRateLimit(sessionId, RATE_LIMITS.TRACKING);
}

export default rateLimiter;