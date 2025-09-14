import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import { logger } from '@/lib/logger';
import { getValidatedJwtSecret } from './jwt-config';
import { getSessionStore, SessionData } from './session-store';

// Unified auth types
export interface AuthUser {
  userId: string;
  username?: string;
  role: 'admin' | 'user' | 'readonly' | 'api-user';
  permissions: string[];
  sessionId?: string;
}

export interface AuthResult {
  isAuthenticated: boolean;
  user?: AuthUser;
  error?: string;
}

export interface AdminAuthResult {
  success: boolean;
  isAdmin: boolean;
  userId?: string;
  error?: string;
}

// JWT payload interface
interface CustomJwtPayload {
  userId: string;
  role: string;
  permissions: string[];
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

// Unified authentication class
class UnifiedAuthManager {
  private jwtSecret: string;

  constructor() {
    this.jwtSecret = getValidatedJwtSecret();
  }

  // Safe string comparison to prevent timing attacks
  private safeEqual(a: string, b: string): boolean {
    const aHash = createHash('sha256').update(a).digest();
    const bHash = createHash('sha256').update(b).digest();
    return timingSafeEqual(aHash, bHash);
  }

  // Generate secure API key with expiration
  generateApiKey(payload: {
    userId: string;
    role: AuthUser['role'];
    permissions: string[];
    expiresIn?: string;
  }): string {
    const expiresIn = payload.expiresIn ?? '24h';

    const token = jwt.sign(
      {
        userId: payload.userId,
        role: payload.role,
        permissions: payload.permissions,
        iat: Math.floor(Date.now() / 1000),
        jti: randomBytes(16).toString('hex'), // Unique token ID for revocation
      },
      this.jwtSecret,
      {
        expiresIn: expiresIn,
        issuer: 'agriko-api',
        audience: 'agriko-services'
      } as jwt.SignOptions
    );

    return token;
  }

