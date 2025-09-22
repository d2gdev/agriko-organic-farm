// Comprehensive Monitoring and Observability System
import { logger } from '@/lib/logger';
import { config } from '@/lib/unified-config';

// Metrics types and interfaces
export interface MetricValue {
  value: number;
  timestamp: number;
  labels?: Record<string, string>;
}

export interface DatabaseMetrics {
  connectionPoolSize: number;
  activeConnections: number;
  queriesPerSecond: number;
  averageQueryTime: number;
  slowQueries: number;
  errorRate: number;
  lastError?: string;
  uptime: number;
}

export interface SyncMetrics {
  totalEvents: number;
  successfulSyncs: number;
  failedSyncs: number;
  averageProcessingTime: number;
  queueSize: number;
  throughputPerMinute: number;
  lastSyncTimestamp: number;
  errorsByType: Record<string, number>;
}

export interface SystemHealthMetrics {
  cpu: number;
  memory: number;
  disk: number;
  networkLatency: number;
  uptime: number;
  version: string;
}

export interface AlertThreshold {
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  value: number;
  windowMs: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

// Monitoring class
class MonitoringSystem {
  private metrics: Map<string, MetricValue[]> = new Map();
  private alerts: AlertThreshold[] = [];
  private alertSubscribers: Array<(alert: TriggeredAlert) => Promise<void>> = [];
  private metricsBuffer: MetricValue[] = [];
  private bufferFlushInterval: NodeJS.Timeout | null = null;
  private startTime: number = Date.now();

  constructor() {
    this.initializeDefaultAlerts();
    this.startBufferFlushing();
  }

  // Metric collection methods
  recordMetric(name: string, value: number, labels?: Record<string, string>): void {
    const metric: MetricValue = {
      value,
      timestamp: Date.now(),
      labels
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metricArray = this.metrics.get(name);
    if (!metricArray) return;
    metricArray.push(metric);

    // Keep only last 1000 metrics per type
    if (metricArray.length > 1000) {
      metricArray.splice(0, metricArray.length - 1000);
    }

    // Add to buffer for batch processing
    this.metricsBuffer.push({ ...metric, labels: { ...labels, metric: name } });

    // Check alerts for this metric
    this.checkAlerts(name, value);
  }

  // Database monitoring
  async monitorDatabasePerformance(dbName: string, operation: string, executionTime: number, success: boolean): Promise<void> {
    this.recordMetric(`db.${dbName}.query_time`, executionTime, { operation });
    this.recordMetric(`db.${dbName}.queries_total`, 1, { operation, status: success ? 'success' : 'error' });

    if (!success) {
      this.recordMetric(`db.${dbName}.errors_total`, 1, { operation });
    }

    // Record slow queries (> 1000ms)
    if (executionTime > 1000) {
      this.recordMetric(`db.${dbName}.slow_queries_total`, 1, { operation });
      logger.warn(`Slow database query detected: ${dbName}.${operation} took ${executionTime}ms`);
    }
  }

  // Sync operation monitoring
  monitorSyncOperation(operation: string, processingTime: number, success: boolean, eventCount: number = 1): void {
    this.recordMetric('sync.processing_time', processingTime, { operation });
    this.recordMetric('sync.events_total', eventCount, { operation, status: success ? 'success' : 'error' });

    if (!success) {
      this.recordMetric('sync.errors_total', 1, { operation });
    }

    // Monitor queue performance
    this.recordMetric('sync.throughput', eventCount, { operation });
  }

  // API endpoint monitoring
  monitorAPIEndpoint(endpoint: string, method: string, statusCode: number, responseTime: number): void {
    this.recordMetric('api.response_time', responseTime, { endpoint, method });
    this.recordMetric('api.requests_total', 1, { endpoint, method, status: statusCode.toString() });

    if (statusCode >= 400) {
      this.recordMetric('api.errors_total', 1, { endpoint, method, status: statusCode.toString() });
    }

    // Monitor slow API responses (> 2000ms)
    if (responseTime > 2000) {
      this.recordMetric('api.slow_requests_total', 1, { endpoint, method });
      logger.warn(`Slow API response: ${method} ${endpoint} took ${responseTime}ms`);
    }
  }

  // System resource monitoring
  async monitorSystemResources(): Promise<SystemHealthMetrics> {
    const metrics: SystemHealthMetrics = {
      cpu: await this.getCpuUsage(),
      memory: await this.getMemoryUsage(),
      disk: await this.getDiskUsage(),
      networkLatency: await this.getNetworkLatency(),
      uptime: Date.now() - this.startTime,
      version: process.env.npm_package_version || '1.0.0'
    };

    this.recordMetric('system.cpu_usage', metrics.cpu);
    this.recordMetric('system.memory_usage', metrics.memory);
    this.recordMetric('system.disk_usage', metrics.disk);
    this.recordMetric('system.network_latency', metrics.networkLatency);

    return metrics;
  }

  // Get aggregated metrics
  getDatabaseMetrics(dbName: string): DatabaseMetrics {
    const queryTimes = this.getMetricValues(`db.${dbName}.query_time`);
    const queries = this.getMetricValues(`db.${dbName}.queries_total`);
    const errors = this.getMetricValues(`db.${dbName}.errors_total`);
    const slowQueries = this.getMetricValues(`db.${dbName}.slow_queries_total`);

    return {
      connectionPoolSize: 10, // Would get from actual connection pool
      activeConnections: 5, // Would get from actual connection pool
      queriesPerSecond: this.calculateRate(queries, 60000),
      averageQueryTime: this.calculateAverage(queryTimes),
      slowQueries: this.sumMetricValues(slowQueries),
      errorRate: queries.length > 0 ? (this.sumMetricValues(errors) / this.sumMetricValues(queries)) * 100 : 0,
      uptime: Date.now() - this.startTime
    };
  }

  getSyncMetrics(): SyncMetrics {
    const processingTimes = this.getMetricValues('sync.processing_time');
    const events = this.getMetricValues('sync.events_total');
    const errors = this.getMetricValues('sync.errors_total');
    const throughput = this.getMetricValues('sync.throughput');

    const errorsByType: Record<string, number> = {};
    errors.forEach(metric => {
      const operation = metric.labels?.operation || 'unknown';
      errorsByType[operation] = (errorsByType[operation] || 0) + metric.value;
    });

    return {
      totalEvents: this.sumMetricValues(events),
      successfulSyncs: this.sumMetricValues(events) - this.sumMetricValues(errors),
      failedSyncs: this.sumMetricValues(errors),
      averageProcessingTime: this.calculateAverage(processingTimes),
      queueSize: 0, // Would get from actual queue
      throughputPerMinute: this.calculateRate(throughput, 60000),
      lastSyncTimestamp: Math.max(...events.map(e => e.timestamp), 0),
      errorsByType
    };
  }

  // Alert system
  addAlert(threshold: AlertThreshold): void {
    this.alerts.push(threshold);
  }

  subscribeToAlerts(callback: (alert: TriggeredAlert) => Promise<void>): void {
    this.alertSubscribers.push(callback);
  }

  private checkAlerts(metricName: string, value: number): void {
    const relevantAlerts = this.alerts.filter(alert => alert.metric === metricName);

    for (const alert of relevantAlerts) {
      if (this.shouldTriggerAlert(alert, value)) {
        this.triggerAlert(alert, value);
      }
    }
  }

  private shouldTriggerAlert(alert: AlertThreshold, value: number): boolean {
    switch (alert.operator) {
      case 'gt': return value > alert.value;
      case 'gte': return value >= alert.value;
      case 'lt': return value < alert.value;
      case 'lte': return value <= alert.value;
      case 'eq': return value === alert.value;
      default: return false;
    }
  }

  private async triggerAlert(threshold: AlertThreshold, currentValue: number): Promise<void> {
    const alert: TriggeredAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      threshold,
      currentValue,
      timestamp: Date.now(),
      description: threshold.description,
      severity: threshold.severity
    };

    logger.error(`Alert triggered: ${alert.description}`, {
      metric: threshold.metric,
      currentValue,
      threshold: threshold.value,
      severity: threshold.severity
    });

    // Notify all subscribers
    for (const subscriber of this.alertSubscribers) {
      try {
        await subscriber(alert);
      } catch (error) {
        logger.error('Alert subscriber failed:', error as Record<string, unknown>);
      }
    }
  }

