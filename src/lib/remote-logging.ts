import { logger as localLogger } from './logger';

// Remote logging configuration
interface RemoteLoggingConfig {
  enabled: boolean;
  endpoints: {
    webhook?: string;
    datadog?: {
      apiKey: string;
      site?: string; // e.g., 'datadoghq.com'
    };
    splunk?: {
      url: string;
      token: string;
    };
    elasticsearch?: {
      url: string;
      index: string;
      apiKey?: string;
    };
    custom?: {
      url: string;
      headers: Record<string, string>;
    };
  };
  batchSize: number;
  flushInterval: number; // milliseconds
  retryAttempts: number;
  retryDelay: number; // milliseconds
  enabledLevels: ('debug' | 'info' | 'warn' | 'error')[];
  bufferLimit: number;
}

// Log entry for remote transmission
interface RemoteLogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  data?: Record<string, unknown>;
  context?: string;
  service: string;
  version: string;
  environment: string;
  hostname: string;
  pid: number;
  requestId?: string;
  userId?: string;
  sessionId?: string;
  tags?: string[];
}

/**
 * Remote logging service for production monitoring
 */
export class RemoteLoggingService {
  private static instance: RemoteLoggingService;
  private config: RemoteLoggingConfig;
  private buffer: RemoteLogEntry[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private isShuttingDown = false;
  private readonly serviceName = 'agriko-ecommerce';
  private readonly serviceVersion = process.env.npm_package_version ?? '1.0.0';
  private readonly environment = process.env.NODE_ENV ?? 'development';
  private readonly hostname = process.env.HOSTNAME ?? 'localhost';

  private constructor() {
    this.config = this.loadConfig();
    this.startFlushTimer();
    this.setupShutdownHandlers();
  }

  static getInstance(): RemoteLoggingService {
    if (!RemoteLoggingService.instance) {
      RemoteLoggingService.instance = new RemoteLoggingService();
    }
    return RemoteLoggingService.instance;
  }

  /**
   * Load remote logging configuration
   */
  private loadConfig(): RemoteLoggingConfig {
    return {
      enabled: process.env.ENABLE_REMOTE_LOGGING === 'true',
      endpoints: {
        webhook: process.env.LOGGING_WEBHOOK_URL,
        datadog: process.env.DATADOG_API_KEY ? {
          apiKey: process.env.DATADOG_API_KEY,
          site: process.env.DATADOG_SITE ?? 'datadoghq.com'
        } : undefined,
        splunk: process.env.SPLUNK_URL && process.env.SPLUNK_TOKEN ? {
          url: process.env.SPLUNK_URL,
          token: process.env.SPLUNK_TOKEN
        } : undefined,
        elasticsearch: process.env.ELASTICSEARCH_URL ? {
          url: process.env.ELASTICSEARCH_URL,
          index: process.env.ELASTICSEARCH_INDEX ?? 'agriko-logs',
          apiKey: process.env.ELASTICSEARCH_API_KEY
        } : undefined,
        custom: process.env.CUSTOM_LOGGING_URL ? {
          url: process.env.CUSTOM_LOGGING_URL,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': process.env.CUSTOM_LOGGING_AUTH ?? ''
          }
        } : undefined
      },
      batchSize: parseInt(process.env.LOGGING_BATCH_SIZE ?? '10'),
      flushInterval: parseInt(process.env.LOGGING_FLUSH_INTERVAL ?? '30000'), // 30 seconds
      retryAttempts: parseInt(process.env.LOGGING_RETRY_ATTEMPTS ?? '3'),
      retryDelay: parseInt(process.env.LOGGING_RETRY_DELAY ?? '5000'), // 5 seconds
      enabledLevels: (process.env.REMOTE_LOG_LEVELS ?? 'warn,error').split(',') as ('debug' | 'info' | 'warn' | 'error')[],
      bufferLimit: parseInt(process.env.LOGGING_BUFFER_LIMIT ?? '1000')
    };
  }

  /**
   * Log a message remotely
   */
  async log(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    data?: Record<string, unknown>,
    context?: string,
    metadata?: {
      requestId?: string;
      userId?: string;
      sessionId?: string;
      tags?: string[];
    }
  ): Promise<void> {
    if (!this.config.enabled || !this.config.enabledLevels.includes(level)) {
      return;
    }

    const entry: RemoteLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data: this.sanitizeData(data),
      context,
      service: this.serviceName,
      version: this.serviceVersion,
      environment: this.environment,
      hostname: this.hostname,
      pid: process.pid,
      requestId: metadata?.requestId,
      userId: metadata?.userId,
      sessionId: metadata?.sessionId,
      tags: metadata?.tags
    };

