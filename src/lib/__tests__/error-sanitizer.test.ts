/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  sanitizeError,
  logError,
  createErrorResponse,
  handleApiError,
  handleError,
  type SanitizedError,
  type ErrorSanitizationOptions
} from '@/lib/error-sanitizer';

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock global Response for testing
global.Response = jest.fn().mockImplementation((body, init) => ({
  body,
  status: init?.status || 200,
  headers: new Map(Object.entries(init?.headers || {})),
  json: () => Promise.resolve(JSON.parse(body)),
})) as any;

describe('Error Sanitizer', () => {
  const mockLogger = require('@/lib/logger').logger;
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment to development for most tests
    process.env.NODE_ENV = 'development';
  });

  afterAll(() => {
    process.env.NODE_ENV = originalEnv;
  });

  describe('sanitizeError', () => {
    it('should sanitize basic Error objects in development', () => {
      const error = new Error('Test error message');
      const result = sanitizeError(error);

      expect(result.message).toBe('Test error message');
      expect(result.timestamp).toBeDefined();
      expect(result.requestId).toBeDefined();
      expect(result.requestId).toMatch(/^req_\d+_[a-z0-9]+$/);
    });

    it('should handle Error objects with custom code', () => {
      const error = new Error('Validation failed') as any;
      error.code = 'VALIDATION_FAILED';

      const result = sanitizeError(error);

      expect(result.message).toBe('Validation failed');
      expect(result.code).toBe('VALIDATION_FAILED');
    });

    it('should handle unknown error types', () => {
      const unknownError = 'string error';
      const result = sanitizeError(unknownError);

      expect(result.message).toBe('Unknown error');
      expect(result.timestamp).toBeDefined();
      expect(result.requestId).toBeDefined();
    });

    it('should handle null/undefined errors', () => {
      const result1 = sanitizeError(null);
      const result2 = sanitizeError(undefined);

      expect(result1.message).toBe('Unknown error');
      expect(result2.message).toBe('Unknown error');
    });

    describe('Production mode', () => {
      beforeEach(() => {
        process.env.NODE_ENV = 'production';
      });

      it('should return generic message for unknown errors in production', () => {
        const error = new Error('Sensitive database connection failed');
        const result = sanitizeError(error);

        expect(result.message).toBe('An unexpected error occurred');
        expect(result.code).toBe('INTERNAL_ERROR');
      });

      it('should handle ValidationError appropriately in production', () => {
        const error = new Error('Invalid data') as any;
        error.name = 'ValidationError';

        const result = sanitizeError(error);

        expect(result.message).toBe('Invalid input provided');
        expect(result.code).toBe('VALIDATION_ERROR');
      });

      it('should handle UnauthorizedError appropriately in production', () => {
        const error = new Error('Token expired') as any;
        error.name = 'UnauthorizedError';

        const result = sanitizeError(error);

        expect(result.message).toBe('Authentication required');
        expect(result.code).toBe('UNAUTHORIZED');
      });

      it('should handle ForbiddenError appropriately in production', () => {
        const error = new Error('Access denied') as any;
        error.name = 'ForbiddenError';

        const result = sanitizeError(error);

        expect(result.message).toBe('Access denied');
        expect(result.code).toBe('FORBIDDEN');
      });

      it('should handle NotFoundError appropriately in production', () => {
        const error = new Error('Resource not found') as any;
        error.name = 'NotFoundError';

        const result = sanitizeError(error);

        expect(result.message).toBe('Resource not found');
        expect(result.code).toBe('NOT_FOUND');
      });

      it('should handle RateLimitError appropriately in production', () => {
        const error = new Error('Rate limit exceeded') as any;
        error.name = 'RateLimitError';

        const result = sanitizeError(error);

        expect(result.message).toBe('Too many requests. Please try again later.');
        expect(result.code).toBe('RATE_LIMIT_EXCEEDED');
      });

      it('should use custom generic message when provided', () => {
        const error = new Error('Internal server error');
        const result = sanitizeError(error, {
          genericMessage: 'Service temporarily unavailable'
        });

        expect(result.message).toBe('Service temporarily unavailable');
        expect(result.code).toBe('INTERNAL_ERROR');
      });
    });

    describe('Options handling', () => {
      it('should include details when requested in development', () => {
        const error = new Error('Test error') as any;
        error.details = { userId: 123, action: 'test' };

        const result = sanitizeError(error, { includeDetails: true });

        expect(result.message).toBe('Test error');
        expect(result.details).toBeDefined();
      });

      it('should exclude details by default in production', () => {
        process.env.NODE_ENV = 'production';
        const error = new Error('Test error') as any;
        error.details = { userId: 123, action: 'test' };

        const result = sanitizeError(error);

        expect(result.details).toBeUndefined();
      });
    });
  });

  describe('logError', () => {
    it('should log errors with appropriate level', () => {
      const error = new Error('Test error');

      logError(error, { userId: '123', endpoint: '/api/test' });

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error:',
        expect.objectContaining({
          message: 'Test error',
          context: expect.objectContaining({
            userId: '123',
            endpoint: '/api/test'
          })
        })
      );
    });

    it('should log validation errors as warnings', () => {
      const error = new Error('Invalid input') as any;
      error.name = 'ValidationError';

      logError(error);

      expect(mockLogger.warn).toHaveBeenCalled();
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should log not found errors as info', () => {
      const error = new Error('Not found') as any;
      error.name = 'NotFoundError';

      logError(error);

      expect(mockLogger.info).toHaveBeenCalled();
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should handle context information', () => {
      const error = new Error('Context test');
      const context = {
        endpoint: '/api/users',
        userId: 'user123',
        requestId: 'req123',
        additionalInfo: { ip: '192.168.1.1' }
      };

      logError(error, context);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error:',
        expect.objectContaining({
          context: expect.objectContaining(context)
        })
      );
    });

    it('should exclude stack traces in production', () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Production error');
      error.stack = 'Error: Production error\n    at test.js:1:1';

      logError(error);

      const logCall = mockLogger.error.mock.calls[0][1];
      expect(logCall.error.stack).toBeUndefined();
    });

    it('should include stack traces in development', () => {
      const error = new Error('Development error');
      error.stack = 'Error: Development error\n    at test.js:1:1';

      logError(error);

      const logCall = mockLogger.error.mock.calls[0][1];
      expect(logCall.error.stack).toBeDefined();
    });
  });

  describe('createErrorResponse', () => {
    it('should create proper error response', () => {
      const error = new Error('API error');
      const response = createErrorResponse(error, 500) as any;

      expect(response.status).toBe(500);
      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(response.headers.get('X-Request-ID')).toBeTruthy();

      const body = JSON.parse(response.body);
      expect(body.message).toBe('API error');
      expect(body.requestId).toBeTruthy();
    });

    it('should use default status code', () => {
      const error = new Error('Default status test');
      const response = createErrorResponse(error) as any;

      expect(response.status).toBe(500);
    });

    it('should log the error when creating response', () => {
      const error = new Error('Response logging test');
      createErrorResponse(error, 400);

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('handleApiError', () => {
    it('should determine status code from error type', () => {
      const validationError = new Error('Invalid data') as any;
      validationError.name = 'ValidationError';

      const response = handleApiError(validationError) as any;
      expect(response.status).toBe(400);
    });

    it('should handle unauthorized errors', () => {
      const authError = new Error('No token') as any;
      authError.name = 'UnauthorizedError';

      const response = handleApiError(authError) as any;
      expect(response.status).toBe(401);
    });

    it('should handle forbidden errors', () => {
      const forbiddenError = new Error('Access denied') as any;
      forbiddenError.name = 'ForbiddenError';

      const response = handleApiError(forbiddenError) as any;
      expect(response.status).toBe(403);
    });

    it('should handle not found errors', () => {
      const notFoundError = new Error('Resource missing') as any;
      notFoundError.name = 'NotFoundError';

      const response = handleApiError(notFoundError) as any;
      expect(response.status).toBe(404);
    });

    it('should handle rate limit errors', () => {
      const rateLimitError = new Error('Too many requests') as any;
      rateLimitError.name = 'RateLimitError';

      const response = handleApiError(rateLimitError) as any;
      expect(response.status).toBe(429);
    });

    it('should use custom status code when provided', () => {
      const error = new Error('Custom status');
      const response = handleApiError(error, undefined, 418) as any;

      expect(response.status).toBe(418);
    });

    it('should use custom message when provided', () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Internal error');
      const response = handleApiError(error, 'Custom error message') as any;

      const body = JSON.parse(response.body);
      expect(body.message).toBe('Custom error message');
    });
  });

  describe('handleError', () => {
    it('should handle Error objects and return sanitized data', () => {
      const error = new Error('Handle test error');
      const result = handleError(error, 'testContext', { userId: 123 });

      expect(result.message).toBe('Handle test error');
      expect(result.context).toBe('testContext');
      expect(result.userId).toBe(123);
      expect(result.requestId).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });

    it('should handle unknown error types', () => {
      const unknownError = { custom: 'error' };
      const result = handleError(unknownError, 'unknownContext');

      expect(result.message).toBe('Unknown error');
      expect(result.context).toBe('unknownContext');
    });

    it('should log the error', () => {
      const error = new Error('Logging test');
      handleError(error, 'loggingContext');

      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should include additional details', () => {
      const error = new Error('Details test');
      const details = { operation: 'test', retry: false };
      const result = handleError(error, 'detailsContext', details);

      expect(result.operation).toBe('test');
      expect(result.retry).toBe(false);
      expect(result.context).toBe('detailsContext');
    });

    it('should handle string errors', () => {
      const result = handleError('String error', 'stringContext');

      expect(result.message).toBe('Unknown error');
      expect(result.context).toBe('stringContext');
    });

    it('should handle null/undefined errors', () => {
      const result1 = handleError(null, 'nullContext');
      const result2 = handleError(undefined, 'undefinedContext');

      expect(result1.message).toBe('Unknown error');
      expect(result1.context).toBe('nullContext');
      expect(result2.message).toBe('Unknown error');
      expect(result2.context).toBe('undefinedContext');
    });
  });

  describe('Edge cases and integration', () => {
    it('should handle complex error objects', () => {
      const complexError = {
        name: 'ComplexError',
        message: 'Complex error occurred',
        code: 'COMPLEX_001',
        details: {
          stackTrace: 'line 1\nline 2',
          metadata: { timestamp: Date.now() }
        }
      };

      const result = sanitizeError(complexError);

      expect(result.message).toBe('Complex error occurred');
      expect(result.code).toBe('COMPLEX_001');
    });

    it('should handle circular references gracefully', () => {
      const circularError: any = { message: 'Circular error' };
      circularError.self = circularError;

      expect(() => sanitizeError(circularError)).not.toThrow();
      const result = sanitizeError(circularError);
      expect(result.message).toBe('Circular error');
    });

    it('should handle very long error messages', () => {
      const longMessage = 'A'.repeat(10000);
      const error = new Error(longMessage);

      const result = sanitizeError(error);

      expect(result.message).toBe(longMessage);
      expect(result.timestamp).toBeDefined();
    });

    it('should maintain consistent requestId format', () => {
      const error = new Error('RequestID test');
      const result = sanitizeError(error);

      expect(result.requestId).toMatch(/^req_\d+_[a-z0-9]{9}$/);
    });

    it('should handle errors with falsy messages', () => {
      const error = new Error('');
      const result = sanitizeError(error);

      expect(result.message).toBe('Unknown error');
    });

    it('should handle production mode consistently', () => {
      process.env.NODE_ENV = 'production';

      const errors = [
        new Error('Database connection failed'),
        new Error('File system error'),
        new Error('Network timeout'),
      ];

      errors.forEach(error => {
        const result = sanitizeError(error);
        expect(result.message).toBe('An unexpected error occurred');
        expect(result.code).toBe('INTERNAL_ERROR');
      });
    });
  });

  describe('Performance and memory', () => {
    it('should handle rapid error sanitization', () => {
      const start = Date.now();

      for (let i = 0; i < 1000; i++) {
        const error = new Error(`Error ${i}`);
        sanitizeError(error);
      }

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
    });

    it('should not leak memory with repeated operations', () => {
      const initialMemory = process.memoryUsage().heapUsed;

      for (let i = 0; i < 100; i++) {
        const error = new Error(`Memory test ${i}`);
        const result = handleError(error, 'memoryTest', { iteration: i });

        // Clear result to help GC
        Object.keys(result).forEach(key => delete result[key]);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 1MB for 100 operations)
      expect(memoryIncrease).toBeLessThan(1024 * 1024);
    });
  });
});