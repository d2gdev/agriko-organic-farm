/**
 * Authentication Middleware
 * Protects routes and validates permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/core/auth/auth.service';
import { logger } from '@/lib/logger';
import { handleError } from '@/lib/error-sanitizer';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    role: string;
    permissions: string[];
  };
  session?: {
    id: string;
    userId: string;
  };
}

/**
 * Middleware to check authentication
 */
export async function requireAuth(
  request: AuthenticatedRequest,
  options?: {
    roles?: string[];
    permissions?: string[];
  }
): Promise<NextResponse | null> {
  try {
    // Validate session
    const result = await authService.validateSession(request);

    if (!result.success) {
      logger.warn('Unauthorized access attempt', {
        path: request.nextUrl.pathname,
        error: result.error,
      });

      return NextResponse.json(
        { error: result.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check roles if specified
    if (options?.roles && (!result.user || !options.roles.includes(result.user.role))) {
      logger.warn('Insufficient role', {
        userId: result.user?.id,
        required: options.roles,
        actual: result.user?.role,
      });

      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Check permissions if specified
    if (options?.permissions) {
      const hasAllPermissions = options.permissions.every((perm) =>
        (result.user?.permissions || []).includes(perm)
      );

      if (!hasAllPermissions) {
        logger.warn('Insufficient permissions', {
          userId: result.user?.id,
          required: options.permissions,
          actual: result.user?.permissions,
        });

        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
    }

    // Attach user and session to request
    (request as AuthenticatedRequest).user = {
      id: result.user?.id || '',
      email: result.user?.email || '',
      role: result.user?.role || '',
      permissions: result.user?.permissions || [],
    };

    (request as AuthenticatedRequest).session = {
      id: result.session?.id || '',
      userId: result.session?.userId || '',
    };

    return null; // Continue to handler
  } catch (error) {
    logger.error('Auth middleware error', handleError(error, 'auth-middleware'));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Middleware to optionally check authentication
 * Doesn't fail if user is not authenticated
 */
export async function optionalAuth(
  request: AuthenticatedRequest
): Promise<void> {
  try {
    const result = await authService.validateSession(request);

    if (result.success) {
      (request as AuthenticatedRequest).user = {
        id: result.user?.id || '',
        email: result.user?.email || '',
        role: result.user?.role || '',
        permissions: result.user?.permissions || [],
      };

      (request as AuthenticatedRequest).session = {
        id: result.session?.id || '',
        userId: result.session?.userId || '',
      };
    }
  } catch (error) {
    // Silently fail for optional auth
    logger.debug('Optional auth check failed', handleError(error, 'optional-auth'));
  }
}

/**
 * Create secure session cookie
 */
export function createSessionCookie(token: string): string {
  const isProduction = process.env.NODE_ENV === 'production';

  return [
    `session-token=${token}`,
    'HttpOnly',
    isProduction ? 'Secure' : '',
    'SameSite=Strict',
    'Path=/',
    `Max-Age=${24 * 60 * 60}`, // 24 hours
  ]
    .filter(Boolean)
    .join('; ');
}

/**
 * Clear session cookie
 */
export function clearSessionCookie(): string {
  return 'session-token=; HttpOnly; Path=/; Max-Age=0';
}