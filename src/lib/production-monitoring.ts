// Production Monitoring and Alerting System
// NOTE: Configuration only - monitoring setup without deployment

import { logger } from './logger';
import { memoryMonitor } from './memory-optimizer';

interface MonitoringConfig {
  enableHealthChecks: boolean;
  enablePerformanceMonitoring: boolean;
  enableErrorTracking: boolean;
  enableAlerts: boolean;
  alertThresholds: {
    memoryUsageMB: number;
    responseTimeMs: number;
    errorRate: number;
    cpuUsagePercent: number;
  };
  healthCheckInterval: number;
  metricsRetentionMs: number;
}

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'critical';
  timestamp: number;
  checks: {
    memory: { status: string; usageMB: number; limit: number };
    database: { status: string; connections: number; responseTime: number };
    redis: { status: string; connected: boolean; memory: string };
    api: { status: string; averageResponseTime: number; errorRate: number };
  };
  uptime: number;
  version: string;
}

interface Alert {
  id: string;
  type: 'memory' | 'performance' | 'error' | 'database' | 'security';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: number;
  metadata: Record<string, unknown>;
  resolved: boolean;
}

class ProductionMonitoringService {
  private config: MonitoringConfig;
  private alerts: Alert[] = [];
  private metrics: Map<string, number[]> = new Map();
  private healthCheckTimer: NodeJS.Timeout | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private startTime: number;

  constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = {
      enableHealthChecks: config.enableHealthChecks ?? true,
      enablePerformanceMonitoring: config.enablePerformanceMonitoring ?? true,
      enableErrorTracking: config.enableErrorTracking ?? true,
      enableAlerts: config.enableAlerts ?? true,
      alertThresholds: {
        memoryUsageMB: config.alertThresholds?.memoryUsageMB ?? 45,
        responseTimeMs: config.alertThresholds?.responseTimeMs ?? 1000,
        errorRate: config.alertThresholds?.errorRate ?? 0.05, // 5%
        cpuUsagePercent: config.alertThresholds?.cpuUsagePercent ?? 80,
        ...config.alertThresholds
      },
      healthCheckInterval: config.healthCheckInterval ?? 30000, // 30 seconds
      metricsRetentionMs: config.metricsRetentionMs ?? 3600000, // 1 hour
    };

