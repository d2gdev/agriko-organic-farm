// Comprehensive Data Validation and Sanitization System
import { z } from 'zod';
import { logger } from '@/lib/logger';

// Base validation schemas
const PositiveNumber = z.number().positive();
const NonEmptyString = z.string().min(1).trim();
const OptionalString = z.string().optional();
const Timestamp = z.number().int().positive();
const Email = z.string().email();
const URL = z.string().url();

// Product validation schemas
export const ProductSchema = z.object({
  id: PositiveNumber,
  name: NonEmptyString.max(255),
  slug: NonEmptyString.max(255),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/), // Price format validation
  regular_price: z.string().regex(/^\d+(\.\d{1,2})?$/),
  sale_price: z.string().optional(),
  status: z.enum(['publish', 'draft', 'private', 'pending', 'trash']),
  stock_status: z.enum(['instock', 'outofstock', 'onbackorder']),
  stock_quantity: z.number().int().min(0).nullable(),
  categories: z.array(z.object({
    id: PositiveNumber,
    name: NonEmptyString.max(255),
    slug: NonEmptyString.max(255)
  })).optional(),
  images: z.array(z.object({
    id: PositiveNumber,
    src: URL,
    alt: OptionalString
  })).optional(),
  description: OptionalString,
  short_description: OptionalString,
  sku: OptionalString,
  weight: OptionalString,
  on_sale: z.boolean().optional()
});

// Order validation schemas
export const OrderItemSchema = z.object({
  id: PositiveNumber,
  product_id: PositiveNumber,
  variation_id: z.number().int().min(0).optional(),
  quantity: z.number().int().positive(),
  price: z.number().positive(),
  total: z.string().regex(/^\d+(\.\d{1,2})?$/),
  sku: OptionalString,
  name: NonEmptyString.max(255)
});

export const OrderSchema = z.object({
  id: PositiveNumber,
  status: z.enum(['pending', 'processing', 'on-hold', 'completed', 'cancelled', 'refunded', 'failed', 'trash']),
  total: z.string().regex(/^\d+(\.\d{1,2})?$/),
  currency: z.string().length(3), // ISO currency code
  customer_id: z.number().int().min(0),
  billing: z.object({
    first_name: NonEmptyString.max(100),
    last_name: NonEmptyString.max(100),
    email: Email,
    phone: OptionalString,
    address_1: NonEmptyString.max(255),
    city: NonEmptyString.max(100),
    postcode: NonEmptyString.max(20),
    country: z.string().length(2) // ISO country code
  }),
  line_items: z.array(OrderItemSchema),
  date_created: z.string().datetime(),
  payment_method: OptionalString,
  payment_method_title: OptionalString
});

// Webhook validation schemas
export const WebhookDataSchema = z.object({
  id: PositiveNumber,
  action: z.enum(['created', 'updated', 'deleted', 'restored', 'trashed']),
  arg: z.union([ProductSchema, OrderSchema])
});

// Tracking event validation schemas
export const TrackingEventSchema = z.object({
  id: NonEmptyString.max(255),
  type: z.enum([
    'product.view', 'product.add_to_cart', 'product.remove_from_cart', 'product.purchase',
    'search.query', 'search.click', 'search.filter',
    'navigation.click', 'cart.toggle', 'cart.view',
    'page.view', 'session.start', 'session.end',
    'order.created', 'order.completed',
    'user.interaction', 'custom.event'
  ]),
  timestamp: Timestamp,
  sessionId: NonEmptyString.max(255),
  userId: OptionalString,
  metadata: z.record(z.unknown()).optional()
});

// Product tracking specific schema
export const ProductTrackingSchema = TrackingEventSchema.extend({
  productId: PositiveNumber,
  productName: NonEmptyString.max(255),
  productPrice: z.number().positive(),
  productCategory: NonEmptyString.max(255),
  quantity: z.number().int().positive().optional(),
  variantId: z.number().int().positive().optional()
});

// Search tracking specific schema
export const SearchTrackingSchema = TrackingEventSchema.extend({
  query: NonEmptyString.max(500),
  resultsCount: z.number().int().min(0),
  clickedResultId: z.number().int().positive().optional(),
  filters: z.record(z.unknown()).optional()
});

// Order tracking specific schema
export const OrderTrackingSchema = TrackingEventSchema.extend({
  orderId: NonEmptyString.max(255),
  orderValue: z.number().positive(),
  itemCount: z.number().int().positive(),
  paymentMethod: OptionalString,
  items: z.array(z.object({
    productId: PositiveNumber,
    quantity: z.number().int().positive(),
    price: z.number().positive()
  }))
});

// Validation result types
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: string[];
  sanitized?: T;
}

// Data sanitization functions
export const sanitizeHtml = (input: string): string => {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>?/gm, '')
    .trim();
};

export const sanitizeNumericString = (input: string): string => {
  return input.replace(/[^\d.]/g, '');
};

export const sanitizeAlphanumeric = (input: string): string => {
  return input.replace(/[^a-zA-Z0-9\-_]/g, '');
};

export const sanitizeEmail = (input: string): string => {
  return input.toLowerCase().trim();
};

