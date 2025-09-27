import { NextRequest } from 'next/server';
import { createApiHandler, successResponse, errorResponse } from '@/lib/api/middleware';
import { AuthService } from '@/lib/auth/jwt';
import { z } from 'zod';

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
  sessionId: z.string().uuid('Invalid session ID')
});

export const POST = createApiHandler(
  async (request: NextRequest) => {
    try {
      // Parse and validate request body
      const body = await request.json();
      const { refreshToken, sessionId } = refreshSchema.parse(body);

      // Refresh the access token
      const result = await AuthService.refreshToken(refreshToken, sessionId);

      return successResponse({
        token: result.token,
        expiresAt: result.expiresAt
      });

    } catch (error) {
      console.error('Token refresh error:', error);

      if (error instanceof Error &&
          (error.message.includes('Invalid') || error.message.includes('expired'))) {
        return errorResponse('Invalid or expired refresh token', 401);
      }

      return errorResponse('Token refresh failed', 500);
    }
  },
  {
    requireAuth: false,
    rateLimit: { maxRequests: 10, windowMs: 60000 } // 10 attempts per minute
  }
);

// Check if a token needs refresh
export const GET = createApiHandler(
  async (request: NextRequest) => {
    try {
      const authHeader = request.headers.get('authorization');

      if (!authHeader?.startsWith('Bearer ')) {
        return errorResponse('Authorization header required', 401);
      }

      const token = authHeader.slice(7);
      const decoded = await AuthService.verifyToken(token);

      return successResponse({
        valid: true,
        userId: decoded.userId,
        role: decoded.role,
        sessionId: decoded.sessionId,
        expiresIn: decoded.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 0
      });

    } catch (error) {
      return successResponse({
        valid: false,
        error: error instanceof Error ? error.message : 'Token validation failed'
      });
    }
  },
  {
    requireAuth: false,
    rateLimit: { maxRequests: 20, windowMs: 60000 }
  }
);