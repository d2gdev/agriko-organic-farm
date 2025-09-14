/**
 * Backward Compatibility Layer for Configuration Systems Migration
 *
 * This file provides compatibility shims for the old configuration systems
 * to ensure smooth migration without breaking existing code.
 */

import { logger } from '@/lib/logger';
import { unifiedConfig, config } from '@/lib/unified-config';

// Track usage of deprecated APIs for migration monitoring
const deprecationWarnings = new Set<string>();

function logDeprecationWarning(oldApi: string, newApi: string, context?: string) {
  const key = `${oldApi}-${context || 'general'}`;

  if (!deprecationWarnings.has(key)) {
    deprecationWarnings.add(key);
    logger.warn(`🔄 DEPRECATED: ${oldApi} is deprecated. Use ${newApi} instead.`, {
      context,
      migration: 'unified-config',
      oldApi,
      newApi
    } as Record<string, unknown>);
  }
}

// ============================================================================
// env-config.ts Compatibility Layer
// ============================================================================

/**
 * @deprecated Use unifiedConfig.getConfig() instead
 */
export const envConfig = {
  get isProduction() {
    logDeprecationWarning('envConfig.isProduction', 'config.isProd', 'env-config');
    return config.isProd;
  },

  get isDevelopment() {
    logDeprecationWarning('envConfig.isDevelopment', 'config.isDev', 'env-config');
    return config.isDev;
  },

  get isTest() {
    logDeprecationWarning('envConfig.isTest', 'config.isTest', 'env-config');
    return config.isTest;
  },

  // WooCommerce
  get wcApiUrl() {
    logDeprecationWarning('envConfig.wcApiUrl', 'config.woocommerce.apiUrl', 'env-config');
    return config.woocommerce.apiUrl;
  },

  get wcConsumerKey() {
    logDeprecationWarning('envConfig.wcConsumerKey', 'config.woocommerce.consumerKey', 'env-config');
    return config.woocommerce.consumerKey;
  },

  get wcConsumerSecret() {
    logDeprecationWarning('envConfig.wcConsumerSecret', 'config.woocommerce.consumerSecret', 'env-config');
    return config.woocommerce.consumerSecret;
  },

  // Auth
  get adminUsername() {
    logDeprecationWarning('envConfig.adminUsername', 'config.security.adminUsername', 'env-config');
    return config.security.adminUsername;
  },

  get adminPassword() {
    logDeprecationWarning('envConfig.adminPassword', 'config.security.adminPassword', 'env-config');
    return config.security.adminPassword;
  },

  get jwtSecret() {
    logDeprecationWarning('envConfig.jwtSecret', 'config.security.jwtSecret', 'env-config');
    return config.security.jwtSecret;
  },

  // External APIs
  get githubToken() {
    logDeprecationWarning('envConfig.githubToken', 'config.apis.github', 'env-config');
    return config.apis.github;
  },

  get googleAnalyticsId() {
    logDeprecationWarning('envConfig.googleAnalyticsId', 'config.monitoring.googleAnalyticsId', 'env-config');
    return config.monitoring.googleAnalyticsId;
  },

  get pineconeApiKey() {
    logDeprecationWarning('envConfig.pineconeApiKey', 'config.apis.pinecone.apiKey', 'env-config');
    return config.apis.pinecone?.apiKey;
  },

  get pineconeIndexName() {
    logDeprecationWarning('envConfig.pineconeIndexName', 'config.apis.pinecone.indexName', 'env-config');
    return config.apis.pinecone?.indexName;
  },

  get pineconeHost() {
    logDeprecationWarning('envConfig.pineconeHost', 'config.apis.pinecone.host', 'env-config');
    return config.apis.pinecone?.host;
  },

  get deepseekApiKey() {
    logDeprecationWarning('envConfig.deepseekApiKey', 'config.apis.deepseek', 'env-config');
    return config.apis.deepseek;
  },

  // Database
  get memgraphUrl() {
    logDeprecationWarning('envConfig.memgraphUrl', 'config.database.memgraph.url', 'env-config');
    return config.database.memgraph?.url;
  },

  get memgraphUser() {
    logDeprecationWarning('envConfig.memgraphUser', 'config.database.memgraph.user', 'env-config');
    return config.database.memgraph?.user;
  },

  get memgraphPassword() {
    logDeprecationWarning('envConfig.memgraphPassword', 'config.database.memgraph.password', 'env-config');
    return config.database.memgraph?.password;
  },

  // Security
  get apiKey() {
    logDeprecationWarning('envConfig.apiKey', 'config.security.apiKey', 'env-config');
    return config.security.apiKey;
  },

  get rateLimitMaxRequests() {
    logDeprecationWarning('envConfig.rateLimitMaxRequests', 'config.performance.rateLimitMax', 'env-config');
    return config.performance.rateLimitMax;
  },

  get rateLimitWindowMs() {
    logDeprecationWarning('envConfig.rateLimitWindowMs', 'config.performance.rateLimitWindowMs', 'env-config');
    return config.performance.rateLimitWindowMs;
  },
} as const;

