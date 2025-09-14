// Runtime validation schemas using Zod
import { z } from 'zod';
import { logger } from '@/lib/logger';

// Product validation schemas
export const ProductSchema = z.object({
  id: z.number().positive('Product ID must be positive'),
  name: z.string().min(1, 'Product name is required'),
  slug: z.string().min(1, 'Product slug is required'),
  price: z.string().regex(/^\d+(\.\d{2})?$/, 'Invalid price format'),
  regular_price: z.string().optional(),
  sale_price: z.string().optional(),
  description: z.string().optional(),
  short_description: z.string().optional(),
  sku: z.string().optional(),
  stock_status: z.enum(['instock', 'outofstock', 'onbackorder']),
  stock_quantity: z.number().nullable(),
  featured: z.boolean(),
  categories: z.array(z.object({
    id: z.number(),
    name: z.string(),
    slug: z.string()
  })).optional(),
  tags: z.array(z.object({
    id: z.number(),
    name: z.string(),
    slug: z.string()
  })).optional(),
  images: z.array(z.object({
    id: z.number(),
    src: z.string().url(),
    alt: z.string().optional()
  })).optional(),
  attributes: z.array(z.object({
    id: z.number(),
    name: z.string(),
    options: z.array(z.string())
  })).optional()
});

export const CategorySchema = z.object({
  id: z.number().positive(),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  parent: z.number().optional(),
  count: z.number().optional(),
  image: z.object({
    id: z.number(),
    src: z.string().url(),
    alt: z.string().optional()
  }).nullable().optional()
});

// Analytics validation schemas
export const AnalyticsEventSchema = z.object({
  eventType: z.string().min(1),
  userId: z.string().optional(),
  sessionId: z.string().min(1),
  timestamp: z.number().positive(),
  data: z.record(z.unknown()),
  metadata: z.object({
    userAgent: z.string().optional(),
    screen: z.object({
      width: z.number().positive(),
      height: z.number().positive()
    }).optional(),
    viewport: z.object({
      width: z.number().positive(),
      height: z.number().positive()
    }).optional(),
    device: z.enum(['mobile', 'tablet', 'desktop']).optional(),
    referrer: z.string().optional(),
    utm: z.object({
      source: z.string().optional(),
      medium: z.string().optional(),
      campaign: z.string().optional(),
      term: z.string().optional(),
      content: z.string().optional()
    }).optional()
  }).optional()
});

export const ConversionEventSchema = z.object({
  type: z.enum(['product_view', 'add_to_cart', 'checkout_start', 'purchase']),
  productId: z.number().positive().optional(),
  value: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
  quantity: z.number().positive().optional(),
  step: z.number().positive().optional()
});

// Search validation schemas
export const SearchFiltersSchema = z.object({
  category: z.string().optional(),
  priceRange: z.object({
    min: z.number().min(0),
    max: z.number().positive()
  }).optional(),
  inStock: z.boolean().optional(),
  featured: z.boolean().optional(),
  rating: z.number().min(1).max(5).optional(),
  tags: z.array(z.string()).optional(),
  sortBy: z.enum(['relevance', 'price_asc', 'price_desc', 'rating', 'newest']).optional()
});

export const SearchQuerySchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  filters: SearchFiltersSchema.optional(),
  page: z.number().positive().optional(),
  limit: z.number().positive().max(100).optional(),
  searchType: z.enum(['keyword', 'semantic', 'hybrid']).optional()
});

export const SearchResultSchema = z.object({
  id: z.number().positive(),
  title: z.string().min(1),
  description: z.string(),
  score: z.number().min(0).max(1),
  type: z.enum(['product', 'category', 'content']),
  url: z.string().url(),
  image: z.string().url().optional(),
  price: z.number().positive().optional(),
  metadata: z.record(z.unknown()).optional()
});

// API validation schemas
export const ApiResponseSchema = <T extends z.ZodType>(dataSchema: T) => z.object({
  success: z.boolean(),
  data: dataSchema.optional(),
  error: z.string().optional(),
  message: z.string().optional(),
  timestamp: z.string().optional(),
  requestId: z.string().optional()
});

export const PaginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) => z.object({
  items: z.array(itemSchema),
  total: z.number().min(0),
  page: z.number().positive(),
  limit: z.number().positive(),
  hasNext: z.boolean(),
  hasPrev: z.boolean()
});

