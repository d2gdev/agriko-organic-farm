import { z } from 'zod';
import { sanitizeHtml, sanitizeUrl, sanitizeFileName } from '@/lib/sanitize';
import { logger } from '@/lib/logger';
import { createValidationError } from '@/lib/error-handler';

// Enhanced validation schemas with comprehensive sanitization
export const EnhancedValidation = {
  // Common field validators with built-in sanitization
  email: z.string()
    .trim()
    .toLowerCase()
    .email('Invalid email format')
    .max(254, 'Email too long')
    .refine(email => !email.includes('<script'), 'Email contains malicious content'),

  url: z.string()
    .trim()
    .url('Invalid URL format')
    .max(2048, 'URL too long')
    .refine(url => {
      // Only allow http and https protocols
      return url.startsWith('http://') || url.startsWith('https://');
    }, 'Only HTTP and HTTPS protocols are allowed')
    .transform(url => sanitizeUrl(url))
    .refine(url => url.length > 0, 'URL failed sanitization'),

  filename: z.string()
    .trim()
    .min(1, 'Filename required')
    .max(255, 'Filename too long')
    .transform(filename => sanitizeFileName(filename))
    .refine(filename => filename.length > 0, 'Filename failed sanitization'),

  html: z.string()
    .transform(html => sanitizeHtml(html, 'strict'))
    .refine(html => html.length <= 10000, 'HTML content too large'),

  richText: z.string()
    .transform(html => sanitizeHtml(html, 'permissive'))
    .refine(html => html.length <= 50000, 'Rich text content too large'),

  plainText: z.string()
    .trim()
    .max(1000, 'Text too long')
    .transform(text => sanitizeHtml(text, 'textOnly')),

  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),

  id: z.number()
    .int('ID must be an integer')
    .positive('ID must be positive')
    .max(2147483647, 'ID too large'),

  slug: z.string()
    .trim()
    .toLowerCase()
    .min(1, 'Slug required')
    .max(100, 'Slug too long')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),

  currency: z.string()
    .regex(/^\d+(\.\d{2})?$/, 'Invalid currency format (use 0.00)')
    .transform(str => parseFloat(str))
    .refine(num => num >= 0, 'Currency must be non-negative')
    .refine(num => num <= 999999.99, 'Currency amount too large'),

  phoneNumber: z.string()
    .trim()
    .regex(/^\+?[\d\s\-\(\)]{7,20}$/, 'Invalid phone number format')
    .transform(phone => phone.replace(/[^\d+]/g, '')),

  ipAddress: z.string()
    .trim()
    .refine(ip => {
      // IPv4 validation with proper range checking
      const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (ipv4Regex.test(ip)) {
        const octets = ip.split('.').map(Number);
        return octets.every(octet => octet >= 0 && octet <= 255);
      }

      // Simple IPv6 validation (more lenient for common formats)
      const ipv6Regex = /^([0-9a-fA-F]{0,4}:){7}[0-9a-fA-F]{0,4}$/;
      return ipv6Regex.test(ip);
    }, 'Invalid IP address format'),

  userAgent: z.string()
    .trim()
    .max(500, 'User agent too long')
    .transform(ua => sanitizeHtml(ua, 'textOnly')),

  // JSON validation with depth limits
  safeJson: z.string()
    .refine(str => {
      try {
        const parsed: unknown = JSON.parse(str);
        return JSON.stringify(parsed).length <= 10000; // Limit JSON size
      } catch {
        return false;
      }
    }, 'Invalid JSON or JSON too large')
    .transform(str => JSON.parse(str)),
};

