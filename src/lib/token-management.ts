import jwt, { SignOptions } from 'jsonwebtoken';
import { logger } from '@/lib/logger';

import { randomBytes } from 'crypto';
import { getValidatedJwtSecret } from './jwt-config';

// Different token types with different lifespans
export type TokenType = 'access' | 'refresh' | 'service' | 'session';

export interface TokenConfig {
  type: TokenType;
  expiresIn: string;
  refreshable: boolean;
  description: string;
}

// JWT payload interfaces
interface BaseJwtPayload {
  userId: string;
  type: 'access' | 'refresh' | 'service' | 'session';
  iat: number;
  exp: number;
  iss?: string;
  aud?: string;
}

interface AccessTokenPayload extends BaseJwtPayload {
  type: 'access';
  email?: string;
  sessionId?: string;
}

interface RefreshTokenPayload extends BaseJwtPayload {
  type: 'refresh';
  jti?: string;
}

type JwtPayload = AccessTokenPayload | RefreshTokenPayload | BaseJwtPayload;

export const TOKEN_CONFIGS: Record<TokenType, TokenConfig> = {
  // Short-lived access tokens (auto-refreshed)
  access: {
    type: 'access',
    expiresIn: '1h',
    refreshable: true,
    description: 'Short-lived token for API access'
  },
  
  // Long-lived refresh tokens (used to get new access tokens)
  refresh: {
    type: 'refresh',
    expiresIn: '90d',
    refreshable: false,
    description: 'Long-lived token for refreshing access tokens'
  },
  
  // Service tokens (long-lived, for automated systems)
  service: {
    type: 'service',
    expiresIn: '1y',
    refreshable: false,
    description: 'Long-lived token for service-to-service communication'
  },
  
  // Session tokens (medium-lived, for web sessions)
  session: {
    type: 'session',
    expiresIn: '24h',
    refreshable: true,
    description: 'Session token for web interface'
  }
};

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface ServiceToken {
  token: string;
  type: 'service';
  expiresIn: string;
  permissions: string[];
  description: string;
}

// Generate a token pair (access + refresh)
export function generateTokenPair(payload: {
  userId: string;
  role: string;
  permissions: string[];
}): TokenPair {
  const secret: string = getJwtSecret();
  const now = Math.floor(Date.now() / 1000);
  
  // Generate access token (1 hour)
  const accessToken = jwt.sign(
    {
      ...payload,
      type: 'access',
      iat: now,
      jti: randomBytes(16).toString('hex')
    },
    secret,
    {
      expiresIn: TOKEN_CONFIGS.access.expiresIn,
      issuer: 'agriko-api',
      audience: 'agriko-services'
    } as SignOptions
  );
  
  // Generate refresh token (90 days)
  const refreshToken = jwt.sign(
    {
      userId: payload.userId,
      type: 'refresh',
      iat: now,
      jti: randomBytes(16).toString('hex')
    },
    secret,
    {
      expiresIn: TOKEN_CONFIGS.refresh.expiresIn,
      issuer: 'agriko-api',
      audience: 'agriko-refresh'
    } as SignOptions
  );
  
  return {
    accessToken,
    refreshToken,
    expiresIn: 3600, // 1 hour in seconds
    tokenType: 'Bearer'
  };
}

// Generate a long-lived service token (for automation)
export function generateServiceToken(payload: {
  userId: string;
  role: string;
  permissions: string[];
  description: string;
  expiresIn?: string;
}): ServiceToken {
  const secret: string = getJwtSecret();
  const expiresIn = payload.expiresIn ?? TOKEN_CONFIGS.service.expiresIn;
  
  const token = jwt.sign(
    {
      userId: payload.userId,
      role: payload.role,
      permissions: payload.permissions,
      type: 'service',
      description: payload.description,
      iat: Math.floor(Date.now() / 1000),
      jti: randomBytes(16).toString('hex')
    },
    secret,
    {
      expiresIn,
      issuer: 'agriko-api',
      audience: 'agriko-services'
    } as SignOptions
  );
  
  return {
    token,
    type: 'service',
    expiresIn,
    permissions: payload.permissions,
    description: payload.description
  };
}

// Refresh an access token using refresh token
export function refreshAccessToken(refreshToken: string): { accessToken: string; expiresIn: number } | null {
  try {
    const secret: string = getValidatedJwtSecret();
    const decoded = jwt.verify(refreshToken, secret, {
      issuer: 'agriko-api',
      audience: 'agriko-refresh'
    }) as RefreshTokenPayload;
    
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type for refresh');
    }
    
    // Generate new access token
    const accessToken = jwt.sign(
      {
        userId: decoded.userId,
        type: 'access',
        iat: Math.floor(Date.now() / 1000),
        jti: randomBytes(16).toString('hex')
      },
      secret,
      {
        expiresIn: TOKEN_CONFIGS.access.expiresIn,
        issuer: 'agriko-api',
        audience: 'agriko-services'
      } as SignOptions
    );
    
    return {
      accessToken,
      expiresIn: 3600 // 1 hour
    };
    
  } catch (error) {
    logger.error('Token refresh failed:', error as Record<string, unknown>);
    return null;
  }
}

// Validate any token and return its info
export function validateToken(token: string): {
  valid: boolean;
  payload?: JwtPayload;
  error?: string;
  needsRefresh?: boolean;
} {
  try {
    const secret = getValidatedJwtSecret();
    const decoded = jwt.verify(token, secret) as JwtPayload;
    
    // Check if token expires soon (within 5 minutes)
    const now = Math.floor(Date.now() / 1000);
    const needsRefresh = decoded.type === 'access' && (decoded.exp - now) < 300;
    
    return {
      valid: true,
      payload: decoded,
      needsRefresh
    };
    
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return { valid: false, error: 'Token has expired', needsRefresh: true };
    } else if (error instanceof jwt.JsonWebTokenError) {
      return { valid: false, error: 'Invalid token' };
    } else {
      return { valid: false, error: 'Token validation failed' };
    }
  }
}

// Use centralized JWT secret management
function getJwtSecret(): string {
  return getValidatedJwtSecret();
}

// Token storage interface (implement with database in production)
export interface TokenStore {
  saveTokenPair(userId: string, tokens: TokenPair): Promise<void>;
  getRefreshToken(userId: string): Promise<string | null>;
  revokeTokens(userId: string): Promise<void>;
  isTokenRevoked(jti: string): Promise<boolean>;
}

// In-memory token store (replace with database in production)
class MemoryTokenStore implements TokenStore {
  private refreshTokens = new Map<string, string>();
  private revokedTokens = new Set<string>();
  
  async saveTokenPair(userId: string, tokens: TokenPair): Promise<void> {
    this.refreshTokens.set(userId, tokens.refreshToken);
  }
  
  async getRefreshToken(userId: string): Promise<string | null> {
    return this.refreshTokens.get(userId) ?? null;
  }
  
  async revokeTokens(userId: string): Promise<void> {
    this.refreshTokens.delete(userId);
  }
  
  async isTokenRevoked(jti: string): Promise<boolean> {
    return this.revokedTokens.has(jti);
  }
}

export const tokenStore = new MemoryTokenStore();