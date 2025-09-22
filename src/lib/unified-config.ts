import { z } from 'zod';
import { logger } from '@/lib/logger';

// Environment types
export type Environment = 'development' | 'production' | 'test' | 'staging';

// Base configuration schema with all environment variables
const BaseConfigSchema = z.object({
  // Core application settings
  NODE_ENV: z.enum(['development', 'production', 'test', 'staging']).default('development'),

  // URLs and endpoints
  NEXT_PUBLIC_SITE_URL: z.string().url('Site URL must be valid').optional(),
  NEXT_PUBLIC_APP_URL: z.string().url('App URL must be valid').optional(),
  NEXTAUTH_URL: z.string().url('NextAuth URL must be valid').default('http://localhost:3000'),

  // Webhook configuration
  WEBHOOK_SECRET: z.string().min(32, 'Webhook secret must be at least 32 characters').optional(),
  WEBHOOK_BACKUP_SECRET: z.string().min(32, 'Webhook backup secret must be at least 32 characters').optional(),

  // WooCommerce API (provide defaults for build time)
  NEXT_PUBLIC_WC_API_URL: z.string().url('WooCommerce API URL must be valid').default('https://agrikoph.com/wp-json/wc/v3'),
  WC_CONSUMER_KEY: z.string()
    .min(20, 'WooCommerce consumer key must be at least 20 characters')
    .startsWith('ck_', 'WooCommerce consumer key must start with ck_')
    .default('ck_build_placeholder_key_12345678'),
  WC_CONSUMER_SECRET: z.string()
    .min(20, 'WooCommerce consumer secret must be at least 20 characters')
    .startsWith('cs_', 'WooCommerce consumer secret must start with cs_')
    .default('cs_build_placeholder_secret_12345678'),

  // Security secrets (provide defaults for build time)
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters').default('build_placeholder_jwt_secret_32_chars_long'),
  NEXTAUTH_SECRET: z.string().min(32, 'NextAuth secret must be at least 32 characters').optional(),
  SESSION_SECRET: z.string().min(32, 'Session secret must be at least 32 characters').optional(),
  API_KEY: z.string().optional(),

  // Admin authentication
  ADMIN_USERNAME: z.string().min(3, 'Admin username must be at least 3 characters').default('admin'),
  ADMIN_PASSWORD: z.string().optional(),

  // Database configuration
  DATABASE_URL: z.string().url('Database URL must be valid').optional(),
  DATABASE_SSL: z.enum(['true', 'false']).default('false').transform(val => val === 'true'),
  DATABASE_POOL_MIN: z.string().regex(/^\d+$/).transform(Number).default('2'),
  DATABASE_POOL_MAX: z.string().regex(/^\d+$/).transform(Number).default('10'),

  // Legacy Memgraph support (for backward compatibility)
  MEMGRAPH_URL: z.string().optional(),
  MEMGRAPH_USER: z.string().optional(),
  MEMGRAPH_PASSWORD: z.string().optional(),

  // Redis configuration
  REDIS_URL: z.string().url('Redis URL must be valid').optional(),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_ENABLE_CLUSTER: z.enum(['true', 'false']).default('false').transform(val => val === 'true'),

  // External service APIs
  GITHUB_TOKEN: z.string().optional(),
  GH_TOKEN: z.string().optional(), // Alias for GITHUB_TOKEN
  DEEPSEEK_API_KEY: z.string().startsWith('sk-', 'DeepSeek API key invalid format').optional(),
  OPENAI_API_KEY: z.string().startsWith('sk-', 'OpenAI API key invalid format').optional(),

  // Qdrant configuration
  QDRANT_API_KEY: z.string().min(20, 'Qdrant API key invalid').optional().or(z.literal('')),
  QDRANT_COLLECTION_NAME: z.string().optional(),
  QDRANT_HOST: z.string().url('Qdrant host must be valid URL').optional(),
  // Legacy fields kept for backward compatibility (will map to Qdrant)
  QDRANT_ENVIRONMENT: z.string().optional(),
  QDRANT_INDEX: z.string().optional(), // Alias for QDRANT_COLLECTION_NAME

  // Analytics and monitoring
  GOOGLE_ANALYTICS_ID: z.string().optional(),
  NEXT_PUBLIC_GA_ID: z.string().startsWith('G-', 'Google Analytics ID invalid format').optional(),
  SENTRY_DSN: z.string().url('Sentry DSN must be valid URL').optional(),
  MONITORING_ENDPOINT: z.string().url('Monitoring endpoint must be valid URL').optional(),

  // Remote logging
  ENABLE_REMOTE_LOGGING: z.enum(['true', 'false']).default('false').transform(val => val === 'true'),
  DATADOG_API_KEY: z.string().min(32, 'Datadog API key must be at least 32 characters').optional(),
  SPLUNK_TOKEN: z.string().min(36, 'Splunk token must be at least 36 characters').optional(),

  // Feature flags
  ENABLE_ANALYTICS: z.enum(['true', 'false']).default('false').transform(val => val === 'true'),
  ENABLE_CACHING: z.enum(['true', 'false']).default('true').transform(val => val === 'true'),
  ENABLE_RATE_LIMITING: z.enum(['true', 'false']).default('true').transform(val => val === 'true'),
  ENABLE_CSRF_PROTECTION: z.enum(['true', 'false']).default('true').transform(val => val === 'true'),

  // Performance and limits
  MAX_CACHE_SIZE: z.string().regex(/^\d+$/).transform(Number).default('1000'),
  MAX_CACHE_MEMORY_MB: z.string().regex(/^\d+$/).transform(Number).default('200'),
  CACHE_WARNING_THRESHOLD: z.string().regex(/^\d+$/).transform(Number).default('80'),
  REQUEST_TIMEOUT: z.string().regex(/^\d+$/).transform(Number).default('30000'),

  // Rate limiting
  RATE_LIMIT_MAX_REQUESTS: z.string().regex(/^\d+$/).transform(Number).default('100'),
  RATE_LIMIT_WINDOW_MS: z.string().regex(/^\d+$/).transform(Number).default('60000'),
  RATE_LIMIT_MAX: z.string().regex(/^\d+$/).transform(Number).default('100'), // Alias

  // Email configuration
  EMAIL_FROM: z.string().email('From email invalid').optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().regex(/^\d+$/).transform(Number).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),

  // Storage configuration
  STORAGE_TYPE: z.enum(['local', 's3', 'cloudflare']).default('local'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_BUCKET: z.string().optional(),
  AWS_REGION: z.string().optional(),
});

