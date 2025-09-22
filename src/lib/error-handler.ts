import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';

// Standard error response interface
export interface StandardErrorResponse {
  success: false;
  error: string;
  message?: string;
  details?: unknown;
  code?: string;
  timestamp: string;
  requestId?: string;
}

// Standard success response interface
export interface StandardSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
  requestId?: string;
}

// Paginated response interface
export interface PaginatedResponse<T = unknown> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  message?: string;
  timestamp: string;
  requestId?: string;
}

// Error types for better categorization
export enum ErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND_ERROR',
  RATE_LIMIT = 'RATE_LIMIT_ERROR',
  EXTERNAL_API = 'EXTERNAL_API_ERROR',
  DATABASE = 'DATABASE_ERROR',
  INTERNAL = 'INTERNAL_ERROR',
  BAD_REQUEST = 'BAD_REQUEST_ERROR',
  CONFLICT = 'CONFLICT_ERROR',
}

// Custom error class with type categorization
export class APIError extends Error {
  public readonly type: ErrorType;
  public readonly statusCode: number;
  public readonly details?: unknown;
  public readonly code?: string;

  constructor(
    message: string,
    type: ErrorType = ErrorType.INTERNAL,
    statusCode: number = 500,
    details?: unknown,
    code?: string
  ) {
    super(message);
    this.name = 'APIError';
    this.type = type;
    this.statusCode = statusCode;
    this.details = details;
    this.code = code;
  }
}

// Predefined error creators
export const createValidationError = (message: string, details?: unknown) =>
  new APIError(message, ErrorType.VALIDATION, 400, details, 'VALIDATION_FAILED');

export const createAuthenticationError = (message: string = 'Authentication required') =>
  new APIError(message, ErrorType.AUTHENTICATION, 401, undefined, 'AUTH_REQUIRED');

export const createAuthorizationError = (message: string = 'Insufficient permissions') =>
  new APIError(message, ErrorType.AUTHORIZATION, 403, undefined, 'INSUFFICIENT_PERMISSIONS');

export const createNotFoundError = (message: string = 'Resource not found') =>
  new APIError(message, ErrorType.NOT_FOUND, 404, undefined, 'RESOURCE_NOT_FOUND');

export const createRateLimitError = (message: string = 'Rate limit exceeded') =>
  new APIError(message, ErrorType.RATE_LIMIT, 429, undefined, 'RATE_LIMIT_EXCEEDED');

export const createConflictError = (message: string, details?: unknown) =>
  new APIError(message, ErrorType.CONFLICT, 409, details, 'RESOURCE_CONFLICT');

export const createExternalAPIError = (message: string, details?: unknown) =>
  new APIError(message, ErrorType.EXTERNAL_API, 502, details, 'EXTERNAL_API_ERROR');

export const createDatabaseError = (message: string = 'Database operation failed') =>
  new APIError(message, ErrorType.DATABASE, 500, undefined, 'DATABASE_ERROR');

// Request ID generator for tracing
export function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

// Get request ID from headers or generate new one
export function getRequestId(request: NextRequest): string {
  return request.headers.get('x-request-id') ?? 
         request.headers.get('x-correlation-id') ?? 
         crypto.randomUUID();
}

