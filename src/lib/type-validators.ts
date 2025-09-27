/**
 * Runtime type validation and type guards
 * Provides comprehensive validation for all data types in the application
 */

import {
  CompetitorData,
  ReviewData,
  OrderMetric,
  UserJourneyData,
  FormValidationResult,
  ValidationError,
  ApiRequest,
  ApiResponse,
  ValidationSchemas
} from '@/types/type-safety';

// ============================================
// Generic Validation Functions
// ============================================

export function validateRequired<T>(
  value: T | null | undefined,
  fieldName: string
): ValidationError | null {
  if (value === null || value === undefined || value === '') {
    return {
      field: fieldName,
      message: `${fieldName} is required`,
      severity: 'error'
    };
  }
  return null;
}

export function validateEmail(email: string): ValidationError | null {
  if (!ValidationSchemas.email.test(email)) {
    return {
      field: 'email',
      message: 'Invalid email format',
      severity: 'error'
    };
  }
  return null;
}

export function validatePhone(phone: string): ValidationError | null {
  if (!ValidationSchemas.phone.test(phone)) {
    return {
      field: 'phone',
      message: 'Invalid phone number format',
      severity: 'error'
    };
  }
  return null;
}

export function validateUrl(url: string): ValidationError | null {
  if (!ValidationSchemas.url.test(url)) {
    return {
      field: 'url',
      message: 'Invalid URL format',
      severity: 'error'
    };
  }
  return null;
}

export function validateNumber(
  value: unknown,
  fieldName: string,
  min?: number,
  max?: number
): ValidationError | null {
  const num = Number(value);
  if (isNaN(num)) {
    return {
      field: fieldName,
      message: `${fieldName} must be a number`,
      severity: 'error'
    };
  }
  if (min !== undefined && num < min) {
    return {
      field: fieldName,
      message: `${fieldName} must be at least ${min}`,
      severity: 'error'
    };
  }
  if (max !== undefined && num > max) {
    return {
      field: fieldName,
      message: `${fieldName} must be at most ${max}`,
      severity: 'error'
    };
  }
  return null;
}

export function validateDate(
  value: unknown,
  fieldName: string
): ValidationError | null {
  const date = new Date(value as number);
  if (isNaN(date.getTime())) {
    return {
      field: fieldName,
      message: `${fieldName} must be a valid date`,
      severity: 'error'
    };
  }
  return null;
}

// ============================================
// Type-Specific Validation Functions
// ============================================

export function validateCompetitorData(data: unknown): FormValidationResult<CompetitorData> {
  const errors: ValidationError[] = [];

  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      errors: [{
        field: 'data',
        message: 'Invalid competitor data format',
        severity: 'error'
      }]
    };
  }

  const competitor = data as Record<string, unknown>;

  // Validate required fields
  const requiredFields = ['id', 'name', 'lastUpdated'];
  for (const field of requiredFields) {
    const error = validateRequired(competitor[field], field);
    if (error) errors.push(error);
  }

  // Validate optional fields
  if (competitor.pricing !== undefined) {
    const error = validateNumber(competitor.pricing, 'pricing', 0);
    if (error) errors.push(error);
  }

  if (competitor.rating !== undefined) {
    const error = validateNumber(competitor.rating, 'rating', 0, 5);
    if (error) errors.push(error);
  }

  if (competitor.marketShare !== undefined) {
    const error = validateNumber(competitor.marketShare, 'marketShare', 0, 100);
    if (error) errors.push(error);
  }

  if (competitor.url !== undefined) {
    const error = validateUrl(competitor.url as string);
    if (error) errors.push(error);
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? data as CompetitorData : undefined
  };
}

