import { z } from 'zod';

// Common validation patterns
const MAX_STRING_LENGTH = 1000;
const MAX_QUERY_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 5000;

// Sanitize input to prevent injection attacks
const sanitizedString = z.string()
  .transform(str => str.trim())
  .refine(str => !/<script|javascript:|data:|vbscript:/i.test(str), {
    message: "Input contains potentially malicious content"
  });

// Common field validations
export const validations = {
  // Basic string validation with XSS protection
  safeString: (maxLength = MAX_STRING_LENGTH) => 
    sanitizedString.pipe(z.string().max(maxLength)),
  
  // Search query validation
  searchQuery: z.string()
    .min(1, "Search query cannot be empty")
    .max(MAX_QUERY_LENGTH, `Search query too long (max ${MAX_QUERY_LENGTH} characters)`)
    .regex(/^[a-zA-Z0-9\s\-_.,!?'"()[\]{}:;@#$%&*+=<>\/\\|~`^]+$/, {
      message: "Search query contains invalid characters"
    }),
  
  // Product validation
  productId: z.number().int().positive(),
  productSlug: z.string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Product slug must contain only lowercase letters, numbers, and hyphens"),
  
  // Pagination validation
  pagination: z.object({
    page: z.number().int().min(1).max(1000).default(1),
    limit: z.number().int().min(1).max(100).default(10),
  }),
  
  // Category validation
  category: z.string()
    .min(1)
    .max(50)
    .regex(/^[a-zA-Z0-9\s\-_]+$/, "Category contains invalid characters"),
  
  // Price validation
  price: z.number().min(0).max(999999.99),
  
  // Rating validation
  rating: z.number().min(1).max(5),
  
  // Email validation
  email: z.string().email("Invalid email format").max(255),
  
  // URL validation
  url: z.string().url("Invalid URL format").max(2048),
  
  // Boolean validation with coercion
  boolean: z.union([
    z.boolean(),
    z.string().transform(val => val === 'true' || val === '1'),
    z.number().transform(val => val === 1)
  ]),
  
  // Date validation
  dateString: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  
  // IP Address validation
  ipAddress: z.string().regex(
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
    "Invalid IP address format"
  ),
};

// API Endpoint Schemas

// Search API validation
export const searchApiSchema = z.object({
  q: validations.searchQuery,
  limit: z.number().int().min(1).max(50).default(10),
  category: validations.category.optional(),
  inStock: validations.boolean.optional(),
  minScore: z.number().min(0).max(1).default(0.3),
  filters: z.record(z.any()).optional(),
});

// Semantic search API validation
export const semanticSearchApiSchema = z.object({
  q: validations.searchQuery,
  limit: z.number().int().min(1).max(50).default(10),
  category: validations.category.optional(),
  inStock: z.boolean().optional(),
  minScore: z.number().min(0).max(1).default(0.3),
});

// Semantic search POST body validation with explicit filters allowlist
export const semanticSearchBodySchema = z.object({
  query: validations.searchQuery,
  limit: z.number().int().min(1).max(50).default(10),
  minScore: z.number().min(0).max(1).default(0.3),
  filters: z.object({
    categories: z.array(validations.category).max(20).optional(),
    inStock: z.boolean().optional(),
    featured: z.boolean().optional(),
    priceRange: z.object({
      min: z.number().min(0).optional(),
      max: z.number().min(0).optional(),
    }).optional(),
  }).optional(),
});

// Product API validation
export const productApiSchema = z.object({
  slug: validations.productSlug,
});

// Analytics tracking validation
export const analyticsEventSchema = z.object({
  id: z.string().max(100).optional(),
  userId: z.string().max(100).optional(),
  sessionId: z.string().max(100),
  timestamp: z.string().datetime().optional(),
  type: z.enum([
    'product_view',
    'search_performed',
    'recommendation_clicked',
    'cart_updated',
    'checkout_started',
    'purchase_completed',
    'page_view',
    'button_clicked',
    'form_submitted'
  ]),
  data: z.record(z.any()).default({}),
  metadata: z.record(z.any()).optional(),
});

export const batchAnalyticsSchema = z.object({
  events: z.array(analyticsEventSchema).min(1).max(100),
});

// Authentication validation
export const loginSchema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username too long")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username contains invalid characters"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password too long"),
});

// Review validation
export const reviewSchema = z.object({
  productId: validations.productId,
  rating: validations.rating,
  title: validations.safeString(100),
  content: validations.safeString(MAX_DESCRIPTION_LENGTH),
  authorName: validations.safeString(100),
  authorEmail: validations.email,
  verified: validations.boolean.default(false),
});