/**
 * @deprecated Use unifiedConfig.getEnvVar() instead
 */
export function getEnvVar(key: string, required = false): string | undefined {
  logDeprecationWarning('getEnvVar()', 'unifiedConfig.getEnvVar()', 'env-config');
  return unifiedConfig.getEnvVar(key, required);
}

/**
 * @deprecated Use unifiedConfig.validateRequiredServices() instead
 */
export function validateRequiredEnvVars(required: string[]): void {
  logDeprecationWarning('validateRequiredEnvVars()', 'unifiedConfig.validateRequiredServices()', 'env-config');

  const missing = required.filter(key => !unifiedConfig.getEnvVar(key));

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env.local file and ensure all required variables are set.'
    );
  }
}

// ============================================================================
// env-validation.ts Compatibility Layer
// ============================================================================

/**
 * @deprecated Use unifiedConfig.getValidationResult() instead
 */
export function validateEnvironment() {
  logDeprecationWarning('validateEnvironment()', 'unifiedConfig.getValidationResult()', 'env-validation');
  return unifiedConfig.getValidationResult();
}

/**
 * @deprecated Use unifiedConfig.getConfig() instead
 */
export function getValidatedConfig() {
  logDeprecationWarning('getValidatedConfig()', 'unifiedConfig.getConfig()', 'env-validation');
  return unifiedConfig.getSafeConfig();
}

/**
 * @deprecated Use unifiedConfig.getValidatedValue() instead
 */
export function getValidatedValue(key: string) {
  logDeprecationWarning('getValidatedValue()', 'unifiedConfig.getValidatedValue()', 'env-validation');
  return unifiedConfig.getValidatedValue(key);
}

/**
 * @deprecated Use unifiedConfig.getSafeConfig() instead
 */
export const validatedConfig = unifiedConfig.getSafeConfig();

// ============================================================================
// environment-manager.ts Compatibility Layer
// ============================================================================

/**
 * @deprecated Use unifiedConfig directly instead
 */
export class EnvironmentManager {
  static getInstance() {
    logDeprecationWarning('EnvironmentManager.getInstance()', 'unifiedConfig', 'environment-manager');
    return {
      get env() { return config.env; },
      get isProd() { return config.isProd; },
      get isDev() { return config.isDev; },
      get isTest() { return config.isTest; },

      get database() { return config.database; },
      get redis() { return config.redis; },
      get security() { return config.security; },
      get woocommerce() { return config.woocommerce; },
      get apis() { return config.apis; },
      get features() { return config.features; },
      get performance() { return config.performance; },
      get monitoring() { return config.monitoring; },
      get email() { return config.email; },
      get storage() { return config.storage; },
      get urls() { return config.app; },

      getValidationResult() {
        return unifiedConfig.getValidationResult();
      },

      validateRequiredServices() {
        return unifiedConfig.validateRequiredServices();
      },

      revalidateEnvironment() {
        unifiedConfig.reloadConfig();
        return unifiedConfig.getValidationResult();
      },

      getSafeConfig() {
        return unifiedConfig.getSafeConfig();
      },

      reloadConfig() {
        unifiedConfig.reloadConfig();
      }
    };
  }
}

/**
 * @deprecated Use config directly from unified-config instead
 */
