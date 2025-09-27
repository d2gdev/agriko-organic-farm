/**
 * Unified Scraping Type Definitions
 * This file contains all scraping-related types used across the application
 */

export interface ScrapedProduct {
  id: string;
  url: string;
  title: string;
  name?: string; // Some components use 'name' instead of 'title'
  price: number;
  originalPrice?: number | null;
  currency: string;
  availability: string;
  description?: string | null;
  imageUrl?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  brand?: string;
  category?: string;
  sku?: string;
  tags?: string[];
  stockLevel?: number;
  additionalImages?: string[];
  productUrl?: string; // Some implementations use this
  competitorName?: string;
  competitorKey?: string;
  lastUpdated?: string;
  priceHistory?: Array<{ date: string; price: number }>;
}

export interface ScrapingResult {
  success: boolean;
  competitorKey: string;
  competitorName: string;
  products: ScrapedProduct[];
  data?: ScrapedProduct[]; // Some components use 'data' instead of 'products'
  errors: Array<{ url: string; error: string }>;
  totalProducts: number;
  productsScraped?: number; // Enhanced scraper uses this
  productsFound?: number; // Some routes expect this
  successCount: number;
  errorCount: number;
  jobId?: string;
  scrapedAt?: Date | string;
  requestedUrls?: string[];
  error?: string; // For failed results
}

export interface ScrapingJob {
  id: string;
  job_type: string;
  target_id?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'processing';
  started_at?: Date;
  completed_at?: Date;
  error_message?: string;
  results_summary?: Record<string, any>;
  items_processed: number;
  items_failed: number;
  retry_count: number;
  max_retries: number;
  created_at: Date;
  // Additional properties that are used in the codebase
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

export interface ScrapingOptions {
  maxProducts?: number;
  timeout?: number;
  retryAttempts?: number;
  includeOutOfStock?: boolean;
  priceRange?: { min: number; max: number };
  categories?: string[];
  keywords?: string[];
}

export interface CompetitorConfig {
  key: string;
  name: string;
  baseUrl: string;
  enabled: boolean;
  selectors: Record<string, string>;
  headers?: Record<string, string>;
  rateLimitMs: number;
  currency: string;
}

export interface ScrapingSystemStatus {
  authenticated: boolean;
  message: string;
  competitors?: {
    total: number;
    enabled: number;
  };
  recentJobs?: Array<{
    id: string;
    competitor?: string;
    status: string;
    products?: number;
    createdAt: Date;
  }>;
}

// API Response types
export interface ScrapingApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ScrapeAllResponse {
  success: boolean;
  results: ScrapingResult[];
  summary: {
    totalCompetitors: number;
    totalProducts: number;
    totalSuccess: number;
    totalErrors: number;
  };
}

export interface CompetitorListResponse {
  success: boolean;
  competitors: Array<{
    key: string;
    name: string;
    baseUrl: string;
  }>;
  total: number;
}