// WooCommerce API validation
export const woocommerceParamsSchema = z.object({
  per_page: z.number().int().min(1).max(100).optional(),
  page: z.number().int().min(1).max(1000).optional(),
  status: z.enum(['draft', 'pending', 'private', 'publish']).optional(),
  featured: validations.boolean.optional(),
  category: z.string().max(50).optional(),
  tag: z.string().max(50).optional(),
  search: validations.searchQuery.optional(),
  orderby: z.enum(['date', 'id', 'include', 'title', 'slug', 'modified']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

// Cart validation
export const cartItemSchema = z.object({
  productId: validations.productId,
  quantity: z.number().int().min(1).max(999),
  variationId: z.number().int().positive().optional(),
  variation: z.record(z.string()).optional(),
});

export const cartUpdateSchema = z.object({
  items: z.array(cartItemSchema).max(100),
});

// Admin API validation
export const adminActionSchema = z.object({
  action: z.enum(['create', 'read', 'update', 'delete', 'export', 'import']),
  resource: z.enum(['products', 'orders', 'customers', 'analytics', 'reviews']),
  data: z.record(z.any()).optional(),
});

// Contact form validation
export const contactSchema = z.object({
  name: validations.safeString(100),
  email: validations.email,
  subject: validations.safeString(200),
  message: validations.safeString(MAX_DESCRIPTION_LENGTH),
  honeypot: z.string().max(0), // Should be empty (bot detection)
});

// File upload validation
export const fileUploadSchema = z.object({
  filename: z.string()
    .min(1)
    .max(255)
    .regex(/^[a-zA-Z0-9._-]+$/, "Filename contains invalid characters"),
  size: z.number().int().min(1).max(10 * 1024 * 1024), // 10MB max
  type: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
});

// Helper function to validate request data
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      }));
      
      throw new ValidationError('Input validation failed', issues);
    }
    throw error;
  }
}

// Custom validation error class
export class ValidationError extends Error {
  constructor(
    message: string, 
    public issues: Array<{ field: string; message: string; code: string }>
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Rate limiting validation
export const rateLimitSchema = z.object({
  maxRequests: z.number().int().min(1).max(10000).default(100),
  windowMs: z.number().int().min(1000).max(3600000).default(60000), // 1sec to 1hour
  message: z.string().max(200).optional(),
});

// Environment validation (for runtime checks)
export const envValidationSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  WC_CONSUMER_KEY: z.string().min(1),
  WC_CONSUMER_SECRET: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  ADMIN_PASSWORD: z.string().min(8),
});

// Recommendations API validation
export const recommendationApiSchema = z.object({
  type: z.enum(['personalized', 'similar', 'health', 'seasonal']),
  userProfile: z.object({
    userId: z.string().optional(),
    preferences: z.array(z.string()).optional(),
    purchaseHistory: z.array(z.number()).optional(),
    demographics: z.object({
      age: z.number().min(0).max(120).optional(),
      location: z.string().max(100).optional(),
    }).optional(),
  }).optional(),
  context: z.object({
    limit: z.number().int().min(1).max(50).default(10),
    season: z.enum(['spring', 'summer', 'fall', 'winter']).optional(),
    priceRange: z.object({
      min: z.number().min(0).optional(),
      max: z.number().min(0).optional(),
    }).optional(),
  }).optional(),
  productId: z.number().int().positive().optional(),
  healthCondition: z.string().max(100).optional(),
  season: z.enum(['spring', 'summer', 'fall', 'winter']).optional(),
});

// Graph entities API validation
export const graphEntitiesApiSchema = z.object({
  action: z.enum(['discover-from-products', 'discover-from-graph', 'discover-from-text', 'discover-all']),
  autoCreate: z.boolean().default(false),
  content: z.string().max(10000).optional(),
});

// Search recommendations validation
export const searchRecommendationSchema = z.object({
  query: validations.searchQuery,
  limit: z.number().int().min(1).max(20).default(5),
  userId: z.string().max(100).optional(),
  sessionId: z.string().max(100).optional(),
});

// Performance monitoring validation
export const performanceMetricsSchema = z.object({
  metrics: z.array(z.object({
    name: z.string().max(100),
    value: z.number(),
    timestamp: z.string().datetime(),
    tags: z.record(z.string().max(100)).optional(),
  })).max(100),
  source: z.string().max(50),
});

const validation = {
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
  ValidationError,
};

export default validation;