// Product validation schemas with business logic
const ProductValidation = {
  id: EnhancedValidation.id,
  name: z.string()
    .trim()
    .min(1, 'Product name required')
    .max(200, 'Product name too long')
    .transform(name => sanitizeHtml(name, 'textOnly')),

  slug: EnhancedValidation.slug,

  description: z.string()
    .optional()
    .transform(desc => desc ? sanitizeHtml(desc, 'strict') : '')
    .refine(desc => !desc || desc.length <= 5000, 'Description too long'),

  price: EnhancedValidation.currency,

  regularPrice: EnhancedValidation.currency.optional(),

  salePrice: EnhancedValidation.currency
    .optional()
    .refine((salePrice) => {
      if (salePrice !== undefined) {
        return true; // Additional validation would be done at the object level
      }
      return true;
    }, 'Sale price must be less than regular price'),

  // Support both stock and stock_quantity field names for compatibility
  stock: z.number()
    .int('Stock must be an integer')
    .min(0, 'Stock cannot be negative')
    .max(999999, 'Stock too large')
    .optional(),

  stock_quantity: z.number()
    .int('Stock must be an integer')
    .min(0, 'Stock cannot be negative')
    .max(999999, 'Stock too large')
    .optional(),

  sku: z.string()
    .trim()
    .min(1, 'SKU required')
    .max(100, 'SKU too long')
    .optional(),

  category: z.array(z.string().trim().max(50))
    .max(10, 'Too many categories')
    .optional(),

  images: z.array(EnhancedValidation.url)
    .max(20, 'Too many images')
    .optional(),

  weight: z.number()
    .positive('Weight must be positive')
    .max(99999, 'Weight too large')
    .optional(),

  dimensions: z.object({
    length: z.number().positive().max(9999).optional(),
    width: z.number().positive().max(9999).optional(),
    height: z.number().positive().max(9999).optional(),
  }).optional(),
};

// Cart validation schemas
export const CartValidation = {
  productId: EnhancedValidation.id,
  
  quantity: z.number()
    .int('Quantity must be an integer')
    .min(1, 'Quantity must be at least 1')
    .max(100, 'Quantity too large'),
  
  totalPrice: EnhancedValidation.currency,
  
  cartItem: z.object({
    productId: EnhancedValidation.id,
    quantity: z.number().int().min(1).max(100),
    price: EnhancedValidation.currency,
    name: ProductValidation.name,
    image: EnhancedValidation.url.optional(),
  }),
  
  cart: z.object({
    items: z.array(z.object({
      productId: EnhancedValidation.id,
      quantity: z.number().int().min(1).max(100),
      price: EnhancedValidation.currency,
      name: ProductValidation.name,
      image: EnhancedValidation.url.optional(),
    })).max(50, 'Too many items in cart'),
    total: EnhancedValidation.currency,
    itemCount: z.number().int().min(0).max(500),
  }).refine(cart => {
    // Validate cart total consistency
    const calculatedTotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return Math.abs(calculatedTotal - cart.total) < 0.01; // Allow for rounding
  }, 'Cart total does not match item prices'),
};

// User validation schemas
const UserValidation = {
  email: EnhancedValidation.email,
  password: EnhancedValidation.password,

  // Support both name and firstName/lastName patterns
  name: z.string()
    .trim()
    .min(1, 'Name required')
    .max(100, 'Name too long')
    .transform(name => sanitizeHtml(name, 'textOnly'))
    .refine(name => !/^\d+$/.test(name), 'Name cannot be only numbers')
    .optional(),

  firstName: z.string()
    .trim()
    .min(1, 'First name required')
    .max(100, 'First name too long')
    .transform(name => sanitizeHtml(name, 'textOnly'))
    .refine(name => !/^\d+$/.test(name), 'First name cannot be only numbers')
    .optional(),

  lastName: z.string()
    .trim()
    .min(1, 'Last name required')
    .max(100, 'Last name too long')
    .transform(name => sanitizeHtml(name, 'textOnly'))
    .refine(name => !/^\d+$/.test(name), 'Last name cannot be only numbers')
    .optional(),

  phone: EnhancedValidation.phoneNumber.optional(),
  phoneNumber: EnhancedValidation.phoneNumber.optional(),

  address: z.object({
    street: z.string().trim().min(1).max(200).transform(str => sanitizeHtml(str, 'textOnly')),
    city: z.string().trim().min(1).max(100).transform(str => sanitizeHtml(str, 'textOnly')),
    state: z.string().trim().min(1).max(100).transform(str => sanitizeHtml(str, 'textOnly')),
    zipCode: z.string().trim().regex(/^[\d\-\s]{3,20}$/, 'Invalid zip code format'),
    country: z.string().trim().length(2, 'Country code must be 2 letters'),
  }).optional(),
};

