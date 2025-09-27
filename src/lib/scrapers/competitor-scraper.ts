import { Core } from '@/types/TYPE_REGISTRY';
// Re-export everything from enhanced scraper for backward compatibility
export * from './enhanced-scraper';
export { default as CompetitorScraper } from './enhanced-scraper';

// Type aliases for backward compatibility
export type CompetitorProduct = import('./enhanced-scraper').ScrapedProduct;

// Legacy types for compatibility
export interface CompetitorProductLegacy {
  id: string;
  name: string;
  price: number;
  currency: string;
  url: string;
  availability: 'in_stock' | 'out_of_stock' | 'pre_order';
  lastUpdated: Date;
  competitorName: string;
  description?: string;
  imageUrl?: string;
  category?: string;
}

// Configuration for different competitor sites
export interface CompetitorConfig {
  name: string;
  baseUrl: string;
  selectors: {
    productName: string;
    price: string;
    availability?: string;
    description?: string;
    imageUrl?: string;
  };
  priceParsing: {
    currencySymbol: string;
    decimalSeparator: string;
    thousandsSeparator?: string;
  };
  rateLimitMs: number;
}

// Example competitor configurations
export const COMPETITOR_CONFIGS: Record<string, CompetitorConfig> = {
  example_store: {
    name: 'Example Store',
    baseUrl: 'https://example-store.com',
    selectors: {
      productName: '.product-title',
      price: '.price-current',
      availability: '.stock-status',
      description: '.product-description',
      imageUrl: '.product-image img'
    },
    priceParsing: {
      currencySymbol: '$',
      decimalSeparator: '.',
      thousandsSeparator: ','
    },
    rateLimitMs: 2000
  },
  agri_competitor: {
    name: 'Agricultural Competitor',
    baseUrl: 'https://agri-example.com',
    selectors: {
      productName: 'h1.product-name',
      price: '.price-value',
      availability: '.availability-status',
      description: '.product-info',
      imageUrl: '.hero-image img'
    },
    priceParsing: {
      currencySymbol: '$',
      decimalSeparator: '.',
      thousandsSeparator: ','
    },
    rateLimitMs: 3000
  }
};