// Production-specific schema with stricter requirements
const ProductionConfigSchema = BaseConfigSchema.extend({
  // Stricter security requirements for production
  JWT_SECRET: z.string().min(64, 'JWT secret must be at least 64 characters in production'),
  NEXTAUTH_SECRET: z.string().min(64, 'NextAuth secret must be at least 64 characters in production'),
  ADMIN_PASSWORD: z.string()
    .min(12, 'Admin password must be at least 12 characters in production')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
      'Admin password must contain uppercase, lowercase, number, and special character in production'
    ),

  // Production requirements
  NEXT_PUBLIC_SITE_URL: z.string().url('Site URL is required in production'),
  DATABASE_SSL: z.literal(true, {
    errorMap: () => ({ message: 'Database SSL is required in production' })
  }),
  SENTRY_DSN: z.string().url('Sentry DSN is required in production'),
}).strict(); // No additional properties allowed in production

// Validation result interface
export interface ValidationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  missing: string[];
  configured: string[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
    missing: number;
  };
}

// Configuration access interface
export interface ConfigurationAccess {
  // Environment info
  env: Environment;
  isProd: boolean;
  isDev: boolean;
  isTest: boolean;

  // Grouped configuration
  app: {
    siteUrl?: string;
    appUrl?: string;
    nextAuthUrl: string;
    baseUrl?: string; // Derived from siteUrl or appUrl
  };

  woocommerce: {
    apiUrl: string;
    consumerKey: string;
    consumerSecret: string;
  };

  webhooks: {
    secret?: string;
    backupSecret?: string;
  };

  security: {
    jwtSecret: string;
    nextAuthSecret?: string;
    sessionSecret?: string;
    apiKey?: string;
    adminUsername: string;
    adminPassword?: string;
  };

  database: {
    url?: string;
    ssl: boolean;
    poolMin: number;
    poolMax: number;
    // Legacy support
    memgraph?: {
      url?: string;
      user?: string;
      password?: string;
    };
  };

  redis: {
    url?: string;
    password?: string;
    enableCluster: boolean;
  };

  apis: {
    github?: string;
    deepseek?: string;
    openai?: string;
    qdrant?: {
      apiKey?: string;
      indexName?: string;
      host?: string;
      environment?: string;
    };
  };

  monitoring: {
    googleAnalyticsId?: string;
    sentryDsn?: string;
    endpoint?: string;
    remoteLogging: {
      enabled: boolean;
      datadogApiKey?: string;
      splunkToken?: string;
    };
  };

