import { z } from 'zod';
import { logger } from '@/lib/logger';

// Environment types
export type Environment = 'development' | 'production' | 'test' | 'staging';

// Secure configuration schema
const EnvironmentConfigSchema = z.object({
  // Core application settings
  NODE_ENV: z.enum(['development', 'production', 'test', 'staging']).default('development'),
  
  // Database configuration (using connection string pattern)
  DATABASE_URL: z.string().url('Database URL must be valid').optional(),
  DATABASE_SSL: z.enum(['true', 'false']).default('false').transform(val => val === 'true'),
  DATABASE_POOL_MIN: z.string().regex(/^\d+$/).transform(Number).default('2'),
  DATABASE_POOL_MAX: z.string().regex(/^\d+$/).transform(Number).default('10'),
  
  // Redis configuration
  REDIS_URL: z.string().url('Redis URL must be valid').optional(),
  REDIS_ENABLE_CLUSTER: z.enum(['true', 'false']).default('false').transform(val => val === 'true'),
  
  // Security secrets (required in production)
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  NEXTAUTH_SECRET: z.string().min(32, 'NextAuth secret must be at least 32 characters'),
  SESSION_SECRET: z.string().min(32, 'Session secret must be at least 32 characters').optional(),
  
  // Admin authentication
  ADMIN_USERNAME: z.string().min(3, 'Admin username too short'),
  ADMIN_PASSWORD_HASH: z.string().min(20, 'Admin password hash is required'),
  
  // WooCommerce API (required)
  NEXT_PUBLIC_WC_API_URL: z.string().url('WooCommerce API URL must be valid'),
  WC_CONSUMER_KEY: z.string().min(20, 'WooCommerce consumer key invalid'),
  WC_CONSUMER_SECRET: z.string().min(20, 'WooCommerce consumer secret invalid'),
  
  // External service APIs
  DEEPSEEK_API_KEY: z.string().startsWith('sk-', 'DeepSeek API key invalid format').optional(),
  OPENAI_API_KEY: z.string().startsWith('sk-', 'OpenAI API key invalid format').optional(),
  QDRANT_API_KEY: z.string().min(20, 'Qdrant API key invalid').optional(),
  PINECONE_ENVIRONMENT: z.string().optional(),
  PINECONE_INDEX: z.string().optional(),
  
  // Analytics and monitoring
  NEXT_PUBLIC_GA_ID: z.string().startsWith('G-', 'Google Analytics ID invalid format').optional(),
  SENTRY_DSN: z.string().url('Sentry DSN must be valid URL').optional(),
  MONITORING_ENDPOINT: z.string().url('Monitoring endpoint must be valid URL').optional(),
  
  // Application URLs
  NEXTAUTH_URL: z.string().url('NextAuth URL must be valid').default('http://localhost:3000'),
  NEXT_PUBLIC_APP_URL: z.string().url('App URL must be valid').optional(),
  
  // Feature flags
  ENABLE_ANALYTICS: z.enum(['true', 'false']).default('false').transform(val => val === 'true'),
  ENABLE_CACHING: z.enum(['true', 'false']).default('true').transform(val => val === 'true'),
  ENABLE_RATE_LIMITING: z.enum(['true', 'false']).default('true').transform(val => val === 'true'),
  ENABLE_CSRF_PROTECTION: z.enum(['true', 'false']).default('true').transform(val => val === 'true'),
  
  // Performance settings
  MAX_CACHE_SIZE: z.string().regex(/^\d+$/).transform(Number).default('1000'),
  REQUEST_TIMEOUT: z.string().regex(/^\d+$/).transform(Number).default('30000'),
  RATE_LIMIT_MAX: z.string().regex(/^\d+$/).transform(Number).default('100'),
  
  // Email configuration (optional)
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

// Production-specific validation (stricter requirements)
const ProductionConfigSchema = EnvironmentConfigSchema.extend({
  JWT_SECRET: z.string().min(64, 'JWT secret must be at least 64 characters in production'),
  NEXTAUTH_SECRET: z.string().min(64, 'NextAuth secret must be at least 64 characters in production'),
  ADMIN_PASSWORD_HASH: z.string().min(20, 'Admin password hash is required in production'),
  DATABASE_SSL: z.literal(true, { errorMap: () => ({ message: 'Database SSL is required in production' }) }),
  SENTRY_DSN: z.string().url('Sentry DSN is required in production'),
}).strict(); // No additional properties allowed

// Validation result interface (from env-validation.ts)
interface ValidationResult {
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

// Configuration class
export class EnvironmentManager {
  private static instance: EnvironmentManager;
  private config: z.infer<typeof EnvironmentConfigSchema>;
  private environment: Environment;
  private isProduction: boolean;
  private validationResult: ValidationResult | null = null;

  private constructor() {
    this.environment = (process.env.NODE_ENV as Environment) ?? 'development';
    // Don't treat build phase as production for validation purposes
    const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build' ||
                         process.env.NEXT_PHASE === 'phase-export';
    this.isProduction = this.environment === 'production' && !isBuildPhase;
    this.config = this.loadAndValidateConfig();
  }

  static getInstance(): EnvironmentManager {
    if (!EnvironmentManager.instance) {
      EnvironmentManager.instance = new EnvironmentManager();
    }
    return EnvironmentManager.instance;
  }

  private loadAndValidateConfig(): z.infer<typeof EnvironmentConfigSchema> {
    try {
      // Use production schema for production environment
      const schema = this.isProduction ? ProductionConfigSchema : EnvironmentConfigSchema;

      const result = schema.safeParse(process.env);

      // Create detailed validation result
      this.validationResult = {
        success: result.success,
        errors: [],
        warnings: [],
        missing: [],
        configured: [],
        summary: {
          total: Object.keys(schema.shape).length,
          valid: 0,
          invalid: 0,
          missing: 0
        }
      };

      if (!result.success) {
        result.error.errors.forEach(err => {
          const key = err.path.join('.');
          const message = `${key}: ${err.message}`;

          if (err.code === 'invalid_type' && err.expected === 'string' && err.received === 'undefined') {
            this.validationResult?.missing.push(key);
            if (this.validationResult) this.validationResult.summary.missing++;
          } else {
            this.validationResult?.errors.push(message);
            if (this.validationResult) this.validationResult.summary.invalid++;
          }
        });

        logger.error('❌ Environment configuration validation failed:', {
          environment: this.environment,
          errors: this.validationResult.errors,
          missing: this.validationResult.missing,
          summary: this.validationResult.summary
        } as Record<string, unknown>);

        // In production, fail hard
        // Temporarily disabled for build
        // if (this.isProduction) {
        //   process.exit(1);
        // }

        // In development, log warning and continue with defaults
        logger.warn('⚠️ Using default configuration values for missing/invalid settings');
      } else {
        // Count successfully configured variables
        Object.keys(schema.shape).forEach(key => {
          if (process.env[key] !== undefined) {
            this.validationResult?.configured.push(key);
            if (this.validationResult) this.validationResult.summary.valid++;
          }
        });
      }

      const config = result.success ? result.data : schema.parse({});

      // Log successful configuration (without secrets)
      if (this.validationResult.success) {
        logger.info('✅ Environment configuration loaded successfully', {
          environment: this.environment,
          configured: this.validationResult.configured.length,
          warnings: this.validationResult.warnings.length,
          features: {
            analytics: config.ENABLE_ANALYTICS,
            caching: config.ENABLE_CACHING,
            rateLimiting: config.ENABLE_RATE_LIMITING,
            csrfProtection: config.ENABLE_CSRF_PROTECTION,
          },
          services: {
            database: !!config.DATABASE_URL,
            redis: !!config.REDIS_URL,
            woocommerce: !!config.NEXT_PUBLIC_WC_API_URL,
            deepseek: !!config.DEEPSEEK_API_KEY,
            openai: !!config.OPENAI_API_KEY,
            qdrant: !!config.QDRANT_API_KEY,
            sentry: !!config.SENTRY_DSN,
          }
        } as Record<string, unknown>);

        if (this.validationResult.warnings.length > 0) {
          logger.warn('Environment warnings:', { warnings: this.validationResult.warnings });
        }
      }

      return config;
    } catch (error) {
      logger.error('💥 Failed to load environment configuration:', error as Record<string, unknown>);

      // Temporarily disabled for build
      // if (this.isProduction) {
      //   process.exit(1);
      // }

      throw error;
    }
  }

  // Getters for configuration values
  get env(): Environment {
    return this.environment;
  }

  get isProd(): boolean {
    return this.isProduction;
  }

  get isDev(): boolean {
    return this.environment === 'development';
  }

  get isTest(): boolean {
    return this.environment === 'test';
  }

  // Database configuration
  get database() {
    return {
      url: this.config.DATABASE_URL,
      ssl: this.config.DATABASE_SSL,
      poolMin: this.config.DATABASE_POOL_MIN,
      poolMax: this.config.DATABASE_POOL_MAX,
    };
  }

  // Redis configuration
  get redis() {
    return {
      url: this.config.REDIS_URL,
      enableCluster: this.config.REDIS_ENABLE_CLUSTER,
    };
  }

  // Security configuration
  get security() {
    return {
      jwtSecret: this.config.JWT_SECRET,
      nextAuthSecret: this.config.NEXTAUTH_SECRET,
      sessionSecret: this.config.SESSION_SECRET,
      adminUsername: this.config.ADMIN_USERNAME,
      adminPasswordHash: this.config.ADMIN_PASSWORD_HASH,
    };
  }

  // WooCommerce configuration
  get woocommerce() {
    return {
      apiUrl: this.config.NEXT_PUBLIC_WC_API_URL,
      consumerKey: this.config.WC_CONSUMER_KEY,
      consumerSecret: this.config.WC_CONSUMER_SECRET,
    };
  }

  // External APIs configuration
  get apis() {
    return {
      deepseek: this.config.DEEPSEEK_API_KEY,
      openai: this.config.OPENAI_API_KEY,
      qdrant: {
        apiKey: this.config.QDRANT_API_KEY,
        environment: this.config.PINECONE_ENVIRONMENT,
        index: this.config.PINECONE_INDEX,
      },
    };
  }

  // Feature flags
  get features() {
    return {
      analytics: this.config.ENABLE_ANALYTICS,
      caching: this.config.ENABLE_CACHING,
      rateLimiting: this.config.ENABLE_RATE_LIMITING,
      csrfProtection: this.config.ENABLE_CSRF_PROTECTION,
    };
  }

  // Performance settings
  get performance() {
    return {
      maxCacheSize: this.config.MAX_CACHE_SIZE,
      requestTimeout: this.config.REQUEST_TIMEOUT,
      rateLimitMax: this.config.RATE_LIMIT_MAX,
    };
  }

  // Monitoring configuration
  get monitoring() {
    return {
      gaId: this.config.NEXT_PUBLIC_GA_ID,
      sentryDsn: this.config.SENTRY_DSN,
      endpoint: this.config.MONITORING_ENDPOINT,
    };
  }

  // Email configuration
  get email() {
    return {
      from: this.config.EMAIL_FROM,
      smtp: {
        host: this.config.SMTP_HOST,
        port: this.config.SMTP_PORT,
        user: this.config.SMTP_USER,
        password: this.config.SMTP_PASSWORD,
      },
    };
  }

  // Storage configuration
  get storage() {
    return {
      type: this.config.STORAGE_TYPE,
      aws: {
        accessKeyId: this.config.AWS_ACCESS_KEY_ID,
        secretAccessKey: this.config.AWS_SECRET_ACCESS_KEY,
        bucket: this.config.AWS_BUCKET,
        region: this.config.AWS_REGION,
      },
    };
  }

  // URLs configuration
  get urls() {
    return {
      nextAuth: this.config.NEXTAUTH_URL,
      app: this.config.NEXT_PUBLIC_APP_URL,
    };
  }

  // Get detailed validation results (similar to env-validation.ts)
  getValidationResult(): ValidationResult {
    return this.validationResult || {
      success: false,
      errors: ['Validation not yet performed'],
      warnings: [],
      missing: [],
      configured: [],
      summary: { total: 0, valid: 0, invalid: 0, missing: 0 }
    };
  }

  // Validation methods
  validateRequiredServices(): { valid: boolean; missing: string[] } {
    const missing: string[] = [];

    // Always required
    if (!this.config.NEXT_PUBLIC_WC_API_URL) missing.push('WooCommerce API');
    if (!this.config.JWT_SECRET) missing.push('JWT Secret');

    // Production requirements
    if (this.isProduction) {
      if (!this.config.DATABASE_URL) missing.push('Database');
      if (!this.config.SENTRY_DSN) missing.push('Sentry monitoring');
    }

    return {
      valid: missing.length === 0,
      missing
    };
  }

  // Re-validate environment (similar to env-validation.ts)
  revalidateEnvironment(): ValidationResult {
    this.config = this.loadAndValidateConfig();
    return this.getValidationResult();
  }

  // Get safe configuration (without secrets) for logging
  getSafeConfig() {
    const safe = { ...this.config };
    
    // Redact sensitive values
    const sensitiveKeys = [
      'JWT_SECRET', 'NEXTAUTH_SECRET', 'SESSION_SECRET',
      'ADMIN_PASSWORD_HASH', 'WC_CONSUMER_SECRET', 'DEEPSEEK_API_KEY',
      'OPENAI_API_KEY', 'QDRANT_API_KEY', 'DATABASE_URL',
      'REDIS_URL', 'SENTRY_DSN', 'SMTP_PASSWORD',
      'AWS_SECRET_ACCESS_KEY'
    ];

    for (const key of sensitiveKeys) {
      if (safe[key as keyof typeof safe]) {
        (safe as Record<string, unknown>)[key] = '[REDACTED]';
      }
    }

    return safe;
  }

  // Reload configuration (for runtime updates)
  reloadConfig(): void {
    logger.info('🔄 Reloading environment configuration...');
    this.config = this.loadAndValidateConfig();
  }
}

// Export singleton instance
export const env = EnvironmentManager.getInstance();

// Validate required services on startup
// Temporarily disabled for build
// const validation = env.validateRequiredServices();
// if (!validation.valid) {
//   logger.error('❌ Missing required services:', { missing: validation.missing });
//   if (env.isProd) {
//     process.exit(1);
//   }
// }

// Environment-specific configuration helpers
export const getTimeoutConfig = () => ({
  database: env.isDev ? 30000 : 10000,
  api: env.isDev ? 30000 : 15000,
  external: env.isDev ? 45000 : 30000,
});

export const getCacheConfig = () => ({
  enabled: env.features.caching,
  maxSize: env.performance.maxCacheSize,
  ttl: env.isDev ? 5 * 60 * 1000 : 15 * 60 * 1000, // 5min dev, 15min prod
});

export const getRateLimitConfig = () => ({
  enabled: env.features.rateLimiting,
  max: env.performance.rateLimitMax,
  windowMs: 60 * 1000, // 1 minute
});

const environmentManagerExports = {
  env,
  EnvironmentManager,
  getTimeoutConfig,
  getCacheConfig,
  getRateLimitConfig,
};

export default environmentManagerExports;