// External API response type definitions

// Pinecone API Types
export interface PineconeVector {
  id: string;
  values: number[];
  metadata?: Record<string, unknown>;
  sparseValues?: {
    indices: number[];
    values: number[];
  };
}

export interface PineconeQueryResponse {
  matches: Array<{
    id: string;
    score?: number;
    values?: number[];
    metadata?: Record<string, unknown>;
  }>;
  namespace?: string;
}

export interface PineconeUpsertResponse {
  upsertedCount: number;
}

export interface PineconeIndexStats {
  dimension: number;
  indexFullness: number;
  namespaces: Record<string, {
    vectorCount: number;
  }>;
  totalVectorCount: number;
}

// DeepSeek API Types
export interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface DeepSeekRequest {
  model: string;
  messages: DeepSeekMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string[];
}

export interface DeepSeekResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: DeepSeekMessage;
    finish_reason: 'stop' | 'length' | 'tool_calls' | null;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// MemGraph/Neo4j Types
export interface MemGraphNode {
  identity: number;
  labels: string[];
  properties: Record<string, unknown>;
}

export interface MemGraphRelationship {
  identity: number;
  start: number;
  end: number;
  type: string;
  properties: Record<string, unknown>;
}

export interface MemGraphPath {
  start: MemGraphNode;
  end: MemGraphNode;
  segments: Array<{
    start: MemGraphNode;
    relationship: MemGraphRelationship;
    end: MemGraphNode;
  }>;
  length: number;
}

export interface MemGraphQueryResult {
  records: Array<{
    keys: string[];
    _fields: unknown[];
    _fieldLookup: Record<string, number>;
  }>;
  summary: {
    query: {
      text: string;
      parameters: Record<string, unknown>;
    };
    queryType: string;
    counters: {
      nodesCreated: number;
      nodesDeleted: number;
      relationshipsCreated: number;
      relationshipsDeleted: number;
      propertiesSet: number;
      labelsAdded: number;
      labelsRemoved: number;
      indexesAdded: number;
      indexesRemoved: number;
      constraintsAdded: number;
      constraintsRemoved: number;
    };
    plan: unknown;
    profile: unknown;
    notifications: unknown[];
    resultAvailableAfter: number;
    resultConsumedAfter: number;
    database: {
      name: string;
    };
  };
}

// Google Analytics Types
export interface GAEvent {
  event_name: string;
  event_parameters: Record<string, number | boolean>;
}

export interface GAPageView {
  page_title: string;
  page_location: string;
  page_referrer?: string;
}

export interface GAEcommerceItem {
  item_id: string;
  item_name: string;
  item_category?: string;
  item_category2?: string;
  item_variant?: string;
  price: number;
  quantity: number;
  currency: string;
}

// Search Console Types
export interface SearchConsoleQuery {
  query: string;
  country?: string;
  device?: 'desktop' | 'mobile' | 'tablet';
  page?: string;
}

export interface SearchConsoleRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface SearchConsoleResponse {
  rows: SearchConsoleRow[];
  responseAggregationType: 'auto' | 'byProperty' | 'byPage';
}

// Generic API Response Wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
  requestId?: string;
}

// Error Response Types
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  statusCode: number;
  timestamp: string;
}

// Pagination Types
export interface PaginatedResponse<T = unknown> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Analytics Batch Event Type
export interface AnalyticsBatchEvent {
  eventType: string;
  userId?: string;
  sessionId: string;
  timestamp: number;
  data: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

// Internal API Response Types
export interface AnalyticsResponse extends ApiResponse {
  data?: {
    metrics?: Record<string, number>;
    trends?: Array<{ date: string; value: number }>;
    segments?: Record<string, unknown>;
  };
}

export interface SearchResponse<T = unknown> extends ApiResponse {
  results?: T[];
  count?: number;
  query?: string;
  filters?: Record<string, unknown>;
  searchType?: string;
  totalMatches?: number;
}

export interface GraphStatsResponse extends ApiResponse {
  nodes?: Array<{ id: string; type: string; properties: Record<string, unknown> }>;
  relationships?: Array<{ from: string; to: string; type: string }>;
  stats?: Record<string, number>;
}

export interface ReviewResponse extends ApiResponse {
  review?: {
    id: string;
    rating: number;
    comment: string;
    author: string;
    createdAt: string;
  };
  reviews?: Array<{
    id: string;
    rating: number;
    comment: string;
    author: string;
    createdAt: string;
  }>;
}

export interface CacheStatusResponse extends ApiResponse {
  caches?: Record<string, {
    size: number;
    hits: number;
    misses: number;
    hitRate: number;
  }>;
}

// Type guard functions
export function isApiResponse(obj: unknown): obj is ApiResponse {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'success' in obj &&
    typeof (obj as ApiResponse).success === 'boolean'
  );
}

export function hasData<T>(response: ApiResponse<T>): response is Required<ApiResponse<T>> {
  return response.success === true && response.data !== undefined;
}