    this.startTime = Date.now();
    this.initializeMonitoring();
  }

  private initializeMonitoring(): void {
    if (this.config.enableHealthChecks) {
      this.startHealthChecks();
    }

    // Set up cleanup for old metrics
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldMetrics();
    }, 300000); // Every 5 minutes
  }

  private startHealthChecks(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    this.healthCheckTimer = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        logger.error('Health check failed:', error as Record<string, unknown>);
      }
    }, this.config.healthCheckInterval);
  }

  async performHealthCheck(): Promise<SystemHealth> {
    const timestamp = Date.now();

    // Memory check
    const memoryStats = memoryMonitor.getStats();
    const currentMemory = memoryStats?.current?.heapUsed || 0;
    const memoryMB = Math.round(currentMemory / 1024 / 1024);

    // Database health check
    const dbHealth = await this.checkDatabaseHealth();

    // Redis health check
    const redisHealth = await this.checkRedisHealth();

    // API performance check
    const apiHealth = this.getAPIHealthMetrics();

    const health: SystemHealth = {
      status: this.calculateOverallStatus(memoryMB, dbHealth, redisHealth, apiHealth),
      timestamp,
      checks: {
        memory: {
          status: memoryMB > this.config.alertThresholds.memoryUsageMB ? 'warning' : 'ok',
          usageMB: memoryMB,
          limit: this.config.alertThresholds.memoryUsageMB
        },
        database: dbHealth,
        redis: redisHealth,
        api: apiHealth
      },
      uptime: timestamp - this.startTime,
      version: process.env.npm_package_version || '1.0.0'
    };

    // Check for alert conditions
    if (this.config.enableAlerts) {
      await this.checkAlertConditions(health);
    }

    // Record metrics
    this.recordMetric('memory.usage', memoryMB);
    this.recordMetric('api.response_time', apiHealth.averageResponseTime);
    this.recordMetric('api.error_rate', apiHealth.errorRate);

    return health;
  }

  private async checkDatabaseHealth(): Promise<any> {
    // This would normally check actual database connections
    // For now, return a mock healthy status
    return {
      status: 'ok',
      connections: 5,
      responseTime: 25
    };

    // TODO: Add real database health check with proper error handling
    // } catch (error) {
    //   return {
    //     status: 'error',
    //     connections: 0,
    //     responseTime: -1,
    //     error: error instanceof Error ? error.message : 'Unknown error'
    //   };
    // }
  }

  private async checkRedisHealth(): Promise<any> {
    // This would normally check Redis connection
    // For now, return a mock healthy status
    return {
      status: 'ok',
      connected: true,
      memory: '10MB'
    };

    // TODO: Add real Redis health check with proper error handling
    // } catch (error) {
    //   return {
    //     status: 'error',
    //     connected: false,
    //     memory: 'unknown',
    //     error: error instanceof Error ? error.message : 'Unknown error'
    //   };
    // }
  }

  private getAPIHealthMetrics(): any {
    const responseTimeMetrics = this.metrics.get('api.response_time') || [];
    const errorRateMetrics = this.metrics.get('api.error_rate') || [];

    const avgResponseTime = responseTimeMetrics.length > 0
      ? responseTimeMetrics.reduce((a, b) => a + b, 0) / responseTimeMetrics.length
      : 0;

    const avgErrorRate = errorRateMetrics.length > 0
      ? errorRateMetrics.reduce((a, b) => a + b, 0) / errorRateMetrics.length
      : 0;

    return {
      status: avgResponseTime > this.config.alertThresholds.responseTimeMs ? 'warning' : 'ok',
      averageResponseTime: Math.round(avgResponseTime),
      errorRate: parseFloat(avgErrorRate.toFixed(4))
    };
  }

  private calculateOverallStatus(
    memoryMB: number,
    dbHealth: any,
    redisHealth: any,
    apiHealth: any
  ): 'healthy' | 'degraded' | 'critical' {
    const issues = [
      memoryMB > this.config.alertThresholds.memoryUsageMB,
      dbHealth.status === 'error',
      redisHealth.status === 'error',
      apiHealth.averageResponseTime > this.config.alertThresholds.responseTimeMs
    ];

    const criticalIssues = [
      dbHealth.status === 'error',
      memoryMB > this.config.alertThresholds.memoryUsageMB * 1.2
    ];

    if (criticalIssues.some(Boolean)) return 'critical';
    if (issues.some(Boolean)) return 'degraded';
    return 'healthy';
  }

  private async checkAlertConditions(health: SystemHealth): Promise<void> {
    // Memory alert
    if (health.checks.memory.usageMB > this.config.alertThresholds.memoryUsageMB) {
      await this.createAlert({
        type: 'memory',
        severity: health.checks.memory.usageMB > this.config.alertThresholds.memoryUsageMB * 1.2 ? 'critical' : 'high',
        message: `High memory usage: ${health.checks.memory.usageMB}MB (limit: ${this.config.alertThresholds.memoryUsageMB}MB)`,
        metadata: { currentUsage: health.checks.memory.usageMB, limit: this.config.alertThresholds.memoryUsageMB }
      });
    }

    // API performance alert
    if (health.checks.api.averageResponseTime > this.config.alertThresholds.responseTimeMs) {
      await this.createAlert({
        type: 'performance',
        severity: 'medium',
        message: `Slow API response: ${health.checks.api.averageResponseTime}ms (threshold: ${this.config.alertThresholds.responseTimeMs}ms)`,
        metadata: { responseTime: health.checks.api.averageResponseTime, threshold: this.config.alertThresholds.responseTimeMs }
      });
    }

    // Database alert
    if (health.checks.database.status === 'error') {
      await this.createAlert({
        type: 'database',
        severity: 'critical',
        message: 'Database connectivity issues detected',
        metadata: health.checks.database
      });
    }
  }

  private async createAlert(alertData: Omit<Alert, 'id' | 'timestamp' | 'resolved'>): Promise<void> {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      resolved: false,
      ...alertData
    };

    this.alerts.push(alert);

    // Log the alert
    logger.error(`ALERT [${alert.severity.toUpperCase()}]: ${alert.message}`, alert.metadata);

    // In production, this would send notifications (email, Slack, PagerDuty, etc.)
    await this.sendAlertNotification(alert);

    // Keep only recent alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-50);
    }
  }

  private async sendAlertNotification(alert: Alert): Promise<void> {
    // In production, implement actual notification sending
    // For now, just log it
    logger.warn(`Alert notification would be sent: ${alert.type} - ${alert.severity} - ${alert.message}`);

    // Example notification implementations:
    // await this.sendSlackAlert(alert);
    // await this.sendEmailAlert(alert);
    // await this.sendPagerDutyAlert(alert);
  }

  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const values = this.metrics.get(name);
    if (!values) return;
    values.push(value);

    // Keep only recent values
    if (values.length > 100) {
      values.splice(0, values.length - 50);
    }
  }

  recordError(error: Error, context?: string): void {
    if (!this.config.enableErrorTracking) return;

    const errorData = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: Date.now()
    };

    logger.error('Application error recorded:', errorData);

    // Record error rate metric
    this.recordMetric('errors.count', 1);

    // Create alert for critical errors
    if (context === 'critical') {
      this.createAlert({
        type: 'error',
        severity: 'high',
        message: `Critical error: ${error.message}`,
        metadata: errorData
      });
    }
  }

  recordPerformanceMetric(name: string, value: number, unit = 'ms'): void {
    if (!this.config.enablePerformanceMonitoring) return;

    this.recordMetric(`performance.${name}`, value);

    logger.debug(`Performance metric: ${name} = ${value}${unit}`);
  }

  private cleanupOldMetrics(): void {
    const cutoff = Date.now() - this.config.metricsRetentionMs;

    // Clean up old alerts
    this.alerts = this.alerts.filter(alert => alert.timestamp > cutoff);

    logger.debug(`Cleaned up old monitoring data. Current alerts: ${this.alerts.length}`);
  }

  getSystemStatus(): SystemHealth | null {
    // This would return the latest health check result
    // For now, return null if no health check has been performed
    return null;
  }

  getRecentAlerts(limit = 10): Alert[] {
    return this.alerts
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  getMetrics(name: string): number[] {
    return this.metrics.get(name) || [];
  }

  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      logger.info(`Alert resolved: ${alertId}`);
    }
  }

  destroy(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    this.alerts = [];
    this.metrics.clear();

    logger.info('Monitoring service destroyed');
  }
}