// Graph validation schemas
export const GraphNodeSchema = z.object({
  id: z.union([z.string(), z.number()]),
  labels: z.array(z.string()),
  properties: z.record(z.unknown())
});

export const GraphRelationshipSchema = z.object({
  id: z.union([z.string(), z.number()]),
  type: z.string().min(1),
  startNodeId: z.union([z.string(), z.number()]),
  endNodeId: z.union([z.string(), z.number()]),
  properties: z.record(z.unknown())
});

export const RecommendationScoreSchema = z.object({
  productId: z.number().positive(),
  score: z.number().min(0).max(1),
  reasons: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  metadata: z.record(z.unknown()).optional()
});

// Review validation schemas
export const ReviewSchema = z.object({
  id: z.string().min(1),
  productId: z.number().positive(),
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  rating: z.number().min(1).max(5),
  title: z.string().min(1).max(200),
  content: z.string().min(10).max(2000),
  status: z.enum(['pending', 'approved', 'rejected']),
  verified: z.boolean(),
  helpful: z.number().min(0),
  createdAt: z.string().datetime(),
  moderatedAt: z.string().datetime().optional(),
  moderatedBy: z.string().optional(),
  moderationNotes: z.string().optional(),
  images: z.array(z.object({
    id: z.string(),
    url: z.string().url(),
    alt: z.string()
  })).optional()
});

// Environment validation schemas
export const EnvironmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  NEXT_PUBLIC_WC_API_URL: z.string().url(),
  WC_CONSUMER_KEY: z.string().min(1),
  WC_CONSUMER_SECRET: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  ADMIN_PASSWORD_HASH: z.string().min(20),
  ADMIN_USERNAME: z.string().min(1),
  MEMGRAPH_URL: z.string().optional(),
  DEEPSEEK_API_KEY: z.string().optional(),
  PINECONE_API_KEY: z.string().optional(),
  PINECONE_INDEX_NAME: z.string().optional()
});

// Type inference from schemas
export type Product = z.infer<typeof ProductSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type AnalyticsEvent = z.infer<typeof AnalyticsEventSchema>;
export type ConversionEvent = z.infer<typeof ConversionEventSchema>;
export type SearchFilters = z.infer<typeof SearchFiltersSchema>;
export type SearchQuery = z.infer<typeof SearchQuerySchema>;
export type SearchResult = z.infer<typeof SearchResultSchema>;
export type GraphNode = z.infer<typeof GraphNodeSchema>;
export type GraphRelationship = z.infer<typeof GraphRelationshipSchema>;
export type RecommendationScore = z.infer<typeof RecommendationScoreSchema>;
export type Review = z.infer<typeof ReviewSchema>;
export type Environment = z.infer<typeof EnvironmentSchema>;

// Validation functions
export const validateProduct = (data: unknown): Product => ProductSchema.parse(data);
export const validateAnalyticsEvent = (data: unknown): AnalyticsEvent => AnalyticsEventSchema.parse(data);
export const validateSearchQuery = (data: unknown): SearchQuery => SearchQuerySchema.parse(data);
export const validateReview = (data: unknown): Review => ReviewSchema.parse(data);
export const validateEnvironment = (data: unknown): Environment => EnvironmentSchema.parse(data);

// Safe validation functions (return Results instead of throwing)
export const safeValidateProduct = (data: unknown) => ProductSchema.safeParse(data);
export const safeValidateAnalyticsEvent = (data: unknown) => AnalyticsEventSchema.safeParse(data);
export const safeValidateSearchQuery = (data: unknown) => SearchQuerySchema.safeParse(data);
export const safeValidateReview = (data: unknown) => ReviewSchema.safeParse(data);

// Environment validation on startup
export function validateEnvironmentVariables(): Environment {
  try {
    return EnvironmentSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationError = new Error('Environment validation failed - required variables missing or invalid');
      const issues = error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message,
        code: err.code
      }));
      
      logger.error('❌ Environment validation failed:', {
        issues,
        error: validationError.message
      } as Record<string, unknown>);
      
      // Add detailed error information to the error object
      // Define the extended error interface
      interface ExtendedValidationError extends Error {
        validationIssues?: Array<{
          path: string;
          message: string;
          code: string;
        }>;
        zodError?: z.ZodError;
      }
      
      // Cast to the extended error interface
      const extendedError = validationError as ExtendedValidationError;
      extendedError.validationIssues = issues;
      extendedError.zodError = error;
      
      // Throw instead of process.exit() to allow proper error handling
      throw validationError;
    }
    throw error;
  }
}