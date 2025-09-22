// Startup validation to ensure type safety at runtime
import { validateEnvironmentVariables, type Environment } from '@/lib/validation-schemas';
import { logger } from '@/lib/logger';

/**
 * Creates a fallback environment for development mode
 */
function createFallbackEnvironment(): Environment {
  return {
    NODE_ENV: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
    NEXT_PUBLIC_WC_API_URL: process.env.NEXT_PUBLIC_WC_API_URL || 'https://shop.agrikoph.com/wp-json/wc/v3',
    WC_CONSUMER_KEY: process.env.WC_CONSUMER_KEY || 'fallback_key',
    WC_CONSUMER_SECRET: process.env.WC_CONSUMER_SECRET || 'fallback_secret',
    JWT_SECRET: process.env.JWT_SECRET || 'fallback_jwt_secret_minimum_32_chars_long',
    ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH || 'fallback_hash_minimum_20_chars',
    ADMIN_USERNAME: process.env.ADMIN_USERNAME || 'admin',
    MEMGRAPH_URL: process.env.MEMGRAPH_URL,
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
    PINECONE_API_KEY: process.env.PINECONE_API_KEY,
    PINECONE_INDEX_NAME: process.env.PINECONE_INDEX_NAME,
  };
}

let validatedEnv: Environment | null = null;

/**
 * Validates environment variables on startup
 * Call this in your app startup (layout.tsx or _app.tsx)
 */
export function initializeEnvironmentValidation(): Environment {
  if (validatedEnv) {
    return validatedEnv;
  }

  try {
    logger.info('🔍 Validating environment variables...');
    validatedEnv = validateEnvironmentVariables();
    logger.info('✅ Environment validation passed');
    return validatedEnv;
  } catch (error) {
    // In development, provide fallback environment with warnings
    if (process.env.NODE_ENV === 'development') {
      logger.warn('⚠️ Environment validation failed in development mode - using fallback values');
      validatedEnv = createFallbackEnvironment();
      return validatedEnv;
    } else {
      logger.error('❌ Environment validation failed in production mode');
      throw error;
    }
  }
}

/**
 * Get validated environment variables (type-safe)
 */
export function getValidatedEnv(): Environment {
  if (!validatedEnv) {
    throw new Error('Environment not validated. Call initializeEnvironmentValidation() first.');
  }
  return validatedEnv;
}

/**
 * Type-safe environment variable access
 */
export const env = {
  get NODE_ENV() { return getValidatedEnv().NODE_ENV; },
  get WC_API_URL() { return getValidatedEnv().NEXT_PUBLIC_WC_API_URL; },
  get WC_CONSUMER_KEY() { return getValidatedEnv().WC_CONSUMER_KEY; },
  get WC_CONSUMER_SECRET() { return getValidatedEnv().WC_CONSUMER_SECRET; },
  get JWT_SECRET() { return getValidatedEnv().JWT_SECRET; },
  get ADMIN_PASSWORD_HASH() { return getValidatedEnv().ADMIN_PASSWORD_HASH; },
  get ADMIN_USERNAME() { return getValidatedEnv().ADMIN_USERNAME; },
  get MEMGRAPH_URL() { return getValidatedEnv().MEMGRAPH_URL; },
  get DEEPSEEK_API_KEY() { return getValidatedEnv().DEEPSEEK_API_KEY; },
  get PINECONE_API_KEY() { return getValidatedEnv().PINECONE_API_KEY; },
  get PINECONE_INDEX_NAME() { return getValidatedEnv().PINECONE_INDEX_NAME; },
  
  // Computed properties
  get isDevelopment() { return this.NODE_ENV === 'development'; },
  get isProduction() { return this.NODE_ENV === 'production'; },
  get isTest() { return this.NODE_ENV === 'test'; }
};

/**
 * Runtime type checking for API responses
 */
export function createTypedApiClient<TRequest, TResponse>(
  endpoint: string,
  requestValidator: (data: unknown) => TRequest,
  responseValidator: (data: unknown) => TResponse
) {
  return async (data: TRequest): Promise<TResponse> => {
    // Validate request data
    const validatedRequest = requestValidator(data);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validatedRequest)
    });
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }
    
    const responseData = await response.json() as unknown;
    
    // Validate response data
    return responseValidator(responseData);
  };
}

/**
 * Type-safe local storage access
 */
export const typedStorage = {
  setItem<T>(key: string, value: T, _validator: (data: unknown) => T): void {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
    } catch (error) {
      logger.error(`Failed to store ${key}:`, error as Record<string, unknown>);
    }
  },

  getItem<T>(key: string, validator: (data: unknown) => T): T | null {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return null;
      
      const parsed = JSON.parse(stored) as unknown;
      return validator(parsed);
    } catch (error) {
      logger.warn(`Failed to retrieve/validate ${key}:`, error as Record<string, unknown>);
      localStorage.removeItem(key); // Clean up invalid data
      return null;
    }
  },

  removeItem(key: string): void {
    localStorage.removeItem(key);
  }
};

/**
 * Development-only type checking
 */
export function devTypeCheck<T>(value: unknown, validator: (data: unknown) => T, name: string): T {
  if (env.isDevelopment) {
    try {
      return validator(value);
    } catch (error) {
      logger.error(`Type validation failed for ${name}:`, error as Record<string, unknown>);
      throw error;
    }
  }
  return value as T; // Skip validation in production for performance
}