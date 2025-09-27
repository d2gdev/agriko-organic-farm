// Business Intelligence - Common Types and Interfaces
// Centralized type definitions for improved type safety

// Generic data structures
export interface TimeSeriesDataPoint {
  period: string;
  value: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface HistoricalDataSeries {
  dataPoints: TimeSeriesDataPoint[];
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  source: string;
  lastUpdated: Date;
  quality: DataQuality;
}

export interface DataQuality {
  completeness: number; // 0-1, percentage of data points present
  accuracy: number; // 0-1, estimated accuracy
  timeliness: number; // 0-1, how recent the data is
  consistency: number; // 0-1, internal consistency score
  reliability: 'low' | 'medium' | 'high' | 'verified';
}

// Search and filtering
export interface SearchFilters {
  dateRange?: {
    start: Date;
    end: Date;
  };
  categories?: string[];
  priorities?: string[];
  statuses?: string[];
  sources?: string[];
  confidenceThreshold?: number;
  limit?: number;
  offset?: number;
}

export interface SearchResult<T> {
  items: T[];
  totalCount: number;
  hasMore: boolean;
  filters: SearchFilters;
  executionTime: number;
  quality: DataQuality;
}

// Performance and monitoring
export interface PerformanceMetrics {
  processingTime: number;
  memoryUsage: number;
  cacheHitRate: number;
  errorRate: number;
  throughput: number;
  lastUpdated: Date;
}

export interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'offline';
  uptime: number;
  responseTime: number;
  errorCount: number;
  lastCheck: Date;
  details?: Record<string, unknown>;
}

// API Response wrappers
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
  metadata: {
    timestamp: Date;
    version: string;
    executionTime: number;
    cached: boolean;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  sorting?: {
    field: string;
    direction: 'asc' | 'desc';
  };
}

// Configuration and settings
export interface ServiceConfiguration {
  enabled: boolean;
  apiKey?: string;
  endpoint?: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  rateLimit?: {
    requests: number;
    window: number; // seconds
  };
  caching?: {
    enabled: boolean;
    ttl: number; // seconds
  };
}

// Error handling
export interface BusinessIntelligenceError {
  code: string;
  message: string;
  category: 'validation' | 'configuration' | 'network' | 'processing' | 'data' | 'auth';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  timestamp: Date;
  context?: Record<string, unknown>;
  stack?: string;
  retryable: boolean;
}

// Analysis result metadata
export interface AnalysisMetadata {
  analysisId: string;
  version: string;
  algorithm: string;
  parameters: Record<string, unknown>;
  executionTime: number;
  dataSourcesUsed: string[];
  confidenceLevel: number;
  qualityScore: number;
  limitations: string[];
  recommendations: string[];
  createdBy: string;
  createdAt: Date;
}

// Competitor intelligence specific types
export interface CompetitorComparisonMetric {
  metric: string;
  ourValue: number;
  theirValue: number;
  difference: number;
  percentageDifference: number;
  trend: 'improving' | 'declining' | 'stable';
  significance: 'high' | 'medium' | 'low';
}

export interface MarketPositioning {
  segment: string;
  position: {
    x: number; // Market share or similar metric
    y: number; // Performance or growth metric
  };
  label: string;
  competitors: Array<{
    id: string;
    name: string;
    position: { x: number; y: number };
    size: number; // Market cap, revenue, etc.
  }>;
  analysisDate: Date;
}

// Predictive modeling types
export interface ModelPrediction<T> {
  prediction: T;
  confidence: number;
  variance: number;
  factors: Array<{
    factor: string;
    weight: number;
    contribution: number;
  }>;
  timeframe: string;
  methodology: string;
  assumptions: string[];
  risks: string[];
}

// Data validation and quality
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  score: number; // 0-1 quality score
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
  code: string;
}

export interface ValidationWarning extends ValidationError {
  suggestion?: string;
}

// Export utility type for strongly typed object keys
export type StrictKeys<T> = keyof T;

// Export utility type for partial updates
export type PartialUpdate<T> = Partial<T> & {
  id: string;
  updatedAt?: Date;
  updatedBy?: string;
};

// Export utility type for API request/response pairs
export interface RequestResponsePair<TRequest, TResponse> {
  request: TRequest;
  response: ApiResponse<TResponse>;
}