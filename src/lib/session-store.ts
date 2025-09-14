import { createHash } from 'crypto';
import { createClient, RedisClientType } from 'redis';
import { logger } from '@/lib/logger';
import { SessionData as ImportedSessionData } from '../types/session';

// Export SessionData for external modules
export interface SessionData extends ImportedSessionData {}


/**
 * Session store interface
 */
export interface SessionStore {
  get(sessionId: string): Promise<SessionData | null>;
  set(sessionId: string, data: SessionData, ttlSeconds?: number): Promise<void>;
  delete(sessionId: string): Promise<void>;
  cleanup(): Promise<void>;
  getActiveSessions(): Promise<Array<{ sessionId: string; data: SessionData }>>;
  destroy(): Promise<void>;
}

/**
 * Redis-based session store
 */
export class RedisSessionStore implements SessionStore {
  private client: RedisClientType | null = null;
  private isConnected = false;
  private keyPrefix = 'agriko:session:';
  private defaultTTL = 7 * 24 * 60 * 60; // 7 days in seconds

  constructor() {
    this.initializeRedis();
  }

  private async initializeRedis(): Promise<void> {
    try {
      // Dynamic import to handle environments where Redis might not be available
      const redisModule = await import('redis').catch(() => null);
      if (!redisModule) {
        logger.warn('Redis module not available, falling back to in-memory sessions');
        return;
      }
      
      // Type assertion for Redis module
      const { createClient } = redisModule as typeof import('redis');
      
      const redisUrl = process.env.REDIS_URL ?? process.env.REDIS_CONNECTION_STRING;
      
      if (!redisUrl) {
        logger.warn('No Redis URL configured, falling back to in-memory sessions');
        return;
      }

      this.client = createClient({
        url: redisUrl,
        socket: {
          connectTimeout: 10000,
          reconnectStrategy: (retries: number) => {
            if (retries > 3) {
              logger.error('Redis reconnection failed after 3 attempts');
              return false;
            }
            return Math.min(retries * 100, 3000);
          }
        },
        // Handle Redis authentication
        password: process.env.REDIS_PASSWORD,
        database: parseInt(process.env.REDIS_DATABASE ?? '0')
      });

      this.client.on('error', (error: Error) => {
        logger.error('Redis client error:', { 
          message: error.message, 
          stack: error.stack,
          name: error.name
        });
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('Redis client connected');
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        logger.warn('Redis client disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
      logger.info('Redis session store initialized');

    } catch (error: unknown) {
      logger.error('Failed to initialize Redis session store:', { 
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      logger.warn('Falling back to in-memory session storage');
      this.client = null;
    }
  }

  async get(sessionId: string): Promise<SessionData | null> {
    if (!this.client || !this.isConnected) {
      return null;
    }

    try {
      const key = this.keyPrefix + sessionId;
      const data = await this.client.get(key);
      
      if (!data) {
        return null;
      }

      const parsed = JSON.parse(data) as SessionData;
      
      // Update last activity timestamp in Redis
      (parsed as SessionData & { lastActivity: number }).lastActivity = Date.now();
      await this.client.set(key, JSON.stringify(parsed), {
        EX: this.defaultTTL
      });

      return parsed;
    } catch (error: unknown) {
      logger.error('Error getting session from Redis:', { 
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      return null;
    }
  }

  async set(sessionId: string, data: SessionData, ttlSeconds?: number): Promise<void> {
    if (!this.client || !this.isConnected) {
      logger.warn('Redis not available, session will not persist');
      return;
    }

    try {
      const key = this.keyPrefix + sessionId;
      const serialized = JSON.stringify(data);
      const ttl = ttlSeconds ?? this.defaultTTL;

      await this.client.set(key, serialized, {
        EX: ttl
      });

      logger.debug(`Session stored in Redis: ${sessionId}`);
    } catch (error: unknown) {
      logger.error('Error storing session in Redis:', { 
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  async delete(sessionId: string): Promise<void> {
    if (!this.client || !this.isConnected) {
      return;
    }

    try {
      const key = this.keyPrefix + sessionId;
      await this.client.del(key);
      logger.debug(`Session deleted from Redis: ${sessionId}`);
    } catch (error) {
      logger.error('Error deleting session from Redis:', { 
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }

  async cleanup(): Promise<void> {
    // Redis handles TTL automatically, but we can scan for expired sessions
    if (!this.client || !this.isConnected) {
      return;
    }

    try {
      // This is optional since Redis TTL handles cleanup automatically
      logger.debug('Redis session cleanup completed (TTL-based)');
    } catch (error) {
      logger.error('Error during Redis session cleanup:', { 
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }

  async getActiveSessions(): Promise<Array<{ sessionId: string; data: SessionData }>> {
    if (!this.client || !this.isConnected) {
      return [];
    }

    try {
      const keys = await this.client.keys(this.keyPrefix + '*');
      const sessions: Array<{ sessionId: string; data: SessionData }> = [];

      for (const key of keys) {
        try {
          const data = await this.client.get(key);
          if (data) {
            const sessionId = key.replace(this.keyPrefix, '');
            const parsed = JSON.parse(data) as SessionData;
            sessions.push({ sessionId, data: parsed });
          }
        } catch (parseError) {
          logger.warn(`Failed to parse session data for key ${key}`);
        }
      }

      return sessions;
    } catch (error) {
      logger.error('Error getting active sessions from Redis:', { 
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      return [];
    }
  }

  async destroy(): Promise<void> {
    if (this.client) {
      try {
        await this.client.quit();
        logger.info('Redis session store destroyed');
      } catch (error) {
        logger.error('Error destroying Redis session store:', { 
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
      }
    }
  }

  isAvailable(): boolean {
    return this.client !== null && this.isConnected;
  }
}

/**
 * In-memory session store (fallback)
 */
export class MemorySessionStore implements SessionStore {
  private sessions = new Map<string, { data: SessionData; expiresAt: number }>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startCleanup();
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000); // Cleanup every 5 minutes
  }

  async get(sessionId: string): Promise<SessionData | null> {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return null;
    }

    if (Date.now() > session.expiresAt) {
      this.sessions.delete(sessionId);
      return null;
    }

    // Update last activity
    (session.data as SessionData & { lastActivity: number }).lastActivity = Date.now();
    return session.data;
  }

  async set(sessionId: string, data: SessionData, ttlSeconds = 7 * 24 * 60 * 60): Promise<void> {
    const expiresAt = Date.now() + (ttlSeconds * 1000);
    this.sessions.set(sessionId, { data, expiresAt });
  }

  async delete(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }

  async cleanup(): Promise<void> {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now > session.expiresAt) {
        this.sessions.delete(sessionId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.debug(`Cleaned up ${cleanedCount} expired in-memory sessions`);
    }
  }

  async getActiveSessions(): Promise<Array<{ sessionId: string; data: SessionData }>> {
    const now = Date.now();
    const active: Array<{ sessionId: string; data: SessionData }> = [];

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now <= session.expiresAt) {
        active.push({ sessionId, data: session.data });
      }
    }

    return active;
  }

  async destroy(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.sessions.clear();
  }
}

/**
 * Session store factory
 */
class SessionStoreFactory {
  private static instance: SessionStore | null = null;

  static async getInstance(): Promise<SessionStore> {
    if (!SessionStoreFactory.instance) {
      // Try Redis first, fallback to memory
      const redisStore = new RedisSessionStore();
      
      // Wait a bit to see if Redis connects
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (redisStore.isAvailable()) {
        SessionStoreFactory.instance = redisStore;
        logger.info('Using Redis session store');
      } else {
        SessionStoreFactory.instance = new MemorySessionStore();
        logger.warn('Using in-memory session store (not recommended for production)');
      }
    }
    
    return SessionStoreFactory.instance;
  }

  static async destroy(): Promise<void> {
    if (SessionStoreFactory.instance) {
      await SessionStoreFactory.instance.destroy();
      SessionStoreFactory.instance = null;
    }
  }
}

// Export the factory and main functions
export const getSessionStore = () => SessionStoreFactory.getInstance();
export const destroySessionStore = () => SessionStoreFactory.destroy();

// Graceful shutdown
if (typeof process !== 'undefined') {
  process.on('SIGINT', destroySessionStore);
  process.on('SIGTERM', destroySessionStore);
  process.on('beforeExit', destroySessionStore);
}