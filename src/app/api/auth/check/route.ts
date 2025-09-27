import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';

interface JWTPayload {
  userId: string;
  username: string;
  role: string;
  permissions: string[];
  iss?: string;
  aud?: string;
  iat?: number;
  exp?: number;
}

// GET /api/auth/check - Check if user is authenticated
export async function GET(request: NextRequest) {
  try {
    // Check for session cookie
    const sessionToken = request.cookies.get('admin-session');

    if (!sessionToken) {
      return NextResponse.json({
        authenticated: false,
        message: 'No session found'
      }, { status: 401 });
    }

    // Verify JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET not configured');
      return NextResponse.json({
        authenticated: false,
        message: 'Authentication service not configured'
      }, { status: 500 });
    }

    try {
      const decoded = verify(sessionToken.value, jwtSecret, {
        issuer: 'agriko-api',
        audience: 'agriko-services'
      }) as JWTPayload;

      // Token is valid
      return NextResponse.json({
        authenticated: true,
        user: {
          userId: decoded.userId,
          username: decoded.username,
          role: decoded.role,
          permissions: decoded.permissions
        }
      });

    } catch (error) {
      // Token is invalid or expired
      console.error('Token verification failed:', error);

      // Clear the invalid cookie
      const response = NextResponse.json({
        authenticated: false,
        message: 'Session expired or invalid'
      }, { status: 401 });

      response.cookies.delete('admin-session');
      response.cookies.delete('admin-auth');

      return response;
    }

  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({
      authenticated: false,
      message: 'Authentication check failed'
    }, { status: 500 });
  }
}