// Database entity types for business intelligence system

export interface User {
  id: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'user' | 'analyst';
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
}

export interface ApiKey {
  id: string;
  user_id: string;
  key_name: string;
  key_hash: string;
  permissions: Record<string, boolean | number>;
  is_active: boolean;
  expires_at?: Date;
  created_at: Date;
  last_used?: Date;
}

export interface Competitor {
  id: string;
  name: string;
  domain: string;
  industry?: string;
  size_category?: string;
  country?: string;
  is_active: boolean;
  scraping_config: {
    enabled: boolean;
    frequency: string;
    selectors?: Record<string, string>;
    headers?: Record<string, string>;
    [key: string]: unknown;
  };
  created_at: Date;
  updated_at: Date;
}

export interface Product {
  id: string;
  competitor_id: string;
  external_id?: string;
  name: string;
  description?: string;
  category?: string;
  price?: number;
  currency: string;
  availability?: string;
  url?: string;
  image_url?: string;
  sku?: string;
  brand?: string;
  metadata: Record<string, number | boolean | null>;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface PriceHistory {
  id: string;
  product_id: string;
  price: number;
  currency: string;
  sale_price?: number;
  discount_percentage?: number;
  availability?: string;
  scraped_at: Date;
  source?: string;
}

export interface BiMetric {
  id: string;
  metric_type: string;
  metric_name: string;
  value?: number;
  string_value?: string;
  json_value?: Record<string, unknown>;
  dimension_1?: string;
  dimension_2?: string;
  dimension_3?: string;
  timestamp: Date;
  source?: string;
  confidence_score?: number;
}

export interface CompetitiveReport {
  id: string;
  report_type: string;
  title: string;
  summary?: string;
  detailed_analysis?: Record<string, unknown>;
  insights?: Record<string, unknown>;
  recommendations?: Record<string, unknown>;
  confidence_score?: number;
  status: 'draft' | 'published' | 'archived';
  generated_by?: string;
  generated_at: Date;
  expires_at?: Date;
}

export interface PredictionModel {
  id: string;
  model_name: string;
  model_type: string;
  version: string;
  description?: string;
  parameters?: Record<string, unknown>;
  training_data_info?: Record<string, unknown>;
  accuracy_metrics?: Record<string, unknown>;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Prediction {
  id: string;
  model_id: string;
  prediction_type: string;
  target_entity_type: string;
  target_entity_id?: string;
  predicted_value?: number;
  predicted_string?: string;
  predicted_json?: Record<string, unknown>;
  confidence_score?: number;
  time_horizon_days?: number;
  prediction_date: Date;
  actual_value?: number;
  actual_date?: Date;
  accuracy_score?: number;
}

export interface Alert {
  id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message?: string;
  details?: Record<string, unknown>;
  entity_type?: string;
  entity_id?: string;
  is_read: boolean;
  is_acknowledged: boolean;
  action_required: boolean;
  created_at: Date;
  acknowledged_at?: Date;
  resolved_at?: Date;
}

export interface AlertRule {
  id: string;
  rule_name: string;
  rule_type: string;
  conditions: Record<string, unknown>;
  actions: Record<string, unknown>;
  is_active: boolean;
  priority: number;
  cooldown_minutes: number;
  created_at: Date;
  updated_at: Date;
  last_triggered?: Date;
}

export interface ScrapingJob {
  id: string;
  job_type: string;
  target_id?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'processing';
  started_at?: Date;
  completed_at?: Date;
  error_message?: string;
  results_summary?: Record<string, unknown>;
  items_processed: number;
  items_failed: number;
  retry_count: number;
  max_retries: number;
  created_at: Date;
  // Additional properties used in scraping system
  competitor?: {
    name: string;
    key: string;
  };
  urls?: string[];
  totalProducts?: number;
  createdAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface UserSession {
  id: string;
  user_id: string;
  session_token: string;
  ip_address?: string;
  user_agent?: string;
  expires_at: Date;
  created_at: Date;
  last_activity: Date;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  timestamp: Date;
}

// View types
export interface CompetitorSummary {
  id: string;
  name: string;
  domain: string;
  industry?: string;
  product_count: number;
  avg_price?: number;
  last_updated?: Date;
}

export interface RecentAlert {
  id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message?: string;
  is_read: boolean;
  is_acknowledged: boolean;
  created_at: Date;
}

export interface PriceTrend {
  product_id: string;
  product_name: string;
  competitor_name: string;
  price: number;
  scraped_at: Date;
  previous_price?: number;
  price_change_percent?: number;
}

// Query filter types
export interface PaginationOptions {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface SortOptions {
  field: string;
  direction: 'ASC' | 'DESC';
}

export interface DateRangeFilter {
  start_date?: Date;
  end_date?: Date;
}

export interface CompetitorFilter extends PaginationOptions {
  industry?: string;
  country?: string;
  is_active?: boolean;
  sort?: SortOptions;
}

export interface ProductFilter extends PaginationOptions {
  competitor_id?: string;
  category?: string;
  price_min?: number;
  price_max?: number;
  is_active?: boolean;
  sort?: SortOptions;
}

export interface AlertFilter extends PaginationOptions {
  alert_type?: string;
  severity?: Alert['severity'];
  is_read?: boolean;
  is_acknowledged?: boolean;
  date_range?: DateRangeFilter;
  sort?: SortOptions;
}

export interface MetricFilter extends PaginationOptions {
  metric_type?: string;
  metric_name?: string;
  date_range?: DateRangeFilter;
  confidence_threshold?: number;
  sort?: SortOptions;
}