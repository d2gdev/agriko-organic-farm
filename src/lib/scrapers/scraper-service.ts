/**
 * Scraper Service
 * Main service that coordinates between real scraping and fallback mechanisms
 */

import { RealWebScraper, RealScrapedProduct, createRealScraper } from './real-scraper';
import { EnhancedCompetitorScraper } from './enhanced-scraper';
import { ScrapedProduct, ScrapingResult } from '@/types/scraping';
// Unused import: ScrapingOptions
import { COMPETITOR_CONFIGS, CompetitorConfig } from './competitor-config';

export interface ScraperOptions {
  useRealScraping?: boolean;
  fallbackToMock?: boolean;
  maxRetries?: number;
  timeout?: number;
}

/**
 * Main scraper service class
 */
export class ScraperService {
  private config: CompetitorConfig;
  private realScraper?: RealWebScraper;
  private mockScraper: EnhancedCompetitorScraper;
  private options: ScraperOptions;

  constructor(competitorKey: string, options: ScraperOptions = {}) {
    const config = COMPETITOR_CONFIGS[competitorKey];
    if (!config) {
      throw new Error(`Unknown competitor: ${competitorKey}`);
    }

    this.config = config;
    this.mockScraper = new EnhancedCompetitorScraper(competitorKey);
    this.options = {
      useRealScraping: true,
      fallbackToMock: true,
      maxRetries: 2,
      timeout: 30000,
      ...options
    };

    // Only create real scraper if enabled
    if (this.options.useRealScraping) {
      this.realScraper = createRealScraper(this.config);
    }
  }

  /**
   * Scrape products with automatic fallback
   */
  async scrapeProducts(urls: string[]): Promise<ScrapingResult> {
    const result: ScrapingResult = {
      success: false, // Will be set to true later if successful
      competitorName: this.config.name,
      competitorKey: this.config.key,
      productsScraped: 0,
      totalProducts: 0,
      successCount: 0,
      errorCount: 0,
      products: [],
      errors: [],
      scrapedAt: new Date().toISOString(),
      requestedUrls: urls
    };

    // Try real scraping first
    if (this.options.useRealScraping && this.realScraper) {
      try {
        // Attempting real scraping...
        const realProducts = await this.scrapeWithRetry(urls);

        // Convert real products to our format
        for (const realProduct of realProducts) {
          if (realProduct.error) {
            result.errors.push({
              url: realProduct.url,
              error: realProduct.error
            });
            result.errorCount++;
          } else if (realProduct.title || realProduct.price) {
            // Only include if we got some data
            const product: ScrapedProduct = this.convertRealProduct(realProduct);
            result.products.push(product);
            result.successCount++;
          } else {
            // No data extracted
            result.errors.push({
              url: realProduct.url,
              error: 'No data extracted'
            });
            result.errorCount++;
          }
          result.productsScraped = (result.productsScraped || 0) + 1;
        }

        // If we got some successful results, return them
        if (result.successCount > 0) {
          result.success = true;
          result.totalProducts = result.products.length;
          return result;
        }
      } catch (error) {
        console.error('Real scraping failed:', error);
      }
    }

    // Fallback to mock data if enabled and real scraping failed
    if (this.options.fallbackToMock) {
      // Falling back to mock data...
      const mockResult = await this.mockScraper.scrapeProducts(urls);
      return mockResult;
    }

    // No fallback, return error result
    result.errors = urls.map(url => ({
      url,
      error: 'Scraping failed and fallback disabled'
    }));
    result.errorCount = urls.length;

    return result;
  }

