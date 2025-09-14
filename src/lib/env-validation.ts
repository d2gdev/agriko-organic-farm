import { logger } from './logger';

// Environment validation schemas
interface EnvValidationRule {
  key: string;
  required: boolean;
  type: 'string' | 'number' | 'boolean' | 'url' | 'email';
  description: string;
  validation?: (value: string) => boolean;
  transform?: (value: string) => string | number | boolean;
  defaultValue?: string | number | boolean;
  sensitiveData?: boolean;
}

// Production environment requirements
const PRODUCTION_ENV_RULES: EnvValidationRule[] = [
  // Application basics
  {
    key: 'NODE_ENV',
    required: true,
    type: 'string',
    description: 'Application environment',
    validation: (value) => ['development', 'production', 'test'].includes(value)
  },
  {
    key: 'NEXT_PUBLIC_SITE_URL',
    required: true,
    type: 'url',
    description: 'Public site URL for CORS and redirects'
  },

  // Security
  {
    key: 'JWT_SECRET',
    required: true,
    type: 'string',
    description: 'JWT signing secret (256-bit minimum)',
    validation: (value) => value.length >= 32,
    sensitiveData: true
  },
  {
    key: 'ADMIN_USERNAME',
    required: true,
    type: 'string',
    description: 'Admin username for basic auth',
    validation: (value) => value.length >= 4
  },
  {
    key: 'ADMIN_PASSWORD',
    required: true,
    type: 'string',
    description: 'Admin password for basic auth',
    validation: (value) => value.length >= 12,
    sensitiveData: true
  },

  // Redis configuration
  {
    key: 'REDIS_URL',
    required: false,
    type: 'url',
    description: 'Redis connection string for session storage',
    sensitiveData: true
  },
  {
    key: 'REDIS_PASSWORD',
    required: false,
    type: 'string',
    description: 'Redis password if required',
    sensitiveData: true
  },

  // Remote logging
  {
    key: 'ENABLE_REMOTE_LOGGING',
    required: false,
    type: 'boolean',
    description: 'Enable remote logging services',
    defaultValue: false,
    transform: (value) => value === 'true'
  },
  {
    key: 'DATADOG_API_KEY',
    required: false,
    type: 'string',
    description: 'Datadog API key for logging',
    validation: (value) => value.length >= 32,
    sensitiveData: true
  },
  {
    key: 'SPLUNK_TOKEN',
    required: false,
    type: 'string',
    description: 'Splunk HEC token',
    validation: (value) => value.length >= 36,
    sensitiveData: true
  },

  // Cache configuration
  {
    key: 'MAX_CACHE_MEMORY_MB',
    required: false,
    type: 'number',
    description: 'Maximum cache memory in MB',
    defaultValue: 200,
    validation: (value) => parseInt(value) > 0 && parseInt(value) <= 2048,
    transform: (value) => parseInt(value)
  },
  {
    key: 'CACHE_WARNING_THRESHOLD',
    required: false,
    type: 'number',
    description: 'Cache warning threshold percentage',
    defaultValue: 80,
    validation: (value) => parseInt(value) > 0 && parseInt(value) <= 100,
    transform: (value) => parseInt(value)
  },

  // WooCommerce
  {
    key: 'NEXT_PUBLIC_WC_API_URL',
    required: true,
    type: 'url',
    description: 'WooCommerce API endpoint'
  },
  {
    key: 'WC_CONSUMER_KEY',
    required: true,
    type: 'string',
    description: 'WooCommerce API consumer key',
    validation: (value) => value.startsWith('ck_'),
    sensitiveData: true
  },
  {
    key: 'WC_CONSUMER_SECRET',
    required: true,
    type: 'string',
    description: 'WooCommerce API consumer secret',
    validation: (value) => value.startsWith('cs_'),
    sensitiveData: true
  }
];

// Validation results
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

/**
 * Environment configuration validator
 */
export class EnvironmentValidator {
  private validatedConfig: Record<string, string | number | boolean> = {};

  /**
   * Validate all environment variables
   */
  validateEnvironment(): ValidationResult {
    const result: ValidationResult = {
      success: true,
      errors: [],
      warnings: [],
      missing: [],
      configured: [],
      summary: {
        total: PRODUCTION_ENV_RULES.length,
        valid: 0,
        invalid: 0,
        missing: 0
      }
    };

    for (const rule of PRODUCTION_ENV_RULES) {
      const value = process.env[rule.key];

      if (!value) {
        if (rule.required) {
          result.errors.push(`Missing required environment variable: ${rule.key} - ${rule.description}`);
          result.missing.push(rule.key);
          result.summary.missing++;
          result.success = false;
        } else if (rule.defaultValue !== undefined) {
          this.validatedConfig[rule.key] = rule.defaultValue;
          result.warnings.push(`Using default value for ${rule.key}: ${rule.defaultValue}`);
          result.configured.push(rule.key);
          result.summary.valid++;
        } else {
          result.warnings.push(`Optional environment variable not set: ${rule.key} - ${rule.description}`);
        }
        continue;
      }

      // Validate type
      let isValid = true;
      let transformedValue: string | number | boolean = value;

      switch (rule.type) {
        case 'number':
          isValid = !isNaN(Number(value));
          if (isValid) transformedValue = Number(value);
          break;
        case 'boolean':
          isValid = value === 'true' || value === 'false';
          if (isValid) transformedValue = value === 'true';
          break;
        case 'url':
          try {
            new URL(value);
          } catch {
            isValid = false;
          }
          break;
        case 'email':
          isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
          break;
      }

      // Custom validation
      if (isValid && rule.validation) {
        isValid = rule.validation(value);
      }

      // Transform value if needed
      if (isValid && rule.transform) {
        transformedValue = rule.transform(value);
      }

      if (isValid) {
        this.validatedConfig[rule.key] = transformedValue;
        result.configured.push(rule.key);
        result.summary.valid++;
      } else {
        result.errors.push(`Invalid ${rule.type} value for ${rule.key}: ${value} - ${rule.description}`);
        result.summary.invalid++;
        result.success = false;
      }
    }

    return result;
  }

  /**
   * Get validated configuration
   */
  getValidatedConfig(): Record<string, string | number | boolean> {
    return { ...this.validatedConfig };
  }

  /**
   * Get a specific validated value
   */
  getValidatedValue(key: string): string | number | boolean | undefined {
    return this.validatedConfig[key];
  }
}

// Singleton instance
const environmentValidator = new EnvironmentValidator();

/**
 * Validate environment and get validated config
 */
export function validateEnvironment(): ValidationResult {
  return environmentValidator.validateEnvironment();
}

/**
 * Get validated configuration
 */
export function getValidatedConfig(): Record<string, string | number | boolean> {
  return environmentValidator.getValidatedConfig();
}

/**
 * Get a specific validated value
 */
export function getValidatedValue(key: string): string | number | boolean | undefined {
  return environmentValidator.getValidatedValue(key);
}

// Run validation on import
const validation = validateEnvironment();

if (!validation.success) {
  logger.error('❌ Environment validation failed', {
    errors: validation.errors,
    missing: validation.missing
  });
  
  // In production, exit if validation fails
  if (process.env.NODE_ENV === 'production') {
    logger.error('Exiting due to environment validation failure');
    process.exit(1);
  }
} else {
  logger.info('✅ Environment validation passed', {
    configured: validation.configured.length,
    warnings: validation.warnings.length
  });
  
  if (validation.warnings.length > 0) {
    logger.warn('Environment warnings:', { warnings: [...validation.warnings] });
  }
}

// Export validated config
export const validatedConfig = getValidatedConfig();