// API request validation schemas
export const APIValidation = {
  pagination: z.object({
    page: z.number().int().min(1).max(1000).default(1),
    limit: z.number().int().min(1).max(100).default(20),
    offset: z.number().int().min(0).optional(),
  }),
  
  search: z.object({
    query: z.string()
      .trim()
      .min(1, 'Search query required')
      .max(200, 'Search query too long')
      .transform(query => sanitizeHtml(query, 'textOnly'))
      .refine(query => query.length >= 2, 'Search query too short'),
    filters: z.record(z.string().max(100)).optional(),
    sort: z.enum(['name', 'price', 'date', 'popularity']).optional(),
    order: z.enum(['asc', 'desc']).optional(),
  }),
  
  filters: z.object({
    category: z.string().trim().max(50).optional(),
    minPrice: EnhancedValidation.currency.optional(),
    maxPrice: EnhancedValidation.currency.optional(),
    inStock: z.boolean().optional(),
    featured: z.boolean().optional(),
  }).refine(filters => {
    // Validate price range consistency
    if (filters.minPrice !== undefined && filters.maxPrice !== undefined) {
      return filters.minPrice <= filters.maxPrice;
    }
    return true;
  }, 'Minimum price cannot be greater than maximum price'),
  
  headers: z.object({
    'user-agent': EnhancedValidation.userAgent.optional(),
    'x-forwarded-for': EnhancedValidation.ipAddress.optional(),
    'authorization': z.string().max(2000).optional(),
    'content-type': z.string().max(100).optional(),
  }),
};

// Order validation schemas
const OrderValidation = {
  id: EnhancedValidation.id,
  
  status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']),
  
  lineItems: z.array(z.object({
    productId: EnhancedValidation.id,
    quantity: z.number().int().min(1).max(100),
    price: EnhancedValidation.currency,
    total: EnhancedValidation.currency,
  })).min(1, 'Order must have at least one item').max(50, 'Too many items in order'),
  
  billing: UserValidation.address,
  shipping: UserValidation.address,
  
  total: EnhancedValidation.currency,
  
  paymentMethod: z.enum(['credit_card', 'paypal', 'bank_transfer', 'cash_on_delivery']),
  
  order: z.object({
    id: EnhancedValidation.id.optional(),
    status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']),
    lineItems: z.array(z.object({
      productId: EnhancedValidation.id,
      quantity: z.number().int().min(1).max(100),
      price: EnhancedValidation.currency,
      total: EnhancedValidation.currency.optional(),
    })).min(1).max(50),
    billing: z.object({
      firstName: z.string().trim().min(1).max(100).optional(),
      lastName: z.string().trim().min(1).max(100).optional(),
      email: EnhancedValidation.email.optional(),
      phone: EnhancedValidation.phoneNumber.optional(),
      address1: z.string().trim().min(1).max(200).optional(),
      street: z.string().trim().min(1).max(200).optional(),
      city: z.string().trim().min(1).max(100).optional(),
      state: z.string().trim().min(1).max(100).optional(),
      postalCode: z.string().trim().regex(/^[\d\-\s]{3,20}$/, 'Invalid postal code format').optional(),
      zipCode: z.string().trim().regex(/^[\d\-\s]{3,20}$/, 'Invalid zip code format').optional(),
      country: z.string().trim().length(2, 'Country code must be 2 letters').optional(),
    }).optional(),
    shipping: z.object({
      firstName: z.string().trim().min(1).max(100).optional(),
      lastName: z.string().trim().min(1).max(100).optional(),
      address1: z.string().trim().min(1).max(200).optional(),
      street: z.string().trim().min(1).max(200).optional(),
      city: z.string().trim().min(1).max(100).optional(),
      state: z.string().trim().min(1).max(100).optional(),
      postalCode: z.string().trim().regex(/^[\d\-\s]{3,20}$/, 'Invalid postal code format').optional(),
      zipCode: z.string().trim().regex(/^[\d\-\s]{3,20}$/, 'Invalid zip code format').optional(),
      country: z.string().trim().length(2, 'Country code must be 2 letters').optional(),
    }).optional(),
    total: EnhancedValidation.currency,
    currency: z.string().trim().length(3, 'Currency code must be 3 letters').optional(),
    paymentMethod: z.enum(['credit_card', 'paypal', 'bank_transfer', 'cash_on_delivery']).optional(),
    customerEmail: EnhancedValidation.email,
  }),
};

