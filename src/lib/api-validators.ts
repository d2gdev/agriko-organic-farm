/**
 * API-specific validators for request/response validation
 * Ensures type safety at API boundaries
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import type { FormValidationResult, ValidationError } from '@/types/type-safety';

// ============================================
// Zod Schema Definitions
// ============================================

// Product schemas
export const ProductQuerySchema = z.object({
  category: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().positive().optional(),
  inStock: z.coerce.boolean().optional(),
  featured: z.coerce.boolean().optional(),
  sortBy: z.enum(['name', 'price', 'date', 'popularity']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export const ProductCreateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  price: z.number().positive(),
  category: z.string().min(1),
  stock: z.number().int().min(0).default(0),
  images: z.array(z.string().url()).optional(),
  featured: z.boolean().default(false),
  metadata: z.record(z.unknown()).optional()
});

// Order schemas
export const OrderCreateSchema = z.object({
  items: z.array(z.object({
    productId: z.number().int().positive(),
    quantity: z.number().int().positive(),
    price: z.number().positive()
  })).min(1),
  customerId: z.string().optional(),
  shippingAddress: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    addressLine1: z.string().min(1),
    addressLine2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    postcode: z.string().min(1),
    country: z.string().min(1),
    phone: z.string().optional()
  }),
  billingAddress: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    addressLine1: z.string().min(1),
    addressLine2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    postcode: z.string().min(1),
    country: z.string().min(1),
    phone: z.string().optional()
  }),
  paymentMethod: z.string().min(1),
  couponCode: z.string().optional()
});

// User schemas
export const UserRegistrationSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  phone: z.string().optional(),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions'
  })
});

export const UserLoginSchema = z.object({
  email: z.string().email().optional(),
  username: z.string().min(1).optional(),
  password: z.string().min(1)
}).refine(data => data.email || data.username, {
  message: 'Either email or username is required'
});

// Review schemas
export const ReviewCreateSchema = z.object({
  productId: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  title: z.string().min(1).max(100).optional(),
  comment: z.string().min(10).max(5000),
  verified: z.boolean().default(false),
  images: z.array(z.string().url()).max(5).optional()
});

// Search schemas
export const SearchQuerySchema = z.object({
  q: z.string().min(1).max(200),
  category: z.string().optional(),
  filters: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['relevance', 'price_asc', 'price_desc', 'date', 'rating']).optional()
});

// Analytics event schemas
export const AnalyticsEventSchema = z.object({
  eventType: z.string().min(1),
  eventData: z.record(z.unknown()),
  timestamp: z.coerce.date().optional(),
  sessionId: z.string().min(1),
  userId: z.string().optional(),
  metadata: z.record(z.unknown()).optional()
});

// ============================================
// Validation Functions
// ============================================

export async function validateRequestBody<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<FormValidationResult<T>> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return {
        isValid: false,
        errors: result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
          severity: 'error' as const
        }))
      };
    }

    return {
      isValid: true,
      errors: [],
      sanitized: result.data
    };
  } catch (_error) {
    return {
      isValid: false,
      errors: [{
        field: 'body',
        message: 'Invalid JSON in request body',
        severity: 'error'
      }]
    };
  }
}

export function validateQueryParams<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): FormValidationResult<T> {
  const searchParams = request.nextUrl.searchParams;
  const params: Record<string, string> = {};

  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  const result = schema.safeParse(params);

  if (!result.success) {
    return {
      isValid: false,
      errors: result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
        severity: 'error' as const
      }))
    };
  }

  return {
    isValid: true,
    errors: [],
    sanitized: result.data
  };
}

export function validateHeaders(
  request: NextRequest,
  requiredHeaders: string[]
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const header of requiredHeaders) {
    if (!request.headers.get(header)) {
      errors.push({
        field: `headers.${header}`,
        message: `Missing required header: ${header}`,
        severity: 'error'
      });
    }
  }

  return errors;
}

// ============================================
// Response Validation
// ============================================

export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.unknown()).optional()
  }).optional(),
  metadata: z.object({
    timestamp: z.string(),
    requestId: z.string(),
    duration: z.number().optional(),
    version: z.string().optional()
  }).optional()
});

export function createValidatedResponse<T>(
  data: T,
  status = 200,
  metadata?: Record<string, unknown>
): Response {
  const responseData = {
    success: status >= 200 && status < 300,
    data,
    metadata: {
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
      ...metadata
    }
  };

  return new Response(JSON.stringify(responseData), {
    status,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

export function createErrorResponse(
  error: string | Error | ValidationError[],
  status = 400
): Response {
  let errorData: { code: string; message: string; details?: unknown };

  if (typeof error === 'string') {
    errorData = { code: 'ERROR', message: error };
  } else if (error instanceof Error) {
    errorData = {
      code: 'ERROR',
      message: error.message,
      details: { stack: error.stack }
    };
  } else {
    errorData = {
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: { errors: error }
    };
  }

  const responseData = {
    success: false,
    error: errorData,
    metadata: {
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID()
    }
  };

  return new Response(JSON.stringify(responseData), {
    status,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

// ============================================
// Middleware Validators
// ============================================

export function createValidationMiddleware<T>(
  schema: z.ZodSchema<T>
) {
  return async (request: NextRequest) => {
    const validation = await validateRequestBody(request, schema);
    if (!validation.isValid) {
      return createErrorResponse(validation.errors, 400);
    }
    return validation.sanitized;
  };
}

export function createQueryValidationMiddleware<T>(
  schema: z.ZodSchema<T>
) {
  return (request: NextRequest) => {
    const validation = validateQueryParams(request, schema);
    if (!validation.isValid) {
      return createErrorResponse(validation.errors, 400);
    }
    return validation.sanitized;
  };
}

// ============================================
// Type Guards for API Data
// ============================================

export function isValidApiResponse(data: unknown): boolean {
  const result = ApiResponseSchema.safeParse(data);
  return result.success;
}

export function assertValidApiResponse(data: unknown): asserts data is z.infer<typeof ApiResponseSchema> {
  const result = ApiResponseSchema.safeParse(data);
  if (!result.success) {
    throw new Error(`Invalid API response: ${result.error.message}`);
  }
}

// ============================================
// Sanitization Helpers
// ============================================

export function sanitizeApiInput<T>(
  input: unknown,
  schema: z.ZodSchema<T>
): T | null {
  const result = schema.safeParse(input);
  return result.success ? result.data : null;
}

export function sanitizeAndValidate<T>(
  input: unknown,
  schema: z.ZodSchema<T>
): { data?: T; errors?: ValidationError[] } {
  const result = schema.safeParse(input);

  if (result.success) {
    return { data: result.data };
  }

  return {
    errors: result.error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code,
      severity: 'error' as const
    }))
  };
}