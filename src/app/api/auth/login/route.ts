import { NextRequest } from 'next/server';
import { createApiHandler, successResponse, errorResponse } from '@/lib/api/middleware';
import { AuthService } from '@/lib/auth/jwt';
import { schemas } from '@/lib/api/validators';

export const POST = createApiHandler(
  async (request: NextRequest) => {
    try {
      // Parse and validate request body
      const body = await request.json();
      const { email, password } = schemas.login.parse(body);

      // Extract client information
      const ipAddress = request.headers.get('x-forwarded-for') ||
                       request.headers.get('x-real-ip') ||
                       'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';

      // Authenticate user
      const authResult = await AuthService.authenticate(
        email,
        password,
        ipAddress,
        userAgent
      );

      return successResponse({
        user: authResult.user,
        token: authResult.token,
        refreshToken: authResult.refreshToken,
        expiresAt: authResult.expiresAt
      });

    } catch (error) {
      console.error('Login error:', error);

      if (error instanceof Error && error.message.includes('Invalid email or password')) {
        return errorResponse('Invalid email or password', 401);
      }

      return errorResponse('Authentication failed', 500);
    }
  },
  {
    requireAuth: false,
    rateLimit: { maxRequests: 5, windowMs: 60000 } // 5 attempts per minute
  }
);