    await this.addToBuffer(entry);
  }

  /**
   * Add log entry to buffer and manage buffer size
   */
  private async addToBuffer(entry: RemoteLogEntry): Promise<void> {
    this.buffer.push(entry);

    // Prevent buffer overflow
    if (this.buffer.length > this.config.bufferLimit) {
      const excessLogs = this.buffer.length - this.config.bufferLimit;
      this.buffer.splice(0, excessLogs);
      localLogger.warn(`Remote logging buffer overflow, dropped ${excessLogs} log entries`);
    }

    // Flush immediately if buffer is full or if it's an error level
    if (this.buffer.length >= this.config.batchSize || entry.level === 'error') {
      await this.flush();
    }
  }

  /**
   * Sanitize data to remove sensitive information
   */
  private sanitizeData(data?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!data) return data;

    const sanitized = { ...data };
    const sensitiveKeys = [
      'password', 'token', 'secret', 'key', 'auth', 'authorization',
      'cookie', 'session', 'jwt', 'apikey', 'api_key', 'private'
    ];

    const sanitizeObject = (obj: unknown): Record<string, unknown> => {
      if (obj === null || obj === undefined) {
        return {};
      }
      
      if (typeof obj === 'object') {
        if (Array.isArray(obj)) {
          // For arrays, we create an object with indexed keys
          const result: Record<string, unknown> = {};
          obj.forEach((item, index) => {
            result[index.toString()] = sanitizeObject(item);
          });
          return result;
        }
        
        const result: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj)) {
          const lowerKey = key.toLowerCase();
          if (sensitiveKeys.some(sensitiveKey => lowerKey.includes(sensitiveKey))) {
            result[key] = '[REDACTED]';
          } else if (typeof value === 'object' && value !== null) {
            result[key] = sanitizeObject(value);
          } else {
            result[key] = value;
          }
        }
        return result;
      }
      
      // For primitive values, wrap in an object
      return { value: obj };
    };

    return sanitizeObject(sanitized);
  }

  /**
   * Flush buffered logs to remote endpoints
   */
  private async flush(): Promise<void> {
    if (this.buffer.length === 0 || this.isShuttingDown) {
      return;
    }

    const logsToSend = [...this.buffer];
    this.buffer = [];

    // Send to all configured endpoints
    const sendPromises: Promise<void>[] = [];

    if (this.config.endpoints.webhook) {
      sendPromises.push(this.sendToWebhook(this.config.endpoints.webhook, logsToSend));
    }

    if (this.config.endpoints.datadog) {
      sendPromises.push(this.sendToDatadog({
        apiKey: this.config.endpoints.datadog.apiKey,
        site: this.config.endpoints.datadog?.site ?? 'datadoghq.com'
      }, logsToSend));
    }

    if (this.config.endpoints.splunk) {
      sendPromises.push(this.sendToSplunk(this.config.endpoints.splunk, logsToSend));
    }

    if (this.config.endpoints.elasticsearch) {
      sendPromises.push(this.sendToElasticsearch(this.config.endpoints.elasticsearch, logsToSend));
    }

    if (this.config.endpoints.custom) {
      sendPromises.push(this.sendToCustom(this.config.endpoints.custom, logsToSend));
    }

    // Wait for all sends to complete
    const results = await Promise.allSettled(sendPromises);
    
    // Log any failures locally
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        localLogger.error(`Remote logging failed for endpoint ${index}:`, result.reason);
      }
    });
  }

  /**
   * Send logs to webhook endpoint
   */
  private async sendToWebhook(url: string, logs: RemoteLogEntry[]): Promise<void> {
    await this.sendWithRetry(async () => {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs })
      });

      if (!response.ok) {
        throw new Error(`Webhook logging failed: ${response.status} ${response.statusText}`);
      }
    });
  }

  /**
   * Send logs to Datadog
   */
  private async sendToDatadog(config: { apiKey: string; site: string }, logs: RemoteLogEntry[]): Promise<void> {
    await this.sendWithRetry(async () => {
      const url = `https://http-intake.logs.${config.site}/v1/input/${config.apiKey}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logs.map(log => ({
          timestamp: log.timestamp,
          level: log.level,
          message: log.message,
          service: log.service,
          hostname: log.hostname,
          ...log.data
        })))
      });

      if (!response.ok) {
        throw new Error(`Datadog logging failed: ${response.status} ${response.statusText}`);
      }
    });
  }

  /**
   * Send logs to Splunk HEC
   */
  private async sendToSplunk(config: { url: string; token: string }, logs: RemoteLogEntry[]): Promise<void> {
    await this.sendWithRetry(async () => {
      const response = await fetch(`${config.url}/services/collector`, {
        method: 'POST',
        headers: {
          'Authorization': `Splunk ${config.token}`,
          'Content-Type': 'application/json'
        },
        body: logs.map(log => JSON.stringify({
          time: Math.floor(new Date(log.timestamp).getTime() / 1000),
          event: log
        })).join('\n')
      });

      if (!response.ok) {
        throw new Error(`Splunk logging failed: ${response.status} ${response.statusText}`);
      }
    });
  }

  /**
   * Send logs to Elasticsearch
   */
  private async sendToElasticsearch(
    config: { url: string; index: string; apiKey?: string }, 
    logs: RemoteLogEntry[]
  ): Promise<void> {
    await this.sendWithRetry(async () => {
      const headers: Record<string, string> = { 'Content-Type': 'application/x-ndjson' };
      if (config.apiKey) {
        headers['Authorization'] = `ApiKey ${config.apiKey}`;
      }

      const body = logs.map(log => 
        JSON.stringify({ index: { _index: config.index } }) + '\n' +
        JSON.stringify(log)
      ).join('\n') + '\n';

      const response = await fetch(`${config.url}/_bulk`, {
        method: 'POST',
        headers,
        body
      });

      if (!response.ok) {
        throw new Error(`Elasticsearch logging failed: ${response.status} ${response.statusText}`);
      }
    });
  }

  /**
   * Send logs to custom endpoint
   */
  private async sendToCustom(
    config: { url: string; headers: Record<string, string> }, 
    logs: RemoteLogEntry[]
  ): Promise<void> {
    await this.sendWithRetry(async () => {
      const response = await fetch(config.url, {
        method: 'POST',
        headers: config.headers,
        body: JSON.stringify({ logs })
      });

      if (!response.ok) {
        throw new Error(`Custom logging failed: ${response.status} ${response.statusText}`);
      }
    });
  }

  /**
   * Send with retry logic
   */
  private async sendWithRetry(sendFn: () => Promise<void>): Promise<void> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
      try {
        await sendFn();
        return; // Success
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < this.config.retryAttempts - 1) {
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Start flush timer
   */
  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flush().catch(error => {
        localLogger.error('Scheduled flush failed:', error);
      });
    }, this.config.flushInterval);
  }

  /**
   * Setup graceful shutdown handlers
   */
  private setupShutdownHandlers(): void {
    const shutdown = async () => {
      this.isShuttingDown = true;
      
      if (this.flushTimer) {
        clearInterval(this.flushTimer);
        this.flushTimer = null;
      }
      
      // Flush remaining logs
      await this.flush();
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    process.on('beforeExit', shutdown);
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      enabled: this.config.enabled,
      bufferedLogs: this.buffer.length,
      bufferLimit: this.config.bufferLimit,
      endpoints: Object.keys(this.config.endpoints).filter(key => 
        this.config.endpoints[key as keyof typeof this.config.endpoints] !== undefined
      ),
      enabledLevels: this.config.enabledLevels
    };
  }
}

// Export singleton instance
export const remoteLogger = RemoteLoggingService.getInstance();

// Convenience functions
export const logRemote = (
  level: 'debug' | 'info' | 'warn' | 'error',
  message: string,
  data?: Record<string, unknown>,
  context?: string,
  metadata?: {
    requestId?: string;
    userId?: string;
    sessionId?: string;
    tags?: string[];
  }
) => remoteLogger.log(level, message, data, context, metadata);

export const logRemoteError = (
  message: string,
  error: unknown,
  context?: string,
  metadata?: { requestId?: string; userId?: string; sessionId?: string }
) => {
  const errorData = error instanceof Error ? {
    name: error.name,
    message: error.message,
    stack: error.stack
  } : { 
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined
  };

  return remoteLogger.log('error', message, errorData, context, metadata);
};

export const logRemoteWarn = (
  message: string,
  data?: Record<string, unknown>,
  context?: string,
  metadata?: { requestId?: string; userId?: string; sessionId?: string }
) => remoteLogger.log('warn', message, data, context, metadata);

export const getRemoteLoggingStatus = () => remoteLogger.getStatus();