  features: {
    analytics: boolean;
    caching: boolean;
    rateLimiting: boolean;
    csrfProtection: boolean;
    enableSlackAlerts: boolean;
    enableMemgraphSync: boolean;
    enableQdrantSync: boolean;
  };

  performance: {
    maxCacheSize: number;
    maxCacheMemoryMb: number;
    cacheWarningThreshold: number;
    requestTimeout: number;
    rateLimitMax: number;
    rateLimitWindowMs: number;
  };

  email?: {
    from?: string;
    smtp?: {
      host?: string;
      port?: number;
      user?: string;
      password?: string;
    };
  };

  storage: {
    type: 'local' | 's3' | 'cloudflare';
    aws?: {
      accessKeyId?: string;
      secretAccessKey?: string;
      bucket?: string;
      region?: string;
    };
  };
}

/**
 * Unified Configuration Manager
 * Consolidates all configuration systems into a single source of truth
 */
export class UnifiedConfigurationManager {
  private static instance: UnifiedConfigurationManager;
  private config: z.infer<typeof BaseConfigSchema>;
  private environment: Environment;
  private isProduction: boolean;
  private validationResult: ValidationResult;
  private sensitiveKeys: Set<string>;

  private constructor() {
    this.environment = (process.env.NODE_ENV as Environment) ?? 'development';
    this.isProduction = this.environment === 'production' &&
                       !this.isBuildPhase();
    this.sensitiveKeys = this.initSensitiveKeys();
    const result = this.loadAndValidateConfig();
    this.config = result.config;
    this.validationResult = result.validation;
  }

  static getInstance(): UnifiedConfigurationManager {
    if (!UnifiedConfigurationManager.instance) {
      UnifiedConfigurationManager.instance = new UnifiedConfigurationManager();
    }
    return UnifiedConfigurationManager.instance;
  }

  private isBuildPhase(): boolean {
    return process.env.NEXT_PHASE === 'phase-production-build' ||
           process.env.NEXT_PHASE === 'phase-export';
  }

  private initSensitiveKeys(): Set<string> {
    return new Set([
      'JWT_SECRET', 'NEXTAUTH_SECRET', 'SESSION_SECRET', 'API_KEY',
      'ADMIN_PASSWORD', 'WC_CONSUMER_SECRET', 'DATABASE_URL',
      'REDIS_URL', 'REDIS_PASSWORD', 'GITHUB_TOKEN', 'GH_TOKEN',
      'DEEPSEEK_API_KEY', 'OPENAI_API_KEY', 'QDRANT_API_KEY',
      'SENTRY_DSN', 'DATADOG_API_KEY', 'SPLUNK_TOKEN',
      'SMTP_PASSWORD', 'AWS_SECRET_ACCESS_KEY', 'MEMGRAPH_PASSWORD',
      'WEBHOOK_SECRET', 'WEBHOOK_BACKUP_SECRET'
    ]);
  }

  private loadAndValidateConfig(): {
    config: z.infer<typeof BaseConfigSchema>;
    validation: ValidationResult;
  } {
    const schema = this.isProduction ? ProductionConfigSchema : BaseConfigSchema;
    const schemaKeys = Object.keys(schema.shape);

    // Initialize validation result
    const validation: ValidationResult = {
      success: false,
      errors: [],
      warnings: [],
      missing: [],
      configured: [],
      summary: {
        total: schemaKeys.length,
        valid: 0,
        invalid: 0,
        missing: 0
      }
    };

    try {
      const result = schema.safeParse(process.env);

      if (result.success) {
        validation.success = true;

        // Count configured variables
        schemaKeys.forEach(key => {
          if (process.env[key] !== undefined) {
            validation.configured.push(key);
            validation.summary.valid++;
          }
        });

        // Log successful configuration
        logger.info('✅ Unified configuration loaded successfully', {
          environment: this.environment,
          configured: validation.configured.length,
          total: schemaKeys.length,
          services: this.getServiceStatus(result.data)
        } as Record<string, unknown>);

        return { config: result.data, validation };
      } else {
        // Handle validation errors
        result.error.errors.forEach(err => {
          const key = err.path.join('.');
          const message = `${key}: ${err.message}`;

          if (err.code === 'invalid_type' && err.expected === 'string' && err.received === 'undefined') {
            validation.missing.push(key);
            validation.summary.missing++;
          } else {
            validation.errors.push(message);
            validation.summary.invalid++;
          }
        });

        logger.error('❌ Configuration validation failed:', {
          environment: this.environment,
          errors: validation.errors,
          missing: validation.missing,
          summary: validation.summary
        } as Record<string, unknown>);

        // In production, exit on validation failure
        if (this.isProduction) {
          logger.error('🚨 Exiting due to configuration validation failure in production');
          process.exit(1);
        }

        // In development, use defaults and continue
        logger.warn('⚠️ Using default configuration values for invalid/missing settings');

        // Parse with defaults
        const configWithDefaults = schema.parse({});
        return { config: configWithDefaults, validation };
      }
    } catch (error) {
      logger.error('💥 Failed to load configuration:', error as Record<string, unknown>);

      if (this.isProduction) {
        process.exit(1);
      }

      throw error;
    }
  }

