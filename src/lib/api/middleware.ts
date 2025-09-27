import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import { redis } from '../database';
import { z } from 'zod';

// Types for middleware
export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    role: string;
    sessionId: string;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: z.ZodError | Record<string, unknown>;
  statusCode: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    timestamp: string;
    requestId: string;
  };
}

// Error classes
export class ApiValidationError extends Error {
  constructor(public details: z.ZodError | Record<string, unknown>) {
    super('Validation failed');
    this.name = 'ApiValidationError';
  }
}

export class ApiAuthenticationError extends Error {
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'ApiAuthenticationError';
  }
}

export class ApiAuthorizationError extends Error {
  constructor(message = 'Insufficient permissions') {
    super(message);
    this.name = 'ApiAuthorizationError';
  }
}

export class ApiNotFoundError extends Error {
  constructor(resource: string) {
    super(`${resource} not found`);
    this.name = 'ApiNotFoundError';
  }
}

export class ApiRateLimitError extends Error {
  constructor(message = 'Rate limit exceeded') {
    super(message);
    this.name = 'ApiRateLimitError';
  }
}

// Response helpers
export function successResponse<T>(
  data: T,
  meta?: ApiResponse<T>['meta']
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: generateRequestId(),
      ...meta
    }
  };

  return NextResponse.json(response);
}

export function errorResponse(
  error: ApiError | Error | string,
  statusCode: number = 500
): NextResponse<ApiResponse> {
  let apiError: ApiError;

  if (typeof error === 'string') {
    apiError = {
      code: 'INTERNAL_ERROR',
      message: error,
      statusCode
    };
  } else if (error instanceof ApiValidationError) {
    apiError = {
      code: 'VALIDATION_ERROR',
      message: error.message,
      details: error.details,
      statusCode: 400
    };
  } else if (error instanceof ApiAuthenticationError) {
    apiError = {
      code: 'AUTHENTICATION_ERROR',
      message: error.message,
      statusCode: 401
    };
  } else if (error instanceof ApiAuthorizationError) {
    apiError = {
      code: 'AUTHORIZATION_ERROR',
      message: error.message,
      statusCode: 403
    };
  } else if (error instanceof ApiNotFoundError) {
    apiError = {
      code: 'NOT_FOUND',
      message: error.message,
      statusCode: 404
    };
  } else if (error instanceof ApiRateLimitError) {
    apiError = {
      code: 'RATE_LIMIT_EXCEEDED',
      message: error.message,
      statusCode: 429
    };
  } else if ('code' in error && 'message' in error) {
    apiError = error as ApiError;
  } else {
    apiError = {
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
      statusCode
    };
  }

  const response: ApiResponse = {
    success: false,
    error: apiError,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: generateRequestId()
    }
  };

  return NextResponse.json(response, { status: apiError.statusCode });
}

// Authentication middleware
export async function authenticateRequest(request: NextRequest): Promise<AuthenticatedRequest> {
  const token = extractToken(request);

  if (!token) {
    throw new ApiAuthenticationError('No authentication token provided');
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new ApiAuthenticationError('JWT secret not configured');
    }
    const payload = verify(token, jwtSecret) as {
      userId: string;
      email: string;
      role: string;
      sessionId: string;
      iat?: number;
      exp?: number;
    };

    // Check if token is blacklisted
    const isBlacklisted = await redis.get(`blacklist:${token}`);
    if (isBlacklisted) {
      throw new ApiAuthenticationError('Token has been revoked');
    }

    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.user = {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
      sessionId: payload.sessionId
    };

    return authenticatedRequest;
  } catch (error) {
    if (error instanceof ApiAuthenticationError) {
      throw error;
    }
    throw new ApiAuthenticationError('Invalid authentication token');
  }
}

// Authorization middleware
export function requireRole(allowedRoles: string[]) {
  return (request: AuthenticatedRequest) => {
    if (!request.user) {
      throw new ApiAuthenticationError();
    }

    if (!allowedRoles.includes(request.user.role)) {
      throw new ApiAuthorizationError(
        `Access denied. Required roles: ${allowedRoles.join(', ')}`
      );
    }
  };
}

