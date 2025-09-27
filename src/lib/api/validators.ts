import { z } from 'zod';

// Common validation schemas
export const uuidSchema = z.string().uuid('Invalid UUID format');

const basePaginationSchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20),
});

export const paginationSchema = basePaginationSchema.refine(data => data.page >= 1 && data.limit >= 1 && data.limit <= 100, {
  message: 'Page must be >= 1 and limit must be between 1 and 100'
});

export const sortSchema = z.object({
  field: z.string().optional(),
  direction: z.enum(['ASC', 'DESC']).optional().default('ASC')
});

const baseDateRangeSchema = z.object({
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional()
});

export const dateRangeSchema = baseDateRangeSchema.refine(data => {
  if (data.start_date && data.end_date) {
    return new Date(data.start_date) <= new Date(data.end_date);
  }
  return true;
}, {
  message: 'Start date must be before end date'
});

// User validation schemas
export const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['admin', 'user', 'analyst']).optional().default('user'),
  is_active: z.boolean().optional().default(true)
});

export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  role: z.enum(['admin', 'user', 'analyst']).optional(),
  is_active: z.boolean().optional()
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

// Competitor validation schemas
export const createCompetitorSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  domain: z.string().url('Invalid domain URL').max(255, 'Domain too long'),
  industry: z.string().max(100).optional(),
  size_category: z.string().max(50).optional(),
  country: z.string().max(100).optional(),
  is_active: z.boolean().optional().default(true),
  scraping_config: z.record(z.string(), z.unknown()).optional().default({})
});

export const updateCompetitorSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  domain: z.string().url().max(255).optional(),
  industry: z.string().max(100).optional(),
  size_category: z.string().max(50).optional(),
  country: z.string().max(100).optional(),
  is_active: z.boolean().optional(),
  scraping_config: z.record(z.string(), z.unknown()).optional()
});

export const competitorFilterSchema = z.object({
  ...basePaginationSchema.shape,
  industry: z.string().optional(),
  country: z.string().optional(),
  is_active: z.string().optional().transform(val => val === 'true'),
  ...sortSchema.shape
}).transform(data => ({
  page: data.page >= 1 ? data.page : 1,
  limit: data.limit >= 1 && data.limit <= 100 ? data.limit : 20,
  industry: data.industry,
  country: data.country,
  is_active: data.is_active,
  field: data.field,
  direction: data.direction
}));

// Product validation schemas
export const createProductSchema = z.object({
  competitor_id: uuidSchema,
  external_id: z.string().max(255).optional(),
  name: z.string().min(1, 'Name is required').max(500, 'Name too long'),
  description: z.string().optional(),
  category: z.string().max(255).optional(),
  price: z.number().positive().optional(),
  currency: z.string().length(3).optional().default('USD'),
  availability: z.string().max(50).optional(),
  url: z.string().url().optional(),
  image_url: z.string().url().optional(),
  sku: z.string().max(255).optional(),
  brand: z.string().max(255).optional(),
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
  is_active: z.boolean().optional().default(true)
});

export const updateProductSchema = z.object({
  external_id: z.string().max(255).optional(),
  name: z.string().min(1).max(500).optional(),
  description: z.string().optional(),
  category: z.string().max(255).optional(),
  price: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
  availability: z.string().max(50).optional(),
  url: z.string().url().optional(),
  image_url: z.string().url().optional(),
  sku: z.string().max(255).optional(),
  brand: z.string().max(255).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  is_active: z.boolean().optional()
});

export const productFilterSchema = z.object({
  ...basePaginationSchema.shape,
  competitor_id: uuidSchema.optional(),
  category: z.string().optional(),
  price_min: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  price_max: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  is_active: z.string().optional().transform(val => val === 'true'),
  ...sortSchema.shape
});

// Price history validation schemas
export const createPriceHistorySchema = z.object({
  product_id: uuidSchema,
  price: z.number().positive('Price must be positive'),
  currency: z.string().length(3).optional().default('USD'),
  sale_price: z.number().positive().optional(),
  discount_percentage: z.number().min(0).max(100).optional(),
  availability: z.string().max(50).optional(),
  source: z.string().max(255).optional()
});

// Alert validation schemas
export const createAlertSchema = z.object({
  alert_type: z.string().min(1, 'Alert type is required').max(100),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  title: z.string().min(1, 'Title is required').max(500),
  message: z.string().optional(),
  details: z.record(z.string(), z.unknown()).optional(),
  entity_type: z.string().max(100).optional(),
  entity_id: uuidSchema.optional(),
  action_required: z.boolean().optional().default(false)
});

export const updateAlertSchema = z.object({
  is_read: z.boolean().optional(),
  is_acknowledged: z.boolean().optional()
});

export const alertFilterSchema = z.object({
  ...basePaginationSchema.shape,
  alert_type: z.string().optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  is_read: z.string().optional().transform(val => val === 'true'),
  is_acknowledged: z.string().optional().transform(val => val === 'true'),
  ...baseDateRangeSchema.shape,
  ...sortSchema.shape
});

// Alert rule validation schemas
export const createAlertRuleSchema = z.object({
  rule_name: z.string().min(1, 'Rule name is required').max(255),
  rule_type: z.string().min(1, 'Rule type is required').max(100),
  conditions: z.record(z.string(), z.unknown()),
  actions: z.record(z.string(), z.unknown()),
  is_active: z.boolean().optional().default(true),
  priority: z.number().int().min(1).max(10).optional().default(5),
  cooldown_minutes: z.number().int().min(0).optional().default(60)
});

