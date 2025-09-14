import { NextRequest } from 'next/server';
import { logger } from '@/lib/logger';
import { handleError } from '@/lib/error-sanitizer';

import { timingSafeEqual, createHash } from 'crypto';
import type { AuthResult, AuthUser } from './auth-types';

function safeEqual(a: string, b: string): boolean {
  // Compare using constant-time hash comparison to avoid length leaks
  const aHash = createHash('sha256').update(a).digest();
  const bHash = createHash('sha256').update(b).digest();
  return timingSafeEqual(aHash, bHash);
}

export async function validateApiAuth(request: NextRequest): Promise<AuthResult> {
  // Try session-based auth first (standardized cookie name)
  try {
    const { getSessionFromRequest } = await import('./session-management');
    const sessionResult = await getSessionFromRequest(request);
    if (sessionResult.valid && sessionResult.session) {
      const user: AuthUser = {
        userId: sessionResult.session.userId,
        username: sessionResult.session.username,
        role: sessionResult.session.role,
        permissions: sessionResult.session.permissions,
      };
      return { isAuthenticated: true, user };
    }
  } catch (error) {
    const errorData = handleError(error, 'validateAuth - session validation');
    logger.error('Session validation error:', errorData);
  }

  // Check Authorization header (API access)
  const authHeader = request.headers.get('authorization');

  if (authHeader) {
    // Bearer token authentication - use secure validation
    if (authHeader.startsWith('Bearer ')) {
      try {
        const { validateApiAuthSecure } = await import('./secure-auth');
        const secureResult = validateApiAuthSecure(request);
        return secureResult;
      } catch (error) {
        const errorData = handleError(error, 'validateAuth - bearer token validation');
        logger.error('Bearer token validation error:', errorData);
        return { isAuthenticated: false, error: 'Invalid token format' };
      }
    }

    // Basic authentication with environment validation
    if (authHeader.startsWith('Basic ')) {
      const credentials = Buffer.from(authHeader.slice(6), 'base64').toString();
      const credentialsParts = credentials.split(':');
      const username = credentialsParts[0] ?? '';
      const password = credentialsParts[1] ?? '';

      const adminUsername = process.env.ADMIN_USERNAME ?? '';
      const adminPassword = process.env.ADMIN_PASSWORD ?? '';
      const adminPasswordBcrypt = process.env.ADMIN_PASSWORD_BCRYPT ?? '';

      // If bcrypt hash is provided, prefer secure compare
      if (adminPasswordBcrypt) {
        try {
          const bcrypt = await import('bcryptjs');
          const userOk = adminUsername ? safeEqual(username, adminUsername as string) : false;
          const passOk = await bcrypt.compare(password, adminPasswordBcrypt as string).catch(() => false);
          if (userOk && passOk) {
            const user: AuthUser = { username, role: 'administrator' };
            return { isAuthenticated: true, user };
          }
        } catch (error) {
          const errorData = handleError(error, 'validateAuth - bcrypt comparison');
          logger.error('bcrypt comparison failed, falling back to constant-time compare:', errorData);
        }
      }

      // Fallback to constant-time comparison of plaintext credentials
      if (adminUsername && adminPassword) {
        const userOk = safeEqual(username, adminUsername as string);
        const passOk = safeEqual(password, adminPassword as string);
        if (userOk && passOk) {
          const user: AuthUser = { username, role: 'administrator' };
          return { isAuthenticated: true, user };
        }
      }
    }
  }

  return { isAuthenticated: false, error: 'Authentication required' };
}

export function createAuthResponse(error: string, status: number = 401) {
  return new Response(
    JSON.stringify({
      error,
      message: 'Authentication required for this endpoint',
      timestamp: new Date().toISOString()
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        'WWW-Authenticate': 'Bearer realm="API", Basic realm="Admin"'
      }
    }
  );
}

// Rate limiting for medium-risk APIs
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(clientId: string, maxRequests: number = 100, windowMs: number = 60000): boolean {
  const now = Date.now();
  const clientData = rateLimitMap.get(clientId);
  
  if (!clientData || now > clientData.resetTime) {
    rateLimitMap.set(clientId, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (clientData.count >= maxRequests) {
    return false;
  }
  
  clientData.count++;
  return true;
}

export function getClientId(request: NextRequest): string {
  // Use IP address as client identifier
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0]?.trim() : request.headers.get('x-real-ip') ?? 'unknown';
  return ip ?? 'unknown';
}
