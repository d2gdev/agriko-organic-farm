import { Pool, PoolClient } from 'pg';
import { Redis } from 'ioredis';

// Database connection configuration
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

// PostgreSQL connection pool
export const pool = new Pool(dbConfig);

// Redis connection
export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  enableReadyCheck: true,
  maxRetriesPerRequest: 3,
  lazyConnect: true
});

// Database query wrapper with error handling
export async function query<T = unknown>(
  text: string,
  params?: unknown[]
): Promise<{ rows: T[]; rowCount: number }> {
  const start = Date.now();
  let client: PoolClient | undefined;

  try {
    client = await pool.connect();
    const result = await client.query(text, params);
    const duration = Date.now() - start;

    // Log slow queries in development
    if (process.env.NODE_ENV === 'development' && duration > 100) {
      console.warn('Slow query detected:', { text, duration });
    }

    return {
      rows: result.rows,
      rowCount: result.rowCount || 0
    };
  } catch (error) {
    console.error('Database query error:', {
      text,
      params,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Transaction wrapper
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Cache wrapper functions
export class CacheManager {
  private static instance: CacheManager;

  static getInstance(): CacheManager {
    if (!this.instance) {
      this.instance = new CacheManager();
    }
    return this.instance;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number = 3600): Promise<void> {
    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  generateKey(prefix: string, ...parts: string[]): string {
    return `${prefix}:${parts.join(':')}`;
  }
}

// Database health check
export async function healthCheck(): Promise<{
  database: boolean;
  redis: boolean;
  timestamp: Date;
}> {
  const result = {
    database: false,
    redis: false,
    timestamp: new Date()
  };

  try {
    await query('SELECT 1');
    result.database = true;
  } catch (error) {
    console.error('Database health check failed:', error);
  }

  try {
    await redis.ping();
    result.redis = true;
  } catch (error) {
    console.error('Redis health check failed:', error);
  }

  return result;
}

// Graceful shutdown
export async function closeConnections(): Promise<void> {
  try {
    await pool.end();
    await redis.quit();
    console.warn('Database connections closed gracefully');
  } catch (error) {
    console.error('Error closing database connections:', error);
  }
}

// Handle process termination
process.on('SIGINT', closeConnections);
process.on('SIGTERM', closeConnections);
process.on('exit', closeConnections);