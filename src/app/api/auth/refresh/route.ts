import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

import { refreshAccessToken, validateToken } from '@/lib/token-management';

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json();
    
    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 400 }
      );
    }
    
    // Validate the refresh token first
    const validation = validateToken(refreshToken);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error || 'Invalid refresh token' },
        { status: 401 }
      );
    }
    
    // Generate new access token
    const result = refreshAccessToken(refreshToken);
    
    if (!result) {
      return NextResponse.json(
        { error: 'Failed to refresh token' },
        { status: 401 }
      );
    }
    
    return NextResponse.json({
      success: true,
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
      tokenType: 'Bearer',
      message: 'Token refreshed successfully'
    });
    
  } catch (error) {
    logger.error('Token refresh error:', error as Record<string, unknown>);
    return NextResponse.json(
      { error: 'Token refresh failed' },
      { status: 500 }
    );
  }
}

// Check if a token needs refresh
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }
    
    const token = authHeader.slice(7);
    const validation = validateToken(token);
    
    return NextResponse.json({
      valid: validation.valid,
      needsRefresh: validation.needsRefresh || false,
      error: validation.error,
      expiresIn: validation.payload?.exp ? validation.payload.exp - Math.floor(Date.now() / 1000) : 0
    });
    
  } catch (error) {
    logger.error('Token check error:', error as Record<string, unknown>);
    return NextResponse.json(
      { error: 'Token check failed' },
      { status: 500 }
    );
  }
}