import { logger } from '@/lib/logger';

// Generic connection pool interface
interface PooledConnection<T> {
  connection: T;
  inUse: boolean;
  createdAt: number;
  lastUsedAt: number;
  usageCount: number;
}

interface PoolConfig<T> {
  minConnections: number;
  maxConnections: number;
  acquireTimeoutMs: number;
  idleTimeoutMs: number;
  maxUsageCount?: number;
  validateConnection?: (connection: T) => Promise<boolean>;
  createConnection: () => Promise<T>;
  destroyConnection?: (connection: T) => Promise<void>;
}

// Generic connection pool implementation
export class ConnectionPool<T> {
  private connections: PooledConnection<T>[] = [];
  private config: PoolConfig<T>;
  private pendingRequests: Array<{
    resolve: (connection: T) => void;
    reject: (error: Error) => void;
    timestamp: number;
    timeoutId: NodeJS.Timeout | null;
  }> = [];
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: PoolConfig<T>) {
    this.config = {
      maxUsageCount: 1000,
      ...config
    };

    this.startCleanupTimer();
    this.initializeMinConnections();
  }

  private async initializeMinConnections(): Promise<void> {
    try {
      const promises = Array(this.config.minConnections)
        .fill(null)
        .map(() => this.createNewConnection());
      
      await Promise.all(promises);
      logger.info(`Connection pool initialized with ${this.config.minConnections} connections`);
    } catch (error) {
      logger.error('Failed to initialize minimum connections:', error as Record<string, unknown>);
    }
  }

  private async createNewConnection(): Promise<PooledConnection<T>> {
    try {
      const connection = await this.config.createConnection();
      const pooledConnection: PooledConnection<T> = {
        connection,
        inUse: false,
        createdAt: Date.now(),
        lastUsedAt: Date.now(),
        usageCount: 0
      };

      this.connections.push(pooledConnection);
      return pooledConnection;
    } catch (error) {
      logger.error('Failed to create new connection:', error as Record<string, unknown>);
      throw error;
    }
  }

  private async validateConnection(pooledConnection: PooledConnection<T>): Promise<boolean> {
    if (!this.config.validateConnection) {
      return true;
    }

    try {
      return await this.config.validateConnection(pooledConnection.connection);
    } catch (error) {
      logger.warn('Connection validation failed:', error as Record<string, unknown>);
      return false;
    }
  }

  private async destroyConnection(pooledConnection: PooledConnection<T>): Promise<void> {
    try {
      if (this.config.destroyConnection) {
        await this.config.destroyConnection(pooledConnection.connection);
      }
      
      const index = this.connections.indexOf(pooledConnection);
      if (index !== -1) {
        this.connections.splice(index, 1);
      }
    } catch (error) {
      logger.error('Failed to destroy connection:', error as Record<string, unknown>);
    }
  }

  private startCleanupTimer(): void {
    if (this.cleanupInterval) {
      return;
    }

    this.cleanupInterval = setInterval(async () => {
      await this.cleanup();
    }, 60000); // Cleanup every minute
  }

  private async cleanup(): Promise<void> {
    const now = Date.now();
    const connectionsToDestroy: PooledConnection<T>[] = [];

    // Find connections to clean up
    for (const conn of this.connections) {
      if (conn.inUse) {
        continue; // Skip connections in use
      }

      const shouldDestroy = 
        // Idle timeout
        (now - conn.lastUsedAt > this.config.idleTimeoutMs) ||
        // Max usage count reached
        ((this.config.maxUsageCount ?? 0) > 0 && conn.usageCount >= (this.config.maxUsageCount ?? 0)) ||
        // Failed validation
        !(await this.validateConnection(conn));

      if (shouldDestroy && this.connections.length > this.config.minConnections) {
        connectionsToDestroy.push(conn);
      }
    }

    // Destroy connections
    for (const conn of connectionsToDestroy) {
      await this.destroyConnection(conn);
    }

    if (connectionsToDestroy.length > 0) {
      logger.debug(`Cleaned up ${connectionsToDestroy.length} connections, pool size: ${this.connections.length}`);
    }

    // Process pending requests if we have available connections
    await this.processPendingRequests();
  }

  private async processPendingRequests(): Promise<void> {
    while (this.pendingRequests.length > 0) {
      const availableConnection = this.connections.find(conn => !conn.inUse);
      if (!availableConnection) {
        break;
      }

      const request = this.pendingRequests.shift();
      if (!request) {
        break;
      }

      // Check if request has timed out
      if (Date.now() - request.timestamp > this.config.acquireTimeoutMs) {
        request.reject(new Error('Connection acquisition timeout'));
        continue;
      }

      // Validate connection before giving it out
      if (!(await this.validateConnection(availableConnection))) {
        await this.destroyConnection(availableConnection);
        
        // Try to create a new connection if we're below max
        if (this.connections.length < this.config.maxConnections) {
          try {
            await this.createNewConnection();
          } catch {
            request.reject(new Error('Failed to create new connection'));
            continue;
          }
        } else {
          // Put request back in queue
          this.pendingRequests.unshift(request);
          break;
        }
        continue;
      }

      // Mark connection as in use and update stats
      availableConnection.inUse = true;
      availableConnection.lastUsedAt = Date.now();
      availableConnection.usageCount++;

      // Clear timeout to prevent resource leak
      if (request.timeoutId) {
        clearTimeout(request.timeoutId);
        request.timeoutId = null;
      }

      request.resolve(availableConnection.connection);
    }
  }

  async acquire(): Promise<T> {
    return new Promise(async (resolve, reject) => {
      // Try to find an available connection immediately
      const availableConnection = this.connections.find(conn => !conn.inUse);
      
      if (availableConnection) {
        // Validate connection
        if (await this.validateConnection(availableConnection)) {
          availableConnection.inUse = true;
          availableConnection.lastUsedAt = Date.now();
          availableConnection.usageCount++;
          resolve(availableConnection.connection);
          return;
        } else {
          // Connection is invalid, destroy it
          await this.destroyConnection(availableConnection);
        }
      }

      // Try to create a new connection if we're below max
      if (this.connections.length < this.config.maxConnections) {
        try {
          const newConnection = await this.createNewConnection();
          newConnection.inUse = true;
          newConnection.lastUsedAt = Date.now();
          newConnection.usageCount++;
          resolve(newConnection.connection);
          return;
        } catch (error) {
          logger.error('Failed to create new connection for immediate use:', error as Record<string, unknown>);
        }
      }

      // Create request with timeout handling
      const request = {
        resolve,
        reject,
        timestamp: Date.now(),
        timeoutId: null as NodeJS.Timeout | null
      };

      // Set timeout for the request with atomic cleanup
      request.timeoutId = setTimeout(() => {
        const requestIndex = this.pendingRequests.findIndex(req => req === request);
        if (requestIndex !== -1) {
          // Atomic removal from queue
          this.pendingRequests.splice(requestIndex, 1);
          request.timeoutId = null; // Clear timeout reference
          reject(new Error(`Connection acquisition timeout after ${this.config.acquireTimeoutMs}ms`));
        }
      }, this.config.acquireTimeoutMs);

      // Queue the request
      this.pendingRequests.push(request);
    });
  }

  async release(connection: T): Promise<void> {
    const pooledConnection = this.connections.find(conn => conn.connection === connection);
    
    if (!pooledConnection) {
      logger.warn('Attempted to release connection not managed by this pool');
      return;
    }

    if (!pooledConnection.inUse) {
      logger.warn('Attempted to release connection that was not in use');
      return;
    }

    pooledConnection.inUse = false;
    pooledConnection.lastUsedAt = Date.now();

    // Process any pending requests
    await this.processPendingRequests();
  }

  async destroy(): Promise<void> {
    // Stop cleanup timer
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // Reject all pending requests and clear their timeouts
    for (const request of this.pendingRequests) {
      if (request.timeoutId) {
        clearTimeout(request.timeoutId);
        request.timeoutId = null;
      }
      request.reject(new Error('Connection pool is being destroyed'));
    }
    this.pendingRequests = [];

    // Destroy all connections
    const destroyPromises = this.connections.map(conn => this.destroyConnection(conn));
    await Promise.all(destroyPromises);
    this.connections = [];

    logger.info('Connection pool destroyed');
  }

  getStats() {
    const now = Date.now();
    return {
      totalConnections: this.connections.length,
      activeConnections: this.connections.filter(conn => conn.inUse).length,
      idleConnections: this.connections.filter(conn => !conn.inUse).length,
      pendingRequests: this.pendingRequests.length,
      oldestConnection: this.connections.length > 0 
        ? Math.max(...this.connections.map(conn => now - conn.createdAt))
        : 0,
      totalUsage: this.connections.reduce((sum, conn) => sum + conn.usageCount, 0),
      config: {
        minConnections: this.config.minConnections,
        maxConnections: this.config.maxConnections,
        acquireTimeoutMs: this.config.acquireTimeoutMs,
        idleTimeoutMs: this.config.idleTimeoutMs
      }
    };
  }
}

