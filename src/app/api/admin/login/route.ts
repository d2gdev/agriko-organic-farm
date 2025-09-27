import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/core/auth/auth.service';
import { createSessionCookie } from '@/core/middleware/auth.middleware';
import { logger } from '@/lib/logger';
import { handleError } from '@/lib/error-sanitizer';

interface LoginRequestBody {
  username?: string;
  password?: string;
  email?: string;
}

interface AuthResult {
  success: boolean;
  token?: string;
  error?: string;
  user?: {
    id: string;
    email: string;
    role: string;
    permissions: string[];
  };
}

interface JWTPayload {
  sessionId?: string;
  userId?: string;
  email?: string;
  iat?: number;
  exp?: number;
}

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json() as LoginRequestBody;
    const { username, password, email } = body;

    // Basic validation
    if (!password || (!username && !email)) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Use email or convert username to email format
    const userEmail = email || `${username}@agriko.com`;

    // DEVELOPMENT ONLY: Hardcoded credentials bypass
    let result: AuthResult;
    if (process.env.NODE_ENV === 'development' &&
        username === 'agrikoadmin' &&
        password === 'admin123') {
      // Create mock successful result for development
      result = {
        success: true,
        token: 'dev-token-' + Date.now(),
        user: {
          id: 'dev-admin',
          email: 'agrikoadmin@agriko.com',
          role: 'admin',
          permissions: ['view_analytics', 'manage_products', 'manage_users', 'manage_content']
        }
      };
    } else {
      // Authenticate using the new auth service
      result = await authService.authenticate(userEmail, password, request);
    }

    if (result.success && result.token) {
      // Create response with authentication data and redirect flag
      const response = NextResponse.json({
        success: true,
        message: 'Login successful',
        token: result.token, // Include JWT token for API usage
        redirect: '/admin/dashboard', // Add redirect URL
        expiresIn: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
        user: result.user ? {
          id: result.user.id,
          email: result.user.email,
          role: result.user.role,
          permissions: result.user.permissions
        } : undefined
      });

      // Set secure HTTP-only session cookie
      response.headers.set('Set-Cookie', createSessionCookie(result.token));

      logger.info('Admin login successful', {
        userId: result.user?.id || 'unknown',
        email: result.user?.email || 'unknown'
      });

      return response;
    } else {
      // Small delay to prevent timing attacks
      await new Promise(resolve => setTimeout(resolve, 100));

      logger.warn('Failed login attempt', { email: userEmail });

      return NextResponse.json(
        { success: false, message: result.error || 'Invalid credentials' },
        { status: 401 }
      );
    }
  } catch (error) {
    logger.error('Login API error', handleError(error, 'admin-login-api'));

    // Don't expose internal errors
    return NextResponse.json(
      { success: false, message: 'Authentication service temporarily unavailable' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get session token from cookie
    const token = request.cookies.get('session-token')?.value;

    if (token) {
      // Extract session ID from token and logout
      const { verify } = await import('jsonwebtoken');
      const jwtSecret = process.env.JWT_SECRET || 'dev-jwt-secret';

      try {
        const decoded = verify(token, jwtSecret) as JWTPayload;
        if (decoded.sessionId) {
          await authService.logout(decoded.sessionId);
        }
      } catch (error) {
        // Token might be invalid, but still clear cookies
        logger.debug('Could not decode token during logout', handleError(error, 'logout-token-decode'));
      }
    }

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

    // Clear authentication cookies
    response.cookies.delete('session-token');
    response.cookies.delete('admin-auth');
    response.cookies.delete('admin-session');

    logger.info('Admin logout successful');
    return response;
  } catch (error) {
    logger.error('Logout error', handleError(error, 'admin-logout'));

    // Even if there's an error, clear cookies for security
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

    response.cookies.delete('session-token');
    response.cookies.delete('admin-auth');
    response.cookies.delete('admin-session');

    return response;
  }
}