// Rate limiting middleware
export async function rateLimitMiddleware(
  request: NextRequest,
  identifier: string = 'global',
  maxRequests: number = 100,
  windowMs: number = 60000
): Promise<void> {
  const key = `rate_limit:${identifier}`;
  const window = Math.floor(Date.now() / windowMs);
  const windowKey = `${key}:${window}`;

  const current = await redis.incr(windowKey);

  if (current === 1) {
    await redis.expire(windowKey, Math.ceil(windowMs / 1000));
  }

  if (current > maxRequests) {
    throw new ApiRateLimitError(
      `Rate limit exceeded. Maximum ${maxRequests} requests per ${windowMs / 1000} seconds`
    );
  }
}

// Request validation middleware
export function validateRequestBody<T>(schema: z.ZodSchema<T>) {
  return async (request: NextRequest): Promise<T> => {
    try {
      const body = await request.json();
      return schema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ApiValidationError(error);
      }
      throw new ApiValidationError({ message: 'Invalid request body' });
    }
  };
}

export function validateQueryParams<T>(schema: z.ZodSchema<T>) {
  return (request: NextRequest): T => {
    try {
      const searchParams = request.nextUrl.searchParams;
      const params: Record<string, string> = {};

      searchParams.forEach((value, key) => {
        params[key] = value;
      });

      return schema.parse(params);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ApiValidationError(error);
      }
      throw new ApiValidationError({ message: 'Invalid query parameters' });
    }
  };
}

// CORS middleware
export function corsMiddleware(request: NextRequest): NextResponse<any> | null {
  const origin = request.headers.get('origin');
  const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'];

  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 200 }) as NextResponse<any>;

    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }

    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Max-Age', '86400');

    return response;
  }

  return null;
}

// Utility functions
function extractToken(request: NextRequest): string | null {
  // First try Authorization header (for API clients)
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Then try cookies (for web clients)
  const cookies = request.cookies;
  const sessionToken = cookies.get('admin-session');
  if (sessionToken) {
    return sessionToken.value;
  }

  return null;
}

function generateRequestId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Middleware composition helper
export function createApiHandler<T = unknown>(
  handler: (request: AuthenticatedRequest) => Promise<NextResponse<ApiResponse<T>>>,
  options: {
    requireAuth?: boolean;
    allowedRoles?: string[];
    rateLimit?: { maxRequests: number; windowMs: number };
    validateBody?: z.ZodSchema<unknown>;
    validateQuery?: z.ZodSchema<unknown>;
  } = {}
) {
  return async (request: NextRequest): Promise<NextResponse<ApiResponse<T>>> => {
    try {
      // Handle CORS preflight
      const corsResponse = corsMiddleware(request);
      if (corsResponse) return corsResponse as NextResponse<ApiResponse<T>>;

      let authenticatedRequest = request as AuthenticatedRequest;

      // Authentication
      if (options.requireAuth) {
        authenticatedRequest = await authenticateRequest(request);
      }

      // Authorization
      if (options.allowedRoles && authenticatedRequest.user) {
        requireRole(options.allowedRoles)(authenticatedRequest);
      }

      // Rate limiting
      if (options.rateLimit) {
        const identifier = authenticatedRequest.user?.id ||
          request.headers.get('x-forwarded-for') ||
          'anonymous';
        await rateLimitMiddleware(
          request,
          identifier,
          options.rateLimit.maxRequests,
          options.rateLimit.windowMs
        );
      }

      // Validation
      if (options.validateBody) {
        await validateRequestBody(options.validateBody)(request);
      }

      if (options.validateQuery) {
        validateQueryParams(options.validateQuery)(request);
      }

      // Execute handler
      return await handler(authenticatedRequest);

    } catch (error) {
      console.error('API error:', error);

      if (error instanceof ApiValidationError ||
          error instanceof ApiAuthenticationError ||
          error instanceof ApiAuthorizationError ||
          error instanceof ApiNotFoundError ||
          error instanceof ApiRateLimitError) {
        return errorResponse(error) as NextResponse<ApiResponse<T>>;
      }

      return errorResponse(error instanceof Error ? error.message : 'Internal server error', 500) as NextResponse<ApiResponse<T>>;
    }
  };
}