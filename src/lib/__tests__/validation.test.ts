import {
  validations,
  searchApiSchema,
  semanticSearchApiSchema,
  semanticSearchBodySchema,
  productApiSchema,
  analyticsEventSchema,
  batchAnalyticsSchema,
  loginSchema,
  reviewSchema,
  woocommerceParamsSchema,
  cartItemSchema,
  cartUpdateSchema,
  adminActionSchema,
  contactSchema,
  fileUploadSchema,
  rateLimitSchema,
  envValidationSchema,
  recommendationApiSchema,
  graphEntitiesApiSchema,
  searchRecommendationSchema,
  performanceMetricsSchema,
  validateRequest,
  ValidationError
} from '@/lib/validation';
import { z } from 'zod';

describe('Validation Schemas', () => {
  describe('Basic Validations', () => {
    describe('safeString', () => {
      it('should validate clean strings', () => {
        const schema = validations.safeString(50);

        expect(schema.parse('Hello World')).toBe('Hello World');
        expect(schema.parse('  Trimmed  ')).toBe('Trimmed');
        expect(schema.parse('Special chars: !@#$%^&*()')).toBe('Special chars: !@#$%^&*()');
      });

      it('should reject malicious content', () => {
        const schema = validations.safeString(50);

        expect(() => schema.parse('<script>alert("xss")</script>')).toThrow();
        expect(() => schema.parse('javascript:alert("xss")')).toThrow();
        expect(() => schema.parse('data:text/html,<script>alert("xss")</script>')).toThrow();
        expect(() => schema.parse('vbscript:msgbox("xss")')).toThrow();
      });

      it('should respect length limits', () => {
        const schema = validations.safeString(10);

        expect(schema.parse('short')).toBe('short');
        expect(() => schema.parse('this is too long for the limit')).toThrow();
      });

      it('should handle edge cases', () => {
        const schema = validations.safeString(100);

        expect(schema.parse('')).toBe('');
        expect(schema.parse('   ')).toBe('');
        expect(schema.parse('Single')).toBe('Single');
      });
    });

    describe('searchQuery', () => {
      it('should validate valid search queries', () => {
        expect(validations.searchQuery.parse('organic rice')).toBe('organic rice');
        expect(validations.searchQuery.parse('black-rice_premium')).toBe('black-rice_premium');
        expect(validations.searchQuery.parse('product123')).toBe('product123');
        expect(validations.searchQuery.parse('Rice & Grains')).toBe('Rice & Grains');
      });

      it('should reject invalid search queries', () => {
        expect(() => validations.searchQuery.parse('')).toThrow();
        expect(() => validations.searchQuery.parse('a'.repeat(201))).toThrow();
        expect(() => validations.searchQuery.parse('search\x00null')).toThrow();
      });

      it('should allow special characters commonly used in searches', () => {
        expect(validations.searchQuery.parse('price: $10-20')).toBe('price: $10-20');
        expect(validations.searchQuery.parse('organic (premium)')).toBe('organic (premium)');
        expect(validations.searchQuery.parse('rice, grains & cereals')).toBe('rice, grains & cereals');
      });
    });

    describe('productId', () => {
      it('should validate positive integers', () => {
        expect(validations.productId.parse(1)).toBe(1);
        expect(validations.productId.parse(999999)).toBe(999999);
      });

      it('should reject invalid product IDs', () => {
        expect(() => validations.productId.parse(0)).toThrow();
        expect(() => validations.productId.parse(-1)).toThrow();
        expect(() => validations.productId.parse(1.5)).toThrow();
        expect(() => validations.productId.parse('123')).toThrow();
      });
    });

    describe('productSlug', () => {
      it('should validate proper slugs', () => {
        expect(validations.productSlug.parse('organic-rice')).toBe('organic-rice');
        expect(validations.productSlug.parse('product123')).toBe('product123');
        expect(validations.productSlug.parse('a')).toBe('a');
      });

      it('should reject invalid slugs', () => {
        expect(() => validations.productSlug.parse('')).toThrow();
        expect(() => validations.productSlug.parse('UPPERCASE')).toThrow();
        expect(() => validations.productSlug.parse('spaces in slug')).toThrow();
        expect(() => validations.productSlug.parse('special_chars')).toThrow();
        expect(() => validations.productSlug.parse('a'.repeat(101))).toThrow();
      });
    });

    describe('pagination', () => {
      it('should validate pagination parameters', () => {
        const result = validations.pagination.parse({ page: 1, limit: 10 });
        expect(result).toEqual({ page: 1, limit: 10 });

        const result2 = validations.pagination.parse({ page: 5, limit: 50 });
        expect(result2).toEqual({ page: 5, limit: 50 });
      });

      it('should apply defaults', () => {
        const result = validations.pagination.parse({});
        expect(result).toEqual({ page: 1, limit: 10 });
      });

      it('should reject invalid pagination', () => {
        expect(() => validations.pagination.parse({ page: 0, limit: 10 })).toThrow();
        expect(() => validations.pagination.parse({ page: 1001, limit: 10 })).toThrow();
        expect(() => validations.pagination.parse({ page: 1, limit: 0 })).toThrow();
        expect(() => validations.pagination.parse({ page: 1, limit: 101 })).toThrow();
      });
    });

    describe('email', () => {
      it('should validate valid emails', () => {
        expect(validations.email.parse('test@example.com')).toBe('test@example.com');
        expect(validations.email.parse('user.name@domain.co.uk')).toBe('user.name@domain.co.uk');
        expect(validations.email.parse('user+tag@example.org')).toBe('user+tag@example.org');
      });

      it('should reject invalid emails', () => {
        expect(() => validations.email.parse('invalid')).toThrow();
        expect(() => validations.email.parse('test@')).toThrow();
        expect(() => validations.email.parse('@domain.com')).toThrow();
        expect(() => validations.email.parse('test..test@example.com')).toThrow();
      });
    });

    describe('price', () => {
      it('should validate prices', () => {
        expect(validations.price.parse(0)).toBe(0);
        expect(validations.price.parse(99.99)).toBe(99.99);
        expect(validations.price.parse(999999.99)).toBe(999999.99);
      });

      it('should reject invalid prices', () => {
        expect(() => validations.price.parse(-1)).toThrow();
        expect(() => validations.price.parse(1000000)).toThrow();
        expect(() => validations.price.parse('19.99')).toThrow();
      });
    });

    describe('rating', () => {
      it('should validate ratings', () => {
        expect(validations.rating.parse(1)).toBe(1);
        expect(validations.rating.parse(3.5)).toBe(3.5);
        expect(validations.rating.parse(5)).toBe(5);
      });

      it('should reject invalid ratings', () => {
        expect(() => validations.rating.parse(0)).toThrow();
        expect(() => validations.rating.parse(6)).toThrow();
        expect(() => validations.rating.parse(-1)).toThrow();
      });
    });

    describe('url', () => {
      it('should validate URLs', () => {
        expect(validations.url.parse('https://example.com')).toBe('https://example.com');
        expect(validations.url.parse('http://test.org/path?query=1')).toBe('http://test.org/path?query=1');
      });

      it('should reject invalid URLs', () => {
        expect(() => validations.url.parse('not-a-url')).toThrow();
        expect(() => validations.url.parse('just-text')).toThrow();
      });
    });

    describe('boolean', () => {
      it('should coerce various boolean values', () => {
        expect(validations.boolean.parse(true)).toBe(true);
        expect(validations.boolean.parse(false)).toBe(false);
        expect(validations.boolean.parse('true')).toBe(true);
        expect(validations.boolean.parse('1')).toBe(true);
        expect(validations.boolean.parse(1)).toBe(true);
        expect(validations.boolean.parse('false')).toBe(false);
        expect(validations.boolean.parse('0')).toBe(false);
        expect(validations.boolean.parse(0)).toBe(false);
      });
    });

    describe('dateString', () => {
      it('should validate date strings', () => {
        expect(validations.dateString.parse('2024-01-15')).toBe('2024-01-15');
        expect(validations.dateString.parse('2023-12-31')).toBe('2023-12-31');
      });

      it('should reject invalid date strings', () => {
        expect(() => validations.dateString.parse('2024-1-15')).toThrow();
        expect(() => validations.dateString.parse('01/15/2024')).toThrow();
        expect(() => validations.dateString.parse('invalid')).toThrow();
      });
    });

    describe('ipAddress', () => {
      it('should validate IP addresses', () => {
        expect(validations.ipAddress.parse('192.168.1.1')).toBe('192.168.1.1');
        expect(validations.ipAddress.parse('10.0.0.1')).toBe('10.0.0.1');
        expect(validations.ipAddress.parse('255.255.255.255')).toBe('255.255.255.255');
      });

      it('should reject invalid IP addresses', () => {
        expect(() => validations.ipAddress.parse('256.1.1.1')).toThrow();
        expect(() => validations.ipAddress.parse('192.168.1')).toThrow();
        expect(() => validations.ipAddress.parse('not-an-ip')).toThrow();
      });
    });
  });

  describe('API Schema Validations', () => {
    describe('searchApiSchema', () => {
      it('should validate search API requests', () => {
        const result = searchApiSchema.parse({
          q: 'organic rice',
          limit: 20,
          category: 'grains',
          inStock: true,
          minScore: 0.5
        });

        expect(result.q).toBe('organic rice');
        expect(result.limit).toBe(20);
        expect(result.category).toBe('grains');
      });

      it('should apply defaults', () => {
        const result = searchApiSchema.parse({ q: 'rice' });
        expect(result.limit).toBe(10);
        expect(result.minScore).toBe(0.3);
      });

      it('should reject invalid search requests', () => {
        expect(() => searchApiSchema.parse({ q: '' })).toThrow();
        expect(() => searchApiSchema.parse({ q: 'rice', limit: 0 })).toThrow();
        expect(() => searchApiSchema.parse({ q: 'rice', limit: 51 })).toThrow();
      });
    });

    describe('semanticSearchApiSchema', () => {
      it('should validate semantic search requests', () => {
        const result = semanticSearchApiSchema.parse({
          q: 'healthy grains',
          limit: 15,
          category: 'grains',
          inStock: true
        });

        expect(result.q).toBe('healthy grains');
        expect(result.limit).toBe(15);
        expect(result.inStock).toBe(true);
      });
    });

    describe('semanticSearchBodySchema', () => {
      it('should validate POST body for semantic search', () => {
        const result = semanticSearchBodySchema.parse({
          query: 'organic products',
          limit: 25,
          minScore: 0.4,
          filters: {
            categories: ['rice', 'grains'],
            inStock: true,
            featured: false,
            priceRange: { min: 100, max: 500 }
          }
        });

        expect(result.query).toBe('organic products');
        expect(result.filters?.categories).toEqual(['rice', 'grains']);
        expect(result.filters?.priceRange?.min).toBe(100);
      });

      it('should handle empty filters', () => {
        const result = semanticSearchBodySchema.parse({
          query: 'rice'
        });

        expect(result.query).toBe('rice');
        expect(result.limit).toBe(10);
        expect(result.minScore).toBe(0.3);
      });
    });

    describe('productApiSchema', () => {
      it('should validate product API requests', () => {
        const result = productApiSchema.parse({ slug: 'organic-rice' });
        expect(result.slug).toBe('organic-rice');
      });

      it('should reject invalid product requests', () => {
        expect(() => productApiSchema.parse({ slug: 'INVALID SLUG' })).toThrow();
        expect(() => productApiSchema.parse({ slug: '' })).toThrow();
      });
    });

    describe('analyticsEventSchema', () => {
      it('should validate analytics events', () => {
        const result = analyticsEventSchema.parse({
          sessionId: 'session123',
          type: 'product_view',
          data: { productId: 123, price: 299 }
        });

        expect(result.sessionId).toBe('session123');
        expect(result.type).toBe('product_view');
        expect(result.data).toEqual({ productId: 123, price: 299 });
      });

      it('should reject invalid event types', () => {
        expect(() => analyticsEventSchema.parse({
          sessionId: 'session123',
          type: 'invalid_event'
        })).toThrow();
      });
    });

    describe('batchAnalyticsSchema', () => {
      it('should validate batch analytics', () => {
        const result = batchAnalyticsSchema.parse({
          events: [
            { sessionId: 'session1', type: 'product_view' },
            { sessionId: 'session1', type: 'search_performed' }
          ]
        });

        expect(result.events).toHaveLength(2);
      });

      it('should reject empty or oversized batches', () => {
        expect(() => batchAnalyticsSchema.parse({ events: [] })).toThrow();

        const tooManyEvents = Array.from({ length: 101 }, (_, i) => ({
          sessionId: `session${i}`,
          type: 'product_view' as const
        }));

        expect(() => batchAnalyticsSchema.parse({ events: tooManyEvents })).toThrow();
      });
    });
  });

  describe('Form Validation Schemas', () => {
    describe('loginSchema', () => {
      it('should validate login credentials', () => {
        const result = loginSchema.parse({
          username: 'testuser',
          password: 'securepassword123'
        });

        expect(result.username).toBe('testuser');
        expect(result.password).toBe('securepassword123');
      });

      it('should reject invalid credentials', () => {
        expect(() => loginSchema.parse({ username: 'ab', password: 'short' })).toThrow();
        expect(() => loginSchema.parse({ username: 'user@invalid', password: 'validpassword' })).toThrow();
      });
    });

    describe('reviewSchema', () => {
      it('should validate product reviews', () => {
        const result = reviewSchema.parse({
          productId: 123,
          rating: 4.5,
          title: 'Great product',
          content: 'I really enjoyed this product. Quality is excellent!',
          authorName: 'John Doe',
          authorEmail: 'john@example.com'
        });

        expect(result.productId).toBe(123);
        expect(result.rating).toBe(4.5);
        expect(result.verified).toBe(false); // default
      });

      it('should reject invalid reviews', () => {
        expect(() => reviewSchema.parse({
          productId: 0,
          rating: 6,
          title: 'Review',
          content: 'Content',
          authorName: 'Author',
          authorEmail: 'invalid-email'
        })).toThrow();
      });
    });

    describe('contactSchema', () => {
      it('should validate contact form data', () => {
        const result = contactSchema.parse({
          name: 'John Doe',
          email: 'john@example.com',
          subject: 'Product Inquiry',
          message: 'I have a question about your organic rice products.',
          honeypot: ''
        });

        expect(result.name).toBe('John Doe');
        expect(result.email).toBe('john@example.com');
        expect(result.honeypot).toBe('');
      });

      it('should reject spam (honeypot filled)', () => {
        expect(() => contactSchema.parse({
          name: 'John Doe',
          email: 'john@example.com',
          subject: 'Test',
          message: 'Test message',
          honeypot: 'spam content'
        })).toThrow();
      });
    });
  });

  describe('E-commerce Schema Validations', () => {
    describe('cartItemSchema', () => {
      it('should validate cart items', () => {
        const result = cartItemSchema.parse({
          productId: 123,
          quantity: 2,
          variationId: 456,
          variation: { color: 'red', size: 'large' }
        });

        expect(result.productId).toBe(123);
        expect(result.quantity).toBe(2);
        expect(result.variationId).toBe(456);
      });

      it('should reject invalid quantities', () => {
        expect(() => cartItemSchema.parse({
          productId: 123,
          quantity: 0
        })).toThrow();

        expect(() => cartItemSchema.parse({
          productId: 123,
          quantity: 1000
        })).toThrow();
      });
    });

    describe('cartUpdateSchema', () => {
      it('should validate cart updates', () => {
        const result = cartUpdateSchema.parse({
          items: [
            { productId: 123, quantity: 2 },
            { productId: 456, quantity: 1 }
          ]
        });

        expect(result.items).toHaveLength(2);
      });

      it('should reject oversized carts', () => {
        const tooManyItems = Array.from({ length: 101 }, (_, i) => ({
          productId: i + 1,
          quantity: 1
        }));

        expect(() => cartUpdateSchema.parse({ items: tooManyItems })).toThrow();
      });
    });

    describe('woocommerceParamsSchema', () => {
      it('should validate WooCommerce API parameters', () => {
        const result = woocommerceParamsSchema.parse({
          per_page: 20,
          page: 2,
          status: 'publish',
          featured: true,
          orderby: 'date',
          order: 'desc'
        });

        expect(result.per_page).toBe(20);
        expect(result.status).toBe('publish');
        expect(result.featured).toBe(true);
      });
    });
  });

  describe('Utility Functions', () => {
    describe('validateRequest', () => {
      it('should validate and return parsed data', () => {
        const schema = z.object({
          name: z.string(),
          age: z.number()
        });

        const result = validateRequest(schema, {
          name: 'John',
          age: 30
        });

        expect(result.name).toBe('John');
        expect(result.age).toBe(30);
      });

      it('should throw ValidationError for invalid data', () => {
        const schema = z.object({
          name: z.string(),
          age: z.number().min(18)
        });

        expect(() => validateRequest(schema, {
          name: 'John',
          age: 16
        })).toThrow(ValidationError);
      });

      it('should include field information in ValidationError', () => {
        const schema = z.object({
          email: validations.email,
          age: z.number().min(18)
        });

        try {
          validateRequest(schema, {
            email: 'invalid-email',
            age: 16
          });
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          const validationError = error as ValidationError;
          expect(validationError.issues).toBeDefined();
          expect(validationError.issues.length).toBeGreaterThan(0);
          expect(validationError.issues[0]?.field).toBeDefined();
          expect(validationError.issues[0]?.message).toBeDefined();
        }
      });
    });

    describe('ValidationError', () => {
      it('should create proper error instances', () => {
        const issues = [
          { field: 'email', message: 'Invalid email', code: 'invalid_string' },
          { field: 'age', message: 'Too young', code: 'too_small' }
        ];

        const error = new ValidationError('Validation failed', issues);

        expect(error.name).toBe('ValidationError');
        expect(error.message).toBe('Validation failed');
        expect(error.issues).toBe(issues);
        expect(error).toBeInstanceOf(Error);
      });
    });
  });

  describe('Security and Edge Cases', () => {
    it('should prevent XSS in all string fields', () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        'data:text/html,<script>alert("xss")</script>',
        'vbscript:msgbox("xss")'
      ];

      xssPayloads.forEach(payload => {
        expect(() => validations.safeString().parse(payload)).toThrow();
        expect(() => contactSchema.parse({
          name: payload,
          email: 'test@example.com',
          subject: 'Test',
          message: 'Test',
          honeypot: ''
        })).toThrow();
      });
    });

    it('should handle unicode and international characters', () => {
      expect(validations.safeString().parse('Café')).toBe('Café');
      expect(validations.safeString().parse('北京')).toBe('北京');
      expect(validations.safeString().parse('München')).toBe('München');
    });

    it('should handle large data sets within limits', () => {
      const largeButValidString = 'a'.repeat(999); // Just under limit
      expect(validations.safeString(1000).parse(largeButValidString)).toBe(largeButValidString);

      const tooLargeString = 'a'.repeat(1001);
      expect(() => validations.safeString(1000).parse(tooLargeString)).toThrow();
    });

    it('should validate environment configuration', () => {
      const validEnv = {
        NODE_ENV: 'production',
        WC_CONSUMER_KEY: 'valid_consumer_key',
        WC_CONSUMER_SECRET: 'valid_consumer_secret',
        JWT_SECRET: 'a_very_long_jwt_secret_that_is_at_least_32_characters',
        ADMIN_PASSWORD: 'securepassword123'
      };

      expect(() => envValidationSchema.parse(validEnv)).not.toThrow();

      const invalidEnv = {
        ...validEnv,
        JWT_SECRET: 'too_short',
        NODE_ENV: 'invalid'
      };

      expect(() => envValidationSchema.parse(invalidEnv)).toThrow();
    });
  });

  describe('Performance and Memory', () => {
    it('should handle validation of multiple items efficiently', () => {
      const startTime = Date.now();

      // Validate 1000 items
      for (let i = 0; i < 1000; i++) {
        validations.productSlug.parse(`product-${i}`);
        validations.email.parse(`user${i}@example.com`);
        validations.price.parse(i * 10.99);
      }

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
    });

    it('should not leak memory during repeated validation', () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Perform many validation operations
      for (let i = 0; i < 100; i++) {
        validations.safeString(100).parse(`test string ${i}`);
        validations.productId.parse(i + 1);
        validations.price.parse(i * 10.99);
        validations.searchQuery.parse(`query ${i}`);
        validations.email.parse(`test${i}@example.com`);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 2MB for 500 operations)
      expect(memoryIncrease).toBeLessThan(2 * 1024 * 1024);
    });
  });
});