export const updateAlertRuleSchema = z.object({
  rule_name: z.string().min(1).max(255).optional(),
  rule_type: z.string().min(1).max(100).optional(),
  conditions: z.record(z.string(), z.unknown()).optional(),
  actions: z.record(z.string(), z.unknown()).optional(),
  is_active: z.boolean().optional(),
  priority: z.number().int().min(1).max(10).optional(),
  cooldown_minutes: z.number().int().min(0).optional()
});

// Business intelligence metrics validation schemas
export const createMetricSchema = z.object({
  metric_type: z.string().min(1, 'Metric type is required').max(100),
  metric_name: z.string().min(1, 'Metric name is required').max(255),
  value: z.number().optional(),
  string_value: z.string().optional(),
  json_value: z.record(z.string(), z.unknown()).optional(),
  dimension_1: z.string().max(255).optional(),
  dimension_2: z.string().max(255).optional(),
  dimension_3: z.string().max(255).optional(),
  source: z.string().max(100).optional(),
  confidence_score: z.number().min(0).max(1).optional()
}).refine(data => {
  return data.value !== undefined || data.string_value !== undefined || data.json_value !== undefined;
}, {
  message: 'At least one value field (value, string_value, or json_value) must be provided'
});

export const metricFilterSchema = z.object({
  ...basePaginationSchema.shape,
  metric_type: z.string().optional(),
  metric_name: z.string().optional(),
  confidence_threshold: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  ...baseDateRangeSchema.shape,
  ...sortSchema.shape
});

// Prediction validation schemas
export const createPredictionSchema = z.object({
  model_id: uuidSchema,
  prediction_type: z.string().min(1, 'Prediction type is required').max(100),
  target_entity_type: z.string().min(1, 'Target entity type is required').max(100),
  target_entity_id: uuidSchema.optional(),
  predicted_value: z.number().optional(),
  predicted_string: z.string().optional(),
  predicted_json: z.record(z.string(), z.unknown()).optional(),
  confidence_score: z.number().min(0).max(1).optional(),
  time_horizon_days: z.number().int().positive().optional()
}).refine(data => {
  return data.predicted_value !== undefined || data.predicted_string !== undefined || data.predicted_json !== undefined;
}, {
  message: 'At least one predicted value field must be provided'
});

// Scraping job validation schemas
export const createScrapingJobSchema = z.object({
  job_type: z.string().min(1, 'Job type is required').max(100),
  target_id: uuidSchema.optional(),
  max_retries: z.number().int().min(0).max(10).optional().default(3)
});

export const updateScrapingJobSchema = z.object({
  status: z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']).optional(),
  error_message: z.string().optional(),
  results_summary: z.record(z.string(), z.unknown()).optional(),
  items_processed: z.number().int().min(0).optional(),
  items_failed: z.number().int().min(0).optional()
});

// Report validation schemas
export const createReportSchema = z.object({
  report_type: z.string().min(1, 'Report type is required').max(100),
  title: z.string().min(1, 'Title is required').max(500),
  summary: z.string().optional(),
  detailed_analysis: z.record(z.string(), z.unknown()).optional(),
  insights: z.record(z.string(), z.unknown()).optional(),
  recommendations: z.record(z.string(), z.unknown()).optional(),
  confidence_score: z.number().min(0).max(1).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional().default('draft'),
  generated_by: z.string().max(100).optional(),
  expires_at: z.string().datetime().optional()
});

export const updateReportSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  summary: z.string().optional(),
  detailed_analysis: z.record(z.string(), z.unknown()).optional(),
  insights: z.record(z.string(), z.unknown()).optional(),
  recommendations: z.record(z.string(), z.unknown()).optional(),
  confidence_score: z.number().min(0).max(1).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  expires_at: z.string().datetime().optional()
});

// Export all schemas for easy access
export const schemas = {
  // Common
  uuid: uuidSchema,
  pagination: paginationSchema,
  sort: sortSchema,
  dateRange: dateRangeSchema,

  // Users
  createUser: createUserSchema,
  updateUser: updateUserSchema,
  login: loginSchema,

  // Competitors
  createCompetitor: createCompetitorSchema,
  updateCompetitor: updateCompetitorSchema,
  competitorFilter: competitorFilterSchema,

  // Products
  createProduct: createProductSchema,
  updateProduct: updateProductSchema,
  productFilter: productFilterSchema,

  // Price History
  createPriceHistory: createPriceHistorySchema,

  // Alerts
  createAlert: createAlertSchema,
  updateAlert: updateAlertSchema,
  alertFilter: alertFilterSchema,

  // Alert Rules
  createAlertRule: createAlertRuleSchema,
  updateAlertRule: updateAlertRuleSchema,

  // Metrics
  createMetric: createMetricSchema,
  metricFilter: metricFilterSchema,

  // Predictions
  createPrediction: createPredictionSchema,

  // Scraping Jobs
  createScrapingJob: createScrapingJobSchema,
  updateScrapingJob: updateScrapingJobSchema,

  // Reports
  createReport: createReportSchema,
  updateReport: updateReportSchema
};