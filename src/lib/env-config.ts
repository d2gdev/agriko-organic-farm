import { z } from 'zod';

import { logger } from '@/lib/logger';

// Environment validation schema
const envSchema = z.object({
  // Next.js
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // WooCommerce API
  NEXT_PUBLIC_WC_API_URL: z.string().url().optional(),
  WC_CONSUMER_KEY: z.string().min(1).optional(),
  WC_CONSUMER_SECRET: z.string().min(1).optional(),
  
  // Authentication
  ADMIN_USERNAME: z.string().min(1).default('admin'),
  ADMIN_PASSWORD: z.string().min(8).optional(),
  JWT_SECRET: z.string().min(32).optional(),
  
  // Third-party APIs
  GITHUB_TOKEN: z.string().optional(),
  GH_TOKEN: z.string().optional(),
  GOOGLE_ANALYTICS_ID: z.string().optional(),
  
  // AI/ML Services
  PINECONE_API_KEY: z.string().optional(),
  PINECONE_INDEX_NAME: z.string().optional(),
  PINECONE_HOST: z.string().url().optional(),
  DEEPSEEK_API_KEY: z.string().optional(),
  
  // Database
  MEMGRAPH_URL: z.string().optional(),
  MEMGRAPH_USER: z.string().optional(),
  MEMGRAPH_PASSWORD: z.string().optional(),
  
  // Security
  API_KEY: z.string().optional(),
  
  // Rate Limiting
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('60000'),
});

// Validate and parse environment variables
let env: z.infer<typeof envSchema>;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  logger.error('❌ Invalid environment configuration:');
  if (error instanceof z.ZodError) {
    error.errors.forEach((err) => {
      logger.error(`  - ${err.path.join('.')}: ${err.message}`);
    });
  }
  
  // In development, provide helpful guidance
  if (process.env.NODE_ENV === 'development') {
    logger.warn('💡 Copy .env.example to .env.local and configure your environment variables');
  }
  
  // Use fallback values for development
  env = {
    NODE_ENV: 'development',
    ADMIN_USERNAME: 'admin',
    ADMIN_PASSWORD: undefined,
    JWT_SECRET: undefined,
    NEXT_PUBLIC_WC_API_URL: undefined,
    WC_CONSUMER_KEY: undefined,
    WC_CONSUMER_SECRET: undefined,
    GITHUB_TOKEN: undefined,
    GH_TOKEN: undefined,
    GOOGLE_ANALYTICS_ID: undefined,
    PINECONE_API_KEY: undefined,
    PINECONE_INDEX_NAME: undefined,
    PINECONE_HOST: undefined,
    DEEPSEEK_API_KEY: undefined,
    MEMGRAPH_URL: undefined,
    MEMGRAPH_USER: undefined,
    MEMGRAPH_PASSWORD: undefined,
    API_KEY: undefined,
    RATE_LIMIT_MAX_REQUESTS: 100,
    RATE_LIMIT_WINDOW_MS: 60000,
  };
}

// Runtime configuration validation
export function validateRequiredEnvVars(required: (keyof typeof env)[]): void {
  const missing = required.filter(key => !env[key]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env.local file and ensure all required variables are set.'
    );
  }
}

// Safe environment access
export function getEnvVar(key: keyof typeof env, required = false): string | undefined {
  const value = env[key];
  
  if (required && !value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  
  return value?.toString();
}

// Specific getters for type safety
export const envConfig = {
  isProduction: env.NODE_ENV === 'production',
  isDevelopment: env.NODE_ENV === 'development',
  isTest: env.NODE_ENV === 'test',
  
  // WooCommerce
  wcApiUrl: env.NEXT_PUBLIC_WC_API_URL,
  wcConsumerKey: env.WC_CONSUMER_KEY,
  wcConsumerSecret: env.WC_CONSUMER_SECRET,
  
  // Auth
  adminUsername: env.ADMIN_USERNAME,
  adminPassword: env.ADMIN_PASSWORD,
  jwtSecret: env.JWT_SECRET,
  
  // External APIs
  githubToken: env.GITHUB_TOKEN ?? env.GH_TOKEN,
  googleAnalyticsId: env.GOOGLE_ANALYTICS_ID,
  pineconeApiKey: env.PINECONE_API_KEY,
  pineconeIndexName: env.PINECONE_INDEX_NAME,
  pineconeHost: env.PINECONE_HOST,
  deepseekApiKey: env.DEEPSEEK_API_KEY,
  
  // Database
  memgraphUrl: env.MEMGRAPH_URL,
  memgraphUser: env.MEMGRAPH_USER,
  memgraphPassword: env.MEMGRAPH_PASSWORD,
  
  // Security
  apiKey: env.API_KEY,
  rateLimitMaxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  rateLimitWindowMs: env.RATE_LIMIT_WINDOW_MS,
} as const;

export default envConfig;