import { createApiHandler, successResponse, errorResponse, AuthenticatedRequest } from '@/lib/api/middleware';
import { AuthService } from '@/lib/auth/jwt';
import { z } from 'zod';

const logoutSchema = z.object({
  logoutAll: z.boolean().optional().default(false)
});

export const POST = createApiHandler(
  async (request: AuthenticatedRequest) => {
    try {
      const body = await request.json();
      const { logoutAll } = logoutSchema.parse(body);

      const token = request.headers.get('authorization')?.substring(7);
      const sessionId = request.user?.sessionId;

      if (!token || !sessionId || !request.user) {
        return errorResponse('Invalid session', 400);
      }

      if (logoutAll) {
        // Logout from all sessions
        await AuthService.logoutAllSessions(request.user.id);
      } else {
        // Logout from current session only
        await AuthService.logout(token, sessionId);
      }

      return successResponse({
        message: logoutAll ? 'Logged out from all sessions' : 'Logged out successfully'
      });

    } catch (error) {
      console.error('Logout error:', error);
      return errorResponse('Logout failed', 500);
    }
  },
  {
    requireAuth: true,
    rateLimit: { maxRequests: 10, windowMs: 60000 }
  }
);