export const env = {
  get env() { return config.env; },
  get isProd() { return config.isProd; },
  get isDev() { return config.isDev; },
  get isTest() { return config.isTest; },

  get database() {
    logDeprecationWarning('env.database', 'config.database', 'environment-manager');
    return config.database;
  },
  get redis() {
    logDeprecationWarning('env.redis', 'config.redis', 'environment-manager');
    return config.redis;
  },
  get security() {
    logDeprecationWarning('env.security', 'config.security', 'environment-manager');
    return config.security;
  },
  get woocommerce() {
    logDeprecationWarning('env.woocommerce', 'config.woocommerce', 'environment-manager');
    return config.woocommerce;
  },
  get apis() {
    logDeprecationWarning('env.apis', 'config.apis', 'environment-manager');
    return config.apis;
  },
  get features() {
    logDeprecationWarning('env.features', 'config.features', 'environment-manager');
    return config.features;
  },
  get performance() {
    logDeprecationWarning('env.performance', 'config.performance', 'environment-manager');
    return config.performance;
  },
  get monitoring() {
    logDeprecationWarning('env.monitoring', 'config.monitoring', 'environment-manager');
    return config.monitoring;
  },
  get email() {
    logDeprecationWarning('env.email', 'config.email', 'environment-manager');
    return config.email;
  },
  get storage() {
    logDeprecationWarning('env.storage', 'config.storage', 'environment-manager');
    return config.storage;
  },
  get urls() {
    logDeprecationWarning('env.urls', 'config.app', 'environment-manager');
    return config.app;
  },

  validateRequiredServices() {
    logDeprecationWarning('env.validateRequiredServices()', 'unifiedConfig.validateRequiredServices()', 'environment-manager');
    return unifiedConfig.validateRequiredServices();
  },

  getValidationResult() {
    logDeprecationWarning('env.getValidationResult()', 'unifiedConfig.getValidationResult()', 'environment-manager');
    return unifiedConfig.getValidationResult();
  },

  revalidateEnvironment() {
    logDeprecationWarning('env.revalidateEnvironment()', 'unifiedConfig.reloadConfig()', 'environment-manager');
    unifiedConfig.reloadConfig();
    return unifiedConfig.getValidationResult();
  },

  getSafeConfig() {
    logDeprecationWarning('env.getSafeConfig()', 'unifiedConfig.getSafeConfig()', 'environment-manager');
    return unifiedConfig.getSafeConfig();
  },

  reloadConfig() {
    logDeprecationWarning('env.reloadConfig()', 'unifiedConfig.reloadConfig()', 'environment-manager');
    unifiedConfig.reloadConfig();
  }
};

// ============================================================================
// Utility Functions (backward compatible versions)
// ============================================================================

/**
 * @deprecated Use getTimeoutConfig() from unified-config instead
 */
export const getTimeoutConfig = () => {
  logDeprecationWarning('getTimeoutConfig() from compatibility layer', 'getTimeoutConfig() from unified-config', 'utilities');
  return {
    database: config.isDev ? 30000 : 10000,
    api: config.isDev ? 30000 : 15000,
    external: config.isDev ? 45000 : 30000,
  };
};

/**
 * @deprecated Use getCacheConfig() from unified-config instead
 */
export const getCacheConfig = () => {
  logDeprecationWarning('getCacheConfig() from compatibility layer', 'getCacheConfig() from unified-config', 'utilities');
  return {
    enabled: config.features.caching,
    maxSize: config.performance.maxCacheSize,
    ttl: config.isDev ? 5 * 60 * 1000 : 15 * 60 * 1000,
  };
};

/**
 * @deprecated Use getRateLimitConfig() from unified-config instead
 */
export const getRateLimitConfig = () => {
  logDeprecationWarning('getRateLimitConfig() from compatibility layer', 'getRateLimitConfig() from unified-config', 'utilities');
  return {
    enabled: config.features.rateLimiting,
    max: config.performance.rateLimitMax,
    windowMs: config.performance.rateLimitWindowMs,
  };
};

// ============================================================================
// Migration Monitoring
// ============================================================================

/**
 * Get deprecation usage statistics for migration monitoring
 */
export function getDeprecationStats() {
  return {
    totalWarnings: deprecationWarnings.size,
    warnings: Array.from(deprecationWarnings),
    migrationStatus: {
      'env-config': Array.from(deprecationWarnings).filter(w => w.includes('env-config')).length,
      'env-validation': Array.from(deprecationWarnings).filter(w => w.includes('env-validation')).length,
      'environment-manager': Array.from(deprecationWarnings).filter(w => w.includes('environment-manager')).length,
    }
  };
}

/**
 * Clear deprecation warnings (useful for testing)
 */
export function clearDeprecationWarnings() {
  deprecationWarnings.clear();
}

// Log initial migration status
logger.info('🔄 Configuration compatibility layer loaded', {
  message: 'Old configuration APIs are available but deprecated',
  migration: 'Use config from unified-config for new code',
  monitoring: 'Deprecation warnings will be logged for migration tracking'
} as Record<string, unknown>);

// Default export for drop-in replacement
const compatibilityAPI = {
  envConfig,
  getEnvVar,
  validateRequiredEnvVars,
  validateEnvironment,
  getValidatedConfig,
  getValidatedValue,
  validatedConfig,
  EnvironmentManager,
  env,
  getTimeoutConfig,
  getCacheConfig,
  getRateLimitConfig,
  getDeprecationStats,
  clearDeprecationWarnings,
};

export default compatibilityAPI;