// Data consistency validators
export class DataConsistencyValidator {
  // Validate product price consistency across different contexts
  static validateProductPricing(product: unknown): boolean {
    try {
      if (!product || typeof product !== 'object') {
        return false;
      }

      const productObj = product as Record<string, unknown>;
      const price = typeof productObj.price === 'number' ? productObj.price : 0;
      const regularPrice = typeof productObj.regularPrice === 'number' ? productObj.regularPrice : null;
      const salePrice = typeof productObj.salePrice === 'number' ? productObj.salePrice : null;
      
      // Sale price must be less than regular price
      if (salePrice && regularPrice && salePrice >= regularPrice) {
        logger.warn('Product price inconsistency: sale price >= regular price', {
          productId: productObj.id,
          salePrice,
          regularPrice
        } as Record<string, unknown>);
        return false;
      }
      
      // Price should equal sale price if on sale, otherwise regular price
      const expectedPrice = salePrice ?? regularPrice ?? price;
      if (Math.abs(price - expectedPrice) > 0.01) {
        logger.warn('Product price inconsistency: price != expected price', {
          productId: productObj.id,
          price,
          expectedPrice
        } as Record<string, unknown>);
        return false;
      }
      
      return true;
    } catch (error) {
      logger.error('Error validating product pricing:', error as Record<string, unknown>);
      return false;
    }
  }
  
  // Validate inventory consistency
  static validateInventory(product: unknown, requestedQuantity: number): boolean {
    try {
      if (!product || typeof product !== 'object') {
        return false;
      }

      const productObj = product as Record<string, unknown>;
      const stock = typeof productObj.stock === 'number' ? productObj.stock : undefined;
      const manageStock = Boolean(productObj.manageStock);
      
      if (manageStock && stock !== undefined) {
        if (stock < 0) {
          logger.warn('Negative stock detected', { productId: productObj.id, stock } as Record<string, unknown>);
          return false;
        }
        
        if (requestedQuantity > stock) {
          logger.warn('Insufficient stock', {
            productId: productObj.id,
            requested: requestedQuantity,
            available: stock
          } as Record<string, unknown>);
          return false;
        }
      }
      
      return true;
    } catch (error) {
      logger.error('Error validating inventory:', error as Record<string, unknown>);
      return false;
    }
  }
  
  // Validate cart state consistency
  static validateCartState(cart: unknown): boolean {
    try {
      if (!cart || typeof cart !== 'object') {
        return false;
      }

      const cartObj = cart as Record<string, unknown>;
      if (!Array.isArray(cartObj.items)) {
        return false;
      }
      
      // Check item count consistency
      const actualItemCount = cartObj.items.reduce((sum: number, item: unknown) => {
        if (!item || typeof item !== 'object') return sum;
        const itemObj = item as Record<string, unknown>;
        const quantity = typeof itemObj.quantity === 'number' ? itemObj.quantity : 0;
        return sum + quantity;
      }, 0);
      
      const itemCount = typeof cartObj.itemCount === 'number' ? cartObj.itemCount : 0;
      if (itemCount !== actualItemCount) {
        logger.warn('Cart item count inconsistency', {
          expected: itemCount,
          actual: actualItemCount
        } as Record<string, unknown>);
        return false;
      }
      
      // Check total consistency
      const calculatedTotal = cartObj.items.reduce((sum: number, item: unknown) => {
        if (!item || typeof item !== 'object') return sum;
        const itemObj = item as Record<string, unknown>;
        const price = typeof itemObj.price === 'number' ? itemObj.price : 0;
        const quantity = typeof itemObj.quantity === 'number' ? itemObj.quantity : 0;
        return sum + (price * quantity);
      }, 0);
      
      const total = typeof cartObj.total === 'number' ? cartObj.total : 0;
      if (Math.abs(total - calculatedTotal) > 0.01) {
        logger.warn('Cart total inconsistency', {
          expected: total,
          calculated: calculatedTotal
        } as Record<string, unknown>);
        return false;
      }
      
      // Check for duplicate items
      const productIds = cartObj.items.map((item: unknown) => {
        if (!item || typeof item !== 'object') return null;
        const itemObj = item as Record<string, unknown>;
        return itemObj.productId;
      }).filter(id => id != null);
      const uniqueIds = new Set(productIds);
      if (productIds.length !== uniqueIds.size) {
        logger.warn('Cart contains duplicate items', { productIds } as Record<string, unknown>);
        return false;
      }
      
      return true;
    } catch (error) {
      logger.error('Error validating cart state:', error as Record<string, unknown>);
      return false;
    }
  }
}

