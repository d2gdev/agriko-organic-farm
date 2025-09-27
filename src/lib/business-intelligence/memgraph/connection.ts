// Business Intelligence - Memgraph Database Connection
import neo4j, { Driver, Session, Result, ManagedTransaction } from 'neo4j-driver';
import { logger } from '@/lib/logger';

export class MemgraphBIConnection {
  private driver: Driver | null = null;
  private static instance: MemgraphBIConnection | null = null;

  private constructor() {
    this.initializeDriver();
  }

  public static getInstance(): MemgraphBIConnection {
    if (!MemgraphBIConnection.instance) {
      MemgraphBIConnection.instance = new MemgraphBIConnection();
    }
    return MemgraphBIConnection.instance;
  }

  private initializeDriver(): void {
    try {
      const memgraphUrl = process.env.MEMGRAPH_URL || 'bolt://143.42.189.57:7687';
      const memgraphUser = process.env.MEMGRAPH_USER || '';
      const memgraphPassword = process.env.MEMGRAPH_PASSWORD || '';

      this.driver = neo4j.driver(
        memgraphUrl,
        memgraphUser && memgraphPassword
          ? neo4j.auth.basic(memgraphUser, memgraphPassword)
          : undefined,
        {
          disableLosslessIntegers: true,
          connectionTimeout: 30000,
          maxConnectionLifetime: 3600000, // 1 hour
          maxConnectionPoolSize: 50,
          connectionAcquisitionTimeout: 30000,
        }
      );

      logger.info('Business Intelligence Memgraph driver initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Memgraph driver for BI:', error as Record<string, unknown>);
      throw error;
    }
  }

  public async getSession(): Promise<Session> {
    if (!this.driver) {
      throw new Error('Memgraph driver not initialized for Business Intelligence');
    }

    return this.driver.session({
      database: 'memgraph',
      defaultAccessMode: neo4j.session.WRITE,
    });
  }

  public async executeQuery(
    query: string,
    parameters: Record<string, unknown> = {}
  ): Promise<Result> {
    const session = await this.getSession();
    try {
      logger.debug('Executing BI Memgraph query:', {
        query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
        paramCount: Object.keys(parameters).length
      });

      const result = await session.run(query, parameters);

      logger.debug('BI Memgraph query executed successfully:', {
        recordCount: result.records.length
      });

      return result;
    } catch (error) {
      logger.error('BI Memgraph query failed:', {
        query,
        error: error as Record<string, unknown>
      });
      throw error;
    } finally {
      await session.close();
    }
  }

  public async executeTransaction<T>(
    work: (tx: ManagedTransaction) => Promise<T>
  ): Promise<T> {
    const session = await this.getSession();
    try {
      return await session.executeWrite(work);
    } catch (error) {
      logger.error('BI Memgraph transaction failed:', error as Record<string, unknown>);
      throw error;
    } finally {
      await session.close();
    }
  }

  public async testConnection(): Promise<boolean> {
    try {
      const result = await this.executeQuery('RETURN "BI Connection Test" as message');
      const success = result.records.length > 0;

      if (success) {
        logger.info('Business Intelligence Memgraph connection test successful');
      } else {
        logger.warn('Business Intelligence Memgraph connection test returned no records');
      }

      return success;
    } catch (error) {
      logger.error('Business Intelligence Memgraph connection test failed:', error as Record<string, unknown>);
      return false;
    }
  }

  public async close(): Promise<void> {
    if (this.driver) {
      await this.driver.close();
      this.driver = null;
      logger.info('Business Intelligence Memgraph driver closed');
    }
  }

  // Health check for monitoring
  public async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    details: {
      connected: boolean;
      responseTime: number;
      lastError?: string;
    };
  }> {
    const startTime = Date.now();

    try {
      const connected = await this.testConnection();
      const responseTime = Date.now() - startTime;

      return {
        status: connected ? 'healthy' : 'unhealthy',
        details: {
          connected,
          responseTime,
        },
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      return {
        status: 'unhealthy',
        details: {
          connected: false,
          responseTime,
          lastError: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }
}

// Export singleton instance
export const memgraphBI = MemgraphBIConnection.getInstance();