// HTTP connection pool for fetch requests
export class HTTPConnectionPool {
  private static instance: HTTPConnectionPool;
  private agentPool: ConnectionPool<unknown> | null = null;

  static getInstance(): HTTPConnectionPool {
    if (!HTTPConnectionPool.instance) {
      HTTPConnectionPool.instance = new HTTPConnectionPool();
    }
    return HTTPConnectionPool.instance;
  }

  // Initialize HTTP connection pooling (Node.js only)
  async initialize(): Promise<void> {
    if (typeof window !== 'undefined') {
      // Browser environment - use native fetch connection pooling
      return;
    }

    try {
      // Dynamic import for Node.js-specific modules
      const https = await import('https');
      const http = await import('http');

      // Create HTTP/HTTPS agents with connection pooling
      const httpsAgent = new https.Agent({
        keepAlive: true,
        keepAliveMsecs: 30000,
        maxSockets: 50,
        maxFreeSockets: 10,
        timeout: 30000,
      });

      const httpAgent = new http.Agent({
        keepAlive: true,
        keepAliveMsecs: 30000,
        maxSockets: 50,
        maxFreeSockets: 10,
        timeout: 30000,
      });

      // Store agents for reuse with proper typing
      interface HttpAgents {
        http: import('http').Agent;
        https: import('https').Agent;
      }

      (globalThis as Record<string, unknown>).__httpAgents = {
        http: httpAgent,
        https: httpsAgent
      } as unknown as HttpAgents;

      logger.info('HTTP connection pool initialized');
    } catch (error) {
      logger.error('Failed to initialize HTTP connection pool:', error as Record<string, unknown>);
    }
  }

