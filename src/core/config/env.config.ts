/**
 * Environment Configuration with Validation
 * Fails fast if required environment variables are missing
 */

import { z } from 'zod';
import * as dotenv from 'dotenv';
import { logger } from '@/lib/logger';

// Load environment variables
dotenv.config();
if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: '.env.production' });
}

// Define schema for environment variables
const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('3000').transform(Number),

  // Database (Qdrant - ONLY database)
  QDRANT_URL: z.string().url().default('http://143.42.189.57:6333'),
  QDRANT_API_KEY: z.string().optional(),

  // Authentication (REQUIRED in production, no defaults)
  JWT_SECRET: z.string().min(32).refine(
    (val) => process.env.NODE_ENV !== 'production' || val !== undefined,
    'JWT_SECRET is required in production'
  ),

  ENCRYPTION_KEY: z.string().min(32).refine(
    (val) => process.env.NODE_ENV !== 'production' || val !== undefined,
    'ENCRYPTION_KEY is required in production'
  ),

  // WooCommerce Integration
  WOOCOMMERCE_URL: z.string().url().optional(),
  WOOCOMMERCE_KEY: z.string().optional(),
  WOOCOMMERCE_SECRET: z.string().optional(),

  // External Services (optional)
  SENTRY_DSN: z.string().url().optional(),
  DEEPSEEK_API_KEY: z.string().optional(),

  // Application URLs
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
});

// Parse and validate environment variables
let config: z.infer<typeof envSchema>;

try {
  config = envSchema.parse(process.env);

  // Log successful configuration (without sensitive values)
  logger.info('Environment configuration validated', {
    NODE_ENV: config.NODE_ENV,
    PORT: config.PORT,
    QDRANT_URL: config.QDRANT_URL,
    HAS_JWT_SECRET: !!config.JWT_SECRET,
    HAS_ENCRYPTION_KEY: !!config.ENCRYPTION_KEY,
    HAS_WOOCOMMERCE: !!config.WOOCOMMERCE_URL,
  });
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('❌ Environment validation failed:');
    error.errors.forEach((err) => {
      console.error(`  - ${err.path.join('.')}: ${err.message}`);
    });
    console.error('\n📝 Required environment variables:');
    console.error('  - JWT_SECRET (min 32 chars)');
    console.error('  - ENCRYPTION_KEY (min 32 chars)');
    console.error('  - QDRANT_URL (default: http://localhost:6335)');
    process.exit(1);
  }
  throw error;
}

// Generate secure defaults for development only
if (config.NODE_ENV === 'development') {
  if (!config.JWT_SECRET) {
    config.JWT_SECRET = 'dev-jwt-secret-DO-NOT-USE-IN-PRODUCTION-' + Date.now();
    logger.warn('Using development JWT_SECRET - DO NOT USE IN PRODUCTION');
  }
  if (!config.ENCRYPTION_KEY) {
    config.ENCRYPTION_KEY = 'dev-encryption-key-DO-NOT-USE-IN-PROD-' + Date.now();
    logger.warn('Using development ENCRYPTION_KEY - DO NOT USE IN PRODUCTION');
  }
}

// Export validated configuration
export { config };

// Export type for use in other files
export type Config = typeof config;