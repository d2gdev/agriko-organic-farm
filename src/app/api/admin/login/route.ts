import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { validateRequest, loginSchema, ValidationError } from '@/lib/validation';
import { generateApiKey } from '@/lib/secure-auth';
import { checkEndpointRateLimit, createRateLimitResponse } from '@/lib/rate-limit';
import { config } from '@/lib/unified-config';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting for login attempts
    const rateLimitResult = checkEndpointRateLimit(request, 'authentication');
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    // Validate request data
    const body = await request.json() as Record<string, unknown>;
    const { username, password } = validateRequest(loginSchema, body);

    // Get credentials from environment variables
    const adminUsername = config.security.adminUsername;
    const adminPassword = config.security.adminPassword;

    if (!adminPassword) {
      logger.error('Admin password not configured', undefined, 'auth');
      return NextResponse.json(
        { success: false, message: 'Authentication system not configured' },
        { status: 500 }
      );
    }

    // Timing attack protection - always perform hash comparison
    const isValidUsername = username === adminUsername;
    const isValidPassword = await bcrypt.compare(password, adminPassword).catch(() => false);

    if (isValidUsername && isValidPassword) {
      // Generate secure JWT token
      const token = generateApiKey({
        userId: `admin-${Date.now()}`,
        role: 'admin',
        permissions: ['read', 'write', 'delete', 'admin', 'analytics'],
        expiresIn: '24h'
      });

      // Create response with authentication data
      const response = NextResponse.json({
        success: true,
        message: 'Login successful',
        token, // Include token for API usage
        expiresIn: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
        user: {
          username: adminUsername,
          role: 'admin',
          permissions: ['read', 'write', 'delete', 'admin', 'analytics']
        }
      });

      // Set secure HTTP-only cookies for web interface
      response.cookies.set('admin-auth', 'authenticated', {
        httpOnly: true,
        secure: config.isProd,
        sameSite: 'strict',
        maxAge: 24 * 60 * 60, // 24 hours
        path: '/'
      });

      response.cookies.set('admin-session', token, {
        httpOnly: true,
        secure: config.isProd,
        sameSite: 'strict',
        maxAge: 24 * 60 * 60, // 24 hours
        path: '/'
      });

      // Log successful login (without sensitive data)
      logger.info(`Admin login successful from ${request.headers.get('x-forwarded-for') ?? 'unknown IP'}`, undefined, 'auth');

      return response;
    } else {
      // Constant-time delay to prevent timing attacks
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 100));
      
      logger.warn(`Failed login attempt for username: ${username} from ${request.headers.get('x-forwarded-for') ?? 'unknown IP'}`, undefined, 'auth');
      
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }
  } catch (error) {
    // Handle validation errors specifically
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid input data',
          errors: error.issues
        },
        { status: 400 }
      );
    }

    logger.error('Login API error', error as Record<string, unknown>, 'auth');
    
    // Don't expose internal errors
    return NextResponse.json(
      { success: false, message: 'Authentication service temporarily unavailable' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  // Logout endpoint
  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully'
  });

  // Clear authentication cookies
  response.cookies.delete('admin-auth');
  response.cookies.delete('admin-session');

  return response;
}