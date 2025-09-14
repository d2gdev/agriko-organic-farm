import { logger } from '@/lib/logger';
import { config } from '@/lib/unified-config';

// Monitoring types
export interface SystemMetrics {
  timestamp: number;
  memory: {
    used: number;
    free: number;
    total: number;
    utilization: number;
  };
  cpu: {
    usage: number;
    cores: number;
  };
  response: {
    averageTime: number;
    p95: number;
    p99: number;
  };
  requests: {
    total: number;
    successful: number;
    failed: number;
    rate: number;
  };
  cache: {
    hitRate: number;
    size: number;
    utilization: number;
  };
  database: {
    connections: number;
    queryTime: number;
    slowQueries: number;
  };
  errors: {
    rate: number;
    total: number;
    types: Record<string, number>;
  };
}

export interface AlertRule {
  id: string;
  name: string;
  condition: (metrics: SystemMetrics) => boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  cooldown: number; // Minimum time between alerts in ms
  message: string;
  enabled: boolean;
}

export interface Alert {
  id: string;
  ruleId: string;
  severity: AlertRule['severity'];
  message: string;
  timestamp: number;
  resolved?: number;
  metrics?: Partial<SystemMetrics>;
}

// Health check status
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: number;
  services: {
    database: { status: 'up' | 'down'; latency?: number };
    woocommerce: { status: 'up' | 'down'; latency?: number };
    cache: { status: 'up' | 'down'; hitRate?: number };
    external: { status: 'up' | 'down'; services: string[] };
  };
  uptime: number;
  version: string;
}

// Performance tracking
class PerformanceTracker {
  private requestTimes: number[] = [];
  private errorCounts = new Map<string, number>();
  private requestCounts = { total: 0, successful: 0, failed: 0 };
  private startTime = Date.now();
  
  trackRequest(responseTime: number, success: boolean, errorType?: string): void {
    // Keep only last 1000 request times for moving averages
    this.requestTimes.push(responseTime);
    if (this.requestTimes.length > 1000) {
      this.requestTimes.shift();
    }
    
    this.requestCounts.total++;
    if (success) {
      this.requestCounts.successful++;
    } else {
      this.requestCounts.failed++;
      if (errorType) {
        this.errorCounts.set(errorType, (this.errorCounts.get(errorType) ?? 0) + 1);
      }
    }
  }
  
  getMetrics(): Partial<SystemMetrics> {
    const sortedTimes = [...this.requestTimes].sort((a, b) => a - b);
    const total = sortedTimes.length;
    
    return {
      response: {
        averageTime: total > 0 ? sortedTimes.reduce((a, b) => a + b, 0) / total : 0,
        p95: total > 0 ? sortedTimes[Math.floor(total * 0.95)] ?? 0 : 0,
        p99: total > 0 ? sortedTimes[Math.floor(total * 0.99)] ?? 0 : 0,
      },
      requests: {
        ...this.requestCounts,
        rate: this.requestCounts.total / ((Date.now() - this.startTime) / 60000), // per minute
      },
      errors: {
        rate: this.requestCounts.failed / (this.requestCounts.total ?? 1),
        total: this.requestCounts.failed,
        types: Object.fromEntries(this.errorCounts),
      }
    };
  }
}

// Alert manager
class AlertManager {
  private alerts = new Map<string, Alert>();
  private lastAlertTimes = new Map<string, number>();
  private alertRules: AlertRule[] = [];
  
  constructor() {
    this.initializeDefaultRules();
  }
  
