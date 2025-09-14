import { randomBytes } from 'crypto';
import { logger } from '@/lib/logger';
import { getValidatedEnv } from '@/lib/startup-validation';

/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeEquals(a: string, b: string): boolean {
  // Always compare same length to prevent early termination
  const maxLength = Math.max(a.length, b.length);
  let result = a.length === b.length ? 0 : 1; // Different lengths = not equal
  
  for (let i = 0; i < maxLength; i++) {
    const charA = i < a.length ? a.charCodeAt(i) : 0;
    const charB = i < b.length ? b.charCodeAt(i) : 0;
    result |= charA ^ charB; // XOR will be 0 only if characters match
  }
  
  return result === 0;
}

// Single source of truth for JWT secret management
let cachedSecret: string | null = null;

/**
 * Get JWT secret from environment or generate a secure fallback
 * This ensures consistent secret handling across the entire application
 */
export function getJwtSecret(): string {
  // Return cached secret if available
  if (cachedSecret) {
    return cachedSecret;
  }

  // In production or when environment is validated, use the validated environment
  try {
    const env = getValidatedEnv();
    cachedSecret = env.JWT_SECRET;
    logger.info('✅ Using validated JWT_SECRET from environment');
    return cachedSecret;
  } catch {
    // Environment not validated yet, fall back to direct access
    logger.debug('Environment not validated yet, falling back to direct access');
  }

  // Try to get from environment directly (fallback for initialization phase)
  const envSecret = process.env.JWT_SECRET;
  
  if (envSecret && envSecret.length >= 32) {
    cachedSecret = envSecret;
    return cachedSecret;
  }

  // In production, require explicit JWT_SECRET
  if (process.env.NODE_ENV === 'production') {
    const error = 'JWT_SECRET environment variable is required in production and must be at least 32 characters';
    logger.error('🚨 Critical security error: JWT_SECRET not properly configured in production', { 
      error,
      length: envSecret?.length ?? 0,
      required: 32
    } as Record<string, unknown>);
    throw new Error(error);
  }
  
  // Generate secure fallback for development only
  cachedSecret = generateSecureSecret();
  
  logger.warn('⚠️ No valid JWT_SECRET found in environment variables. Generated temporary secret.');
  logger.warn('🔒 In production, set JWT_SECRET environment variable to a secure value (minimum 32 characters).');
  logger.warn('💡 Add JWT_SECRET to your .env.local file for consistent development.');
  
  return cachedSecret;
}

/**
 * Generate a cryptographically secure secret key
 */
function generateSecureSecret(): string {
  return randomBytes(64).toString('hex');
}

/**
 * Validate that JWT_SECRET meets security requirements
 */
export function validateJwtSecret(secret: string): boolean {
  // Minimum length for security
  if (secret.length < 32) {
    logger.warn('🔒 JWT_SECRET should be at least 32 characters long for security');
    return false;
  }
  
  // Check for common weak secrets using constant-time comparison
  const weakSecrets = ['secret', 'password', '123456', 'test', 'dev'];
  const lowerSecret = secret.toLowerCase();
  
  // Use constant-time comparison to prevent timing attacks
  let isWeak = false;
  for (const weakSecret of weakSecrets) {
    if (constantTimeEquals(lowerSecret, weakSecret)) {
      isWeak = true;
      // Continue checking all secrets to maintain constant time
    }
  }
  
  if (isWeak) {
    logger.warn('🔒 JWT_SECRET appears to be a weak secret. Use a strong random value.');
    return false;
  }
  
  return true;
}

/**
 * Get JWT secret with enforced validation
 */
export function getValidatedJwtSecret(): string {
  const secret = getJwtSecret();
  const isValid = validateJwtSecret(secret);
  
  // In production, enforce strong secrets
  if (!isValid && process.env.NODE_ENV === 'production') {
    const error = 'JWT_SECRET validation failed - weak or insecure secret detected in production';
    logger.error('🚨 SECURITY ERROR: Weak JWT secret in production:', { 
      error,
      secretLength: secret.length,
      environment: process.env.NODE_ENV 
    } as Record<string, unknown>);
    throw new Error(error);
  }
  
  // In development, log warning but continue
  if (!isValid) {
    logger.warn('⚠️ JWT_SECRET validation failed in development - consider using a stronger secret');
  }
  
  return secret;
}