// Create global monitoring instance
export const productionMonitoring = new ProductionMonitoringService({
  enableHealthChecks: process.env.NODE_ENV === 'production',
  enablePerformanceMonitoring: true,
  enableErrorTracking: true,
  enableAlerts: process.env.NODE_ENV === 'production',
  alertThresholds: {
    memoryUsageMB: parseInt(process.env.MEMORY_WARNING_THRESHOLD_MB || '45'),
    responseTimeMs: parseInt(process.env.PERFORMANCE_THRESHOLD_MS || '1000'),
    errorRate: 0.05,
    cpuUsagePercent: 80
  }
});

// Export health check endpoint handler
export async function healthCheckHandler(): Promise<Response> {
  try {
    const health = await productionMonitoring.performHealthCheck();

    const statusCode = health.status === 'healthy' ? 200 :
                      health.status === 'degraded' ? 200 : 503;

    return new Response(JSON.stringify(health), {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    logger.error('Health check endpoint error:', error as Record<string, unknown>);

    return new Response(JSON.stringify({
      status: 'critical',
      error: 'Health check failed',
      timestamp: Date.now()
    }), {
      status: 503,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

// Performance monitoring middleware
export function performanceMiddleware(name: string) {
  return function <_T extends (...args: any[]) => any>(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();

      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - startTime;

        productionMonitoring.recordPerformanceMetric(`${name}.${propertyKey}`, duration);

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        productionMonitoring.recordPerformanceMetric(`${name}.${propertyKey}.error`, duration);
        productionMonitoring.recordError(error as Error, name);
        throw error;
      }
    };

    return descriptor;
  };
}

// Graceful shutdown handler
const cleanup = () => {
  logger.info('🧹 Cleaning up production monitoring...');
  productionMonitoring.destroy();
};

// Register cleanup handlers
if (typeof process !== 'undefined') {
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('beforeExit', cleanup);
}