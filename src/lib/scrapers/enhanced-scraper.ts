/**
 * Enhanced Competitor Product Scraper
 * Provides advanced scraping capabilities with error handling, rate limiting, and caching
 */

import {
  CompetitorConfig,
  COMPETITOR_CONFIGS,
  getEnabledCompetitors,
  PRODUCT_KEYWORDS
} from './competitor-config';
import { ScrapedProduct, ScrapingResult, ScrapingOptions } from '@/types/scraping';

// Re-export types for compatibility with existing imports
export type { ScrapedProduct, ScrapingResult, ScrapingOptions };


/**
 * Enhanced Competitor Scraper Class
 */
export class EnhancedCompetitorScraper {
  private config: CompetitorConfig;
  private lastRequestTime: number = 0;
  private cache: Map<string, { data: ScrapedProduct; timestamp: number }> = new Map();
  private cacheExpiryMs: number = 3600000; // 1 hour

  constructor(competitorKey: string) {
    const config = COMPETITOR_CONFIGS[competitorKey];
    if (!config) {
      throw new Error(`Unknown competitor: ${competitorKey}`);
    }
    this.config = config;
  }

  /**
   * Scrape products from URLs
   */
  async scrapeProducts(
    urls: string[],
    options: ScrapingOptions = {}
  ): Promise<ScrapingResult> {
    const result: ScrapingResult = {
      success: false, // Will be set to true if we get any products
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

    for (const url of urls) {
      try {
        // Check cache first
        const cached = this.getCachedProduct(url);
        if (cached) {
          result.products.push(cached);
          result.successCount++;
          continue;
        }

        // Rate limiting
        await this.enforceRateLimit();

        // Scrape the product
        const product = await this.scrapeProductFromUrl(url, options);

        if (product) {
          // Apply filters
          if (this.shouldIncludeProduct(product, options)) {
            result.products.push(product);
            result.successCount++;

            // Cache the result
            this.cacheProduct(url, product);
          }
        }
      } catch (error) {
        result.errors.push({
          url,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        result.errorCount++;
      }

      result.productsScraped = (result.productsScraped || 0) + 1;

      // Check max products limit
      if (options.maxProducts && result.products.length >= options.maxProducts) {
        break;
      }
    }

    // Set success status and total products
    result.success = result.successCount > 0;
    result.totalProducts = result.products.length;

    return result;
  }

  /**
   * Scrape a single product from URL
   */
  private async scrapeProductFromUrl(
    url: string,
    _options: ScrapingOptions // Currently not used in mock implementation
  ): Promise<ScrapedProduct> {
    // In a real implementation, this would use Puppeteer or Playwright
    // For now, we'll return mock data based on the URL and competitor config

    const productId = this.generateProductId(url);
    const mockPrice = Math.floor(Math.random() * 50) + 10;

    const product: ScrapedProduct = {
      id: productId,
      url: url, // Required property
      title: this.generateMockTitle(url),
      price: mockPrice,
      originalPrice: mockPrice * 1.2,
      currency: 'USD',
      availability: Math.random() > 0.2 ? 'In Stock' : 'Out of Stock',
      stockLevel: Math.floor(Math.random() * 100),
      description: this.generateMockDescription(),
      brand: this.config.name,
      sku: `SKU-${productId}`,
      category: this.detectCategory(url),
      tags: this.generateTags(url),
      imageUrl: `https://via.placeholder.com/400x400?text=${encodeURIComponent(this.config.name)}`,
      rating: Number((Math.random() * 2 + 3).toFixed(1)),
      reviewCount: Math.floor(Math.random() * 500),
      productUrl: url,
      competitorName: this.config.name,
      competitorKey: this.config.key,
      lastUpdated: new Date().toISOString()
    };

    return product;
  }

  /**
   * Generate mock product title based on URL and keywords
   */
  private generateMockTitle(url: string): string {
    const titles = [
      'Organic Black Rice - Premium Grade',
      'Wild Brown Rice - 5lb Bag',
      'Red Rice - Himalayan Variety',
      'Jasmine White Rice - Thai Premium',
      'Organic Turmeric Powder - 100% Pure',
      'Raw Ginger Powder - Fresh Ground',
      'Moringa Leaf Powder - Superfood',
      'Raw Wildflower Honey - Local Harvest',
      'Organic Quinoa - Tri-Color Blend',
      'Ancient Grains Mix - Heritage Variety'
    ];

    // Use URL hash to consistently return same title for same URL
    const hash = this.hashString(url);
    return titles[hash % titles.length]!
  }

  /**
   * Generate mock product description
   */
  private generateMockDescription(): string {
    const descriptions = [
      'Premium quality organic product sourced from sustainable farms. Rich in nutrients and carefully processed to maintain maximum nutritional value.',
      'Carefully selected and processed using traditional methods. Non-GMO, gluten-free, and certified organic.',
      'Sustainably grown and harvested at peak freshness. Perfect for health-conscious consumers looking for premium quality.',
      'Farm-fresh product with superior taste and texture. Ideal for everyday cooking and special occasions.'
    ];

    return descriptions[Math.floor(Math.random() * descriptions.length)]!;
  }

  /**
   * Detect product category from URL
   */
  private detectCategory(url: string): string {
    const urlLower = url.toLowerCase();

    for (const [category, keywords] of Object.entries(PRODUCT_KEYWORDS)) {
      if (keywords.some(keyword => urlLower.includes(keyword.replace(' ', '-')))) {
        return category;
      }
    }

    return 'general';
  }

  /**
   * Generate product tags
   */
  private generateTags(url: string): string[] {
    const tags: string[] = ['organic'];
    const urlLower = url.toLowerCase();

    if (urlLower.includes('rice')) tags.push('rice', 'grain');
    if (urlLower.includes('powder')) tags.push('powder', 'spice');
    if (urlLower.includes('honey')) tags.push('honey', 'sweetener');
    if (urlLower.includes('black')) tags.push('black-rice', 'antioxidant');
    if (urlLower.includes('brown')) tags.push('brown-rice', 'whole-grain');

    return tags;
  }

  /**
   * Check if product should be included based on filters
   */
  private shouldIncludeProduct(
    product: ScrapedProduct,
    options: ScrapingOptions
  ): boolean {
    // Check stock availability
    if (!options.includeOutOfStock && product.availability === 'Out of Stock') {
      return false;
    }

    // Check price range
    if (options.priceRange) {
      if (product.price < options.priceRange.min || product.price > options.priceRange.max) {
        return false;
      }
    }

    // Check categories
    if (options.categories && options.categories.length > 0) {
      if (!product.category || !options.categories.includes(product.category)) {
        return false;
      }
    }

    // Check keywords
    if (options.keywords && options.keywords.length > 0) {
      const productText = `${product.title} ${product.description}`.toLowerCase();
      const hasKeyword = options.keywords.some(keyword =>
        productText.includes(keyword.toLowerCase())
      );
      if (!hasKeyword) {
        return false;
      }
    }

    return true;
  }

  /**
   * Rate limiting
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.config.rateLimitMs) {
      const waitTime = this.config.rateLimitMs - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Cache management
   */
  private getCachedProduct(url: string): ScrapedProduct | null {
    const cached = this.cache.get(url);

    if (cached) {
      const age = Date.now() - cached.timestamp;
      if (age < this.cacheExpiryMs) {
        return cached.data;
      }
      // Remove expired entry
      this.cache.delete(url);
    }

    return null;
  }

  private cacheProduct(url: string, product: ScrapedProduct): void {
    this.cache.set(url, {
      data: product,
      timestamp: Date.now()
    });

    // Limit cache size
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
  }

  /**
   * Helper functions
   */
  private generateProductId(url: string): string {
    return `${this.config.key}-${this.hashString(url)}`;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}

/**
 * Scrape products from multiple competitors
 */
export async function scrapeAllCompetitors(
  urls: string[],
  options: ScrapingOptions = {}
): Promise<ScrapingResult[]> {
  const results: ScrapingResult[] = [];
  const competitors = getEnabledCompetitors();

  for (const config of competitors) {
    try {
      const scraper = new EnhancedCompetitorScraper(config.key);
      const result = await scraper.scrapeProducts(urls, options);
      results.push(result);
    } catch (error) {
      console.error(`Error scraping ${config.name}:`, error);
    }
  }

  return results;
}

/**
 * Create scraper instance
 */
export function createCompetitorScraper(competitorKey: string): EnhancedCompetitorScraper {
  return new EnhancedCompetitorScraper(competitorKey);
}

/**
 * Get available competitors
 */
export function getAvailableCompetitors(): Array<{ key: string; name: string; baseUrl: string }> {
  return getEnabledCompetitors().map(config => ({
    key: config.key,
    name: config.name,
    baseUrl: config.baseUrl
  }));
}

export default EnhancedCompetitorScraper;