import jwt from 'jsonwebtoken';
import { createHash, randomBytes } from 'crypto';
import { NextRequest } from 'next/server';
import { getValidatedJwtSecret } from './jwt-config';

// JWT payload interface
interface CustomJwtPayload {
  userId: string;
  role: UserRole;
  permissions: Permission[];
  iat: number;
  exp: number;
  jti?: string;
}

// Token validation result interface
interface TokenValidationResult {
  valid: boolean;
  payload?: CustomJwtPayload;
  error?: string;
}

// Use centralized JWT secret management
function getJwtSecret(): string {
  return getValidatedJwtSecret();
}

// Generate a secure API key with expiration
export function generateApiKey(payload: {
  userId: string;
  role: UserRole;
  permissions: Permission[];
  expiresIn?: string;
}): string {
  const secret = getJwtSecret();
  const expiresIn = payload.expiresIn ?? '24h';
  
  const token = jwt.sign(
    {
      userId: payload.userId,
      role: payload.role,
      permissions: payload.permissions,
      iat: Math.floor(Date.now() / 1000),
      jti: randomBytes(16).toString('hex'), // Unique token ID for revocation
    },
    secret,
    { 
      expiresIn: expiresIn,
      issuer: 'agriko-api',
      audience: 'agriko-services'
    } as jwt.SignOptions
  );
  
  return token;
}

// Validate JWT token
export function validateJwtToken(token: string): TokenValidationResult {
  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret, {
      issuer: 'agriko-api',
      audience: 'agriko-services'
    });
    
    // jwt.verify returns string | JwtPayload, but we only accept JwtPayload
    if (typeof decoded === 'string') {
      return { valid: false, error: 'Invalid token format' };
    }
    
    // Define the expected JWT payload structure
    interface JwtPayloadStructure {
      userId: string;
      role: UserRole;
      permissions: Permission[];
      iat: number;
      exp: number;
      jti?: string;
    }
    
    // Cast decoded to the expected structure
    const jwtPayload = decoded as JwtPayloadStructure;
    
    // Map the decoded payload to our custom interface
    const customPayload: CustomJwtPayload = {
      userId: jwtPayload.userId,
      role: jwtPayload.role,
      permissions: jwtPayload.permissions || [],
      iat: jwtPayload.iat,
      exp: jwtPayload.exp,
      jti: jwtPayload.jti
    };
    
    return { valid: true, payload: customPayload };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return { valid: false, error: 'Token has expired' };
    } else if (error instanceof jwt.JsonWebTokenError) {
      return { valid: false, error: 'Invalid token' };
    } else {
      return { valid: false, error: 'Token validation failed' };
    }
  }
}

// Generate a secure session token
export function generateSessionToken(): string {
  return randomBytes(32).toString('hex');
}

// Hash a token for storage (never store raw tokens)
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

// Generate API key with specific permissions
export function generatePermissionedApiKey(role: UserRole.ADMIN | UserRole.READONLY | UserRole.API_USER): string {
  return generateApiKey({
    userId: `${role}-${Date.now()}`,
    role,
    permissions: ROLE_PERMISSIONS[role],
    expiresIn: '30d' // 30 days for API keys
  });
}

// Import shared AuthResult type
import { AuthResult, AuthUser, UserRole, Permission, ROLE_PERMISSIONS } from '@/types/auth';

export function validateApiAuthSecure(request: NextRequest): AuthResult {
  // Check for session cookies (from web interface)
  const authCookie = request.cookies.get('admin-auth');
  const sessionToken = request.cookies.get('admin-session');
  
  if (authCookie?.value === 'authenticated' && sessionToken?.value) {
    return {
      isAuthenticated: true,
      user: {
        userId: 'web-admin',
        username: 'admin',
        email: 'admin@agriko.local',
        role: UserRole.ADMIN,
        permissions: ROLE_PERMISSIONS[UserRole.ADMIN]
      } as AuthUser
    };
  }
  
  // Check for Authorization header with JWT
  const authHeader = request.headers.get('authorization');
  
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const validation = validateJwtToken(token);
    
    if (validation.valid && validation.payload) {
      return {
        isAuthenticated: true,
        user: {
          userId: validation.payload.userId,
          username: validation.payload.userId,  // Use userId as fallback
          email: `${validation.payload.userId}@agriko.local`,
          role: validation.payload.role,
          permissions: validation.payload.permissions || []
        } as AuthUser
      };
    } else {
      return {
        isAuthenticated: false,
        error: validation.error ?? 'Invalid token'
      };
    }
  }
  
  // Basic auth removed for security - use JWT tokens only
  // Basic authentication has been deprecated due to security concerns
  // All API access must use proper JWT authentication
  
  return {
    isAuthenticated: false,
    error: 'Authentication required'
  };
}

// Check if user has specific permission
export function hasPermission(user: { permissions: Permission[] }, requiredPermission: Permission): boolean {
  return user.permissions.includes(requiredPermission) || user.permissions.includes(Permission.ADMIN_FULL);
}

// Rate limiting with token buckets (more sophisticated than simple counters)
interface TokenBucket {
  tokens: number;
  lastRefill: number;
  capacity: number;
  refillRate: number;
}

const rateLimitBuckets = new Map<string, TokenBucket>();

export function checkAdvancedRateLimit(
  clientId: string, 
  capacity: number = 100, 
  refillRate: number = 10, // tokens per second
  tokensRequired: number = 1
): boolean {
  const now = Date.now();
  let bucket = rateLimitBuckets.get(clientId);
  
  if (!bucket) {
    bucket = { tokens: capacity, lastRefill: now, capacity, refillRate };
    rateLimitBuckets.set(clientId, bucket);
  }
  
  // Refill tokens based on time elapsed
  const timePassed = (now - bucket.lastRefill) / 1000;
  const tokensToAdd = Math.floor(timePassed * refillRate);
  bucket.tokens = Math.min(bucket.capacity, bucket.tokens + tokensToAdd);
  bucket.lastRefill = now;
  
  // Check if enough tokens available
  if (bucket.tokens >= tokensRequired) {
    bucket.tokens -= tokensRequired;
    return true;
  }
  
  return false;
}

// Generate a secure random string for various purposes
export function generateSecureRandom(length: number = 32): string {
  return randomBytes(length).toString('hex');
}