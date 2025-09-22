
import { NextRequest, NextResponse } from 'next/server';
import { validateApiAuthSecure, hasPermission } from '@/lib/secure-auth';
import { generateTokenPair, generateServiceToken } from '@/lib/token-management';
import { logger } from '@/lib/logger';
import { urlHelpers } from '@/lib/url-constants';

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = validateApiAuthSecure(request);
    
    if (!authResult.isAuthenticated || !authResult.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Check if user has admin permissions
    if (!hasPermission(authResult.user, 'admin')) {
      return NextResponse.json(
        { error: 'Admin permissions required to generate API keys' },
        { status: 403 }
      );
    }
    
    const body = await request.json() as { role?: string; description?: string; tokenType?: string };
    const { role, description, tokenType = 'service' } = body;
    
    // Validate role
    const validRoles = ['admin', 'readonly', 'api-user'];
    if (!role || !validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be one of: admin, readonly, api-user' },
        { status: 400 }
      );
    }
    
    // Validate token type
    const validTokenTypes = ['service', 'pair'];
    if (!validTokenTypes.includes(tokenType)) {
      return NextResponse.json(
        { error: 'Invalid token type. Must be one of: service, pair' },
        { status: 400 }
      );
    }
    
    const permissions: { [key: string]: string[] } = {
      admin: ['read', 'write', 'delete', 'admin', 'analytics'],
      readonly: ['read'],
      'api-user': ['read', 'write']
    };
    
    // Generate tokens based on type
    if (tokenType === 'pair') {
      // Generate access + refresh token pair (auto-refreshing)
      const tokenPair = generateTokenPair({
        userId: `${role}-${Date.now()}`,
        role: role,
        permissions: permissions[role] ?? []
      });
      
      return NextResponse.json({
        success: true,
        type: 'token_pair',
        accessToken: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken,
        expiresIn: tokenPair.expiresIn,
        role: role,
        description: description ?? `Auto-refreshing token pair for ${role} access`,
        permissions: permissions[role] ?? [],
        usage: {
          initial: `curl -H "Authorization: Bearer ${tokenPair.accessToken}" ${urlHelpers.getApiEndpoint('analytics/dashboard')}`,
          refresh: `curl -X POST -H "Content-Type: application/json" -d '{"refreshToken":"${tokenPair.refreshToken}"}' ${urlHelpers.getApiEndpoint('auth/refresh')}`,
          note: 'Access token expires in 1 hour. Use refresh token to get new access tokens automatically.'
        },
        createdBy: authResult.user.userId,
        createdAt: new Date().toISOString()
      });
    } else {
      // Generate long-lived service token
      const serviceToken = generateServiceToken({
        userId: `${role}-${Date.now()}`,
        role: role,
        permissions: permissions[role] ?? [],
        description: description ?? `Service token for ${role} access`,
        expiresIn: '1y' // 1 year for service tokens
      });
      
      return NextResponse.json({
        success: true,
        type: 'service_token',
        token: serviceToken.token,
        role: role,
        description: serviceToken.description,
        expiresIn: serviceToken.expiresIn,
        permissions: serviceToken.permissions,
        usage: {
          example: `curl -H "Authorization: Bearer ${serviceToken.token}" ${urlHelpers.getApiEndpoint('analytics/dashboard')}`,
          note: 'This is a long-lived service token (1 year). Store it securely.'
        },
        createdBy: authResult.user.userId,
        createdAt: new Date().toISOString()
      });
    }
    
  } catch (error) {
    // Type guard to ensure error is a valid object for logging
    const errorData: Record<string, unknown> = {};
    if (error && typeof error === 'object') {
      Object.assign(errorData, error);
    } else if (error) {
      errorData.message = String(error);
    }
    
    logger.error('API key generation error', errorData, 'auth');
    return NextResponse.json(
      { error: 'Failed to generate API key' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // List existing API keys (in production, get from database)
  const authResult = validateApiAuthSecure(request);
  
  if (!authResult.isAuthenticated || !authResult.user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }
  
  if (!hasPermission(authResult.user, 'admin')) {
    return NextResponse.json(
      { error: 'Admin permissions required' },
      { status: 403 }
    );
  }
  
  // In production, return list of API keys from database
  // Never return the actual keys, only metadata
  return NextResponse.json({
    apiKeys: [
      {
        id: 'key-1',
        description: 'Analytics API access',
        role: 'readonly',
        createdAt: '2024-01-01T00:00:00Z',
        expiresAt: '2024-02-01T00:00:00Z',
        lastUsed: '2024-01-15T12:00:00Z',
        status: 'active'
      }
    ],
    instructions: 'This endpoint would show API key metadata from your database in production'
  });
}