  private initializeDefaultRules(): void {
    this.alertRules = [
      {
        id: 'high-memory-usage',
        name: 'High Memory Usage',
        condition: (metrics) => metrics.memory.utilization > 85,
        severity: 'high',
        cooldown: 5 * 60 * 1000, // 5 minutes
        message: 'Memory usage is above 85%',
        enabled: true,
      },
      {
        id: 'high-error-rate',
        name: 'High Error Rate',
        condition: (metrics) => metrics.errors.rate > 0.05, // 5% error rate
        severity: 'critical',
        cooldown: 2 * 60 * 1000, // 2 minutes
        message: 'Error rate is above 5%',
        enabled: true,
      },
      {
        id: 'slow-response-time',
        name: 'Slow Response Time',
        condition: (metrics) => metrics.response.p95 > 2000, // 2 seconds
        severity: 'medium',
        cooldown: 10 * 60 * 1000, // 10 minutes
        message: '95th percentile response time is above 2 seconds',
        enabled: true,
      },
      {
        id: 'low-cache-hit-rate',
        name: 'Low Cache Hit Rate',
        condition: (metrics) => metrics.cache.hitRate < 0.7, // 70%
        severity: 'low',
        cooldown: 15 * 60 * 1000, // 15 minutes
        message: 'Cache hit rate is below 70%',
        enabled: true,
      },
      {
        id: 'database-slow-queries',
        name: 'Database Slow Queries',
        condition: (metrics) => metrics.database.slowQueries > 10,
        severity: 'medium',
        cooldown: 5 * 60 * 1000, // 5 minutes
        message: 'More than 10 slow database queries detected',
        enabled: true,
      },
      {
        id: 'high-cpu-usage',
        name: 'High CPU Usage',
        condition: (metrics) => metrics.cpu.usage > 80,
        severity: 'high',
        cooldown: 5 * 60 * 1000, // 5 minutes
        message: 'CPU usage is above 80%',
        enabled: true,
      }
    ];
  }
  
  checkAlerts(metrics: SystemMetrics): Alert[] {
    const triggeredAlerts: Alert[] = [];
    const now = Date.now();
    
    for (const rule of this.alertRules) {
      if (!rule.enabled) continue;
      
      const lastAlert = this.lastAlertTimes.get(rule.id);
      if (lastAlert && (now - lastAlert) < rule.cooldown) {
        continue; // Still in cooldown period
      }
      
      if (rule.condition(metrics)) {
        const alertId = `${rule.id}-${now}`;
        const alert: Alert = {
          id: alertId,
          ruleId: rule.id,
          severity: rule.severity,
          message: rule.message,
          timestamp: now,
          metrics: this.getRelevantMetrics(rule.id, metrics),
        };
        
        this.alerts.set(alertId, alert);
        this.lastAlertTimes.set(rule.id, now);
        triggeredAlerts.push(alert);
        
        logger.warn(`🚨 Alert triggered: ${rule.name}`, {
          alert,
          metrics: alert.metrics,
        });
      }
    }
    
    return triggeredAlerts;
  }
  
  private getRelevantMetrics(ruleId: string, metrics: SystemMetrics): Partial<SystemMetrics> {
    switch (ruleId) {
      case 'high-memory-usage':
        return { memory: metrics.memory };
      case 'high-error-rate':
        return { errors: metrics.errors, requests: metrics.requests };
      case 'slow-response-time':
        return { response: metrics.response };
      case 'low-cache-hit-rate':
        return { cache: metrics.cache };
      case 'database-slow-queries':
        return { database: metrics.database };
      case 'high-cpu-usage':
        return { cpu: metrics.cpu };
      default:
        return metrics;
    }
  }
  
  resolveAlert(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolved = Date.now();
      logger.info(`✅ Alert resolved: ${alertId}`);
    }
  }
  
  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
  }
  
  getAlertHistory(limit = 100): Alert[] {
    return Array.from(this.alerts.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }
}

