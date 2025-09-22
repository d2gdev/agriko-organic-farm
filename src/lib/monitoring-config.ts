import { config } from '@/lib/unified-config';

// Monitoring configuration based on environment
export const getMonitoringConfig = () => {
  const isDev = config.isDev;
  const isProd = config.isProd;
  
  return {
    // Collection intervals
    metricsInterval: isDev ? 60000 : 30000, // 60s dev, 30s prod
    healthCheckInterval: isDev ? 120000 : 60000, // 2min dev, 1min prod
    
    // Alert thresholds
    alerts: {
      memory: {
        warning: isDev ? 90 : 80, // % utilization
        critical: isDev ? 95 : 85,
      },
      cpu: {
        warning: isDev ? 85 : 75, // % usage
        critical: isDev ? 95 : 85,
      },
      responseTime: {
        warning: isDev ? 3000 : 1500, // ms (p95)
        critical: isDev ? 5000 : 2500,
      },
      errorRate: {
        warning: isDev ? 0.1 : 0.03, // % (10% dev, 3% prod)
        critical: isDev ? 0.2 : 0.05, // % (20% dev, 5% prod)
      },
      cacheHitRate: {
        warning: isDev ? 0.5 : 0.7, // 50% dev, 70% prod
        critical: isDev ? 0.3 : 0.5, // 30% dev, 50% prod
      },
    },
    
    // Alert cooldown periods (ms)
    cooldowns: {
      low: 15 * 60 * 1000,    // 15 minutes
      medium: 10 * 60 * 1000, // 10 minutes
      high: 5 * 60 * 1000,    // 5 minutes
      critical: 2 * 60 * 1000, // 2 minutes
    },
    
    // Data retention
    retention: {
      metrics: isDev ? 2 : 24, // hours
      alerts: isDev ? 100 : 1000, // count
    },
    
    // External monitoring
    external: {
      enabled: !!config.monitoring.endpoint,
      endpoint: config.monitoring.endpoint,
      timeout: 10000, // 10 seconds
      retries: 3,
    },
    
    // Features
    features: {
      autoResolve: true,
      autoResolveTimeout: 10 * 60 * 1000, // 10 minutes for low severity
      detailedMetrics: isProd,
      healthChecks: true,
      alertNotifications: isProd,
    },
  };
};

// Monitoring endpoints configuration
export const monitoringEndpoints = {
  // Internal monitoring endpoints (require auth)
  internal: [
    '/api/monitoring',
    '/api/admin/system-status',
  ],
  
  // Public health check endpoints (no auth)
  public: [
    '/api/health',
  ],
  
  // External monitoring integration endpoints
  external: [
    '/api/monitoring/webhook', // For external alerts
    '/api/monitoring/prometheus', // For Prometheus scraping
  ],
};

// Service-specific health check configurations
export const serviceHealthChecks = {
  woocommerce: {
    endpoint: '/products',
    timeout: 10000,
    retries: 2,
    expectedStatus: 200,
  },
  
  database: {
    timeout: 5000,
    retries: 1,
  },
  
  cache: {
    timeout: 1000,
    retries: 1,
  },
  
  external: {
    deepseek: {
      enabled: !!config.apis.deepseek,
      timeout: 15000,
      retries: 1,
    },
    openai: {
      enabled: !!config.apis.openai,
      timeout: 15000,
      retries: 1,
    },
    qdrant: {
      enabled: !!config.apis.qdrant?.apiKey,
      timeout: 10000,
      retries: 1,
    },
  },
};

// Performance benchmarks and SLAs
export const performanceSLAs = {
  // Response time targets (ms)
  responseTime: {
    api: {
      target: 500,
      warning: 1000,
      critical: 2000,
    },
    page: {
      target: 1000,
      warning: 2000,
      critical: 3000,
    },
    search: {
      target: 800,
      warning: 1500,
      critical: 2500,
    },
  },
  
  // Availability targets (%)
  availability: {
    overall: 99.9,
    api: 99.95,
    search: 99.5,
  },
  
  // Error rate limits (%)
  errorRate: {
    overall: 1,
    api: 0.5,
    critical: 0.1,
  },
  
  // Cache performance targets
  cache: {
    hitRate: 80, // %
    responseTime: 50, // ms
  },
};

const monitoringConfigExports = {
  getMonitoringConfig,
  monitoringEndpoints,
  serviceHealthChecks,
  performanceSLAs,
};

export default monitoringConfigExports;