  // Health check endpoint
  async getHealthStatus(): Promise<HealthStatus> {
    const dbMetrics = {
      memgraph: this.getDatabaseMetrics('memgraph'),
      qdrant: this.getDatabaseMetrics('qdrant'),
      analytics: this.getDatabaseMetrics('analytics')
    };

    const syncMetrics = this.getSyncMetrics();
    const systemMetrics = await this.monitorSystemResources();

    const isHealthy =
      dbMetrics.memgraph.errorRate < 5 &&
      dbMetrics.qdrant.errorRate < 5 &&
      syncMetrics.failedSyncs < (syncMetrics.totalEvents * 0.05) &&
      systemMetrics.cpu < 80 &&
      systemMetrics.memory < 80;

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: Date.now(),
      databases: dbMetrics,
      sync: syncMetrics,
      system: systemMetrics,
      alerts: this.getActiveAlerts()
    };
  }

  // Utility methods
  private getMetricValues(metricName: string): MetricValue[] {
    return this.metrics.get(metricName) || [];
  }

  private sumMetricValues(metrics: MetricValue[]): number {
    return metrics.reduce((sum, metric) => sum + metric.value, 0);
  }

  private calculateAverage(metrics: MetricValue[]): number {
    if (metrics.length === 0) return 0;
    return this.sumMetricValues(metrics) / metrics.length;
  }

  private calculateRate(metrics: MetricValue[], windowMs: number): number {
    const now = Date.now();
    const recentMetrics = metrics.filter(m => now - m.timestamp <= windowMs);
    return this.sumMetricValues(recentMetrics) / (windowMs / 1000); // per second
  }