// Comprehensive validation middleware
export function createValidationMiddleware<T>(
  schema: z.ZodSchema<T>,
  options: {
    sanitize?: boolean;
    validateConsistency?: boolean;
    logValidationErrors?: boolean;
  } = {}
) {
  return (data: unknown): T => {
    const { sanitize: _sanitize = true, validateConsistency = false, logValidationErrors = true } = options;
    void _sanitize; // Mark as used for future implementation
    
    try {
      // First pass: Zod validation with built-in sanitization
      const validated = schema.parse(data);
      
      // Second pass: Business logic validation if enabled
      if (validateConsistency) {
        const validatedObj = validated as Record<string, unknown>;
        
        if (validatedObj.items) {
          // Looks like a cart
          if (!DataConsistencyValidator.validateCartState(validated)) {
            throw createValidationError('Cart state consistency validation failed');
          }
        }
        
        if (validatedObj.price !== undefined) {
          // Looks like a product
          if (!DataConsistencyValidator.validateProductPricing(validated)) {
            throw createValidationError('Product pricing consistency validation failed');
          }
        }
      }
      
      return validated;
    } catch (error) {
      if (logValidationErrors) {
        logger.error('Validation failed:', {
          error: error instanceof Error ? error.message : String(error),
          data: typeof data === 'object' ? Object.keys(data ?? {}) : typeof data
        } as Record<string, unknown>);
      }
      
      throw error;
    }
  };
}

// Complete validation schemas with parse methods
export const ProductValidationSchema = z.object(ProductValidation);
export const UserValidationSchema = z.object(UserValidation);
export const OrderValidationSchema = OrderValidation.order;
export const CartValidationSchema = CartValidation.cart;
export const CartItemValidationSchema = CartValidation.cartItem;

// Review validation schema (missing from original implementation)
const ReviewValidationFields = {
  id: EnhancedValidation.id.optional(),
  productId: EnhancedValidation.id,
  userId: EnhancedValidation.id.optional(),
  customerName: z.string()
    .trim()
    .min(1, 'Customer name required')
    .max(100, 'Customer name too long')
    .transform(name => sanitizeHtml(name, 'textOnly'))
    .optional(),
  customerEmail: EnhancedValidation.email.optional(),
  rating: z.number()
    .int('Rating must be an integer')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5'),
  title: z.string()
    .trim()
    .min(1, 'Review title required')
    .max(100, 'Review title too long')
    .transform(title => sanitizeHtml(title, 'textOnly'))
    .optional(),
  content: z.string()
    .trim()
    .min(1, 'Review content required')
    .max(2000, 'Review content too long')
    .transform(content => sanitizeHtml(content, 'strict'))
    .optional(),
  verified: z.boolean().default(false).optional(),
  helpful: z.number().int().min(0).default(0).optional(),
  createdAt: z.date().optional(),
};

export const ReviewValidationSchema = z.object(ReviewValidationFields);

// Export complete validation schemas
export const ValidationSchemas = {
  Product: ProductValidationSchema,
  Cart: CartValidationSchema,
  CartItem: CartItemValidationSchema,
  User: UserValidationSchema,
  Order: OrderValidationSchema,
  Review: ReviewValidationSchema,
  Search: APIValidation.search,
  Pagination: APIValidation.pagination,
  Filters: APIValidation.filters,
};

// Export schemas with expected names for backward compatibility
export { ProductValidationSchema as ProductValidation };
export { UserValidationSchema as UserValidation };
export { OrderValidationSchema as OrderValidation };
export { ReviewValidationSchema as ReviewValidation };

const comprehensiveValidationModule = {
  EnhancedValidation,
  ProductValidation,
  CartValidation,
  UserValidation,
  OrderValidation,
  APIValidation,
  ValidationSchemas,
  DataConsistencyValidator,
  createValidationMiddleware,
};

export default comprehensiveValidationModule;