  // Get fetch options with connection pooling
  getFetchOptions(url: string): RequestInit {
    if (typeof window !== 'undefined') {
      // Browser environment
      return {};
    }

    // Node.js environment
    const agents = (globalThis as Record<string, unknown>).__httpAgents as { http: typeof import('http').Agent; https: typeof import('https').Agent } | undefined;
    if (!agents) {
      return {};
    }

    const isHttps = url.startsWith('https:');
    return {
      // @ts-ignore - Node.js specific property
      agent: isHttps ? agents.https : agents.http
    };
  }

  async destroy(): Promise<void> {
    const agents = (globalThis as Record<string, unknown>).__httpAgents as { http: typeof import('http').Agent; https: typeof import('https').Agent } | undefined;
    if (agents) {
      // Close agents instead of destroying them
      if (agents.http && typeof (agents.http as unknown as { close?: () => void }).close === 'function') {
        (agents.http as unknown as { close: () => void }).close();
      }
      if (agents.https && typeof (agents.https as unknown as { close?: () => void }).close === 'function') {
        (agents.https as unknown as { close: () => void }).close();
      }
      delete (globalThis as Record<string, unknown>).__httpAgents;
    }

    if (this.agentPool) {
      await this.agentPool.destroy();
      this.agentPool = null;
    }

    logger.info('HTTP connection pool destroyed');
  }
}

// Database connection pool (generic implementation)
export function createDatabasePool<T>(config: {
  createConnection: () => Promise<T>;
  destroyConnection?: (connection: T) => Promise<void>;
  validateConnection?: (connection: T) => Promise<boolean>;
  minConnections?: number;
  maxConnections?: number;
}): ConnectionPool<T> {
  return new ConnectionPool({
    minConnections: config.minConnections ?? 2,
    maxConnections: config.maxConnections ?? 10,
    acquireTimeoutMs: 30000,
    idleTimeoutMs: 300000,
    maxUsageCount: 1000,
    ...config
  });
}

// Global HTTP connection pool instance
export const httpPool = HTTPConnectionPool.getInstance();

// Initialize HTTP pool on import (Node.js only)
if (typeof window === 'undefined') {
  httpPool.initialize().catch(error => {
    logger.error('Failed to auto-initialize HTTP connection pool:', error as Record<string, unknown>);
  });
}

// Graceful shutdown (prevent duplicate listeners)
if (typeof process !== 'undefined') {
  // Increase max listeners to prevent warnings during hot reloading
  if (process.getMaxListeners() < 50) {
    process.setMaxListeners(50);
  }

  const cleanup = async () => {
    await httpPool.destroy();
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('beforeExit', cleanup);
}

const connectionPoolModule = {
  ConnectionPool,
  HTTPConnectionPool,
  createDatabasePool,
  httpPool,
};

export default connectionPoolModule;