  // Validate JWT token
  validateJwtToken(token: string): TokenValidationResult {
    try {
      const decoded = jwt.verify(token, this.jwtSecret, {
        issuer: 'agriko-api',
        audience: 'agriko-services'
      });

      // jwt.verify returns string | JwtPayload, but we only accept CustomJwtPayload
      if (typeof decoded === 'string') {
        return { valid: false, error: 'Invalid token format' };
      }

      // Define the expected JWT payload structure
      interface JwtPayloadStructure {
        userId: string;
        role: string;
        permissions: string[];
        iat: number;
        exp: number;
        jti?: string;
      }
      
      // Cast decoded to the expected structure
      const jwtPayload = decoded as JwtPayloadStructure;

      // Type assertion to our custom payload type
      const customPayload: CustomJwtPayload = {
        userId: jwtPayload.userId,
        role: jwtPayload.role,
        permissions: jwtPayload.permissions ?? [],
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

  // Session-based authentication using Redis/memory store
  private async validateSessionAuth(request: NextRequest): Promise<AuthResult> {
    try {
      const sessionCookie = request.cookies.get('auth-session');
      
      if (!sessionCookie?.value) {
        return { isAuthenticated: false, error: 'No session cookie' };
      }

      const sessionStore = await getSessionStore();
      const sessionData = await sessionStore.get(sessionCookie.value);
      
      if (!sessionData) {
        return { isAuthenticated: false, error: 'Session not found or expired' };
      }

      // Validate session hasn't expired
      const now = Date.now();
      const sessionAge = now - (sessionData.createdAt ?? now);
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      
      if (sessionAge > maxAge) {
        await sessionStore.delete(sessionCookie.value);
        return { isAuthenticated: false, error: 'Session expired' };
      }

      return {
        isAuthenticated: true,
        user: {
          userId: sessionData.userId,
          username: sessionData.username,
          role: sessionData.role as AuthUser['role'],
          permissions: sessionData.permissions,
          sessionId: sessionCookie.value,
        }
      };
    } catch (error) {
      logger.error('Session validation error:', error as Record<string, unknown>);
      return { isAuthenticated: false, error: 'Session validation failed' };
    }
  }

  // Bearer token authentication
  private validateBearerAuth(request: NextRequest): AuthResult {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return { isAuthenticated: false, error: 'Missing Bearer token' };
    }

    const token = authHeader.slice(7);
    const validation = this.validateJwtToken(token);

    if (validation.valid && validation.payload) {
      return {
        isAuthenticated: true,
        user: {
          userId: validation.payload.userId,
          role: (validation.payload.role as 'admin' | 'user' | 'readonly' | 'api-user') || 'user',
          permissions: validation.payload.permissions ?? []
        }
      };
    } else {
      return {
        isAuthenticated: false,
        error: validation.error ?? 'Invalid token'
      };
    }
  }

  // Basic authentication (environment variables only)
  private validateBasicAuth(request: NextRequest): AuthResult {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader?.startsWith('Basic ')) {
      return { isAuthenticated: false, error: 'Missing Basic auth' };
    }

    const credentials = Buffer.from(authHeader.slice(6), 'base64').toString();
    const [username, password] = credentials.split(':');

    const adminUsername = process.env.ADMIN_USERNAME ?? '';
    const adminPassword = process.env.ADMIN_PASSWORD ?? '';

    if (!adminUsername || !adminPassword) {
      return {
        isAuthenticated: false,
        error: 'Admin credentials not configured'
      };
    }

    if (this.safeEqual(username ?? '', adminUsername) && this.safeEqual(password ?? '', adminPassword)) {
      return {
        isAuthenticated: true,
        user: {
          userId: 'basic-admin',
          username: adminUsername,
          role: 'admin',
          permissions: ['read', 'write', 'delete', 'admin', 'analytics']
        }
      };
    }

    return { isAuthenticated: false, error: 'Invalid credentials' };
  }

  // Main authentication method - tries all methods in order
  async authenticate(request: NextRequest): Promise<AuthResult> {
    // 1. Try session-based auth first (for web interface)
    const sessionResult = await this.validateSessionAuth(request);
    if (sessionResult.isAuthenticated) {
      return sessionResult;
    }

    // 2. Try Bearer token auth (for API access)
    const bearerResult = this.validateBearerAuth(request);
    if (bearerResult.isAuthenticated) {
      return bearerResult;
    }

    // 3. Try Basic auth (fallback for simple admin access)
    const basicResult = this.validateBasicAuth(request);
    if (basicResult.isAuthenticated) {
      return basicResult;
    }

    return {
      isAuthenticated: false,
      error: 'No valid authentication method found'
    };
  }

  // Admin authentication wrapper
  async authenticateAdmin(request: NextRequest): Promise<AdminAuthResult> {
    const authResult = await this.authenticate(request);

    if (!authResult.isAuthenticated || !authResult.user) {
      return {
        success: false,
        isAdmin: false,
        error: authResult.error ?? 'Authentication required'
      };
    }

    // Check if user has admin privileges
    const isAdmin = authResult.user.role === 'admin' || 
                   authResult.user.permissions.includes('admin');

    if (!isAdmin) {
      logger.warn(`Unauthorized admin access attempt by user ${authResult.user.userId}`, {
        userId: authResult.user.userId,
        role: authResult.user.role,
        ip: this.getClientIP(request)
      });

      return {
        success: false,
        isAdmin: false,
        userId: authResult.user.userId,
        error: 'Admin privileges required'
      };
    }

    return {
      success: true,
      isAdmin: true,
      userId: authResult.user.userId
    };
  }

  // Check if user has specific permission
  hasPermission(user: AuthUser, requiredPermission: string): boolean {
    return user.permissions.includes(requiredPermission) || 
           user.permissions.includes('admin');
  }

  // Generate permissioned API key
  generatePermissionedApiKey(role: AuthUser['role']): string {
    const permissions = {
      admin: ['read', 'write', 'delete', 'admin', 'analytics'],
      readonly: ['read'],
      'api-user': ['read', 'write'],
      user: ['read']
    };

    return this.generateApiKey({
      userId: `${role}-${Date.now()}`,
      role,
      permissions: permissions[role],
      expiresIn: '30d' // 30 days for API keys
    });
  }

  // Utility: Get client IP
  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const clientIp = request.headers.get('cf-connecting-ip');

    if (forwarded) {
      const forwardedParts = forwarded.split(',');
      return forwardedParts[0]?.trim() ?? 'unknown';
    }
    
    return realIp ?? clientIp ?? 'unknown';
  }

  // Generate secure session token
  generateSessionToken(): string {
    return randomBytes(32).toString('hex');
  }

  // Hash token for storage
  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}

// Create singleton instance
const authManager = new UnifiedAuthManager();

// Export main functions
export async function validateApiAuth(request: NextRequest): Promise<AuthResult> {
  return authManager.authenticate(request);
}

export async function validateAdminAuth(request: NextRequest): Promise<AdminAuthResult> {
  return authManager.authenticateAdmin(request);
}

export function generateApiKey(payload: {
  userId: string;
  role: AuthUser['role'];
  permissions: string[];
  expiresIn?: string;
}): string {
  return authManager.generateApiKey(payload);
}

export function generatePermissionedApiKey(role: AuthUser['role']): string {
  return authManager.generatePermissionedApiKey(role);
}

export function hasPermission(user: AuthUser, requiredPermission: string): boolean {
  return authManager.hasPermission(user, requiredPermission);
}

export function generateSessionToken(): string {
  return authManager.generateSessionToken();
}

export function hashToken(token: string): string {
  return authManager.hashToken(token);
}

// Legacy compatibility exports
export const validateApiAuthSecure = validateApiAuth;

const unifiedAuth = {
  validateApiAuth,
  validateAdminAuth,
  generateApiKey,
  generatePermissionedApiKey,
  hasPermission,
  generateSessionToken,
  hashToken,
  authManager,
};

export default unifiedAuth;