  private getServiceStatus(config: z.infer<typeof BaseConfigSchema>) {
    return {
      woocommerce: !!config.NEXT_PUBLIC_WC_API_URL,
      database: !!config.DATABASE_URL || !!config.MEMGRAPH_URL,
      redis: !!config.REDIS_URL,
      github: !!(config.GITHUB_TOKEN || config.GH_TOKEN),
      deepseek: !!config.DEEPSEEK_API_KEY,
      openai: !!config.OPENAI_API_KEY,
      qdrant: !!config.QDRANT_API_KEY,
      sentry: !!config.SENTRY_DSN,
      analytics: !!(config.GOOGLE_ANALYTICS_ID || config.NEXT_PUBLIC_GA_ID),
    };
  }

  // Public API - Get full configuration object
  getConfig(): ConfigurationAccess {
    return {
      env: this.environment,
      isProd: this.isProduction,
      isDev: this.environment === 'development',
      isTest: this.environment === 'test',

      app: {
        siteUrl: this.config.NEXT_PUBLIC_SITE_URL,
        appUrl: this.config.NEXT_PUBLIC_APP_URL,
        nextAuthUrl: this.config.NEXTAUTH_URL,
        baseUrl: this.config.NEXT_PUBLIC_SITE_URL || this.config.NEXT_PUBLIC_APP_URL || this.config.NEXTAUTH_URL,
      },

      woocommerce: {
        apiUrl: this.config.NEXT_PUBLIC_WC_API_URL,
        consumerKey: this.config.WC_CONSUMER_KEY,
        consumerSecret: this.config.WC_CONSUMER_SECRET,
      },

      webhooks: {
        secret: this.config.WEBHOOK_SECRET,
        backupSecret: this.config.WEBHOOK_BACKUP_SECRET,
      },

      security: {
        jwtSecret: this.config.JWT_SECRET,
        nextAuthSecret: this.config.NEXTAUTH_SECRET,
        sessionSecret: this.config.SESSION_SECRET,
        apiKey: this.config.API_KEY,
        adminUsername: this.config.ADMIN_USERNAME,
        adminPassword: this.config.ADMIN_PASSWORD,
      },

      database: {
        url: this.config.DATABASE_URL,
        ssl: this.config.DATABASE_SSL,
        poolMin: this.config.DATABASE_POOL_MIN,
        poolMax: this.config.DATABASE_POOL_MAX,
        memgraph: {
          url: this.config.MEMGRAPH_URL,
          user: this.config.MEMGRAPH_USER,
          password: this.config.MEMGRAPH_PASSWORD,
        },
      },

      redis: {
        url: this.config.REDIS_URL,
        password: this.config.REDIS_PASSWORD,
        enableCluster: this.config.REDIS_ENABLE_CLUSTER,
      },

      apis: {
        github: this.config.GITHUB_TOKEN || this.config.GH_TOKEN,
        deepseek: this.config.DEEPSEEK_API_KEY,
        openai: this.config.OPENAI_API_KEY,
        qdrant: {
          apiKey: this.config.QDRANT_API_KEY,
          indexName: this.config.QDRANT_COLLECTION_NAME || this.config.QDRANT_INDEX,
          host: this.config.QDRANT_HOST,
          environment: this.config.QDRANT_ENVIRONMENT,
        },
      },

      monitoring: {
        googleAnalyticsId: this.config.GOOGLE_ANALYTICS_ID || this.config.NEXT_PUBLIC_GA_ID,
        sentryDsn: this.config.SENTRY_DSN,
        endpoint: this.config.MONITORING_ENDPOINT,
        remoteLogging: {
          enabled: this.config.ENABLE_REMOTE_LOGGING,
          datadogApiKey: this.config.DATADOG_API_KEY,
          splunkToken: this.config.SPLUNK_TOKEN,
        },
      },

      features: {
        analytics: this.config.ENABLE_ANALYTICS,
        caching: this.config.ENABLE_CACHING,
        rateLimiting: this.config.ENABLE_RATE_LIMITING,
        csrfProtection: this.config.ENABLE_CSRF_PROTECTION,
        enableSlackAlerts: false, // Default to false for now
        enableMemgraphSync: true, // Enable by default for auto-sync
        enableQdrantSync: true, // Enable by default for auto-sync
      },

      performance: {
        maxCacheSize: this.config.MAX_CACHE_SIZE,
        maxCacheMemoryMb: this.config.MAX_CACHE_MEMORY_MB,
        cacheWarningThreshold: this.config.CACHE_WARNING_THRESHOLD,
        requestTimeout: this.config.REQUEST_TIMEOUT,
        rateLimitMax: this.config.RATE_LIMIT_MAX_REQUESTS || this.config.RATE_LIMIT_MAX,
        rateLimitWindowMs: this.config.RATE_LIMIT_WINDOW_MS,
      },

      email: this.config.EMAIL_FROM ? {
        from: this.config.EMAIL_FROM,
        smtp: {
          host: this.config.SMTP_HOST,
          port: this.config.SMTP_PORT,
          user: this.config.SMTP_USER,
          password: this.config.SMTP_PASSWORD,
        },
      } : undefined,

      storage: {
        type: this.config.STORAGE_TYPE,
        aws: {
          accessKeyId: this.config.AWS_ACCESS_KEY_ID,
          secretAccessKey: this.config.AWS_SECRET_ACCESS_KEY,
          bucket: this.config.AWS_BUCKET,
          region: this.config.AWS_REGION,
        },
      },
    };
  }