// Main monitoring service
export class MonitoringService {
  private static instance: MonitoringService;
  private performanceTracker = new PerformanceTracker();
  private alertManager = new AlertManager();
  private metricsHistory: SystemMetrics[] = [];
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  
  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }
  
  start(intervalMs = 30000): void { // Default 30 seconds
    if (this.isRunning) return;
    
    this.isRunning = true;
    logger.info('📊 Starting monitoring service', { interval: intervalMs });
    
    this.intervalId = setInterval(async () => {
      try {
        const metrics = await this.collectMetrics();
        this.storeMetrics(metrics);
        
        const alerts = this.alertManager.checkAlerts(metrics);
        if (alerts.length > 0) {
          await this.handleAlerts(alerts);
        }
      } catch (error) {
        logger.error('Error in monitoring service:', { 
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
      }
    }, intervalMs);
  }
  
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    logger.info('📊 Monitoring service stopped');
  }
  
  private async collectMetrics(): Promise<SystemMetrics> {
    const now = Date.now();
    const performanceMetrics = this.performanceTracker.getMetrics();
    
    // Get system metrics (simplified for Node.js)
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      timestamp: now,
      memory: {
        used: memUsage.heapUsed,
        free: memUsage.heapTotal - memUsage.heapUsed,
        total: memUsage.heapTotal,
        utilization: (memUsage.heapUsed / memUsage.heapTotal) * 100,
      },
      cpu: {
        usage: (cpuUsage.user + cpuUsage.system) / 1000000, // Convert to seconds
        cores: await this.getCpuCoreCount(),
      },
      response: performanceMetrics.response ?? { averageTime: 0, p95: 0, p99: 0 },
      requests: performanceMetrics.requests ?? { total: 0, successful: 0, failed: 0, rate: 0 },
      cache: await this.getCacheMetrics(),
      database: await this.getDatabaseMetrics(),
      errors: performanceMetrics.errors ?? { rate: 0, total: 0, types: {} },
    };
  }
  
  private async getCacheMetrics(): Promise<SystemMetrics['cache']> {
    try {
      // Try to get cache stats from various cache instances
      const { productCacheSafe } = await import('./thread-safe-cache');
      const stats = productCacheSafe.getStats();
      
      return {
        hitRate: stats.averageAccessCount > 0 ? 0.8 : 0.5, // Estimated
        size: stats.size,
        utilization: stats.utilizationPercent,
      };
    } catch {
      return { hitRate: 0, size: 0, utilization: 0 };
    }
  }
  
  private async getCpuCoreCount(): Promise<number> {
    try {
      const os = await import('os');
      return os.cpus().length;
    } catch {
      return 1; // Fallback
    }
  }

  private async getDatabaseMetrics(): Promise<SystemMetrics['database']> {
    try {
      const { databaseMonitor } = await import('./database-monitor');
      const metrics = await databaseMonitor.getMetrics();
      
      return {
        connections: metrics.connections,
        queryTime: metrics.queryTime,
        slowQueries: metrics.slowQueries,
      };
    } catch (error) {
      logger.error('Failed to get database metrics:', { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      // Fallback to basic metrics if database monitor fails
      return {
        connections: 1,
        queryTime: 0,
        slowQueries: 0,
      };
    }
  }
  
  private storeMetrics(metrics: SystemMetrics): void {
    this.metricsHistory.push(metrics);
    
    // Keep only last 24 hours of metrics (assuming 30s intervals = 2880 entries)
    if (this.metricsHistory.length > 2880) {
      this.metricsHistory.shift();
    }
  }
  
  private async handleAlerts(alerts: Alert[]): Promise<void> {
    for (const alert of alerts) {
      // Log alert
      logger.warn(`🚨 Alert: ${alert.message}`, {
        severity: alert.severity,
        metrics: alert.metrics,
      });
      
      // Send to external monitoring service if configured
      if (config.monitoring.endpoint) {
        try {
          await this.sendAlertToExternal(alert);
        } catch (error) {
          logger.error('Failed to send alert to external service:', { 
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
          });
        }
      }
      
      // Auto-resolve certain types of alerts
      if (alert.severity === 'low') {
        setTimeout(() => {
          this.alertManager.resolveAlert(alert.id);
        }, 10 * 60 * 1000); // Auto-resolve low severity alerts after 10 minutes
      }
    }
  }
  
  private async sendAlertToExternal(alert: Alert): Promise<void> {
    if (!config.monitoring.endpoint) return;
    
    const response = await fetch(config.monitoring.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MONITORING_API_KEY ?? ''}`,
      },
      body: JSON.stringify({
        service: 'agriko-ecommerce',
        alert,
        timestamp: new Date().toISOString(),
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to send alert: ${response.statusText}`);
    }
  }
  
  // Public API methods
  trackRequest(responseTime: number, success: boolean, errorType?: string): void {
    this.performanceTracker.trackRequest(responseTime, success, errorType);
  }
  
  async getHealthStatus(): Promise<HealthStatus> {
    const services = await this.checkServices();
    const overallStatus = this.determineOverallHealth(services);
    
    return {
      status: overallStatus,
      timestamp: Date.now(),
      services,
      uptime: Date.now() - (process.uptime() * 1000),
      version: process.env.npm_package_version ?? '1.0.0',
    };
  }
  
  private async checkServices(): Promise<HealthStatus['services']> {
    const results: HealthStatus['services'] = {
      database: { status: 'down' },
      woocommerce: { status: 'down' },
      cache: { status: 'down' },
      external: { status: 'down', services: [] },
    };

    // Check database health
    try {
      const { getDatabaseHealth, databaseMonitor } = await import('./database-monitor');
      const isHealthy = await getDatabaseHealth();
      const connectionStatus = databaseMonitor.getConnectionStatus();
      
      results.database = {
        status: isHealthy ? 'up' : 'down',
        latency: Object.values(connectionStatus).find(c => c.connected)?.latency ?? -1
      };
    } catch (error) {
      logger.error('Database health check failed:', { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
    }
    
    // Check WooCommerce API
    try {
      const start = Date.now();
      const { getAllProducts } = await import('./woocommerce');
      await getAllProducts({ per_page: 1 });
      results.woocommerce = { status: 'up', latency: Date.now() - start };
    } catch (error) {
      results.woocommerce = { status: 'down' };
      logger.error('WooCommerce health check failed:', { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
    }
    
    // Check cache systems
    try {
      const { productCacheSafe, apiCacheSafe } = await import('./thread-safe-cache');
      const productStats = productCacheSafe.getStats();
      const apiStats = apiCacheSafe.getStats();
      
      const overallUtilization = (productStats.utilizationPercent + apiStats.utilizationPercent) / 2;
      const avgAccessCount = (productStats.averageAccessCount + apiStats.averageAccessCount) / 2;
      
      results.cache = { 
        status: 'up',
        hitRate: avgAccessCount > 0 ? Math.min(avgAccessCount / 10, 1) : 0.5, // More realistic calculation
      };
    } catch (error) {
      results.cache = { status: 'down' };
      logger.error('Cache health check failed:', { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
    }

    // Check external services
    const externalServices = await this.checkExternalServices();
    results.external = {
      status: externalServices.some(s => s.status === 'up') ? 'up' : 'down',
      services: externalServices.map(s => s.name)
    };
    
    return results;
  }

  private async checkExternalServices(): Promise<Array<{name: string, status: 'up' | 'down', latency?: number}>> {
    const services: Array<{name: string, status: 'up' | 'down', latency?: number}> = [];
    
    // Check DeepSeek API
    if (config.apis.deepseek) {
      try {
        const start = Date.now();
        const response = await fetch('https://api.deepseek.com/v1/models', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${config.apis.deepseek}`,
            'Content-Type': 'application/json'
          },
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });
        
        services.push({
          name: 'deepseek',
          status: response.ok ? 'up' : 'down',
          latency: Date.now() - start
        });
      } catch (error) {
        services.push({ name: 'deepseek', status: 'down' });
        logger.debug('DeepSeek API health check failed:', { 
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
      }
    }

    // Check OpenAI API
    if (config.apis.openai) {
      try {
        const start = Date.now();
        const response = await fetch('https://api.openai.com/v1/models', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${config.apis.openai}`,
            'Content-Type': 'application/json'
          },
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });
        
        services.push({
          name: 'openai',
          status: response.ok ? 'up' : 'down',
          latency: Date.now() - start
        });
      } catch (error) {
        services.push({ name: 'openai', status: 'down' });
        logger.debug('OpenAI API health check failed:', { 
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
      }
    }

    // Check Pinecone API
    if (config.apis.pinecone?.apiKey) {
      try {
        const start = Date.now();
        const response = await fetch('https://api.pinecone.io/whoami', {
          method: 'GET',
          headers: {
            'Api-Key': config.apis.pinecone?.apiKey,
            'Content-Type': 'application/json'
          },
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });
        
        services.push({
          name: 'pinecone',
          status: response.ok ? 'up' : 'down',
          latency: Date.now() - start
        });
      } catch (error) {
        services.push({ name: 'pinecone', status: 'down' });
        logger.debug('Pinecone API health check failed:', { 
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
      }
    }

    // Check Google Analytics (if configured)
    if (config.monitoring.googleAnalyticsId) {
      try {
        const start = Date.now();
        // Simple check to Google's public endpoint
        const response = await fetch('https://www.google-analytics.com/analytics.js', {
          method: 'HEAD',
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });
        
        services.push({
          name: 'google-analytics',
          status: response.ok ? 'up' : 'down',
          latency: Date.now() - start
        });
      } catch (error) {
        services.push({ name: 'google-analytics', status: 'down' });
        logger.debug('Google Analytics health check failed:', { 
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
      }
    }

    return services;
  }
  
  private determineOverallHealth(services: HealthStatus['services']): HealthStatus['status'] {
    const serviceStatuses = Object.values(services).map(service => service.status);
    const downServices = serviceStatuses.filter(status => status === 'down').length;
    
    if (downServices === 0) return 'healthy';
    if (downServices < serviceStatuses.length / 2) return 'degraded';
    return 'unhealthy';
  }
  
  getCurrentMetrics(): SystemMetrics | null {
    return this.metricsHistory[this.metricsHistory.length - 1] ?? null;
  }
  
  getMetricsHistory(hours = 1): SystemMetrics[] {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    return this.metricsHistory.filter(metrics => metrics.timestamp > cutoff);
  }
  
  getActiveAlerts(): Alert[] {
    return this.alertManager.getActiveAlerts();
  }
  
  getAlertHistory(limit = 100): Alert[] {
    return this.alertManager.getAlertHistory(limit);
  }
  
  resolveAlert(alertId: string): void {
    this.alertManager.resolveAlert(alertId);
  }
}

// Request monitoring middleware helper
export function createMonitoringMiddleware() {
  const monitoring = MonitoringService.getInstance();
  
  return (handler: (req: Request) => Promise<Response>) => {
    return async (req: Request): Promise<Response> => {
      const start = Date.now();
      let success = true;
      let errorType: string | undefined;
      
      try {
        const response = await handler(req);
        success = response.status < 400;
        if (!success) {
          errorType = `http_${response.status}`;
        }
        return response;
      } catch (error) {
        success = false;
        errorType = error instanceof Error ? error.constructor.name : 'unknown_error';
        throw error;
      } finally {
        const responseTime = Date.now() - start;
        monitoring.trackRequest(responseTime, success, errorType);
      }
    };
  };
}

// Singleton instance
export const monitoring = MonitoringService.getInstance();

// Auto-start monitoring in production
if (config.isProd && typeof process !== 'undefined') {
  monitoring.start();
  
  // Graceful shutdown
  process.on('SIGTERM', () => monitoring.stop());
  process.on('SIGINT', () => monitoring.stop());
}

const monitoringServiceModule = {
  MonitoringService,
  monitoring,
  createMonitoringMiddleware,
};

export default monitoringServiceModule;