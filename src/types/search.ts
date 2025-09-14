// Search and filtering type definitions

export interface SearchFilters {
  category?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  inStock?: boolean;
  featured?: boolean;
  rating?: number;
  tags?: string[];
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'newest';
}

export interface SearchQuery {
  query: string;
  filters?: SearchFilters;
  page?: number;
  limit?: number;
  searchType?: 'keyword' | 'semantic' | 'hybrid';
}

export interface SearchResult {
  id: number;
  title: string;
  description: string;
  score: number;
  type: 'product' | 'category' | 'content';
  url: string;
  image?: string;
  price?: number;
  metadata?: Record<string, unknown>;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  limit: number;
  query: string;
  searchType: string;
  executionTime: number;
  suggestions?: string[];
  filters?: SearchFilters;
}

export interface AutocompleteResult {
  text: string;
  type: 'product' | 'category' | 'suggestion';
  count?: number;
  category?: string;
}

export interface HybridSearchResult {
  product: {
    id: number;
    name: string;
    slug: string;
    price: number;
    image?: string;
  };
  scores: {
    semantic: number;
    keyword: number;
    hybrid: number;
  };
  matchedTerms: string[];
  relevanceFactors: string[];
}

export interface SearchAnalytics {
  query: string;
  resultsCount: number;
  clickThroughRate: number;
  averagePosition: number;
  searchTime: number;
  filters: SearchFilters;
  timestamp: number;
}

export interface SearchCache {
  key: string;
  query: SearchQuery;
  results: SearchResponse;
  timestamp: number;
  expiresAt: number;
  hitCount: number;
}

export interface FacetValue {
  value: string;
  count: number;
  selected: boolean;
}

export interface SearchFacet {
  name: string;
  type: 'checkbox' | 'range' | 'select';
  values: FacetValue[];
  min?: number;
  max?: number;
}