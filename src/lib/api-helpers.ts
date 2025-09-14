import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * Generic API parameter validator
 */
export function validateApiParams<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: NextResponse } {
  try {
    const result = schema.safeParse(data);
    
    if (!result.success) {
      const errorResponse = NextResponse.json(
        {
          error: 'Invalid parameters',
          details: result.error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
            code: e.code,
          })),
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
      
      return { success: false, error: errorResponse };
    }
    
    return { success: true, data: result.data };
  } catch (error) {
    const errorResponse = NextResponse.json(
      {
        error: 'Parameter validation failed',
        details: error instanceof Error ? error.message : 'Unknown validation error',
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    );
    
    return { success: false, error: errorResponse };
  }
}

/**
 * Validate query parameters from URL
 */
export function validateQueryParams<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: NextResponse } {
  const { searchParams } = new URL(request.url);
  const params: Record<string, unknown> = {};
  
  // Convert URLSearchParams to plain object
  for (const [key, value] of searchParams.entries()) {
    // Handle multiple values for same key
    if (params[key]) {
      if (Array.isArray(params[key])) {
        params[key].push(value);
      } else {
        params[key] = [params[key], value];
      }
    } else {
      params[key] = value;
    }
  }
  
  return validateApiParams(schema, params);
}

/**
 * Validate JSON request body
 */
export async function validateRequestBody<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: NextResponse }> {
  try {
    const body = await request.json() as Record<string, unknown>;
    return validateApiParams(schema, body);
  } catch (error) {
    const errorResponse = NextResponse.json(
      {
        error: 'Invalid JSON body',
        details: error instanceof Error ? error.message : 'Failed to parse request body',
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    );
    
    return { success: false, error: errorResponse };
  }
}

/**
 * Type-safe integer parameter parser
 */
export function parseIntParam(
  value: string | null,
  paramName: string,
  options: { min?: number; max?: number; required?: boolean } = {}
): { success: true; value: number } | { success: false; error: string } {
  if (!value) {
    if (options.required) {
      return { success: false, error: `${paramName} is required` };
    }
    return { success: true, value: 0 };
  }
  
  const parsed = parseInt(value, 10);
  
  if (isNaN(parsed)) {
    return { success: false, error: `${paramName} must be a valid integer` };
  }
  
  if (options.min !== undefined && parsed < options.min) {
    return { success: false, error: `${paramName} must be at least ${options.min}` };
  }
  
  if (options.max !== undefined && parsed > options.max) {
    return { success: false, error: `${paramName} must not exceed ${options.max}` };
  }
  
  return { success: true, value: parsed };
}

/**
 * Type-safe float parameter parser
 */
export function parseFloatParam(
  value: string | null,
  paramName: string,
  options: { min?: number; max?: number; required?: boolean } = {}
): { success: true; value: number } | { success: false; error: string } {
  if (!value) {
    if (options.required) {
      return { success: false, error: `${paramName} is required` };
    }
    return { success: true, value: 0 };
  }
  
  const parsed = parseFloat(value);
  
  if (isNaN(parsed)) {
    return { success: false, error: `${paramName} must be a valid number` };
  }
  
  if (options.min !== undefined && parsed < options.min) {
    return { success: false, error: `${paramName} must be at least ${options.min}` };
  }
  
  if (options.max !== undefined && parsed > options.max) {
    return { success: false, error: `${paramName} must not exceed ${options.max}` };
  }
  
  return { success: true, value: parsed };
}

/**
 * Type-safe boolean parameter parser
 */
export function parseBooleanParam(
  value: string | null,
  paramName: string,
  defaultValue?: boolean
): boolean {
  if (!value) {
    return defaultValue ?? false;
  }
  
  const lowerValue = value.toLowerCase();
  return lowerValue === 'true' || lowerValue === '1' || lowerValue === 'yes';
}

/**
 * Sanitize string parameter
 */
export function sanitizeStringParam(
  value: string | null,
  paramName: string,
  options: { maxLength?: number; required?: boolean; allowEmpty?: boolean } = {}
): { success: true; value: string } | { success: false; error: string } {
  if (!value || value.trim() === '') {
    if (options.required && !options.allowEmpty) {
      return { success: false, error: `${paramName} is required` };
    }
    return { success: true, value: '' };
  }
  
  const trimmed = value.trim();
  
  if (options.maxLength && trimmed.length > options.maxLength) {
    return { 
      success: false, 
      error: `${paramName} must not exceed ${options.maxLength} characters` 
    };
  }
  
  // Basic XSS protection
  if (/<script|javascript:|data:|vbscript:/i.test(trimmed)) {
    return { 
      success: false, 
      error: `${paramName} contains potentially malicious content` 
    };
  }
  
  return { success: true, value: trimmed };
}

/**
 * Generic error response helper
 */
export function createErrorResponse(
  message: string,
  details?: Record<string, unknown>,
  status: number = 500
): NextResponse {
  return NextResponse.json(
    {
      error: message,
      details,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

/**
 * Generic success response helper
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

/**
 * Paginated response helper
 */
export function createPaginatedResponse<T>(
  data: T[],
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages?: number;
  },
  message?: string
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      pagination: {
        ...pagination,
        pages: pagination.pages ?? Math.ceil(pagination.total / pagination.limit),
      },
      message,
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}

const apiHelpers = {
  validateApiParams,
  validateQueryParams,
  validateRequestBody,
  parseIntParam,
  parseFloatParam,
  parseBooleanParam,
  sanitizeStringParam,
  createErrorResponse,
  createSuccessResponse,
  createPaginatedResponse,
};

export default apiHelpers;
