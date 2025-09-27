// Common type definitions to replace Record<string, unknown>

// Analytics and tracking related
export interface AnalyticsData {
  eventName?: string;
  eventValue?: number;
  category?: string;
  label?: string;
  // Specific custom dimensions we actually use
  customDimensions?: {
    userId?: string;
    sessionId?: string;
    productId?: number;
    categoryId?: number;
    searchQuery?: string;
    experimentId?: string;
    variantId?: string;
  };
  // Specific custom metrics we track
  customMetrics?: {
    pageLoadTime?: number;
    searchResultsCount?: number;
    cartValue?: number;
    conversionValue?: number;
    engagementScore?: number;
  };
}

// Search filters with specific attributes
export interface SearchFilterValues {
  categories?: string[];
  priceRange?: { min?: number; max?: number };
  ratings?: number[];
  availability?: 'in_stock' | 'out_of_stock' | 'all';
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'newest';
  tags?: string[];
  // Specific product attributes we support
  attributes?: {
    color?: string[];
    size?: string[];
    brand?: string[];
    weight?: string[];
    material?: string[];
    organic?: boolean;
    glutenFree?: boolean;
    vegan?: boolean;
  };
}

// Metadata for various entities - NO INDEX SIGNATURES
export interface EntityMetadata {
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  version?: number;
  tags?: string[];
  source?: string;
  // Additional metadata fields we actually use
  environment?: 'development' | 'staging' | 'production';
  region?: string;
  tenant?: string;
  correlationId?: string;
  requestId?: string;
  userAgent?: string;
  ipAddress?: string;
  // Fields used in the codebase
  timestamp?: number;
  validatedAt?: number;
  productId?: number;
  orderId?: string;
  orderTotal?: number;
  clickedResults?: number[];
  syncSource?: string;
  name?: string;
  queryLength?: number;
  value?: number;
  // Additional fields found in usage
  itemCount?: number;
  hasFilters?: boolean;
  entryType?: string;
  paymentMethod?: string;
  shippingMethod?: string;
  startTime?: number;
  priority?: string;
  searchQuery?: string;
  pageUrl?: string;
  realTimeSync?: boolean;
  autoSync?: boolean;
}

// Configuration objects with specific types
export interface ComponentConfig {
  enabled?: boolean;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'danger';
  theme?: 'light' | 'dark' | 'auto' | 'high-contrast';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  // Layout options for A/B testing
  layout?: 'grid' | 'list' | 'carousel' | 'masonry';
  // Search types
  searchType?: 'instant' | 'traditional' | 'autocomplete';
  // Specific style overrides we support
  customStyles?: {
    backgroundColor?: string;
    color?: string;
    borderRadius?: number;
    padding?: number;
    margin?: number;
    fontSize?: number;
    fontWeight?: number | 'normal' | 'bold';
    opacity?: number;
    zIndex?: number;
  };
  // Specific features we support
  features?: {
    animation?: boolean;
    sound?: boolean;
    hapticFeedback?: boolean;
    keyboardShortcuts?: boolean;
    autoSave?: boolean;
    offlineMode?: boolean;
    debugMode?: boolean;
  };
}

// Graph/Node properties with specific types
export interface GraphNodeProperties {
  id: string;
  label?: string;
  type?: 'product' | 'category' | 'user' | 'order' | 'tag' | 'brand' | 'health_benefit';
  weight?: number;
  category?: string;
  // Specific attributes based on node type
  attributes?: {
    // Product attributes
    price?: number;
    stock?: number;
    sku?: string;
    // Category attributes
    parentCategory?: string;
    displayOrder?: number;
    // User attributes
    registrationDate?: string;
    purchaseCount?: number;
    // Health benefit attributes
    scientificEvidence?: 'strong' | 'moderate' | 'weak';
    description?: string;
  };
  relationships?: string[];
}

// Event data structures
export interface EventData {
  action?: string;
  category?: string;
  label?: string;
  value?: number;
  nonInteraction?: boolean;
  transport?: 'beacon' | 'xhr' | 'image';
  customDimensions?: { [key: string]: number };
}

// API parameters
export interface ApiParameters {
  page?: number;
  limit?: number;
  offset?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  fields?: string[];
  include?: string[];
  exclude?: string[];
  filter?: { [field: string]: number | boolean | string[] };
}

// Error details
export interface ErrorDetails {
  code?: string;
  message?: string;
  field?: string;
  value?: unknown;
  stack?: string;
  innerError?: ErrorDetails;
  timestamp?: string;
  context?: {
    url?: string;
    method?: string;
    headers?: { [key: string]: string };
    body?: unknown;
  };
}

// Service worker data
export interface ServiceWorkerData {
  action?: string;
  payload?: unknown;
  timestamp?: number;
  version?: string;
  clientId?: string;
  messageId?: string;
}

// Export data for CSV/JSON
export interface ExportDataRow {
  [column: string]: number | boolean | Date | null;
}

// Segment data for analytics
export interface SegmentData {
  segmentId?: string;
  segmentName?: string;
  criteria?: {
    field: string;
    operator: 'equals' | 'contains' | 'greater' | 'less' | 'between';
    value: unknown;
  }[];
  userCount?: number;
}

// Type guard helpers
export function isAnalyticsData(value: unknown): value is AnalyticsData {
  return typeof value === 'object' && value !== null &&
    ('eventName' in value || 'category' in value || 'customDimensions' in value);
}

export function isSearchFilterValues(value: unknown): value is SearchFilterValues {
  return typeof value === 'object' && value !== null &&
    ('categories' in value || 'priceRange' in value || 'sortBy' in value);
}

export function isEntityMetadata(value: unknown): value is EntityMetadata {
  return typeof value === 'object' && value !== null &&
    ('createdAt' in value || 'updatedAt' in value || 'version' in value);
}