// Comprehensive validation functions
export const validateWebhookData = (data: unknown): ValidationResult<z.infer<typeof WebhookDataSchema>> => {
  try {
    const parsed = WebhookDataSchema.parse(data);
    return {
      success: true,
      data: parsed,
      sanitized: parsed
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      logger.error('Webhook data validation failed:', { errors, data });
      return {
        success: false,
        errors
      };
    }
    return {
      success: false,
      errors: ['Unknown validation error']
    };
  }
};

export const validateTrackingEvent = (data: unknown): ValidationResult<z.infer<typeof TrackingEventSchema>> => {
  try {
    const parsed = TrackingEventSchema.parse(data);

    // Additional sanitization
    const sanitized = {
      ...parsed,
      sessionId: sanitizeAlphanumeric(parsed.sessionId),
      userId: parsed.userId ? sanitizeAlphanumeric(parsed.userId) : undefined,
      metadata: parsed.metadata ? sanitizeMetadata(parsed.metadata) : undefined
    };

    return {
      success: true,
      data: parsed,
      sanitized
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      logger.error('Tracking event validation failed:', { errors, data });
      return {
        success: false,
        errors
      };
    }
    return {
      success: false,
      errors: ['Unknown validation error']
    };
  }
};

export const validateProductTracking = (data: unknown): ValidationResult<z.infer<typeof ProductTrackingSchema>> => {
  try {
    const parsed = ProductTrackingSchema.parse(data);

    // Sanitize product data
    const sanitized = {
      ...parsed,
      productName: sanitizeHtml(parsed.productName),
      productCategory: sanitizeHtml(parsed.productCategory),
      sessionId: sanitizeAlphanumeric(parsed.sessionId),
      userId: parsed.userId ? sanitizeAlphanumeric(parsed.userId) : undefined
    };

    return {
      success: true,
      data: parsed,
      sanitized
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      logger.error('Product tracking validation failed:', { errors, data });
      return {
        success: false,
        errors
      };
    }
    return {
      success: false,
      errors: ['Unknown validation error']
    };
  }
};

export const validateSearchTracking = (data: unknown): ValidationResult<z.infer<typeof SearchTrackingSchema>> => {
  try {
    const parsed = SearchTrackingSchema.parse(data);

    // Sanitize search data
    const sanitized = {
      ...parsed,
      query: sanitizeHtml(parsed.query),
      sessionId: sanitizeAlphanumeric(parsed.sessionId),
      userId: parsed.userId ? sanitizeAlphanumeric(parsed.userId) : undefined,
      filters: parsed.filters ? sanitizeMetadata(parsed.filters) : undefined
    };

    return {
      success: true,
      data: parsed,
      sanitized
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      logger.error('Search tracking validation failed:', { errors, data });
      return {
        success: false,
        errors
      };
    }
    return {
      success: false,
      errors: ['Unknown validation error']
    };
  }
};

export const validateOrderTracking = (data: unknown): ValidationResult<z.infer<typeof OrderTrackingSchema>> => {
  try {
    const parsed = OrderTrackingSchema.parse(data);

    // Sanitize order data
    const sanitized = {
      ...parsed,
      orderId: sanitizeAlphanumeric(parsed.orderId),
      paymentMethod: parsed.paymentMethod ? sanitizeAlphanumeric(parsed.paymentMethod) : undefined,
      sessionId: sanitizeAlphanumeric(parsed.sessionId),
      userId: parsed.userId ? sanitizeAlphanumeric(parsed.userId) : undefined
    };

    return {
      success: true,
      data: parsed,
      sanitized
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      logger.error('Order tracking validation failed:', { errors, data });
      return {
        success: false,
        errors
      };
    }
    return {
      success: false,
      errors: ['Unknown validation error']
    };
  }
};

// Sanitize metadata recursively
const sanitizeMetadata = (obj: Record<string, unknown>): Record<string, unknown> => {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const sanitizedKey = sanitizeAlphanumeric(key);

    if (typeof value === 'string') {
      sanitized[sanitizedKey] = sanitizeHtml(value);
    } else if (typeof value === 'number') {
      sanitized[sanitizedKey] = Number.isFinite(value) ? value : 0;
    } else if (typeof value === 'boolean') {
      sanitized[sanitizedKey] = value;
    } else if (Array.isArray(value)) {
      sanitized[sanitizedKey] = value.slice(0, 100); // Limit array size
    } else if (value && typeof value === 'object') {
      sanitized[sanitizedKey] = sanitizeMetadata(value as Record<string, unknown>);
    }
    // Skip null, undefined, functions, etc.
  }

  return sanitized;
};

// Rate limiting validation
export const validateRateLimit = (_identifier: string, _maxRequests: number, _windowMs: number): boolean => {
  // This would integrate with a rate limiting store (Redis)
  // For now, return true - implement with actual rate limiting
  return true;
};

// Export types for use in other modules
export type ValidatedWebhookData = z.infer<typeof WebhookDataSchema>;
export type ValidatedTrackingEvent = z.infer<typeof TrackingEventSchema>;
export type ValidatedProductTracking = z.infer<typeof ProductTrackingSchema>;
export type ValidatedSearchTracking = z.infer<typeof SearchTrackingSchema>;
export type ValidatedOrderTracking = z.infer<typeof OrderTrackingSchema>;

export default {
  validateWebhookData,
  validateTrackingEvent,
  validateProductTracking,
  validateSearchTracking,
  validateOrderTracking,
  sanitizeHtml,
  sanitizeNumericString,
  sanitizeAlphanumeric,
  sanitizeEmail
};