/**
 * Error handling utilities with proper serialization
 */

export interface SerializedError {
  message: string;
  name?: string;
  stack?: string;
  code?: string;
  statusCode?: number;
  cause?: SerializedError;
  context?: {
    url?: string;
    method?: string;
    userId?: string | number | boolean;
    sessionId?: string;
    timestamp?: string;
    [key: string]: string | number | boolean | undefined;
  };
}

/**
 * Safely serialize any error type to a structured format
 */
export function serializeError(error: unknown): SerializedError {
  // Handle null/undefined
  if (error == null) {
    return {
      message: 'Unknown error occurred',
      name: 'UnknownError'
    };
  }

  // Handle Error instances
  if (error instanceof Error) {
    const serialized: SerializedError = {
      message: error.message,
      name: error.name,
      stack: error.stack
    };

    // Handle common error extensions
    const errorWithCode = error as Error & { code?: string; statusCode?: number };
    if (errorWithCode.code) {
      serialized.code = errorWithCode.code;
    }
    if (errorWithCode.statusCode) {
      serialized.statusCode = errorWithCode.statusCode;
    }

    // Handle Error.cause (ES2022)
    if ('cause' in error && error.cause != null) {
      serialized.cause = serializeError(error.cause);
    }

    return serialized;
  }

  // Handle objects that look like errors
  if (typeof error === 'object') {
    const obj = error as Record<string, unknown>;
    const serialized: SerializedError = {
      message: String(obj.message || obj.error || obj.msg || JSON.stringify(error)),
      name: String(obj.name || 'ObjectError')
    };

    if (obj.stack) serialized.stack = String(obj.stack);
    if (obj.code) serialized.code = String(obj.code);
    if (obj.statusCode) serialized.statusCode = Number(obj.statusCode);

    return serialized;
  }

  // Handle primitives
  return {
    message: String(error),
    name: typeof error === 'string' ? 'StringError' : 'PrimitiveError'
  };
}

/**
 * Format error for logging with appropriate detail level
 */
export function formatErrorForLogging(
  error: unknown,
  includeStack = process.env.NODE_ENV !== 'production'
): string {
  const serialized = serializeError(error);

  if (!includeStack) {
    return `${serialized.name || 'Error'}: ${serialized.message}`;
  }

  let formatted = `${serialized.name || 'Error'}: ${serialized.message}`;

  if (serialized.code) {
    formatted += ` [${serialized.code}]`;
  }

  if (serialized.stack) {
    formatted += `\n${serialized.stack}`;
  }

  if (serialized.cause) {
    formatted += `\nCaused by: ${formatErrorForLogging(serialized.cause, includeStack)}`;
  }

  return formatted;
}

/**
 * Check if a value is an Error instance
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error ||
    (typeof value === 'object' &&
     value !== null &&
     'message' in value &&
     'name' in value);
}

/**
 * Create a standardized application error
 */
export class AppError extends Error {
  public readonly code?: string;
  public readonly statusCode?: number;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    options?: {
      code?: string;
      statusCode?: number;
      cause?: unknown;
      context?: Record<string, unknown>;
    }
  ) {
    super(message);
    this.name = 'AppError';
    this.code = options?.code;
    this.statusCode = options?.statusCode;
    this.context = options?.context;

    if (options?.cause) {
      this.cause = options.cause;
    }

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

/**
 * Type-safe error wrapping
 */
export function wrapError(error: unknown, message: string): AppError {
  return new AppError(message, { cause: error });
}

/**
 * Extract error message safely
 */
export function getErrorMessage(error: unknown): string {
  return serializeError(error).message;
}

/**
 * Check if error is retryable based on code
 */
export function isRetryableError(error: unknown): boolean {
  const serialized = serializeError(error);

  // Network errors
  if (serialized.code && ['ETIMEDOUT', 'ECONNRESET', 'ENOTFOUND', 'ECONNREFUSED'].includes(serialized.code)) {
    return true;
  }

  // HTTP status codes that are retryable
  if (serialized.statusCode && [408, 429, 502, 503, 504].includes(serialized.statusCode)) {
    return true;
  }

  return false;
}