  /**
   * Scrape with retry logic
   */
  private async scrapeWithRetry(urls: string[]): Promise<RealScrapedProduct[]> {
    if (!this.realScraper) {
      throw new Error('Real scraper not initialized');
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= (this.options.maxRetries || 1); attempt++) {
      try {
        // Scraping attempt...
        const products = await this.realScraper.scrapeUrls(urls);

        // Check if we got any successful results
        const successfulProducts = products.filter(p => !p.error);
        if (successfulProducts.length > 0) {
          return products;
        }

        // All products had errors
        if (attempt < (this.options.maxRetries || 1)) {
          // All products failed, retrying...
          await new Promise(resolve => setTimeout(resolve, attempt * 2000));
        }
      } catch (error) {
        lastError = error as Error;
        console.error(`Attempt ${attempt} failed:`, error);

        if (attempt < (this.options.maxRetries || 1)) {
          await new Promise(resolve => setTimeout(resolve, attempt * 2000));
        }
      }
    }

    if (lastError) {
      throw lastError;
    }

    return [];
  }

  /**
   * Convert real scraped product to our format
   */
  private convertRealProduct(realProduct: RealScrapedProduct): ScrapedProduct {
    return {
      id: `${this.config.key}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      url: realProduct.url, // Required property
      title: realProduct.title || 'Unknown Product',
      price: realProduct.price || 0,
      originalPrice: realProduct.price ? realProduct.price * 1.1 : undefined,
      currency: realProduct.currency || 'USD',
      availability: this.mapAvailability(realProduct.availability),
      stockLevel: undefined,
      description: realProduct.description || undefined,
      brand: realProduct.brand || this.config.name,
      sku: realProduct.sku || undefined,
      category: undefined,
      tags: [],
      imageUrl: realProduct.image || undefined,
      additionalImages: undefined,
      rating: realProduct.rating || undefined,
      reviewCount: realProduct.reviews || undefined,
      productUrl: realProduct.url,
      competitorName: this.config.name,
      competitorKey: this.config.key,
      lastUpdated: realProduct.scrapedAt.toISOString(),
      priceHistory: undefined
    };
  }

  /**
   * Map availability text to our enum
   */
  private mapAvailability(availability: string | null): 'In Stock' | 'Out of Stock' | 'Limited Stock' | 'Pre-order' {
    if (!availability) return 'Out of Stock';

    const lower = availability.toLowerCase();

    if (lower.includes('in stock') || lower.includes('available')) {
      return 'In Stock';
    }
    if (lower.includes('out of stock') || lower.includes('unavailable')) {
      return 'Out of Stock';
    }
    if (lower.includes('limited') || lower.includes('low stock')) {
      return 'Limited Stock';
    }
    if (lower.includes('pre-order') || lower.includes('preorder')) {
      return 'Pre-order';
    }

    return 'Out of Stock';
  }
}

/**
 * Scrape from multiple competitors
 */
export async function scrapeAllCompetitorsReal(
  urls: string[],
  options: ScraperOptions = {}
): Promise<ScrapingResult[]> {
  const results: ScrapingResult[] = [];
  const enabledCompetitors = Object.values(COMPETITOR_CONFIGS).filter(c => c.enabled);

  for (const config of enabledCompetitors) {
    try {
      const service = new ScraperService(config.key, options);
      const result = await service.scrapeProducts(urls);
      results.push(result);

      // Add delay between competitors
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Failed to scrape ${config.name}:`, error);
      results.push({
        success: false,
        competitorName: config.name,
        competitorKey: config.key,
        productsScraped: 0,
        totalProducts: 0,
        successCount: 0,
        errorCount: urls.length,
        products: [],
        errors: urls.map(url => ({
          url,
          error: error instanceof Error ? error.message : 'Unknown error'
        })),
        scrapedAt: new Date().toISOString(),
        requestedUrls: urls
      });
    }
  }

  return results;
}

/**
 * Test scraper with a single URL
 */
export async function testScraper(competitorKey: string, testUrl: string): Promise<{
  success: boolean;
  data?: ScrapedProduct[];
  error?: string;
  method?: string;
}> {
  try {
    const service = new ScraperService(competitorKey, {
      useRealScraping: true,
      fallbackToMock: false,
      maxRetries: 1
    });

    const result = await service.scrapeProducts([testUrl]);

    return {
      success: result.successCount > 0,
      data: result.products,
      method: 'real'
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export default ScraperService;