  private getActiveAlerts(): TriggeredAlert[] {
    // Return recent alerts (last 24 hours)
    const _oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    return []; // Would store and return actual triggered alerts
  }

  // System resource monitoring implementations
  private async getCpuUsage(): Promise<number> {
    // Mock implementation - would use actual system monitoring
    return Math.random() * 100;
  }

  private async getMemoryUsage(): Promise<number> {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      return (usage.heapUsed / usage.heapTotal) * 100;
    }
    return 0;
  }

  private async getDiskUsage(): Promise<number> {
    // Mock implementation - would use actual disk monitoring
    return Math.random() * 100;
  }

  private async getNetworkLatency(): Promise<number> {
    // Mock implementation - would ping external service
    return Math.random() * 100;
  }

  // Initialize default alert thresholds
  private initializeDefaultAlerts(): void {
    const defaultAlerts: AlertThreshold[] = [
      {
        metric: 'db.memgraph.query_time',
        operator: 'gt',
        value: 5000,
        windowMs: 300000,
        severity: 'high',
        description: 'Memgraph query time exceeds 5 seconds'
      },
      {
        metric: 'db.qdrant.query_time',
        operator: 'gt',
        value: 3000,
        windowMs: 300000,
        severity: 'high',
        description: 'Qdrant query time exceeds 3 seconds'
      },
      {
        metric: 'sync.errors_total',
        operator: 'gt',
        value: 10,
        windowMs: 600000,
        severity: 'medium',
        description: 'More than 10 sync errors in 10 minutes'
      },
      {
        metric: 'api.errors_total',
        operator: 'gt',
        value: 50,
        windowMs: 300000,
        severity: 'high',
        description: 'More than 50 API errors in 5 minutes'
      },
      {
        metric: 'system.memory_usage',
        operator: 'gt',
        value: 85,
        windowMs: 60000,
        severity: 'critical',
        description: 'Memory usage exceeds 85%'
      }
    ];

    this.alerts.push(...defaultAlerts);
  }

  // Buffer flushing for batch processing
  private startBufferFlushing(): void {
    this.bufferFlushInterval = setInterval(() => {
      if (this.metricsBuffer.length > 0) {
        this.flushMetricsBuffer();
      }
    }, 30000); // Flush every 30 seconds
  }

  private flushMetricsBuffer(): void {
    if (this.metricsBuffer.length === 0) return;

    // Here you would send metrics to external monitoring service
    logger.debug(`Flushing ${this.metricsBuffer.length} metrics to monitoring service`);

    // Clear buffer
    this.metricsBuffer = [];
  }

  // Cleanup
  destroy(): void {
    if (this.bufferFlushInterval) {
      clearInterval(this.bufferFlushInterval);
    }
  }
}

// Types for external use
export interface TriggeredAlert {
  id: string;
  threshold: AlertThreshold;
  currentValue: number;
  timestamp: number;
  description: string;
  severity: string;
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: number;
  databases: Record<string, DatabaseMetrics>;
  sync: SyncMetrics;
  system: SystemHealthMetrics;
  alerts: TriggeredAlert[];
}

// Global monitoring instance
export const monitoring = new MonitoringSystem();

// Convenience functions for common monitoring tasks
export const monitorDatabaseQuery = (dbName: string, operation: string) => {
  const startTime = Date.now();

  return {
    finish: (success: boolean = true) => {
      const executionTime = Date.now() - startTime;
      monitoring.monitorDatabasePerformance(dbName, operation, executionTime, success);
      return executionTime;
    }
  };
};

export const monitorSyncEvent = (operation: string) => {
  const startTime = Date.now();

  return {
    finish: (success: boolean = true, eventCount: number = 1) => {
      const processingTime = Date.now() - startTime;
      monitoring.monitorSyncOperation(operation, processingTime, success, eventCount);
      return processingTime;
    }
  };
};

export const monitorAPICall = (endpoint: string, method: string) => {
  const startTime = Date.now();

  return {
    finish: (statusCode: number) => {
      const responseTime = Date.now() - startTime;
      monitoring.monitorAPIEndpoint(endpoint, method, statusCode, responseTime);
      return responseTime;
    }
  };
};

// Email/Slack alerting (would integrate with actual services)
export const setupAlertNotifications = () => {
  monitoring.subscribeToAlerts(async (alert: TriggeredAlert) => {
    // Email notification
    if (alert.severity === 'critical' || alert.severity === 'high') {
      await sendEmailAlert(alert);
    }

    // Slack notification
    if (config.features.enableSlackAlerts) {
      await sendSlackAlert(alert);
    }
  });
};

const sendEmailAlert = async (alert: TriggeredAlert): Promise<void> => {
  // Implementation would depend on email service
  logger.info(`Email alert would be sent: ${alert.description}`);
};

const sendSlackAlert = async (alert: TriggeredAlert): Promise<void> => {
  // Implementation would depend on Slack webhook
  logger.info(`Slack alert would be sent: ${alert.description}`);
};

export default monitoring;