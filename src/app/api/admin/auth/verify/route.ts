import { NextRequest, NextResponse } from 'next/server';
import { validateJwtToken } from '@/lib/secure-auth';
import { logger } from '@/lib/logger';
import { getErrorMessage } from '@/lib/error-utils';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Check for authentication cookie
    const authCookie = request.cookies.get('admin-auth');
    const sessionCookie = request.cookies.get('admin-session');

    if (!authCookie || authCookie.value !== 'authenticated' || !sessionCookie) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verify JWT token
    const verificationResult = validateJwtToken(sessionCookie.value);

    if (!verificationResult.valid || !verificationResult.payload) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    const payload = verificationResult.payload;

    // Check if user has admin role
    if (payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Return user info
    return NextResponse.json({
      success: true,
      user: {
        username: 'admin', // You can extract this from payload if stored
        role: payload.role,
        permissions: payload.permissions || []
      }
    });

  } catch (error) {
    logger.error('Auth verification error', { error: getErrorMessage(error) }, 'auth');

    return NextResponse.json(
      { success: false, message: 'Authentication verification failed' },
      { status: 500 }
    );
  }
}