export function validateReviewData(data: unknown): FormValidationResult<ReviewData> {
  const errors: ValidationError[] = [];

  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      errors: [{
        field: 'data',
        message: 'Invalid review data format',
        severity: 'error'
      }]
    };
  }

  const review = data as Record<string, unknown>;

  // Validate required fields
  const requiredFields = ['id', 'productId', 'rating', 'comment'];
  for (const field of requiredFields) {
    const error = validateRequired(review[field], field);
    if (error) errors.push(error);
  }

  // Validate rating range
  if (review.rating !== undefined) {
    const error = validateNumber(review.rating, 'rating', 1, 5);
    if (error) errors.push(error);
  }

  // Validate productId
  if (review.productId !== undefined) {
    const error = validateNumber(review.productId, 'productId', 1);
    if (error) errors.push(error);
  }

  // Validate comment length
  if (typeof review.comment === 'string' && review.comment.length > 5000) {
    errors.push({
      field: 'comment',
      message: 'Comment must be less than 5000 characters',
      severity: 'error'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? data as ReviewData : undefined
  };
}

export function validateOrderMetric(data: unknown): FormValidationResult<OrderMetric> {
  const errors: ValidationError[] = [];

  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      errors: [{
        field: 'data',
        message: 'Invalid order metric format',
        severity: 'error'
      }]
    };
  }

  const order = data as Record<string, unknown>;

  // Validate required fields
  const requiredFields = ['id', 'total', 'status', 'date'];
  for (const field of requiredFields) {
    const error = validateRequired(order[field], field);
    if (error) errors.push(error);
  }

  // Validate total amount
  if (order.total !== undefined) {
    const error = validateNumber(order.total, 'total', 0);
    if (error) errors.push(error);
  }

  // Validate date
  if (order.date !== undefined) {
    const error = validateDate(order.date, 'date');
    if (error) errors.push(error);
  }

  // Validate status enum
  const validStatuses = ['pending', 'processing', 'completed', 'cancelled', 'refunded'];
  if (order.status && !validStatuses.includes(order.status as string)) {
    errors.push({
      field: 'status',
      message: `Status must be one of: ${validStatuses.join(', ')}`,
      severity: 'error'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? data as OrderMetric : undefined
  };
}

export function validateUserJourney(data: unknown): FormValidationResult<UserJourneyData> {
  const errors: ValidationError[] = [];

  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      errors: [{
        field: 'data',
        message: 'Invalid user journey format',
        severity: 'error'
      }]
    };
  }

  const journey = data as Record<string, unknown>;

  // Validate required fields
  const requiredFields = ['userId', 'sessionId', 'events', 'startTime'];
  for (const field of requiredFields) {
    const error = validateRequired(journey[field], field);
    if (error) errors.push(error);
  }

  // Validate events array
  if (!Array.isArray(journey.events)) {
    errors.push({
      field: 'events',
      message: 'Events must be an array',
      severity: 'error'
    });
  } else if (journey.events.length === 0) {
    errors.push({
      field: 'events',
      message: 'At least one event is required',
      severity: 'error'
    });
  }

  // Validate completion status
  const validStatuses = ['active', 'completed', 'abandoned'];
  if (journey.completionStatus && !validStatuses.includes(journey.completionStatus as string)) {
    errors.push({
      field: 'completionStatus',
      message: `Completion status must be one of: ${validStatuses.join(', ')}`,
      severity: 'error'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? data as UserJourneyData : undefined
  };
}

// ============================================
// API Validation Functions
// ============================================

export function validateApiRequest<T = unknown>(data: unknown): FormValidationResult<ApiRequest<T>> {
  const errors: ValidationError[] = [];

  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      errors: [{
        field: 'data',
        message: 'Invalid API request format',
        severity: 'error'
      }]
    };
  }

  const request = data as Record<string, unknown>;

  // Validate HTTP method
  const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
  if (!request.method || !validMethods.includes(request.method as string)) {
    errors.push({
      field: 'method',
      message: `Method must be one of: ${validMethods.join(', ')}`,
      severity: 'error'
    });
  }

  // Validate headers
  if (!request.headers || typeof request.headers !== 'object') {
    errors.push({
      field: 'headers',
      message: 'Headers must be an object',
      severity: 'error'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? data as ApiRequest<T> : undefined
  };
}

export function validateApiResponse<T = unknown>(data: unknown): FormValidationResult<ApiResponse<T>> {
  const errors: ValidationError[] = [];

  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      errors: [{
        field: 'data',
        message: 'Invalid API response format',
        severity: 'error'
      }]
    };
  }

  const response = data as Record<string, unknown>;

  // Validate status code
  if (response.status !== undefined) {
    const error = validateNumber(response.status, 'status', 100, 599);
    if (error) errors.push(error);
  } else {
    errors.push({
      field: 'status',
      message: 'Status code is required',
      severity: 'error'
    });
  }

  // Validate error if present
  if (response.error && typeof response.error === 'object') {
    const err = response.error as Record<string, unknown>;
    if (!err.code || !err.message) {
      errors.push({
        field: 'error',
        message: 'Error must have code and message',
        severity: 'error'
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? data as ApiResponse<T> : undefined
  };
}

// ============================================
// Sanitization Functions
// ============================================

export function sanitizeString(value: unknown, maxLength = 1000): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}

export function sanitizeNumber(value: unknown, defaultValue = 0): number {
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

export function sanitizeBoolean(value: unknown, defaultValue = false): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  return defaultValue;
}

export function sanitizeArray<T>(value: unknown, defaultValue: T[] = []): T[] {
  return Array.isArray(value) ? value : defaultValue;
}

export function sanitizeObject<T extends Record<string, unknown>>(
  value: unknown,
  defaultValue: T
): T {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return defaultValue;
  }
  return value as T;
}

// ============================================
// Deep Validation Functions
// ============================================

export function deepValidate(
  data: unknown,
  schema: Record<string, unknown>
): FormValidationResult {
  const errors: ValidationError[] = [];

  function validateRecursive(
    obj: unknown,
    schemaObj: unknown,
    path = ''
  ): void {
    if (schemaObj && typeof schemaObj === 'object' && !Array.isArray(schemaObj)) {
      const schemaRecord = schemaObj as Record<string, unknown>;
      const dataRecord = obj as Record<string, unknown> || {};

      for (const key in schemaRecord) {
        if (Object.prototype.hasOwnProperty.call(schemaRecord, key)) {
          const fullPath = path ? `${path}.${key}` : key;
          const schemaValue = schemaRecord[key];
          const dataValue = dataRecord[key];

        if (typeof schemaValue === 'function') {
          // It's a validator function
          const validator = schemaValue as (value: unknown) => ValidationError | null;
          const error = validator(dataValue);
          if (error) {
            errors.push({ ...error, field: fullPath });
          }
        } else if (typeof schemaValue === 'object') {
          // Recurse into nested object
          validateRecursive(dataValue, schemaValue, fullPath);
        }
        }
      }
    }
  }

  validateRecursive(data, schema);

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? data : undefined
  };
}

// ============================================
// Type Guard Helpers
// ============================================

export function isNonNullable<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined;
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isArray<T = unknown>(value: unknown): value is T[] {
  return Array.isArray(value);
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function isFunction(value: unknown): value is Function {
  return typeof value === 'function';
}

export function isDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

export function isPromise<T = unknown>(value: unknown): value is Promise<T> {
  return value instanceof Promise;
}