  // Validation methods
  getValidationResult(): ValidationResult {
    return { ...this.validationResult };
  }

  validateRequiredServices(): { valid: boolean; missing: string[] } {
    const missing: string[] = [];

    // Always required
    if (!this.config.NEXT_PUBLIC_WC_API_URL) missing.push('WooCommerce API');
    if (!this.config.JWT_SECRET) missing.push('JWT Secret');

    // Production requirements
    if (this.isProduction) {
      if (!this.config.DATABASE_URL && !this.config.MEMGRAPH_URL) {
        missing.push('Database configuration');
      }
      if (!this.config.SENTRY_DSN) missing.push('Sentry monitoring');
    }

    return {
      valid: missing.length === 0,
      missing
    };
  }

  // Safe configuration (redacted secrets)
  getSafeConfig() {
    const safe = { ...this.config };

    for (const key of this.sensitiveKeys) {
      if (safe[key as keyof typeof safe]) {
        (safe as Record<string, unknown>)[key] = '[REDACTED]';
      }
    }

    return safe;
  }

  // Reload configuration
  reloadConfig(): void {
    logger.info('🔄 Reloading unified configuration...');
    const result = this.loadAndValidateConfig();
    this.config = result.config;
    this.validationResult = result.validation;
  }

  // Backward compatibility methods (to ease migration)
  getEnvVar(key: string, required = false): string | undefined {
    const value = (this.config as Record<string, unknown>)[key]?.toString();

    if (required && !value) {
      throw new Error(`Required environment variable ${key} is not set`);
    }

    return value;
  }

  getValidatedValue(key: string): string | number | boolean | undefined {
    return (this.config as Record<string, unknown>)[key] as string | number | boolean | undefined;
  }
}

// Export singleton instance
export const unifiedConfig = UnifiedConfigurationManager.getInstance();

// Export configuration access object (main API)
export const config = unifiedConfig.getConfig();

// Validate required services on startup
const validation = unifiedConfig.validateRequiredServices();
if (!validation.valid && config.isProd) {
  logger.error('❌ Missing required services:', { missing: validation.missing });
  process.exit(1);
} else if (!validation.valid) {
  logger.warn('⚠️ Missing optional services:', { missing: validation.missing });
}

// Export utility functions
export const getTimeoutConfig = () => ({
  database: config.isDev ? 30000 : 10000,
  api: config.isDev ? 30000 : 15000,
  external: config.isDev ? 45000 : 30000,
});

export const getCacheConfig = () => ({
  enabled: config.features.caching,
  maxSize: config.performance.maxCacheSize,
  maxMemoryMb: config.performance.maxCacheMemoryMb,
  warningThreshold: config.performance.cacheWarningThreshold,
  ttl: config.isDev ? 5 * 60 * 1000 : 15 * 60 * 1000, // 5min dev, 15min prod
});

export const getRateLimitConfig = () => ({
  enabled: config.features.rateLimiting,
  max: config.performance.rateLimitMax,
  windowMs: config.performance.rateLimitWindowMs,
});

// APP_CONSTANTS removed due to dependency issues and no active usage

// Default export
export default unifiedConfig;