// Standardized error response creator
export function createErrorResponse(
  error: unknown,
  requestId?: string,
  context?: string
): NextResponse {
  const timestamp = new Date().toISOString();

  // Handle APIError instances
  if (error instanceof APIError) {
    const response: StandardErrorResponse = {
      success: false,
      error: error.message,
      code: error.code,
      details: process.env.NODE_ENV === 'development' ? error.details : undefined,
      timestamp,
      requestId,
    };

    logger.error(`API Error [${error.type}]: ${error.message}`, {
      type: error.type,
      statusCode: error.statusCode,
      details: error.details,
      requestId,
      context,
    } as Record<string, unknown>);

    return NextResponse.json(response, { 
      status: error.statusCode,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId || '',
      }
    });
  }

  // Handle Zod validation errors
  if (error instanceof z.ZodError) {
    const response: StandardErrorResponse = {
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: process.env.NODE_ENV === 'development' ? 
        error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
          code: e.code,
        })) : undefined,
      timestamp,
      requestId,
    };

    logger.error('Validation Error:', {
      errors: error.errors,
      requestId,
      context,
    } as Record<string, unknown>);

    return NextResponse.json(response, { 
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId || '',
      }
    });
  }

  // Handle standard Error instances
  if (error instanceof Error) {
    const response: StandardErrorResponse = {
      success: false,
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? {
        name: error.name,
        stack: error.stack,
      } : undefined,
      timestamp,
      requestId,
    };

    logger.error('Unhandled Error:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      requestId,
      context,
    } as Record<string, unknown>);

    return NextResponse.json(response, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId || '',
      }
    });
  }

  // Handle unknown error types
  const response: StandardErrorResponse = {
    success: false,
    error: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR',
    details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
    timestamp,
    requestId,
  };

  logger.error('Unknown Error:', {
    error: String(error),
    type: typeof error,
    requestId,
    context,
  } as Record<string, unknown>);

  return NextResponse.json(response, { 
    status: 500,
    headers: {
      'Content-Type': 'application/json',
      'X-Request-ID': requestId || '',
    }
  });
}

// Standardized success response creator
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  requestId?: string,
  status: number = 200
): NextResponse {
  const response: StandardSuccessResponse<T> = {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
    requestId,
  };

  return NextResponse.json(response, { 
    status,
    headers: {
      'Content-Type': 'application/json',
      'X-Request-ID': requestId || '',
    }
  });
}

// Standardized paginated response creator
export function createPaginatedResponse<T>(
  data: T[],
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages?: number;
  },
  message?: string,
  requestId?: string
): NextResponse {
  const response: PaginatedResponse<T> = {
    success: true,
    data,
    pagination: {
      ...pagination,
      pages: pagination.pages ?? Math.ceil(pagination.total / pagination.limit),
    },
    message,
    timestamp: new Date().toISOString(),
    requestId,
  };

  return NextResponse.json(response, { 
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'X-Request-ID': requestId || '',
    }
  });
}

// API route wrapper with standardized error handling
export function withErrorHandling<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      // Extract request from args if it's a NextRequest
      const request = args.find((arg): arg is NextRequest => 
        Boolean(arg && typeof arg === 'object' && 'headers' in arg && 'url' in arg)
      );

      const requestId = request ? getRequestId(request) : generateRequestId();
      const context = `${handler.name ?? 'anonymous'}`;

      return createErrorResponse(error, requestId, context);
    }
  };
}

// Validation helper with standardized error handling
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  _requestId?: string
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createValidationError('Request validation failed', error.errors);
    }
    throw error;
  }
}

// Async operation wrapper with error context
export async function safeAsyncOperation<T>(
  operation: () => Promise<T>,
  errorMessage: string,
  errorType: ErrorType = ErrorType.INTERNAL
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof APIError) {
      throw error; // Re-throw APIErrors as-is
    }
    
    if (error instanceof Error) {
      throw new APIError(
        `${errorMessage}: ${error.message}`,
        errorType,
        errorType === ErrorType.EXTERNAL_API ? 502 : 500,
        error
      );
    }
    
    throw new APIError(errorMessage, errorType);
  }
}

const errorHandlerExports = {
  APIError,
  createValidationError,
  createAuthenticationError,
  createAuthorizationError,
  createNotFoundError,
  createRateLimitError,
  createConflictError,
  createExternalAPIError,
  createDatabaseError,
  createErrorResponse,
  createSuccessResponse,
  createPaginatedResponse,
  withErrorHandling,
  validateRequest,
  safeAsyncOperation,
  getRequestId,
  generateRequestId,
};

export default errorHandlerExports;