/**
 * Server-Side Scraper Service
 * Uses proxy API to actually scrape websites
 */

import db from '@/lib/database/competitor-qdrant';
import { checkRobotsCompliance } from './robots-checker';
// Unused import: getCrawlDelay
import { ScrapingResult, ScrapedProduct } from '@/types/scraping';

export class ServerScraper {
  private baseUrl: string;

  constructor() {
    // Use the app's own proxy endpoint
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
  }

  /**
   * Scrape URLs using a specific competitor's configuration
   */
  async scrapeWithCompetitor(
    competitorKey: string,
    urls: string[]
  ): Promise<ScrapingResult> {
    const competitor = await db.competitor.getByKey(competitorKey);
    
    if (!competitor) {
      return {
        success: false,
        competitorKey,
        competitorName: 'Unknown',
        products: [],
        errors: [{ url: '', error: `Competitor ${competitorKey} not found` }],
        totalProducts: 0,
        successCount: 0,
        errorCount: 1,
      };
    }

    if (!competitor.enabled) {
      return {
        success: false,
        competitorKey: competitor.key,
        competitorName: competitor.name,
        products: [],
        errors: [{ url: '', error: `Competitor ${competitor.name} is disabled` }],
        totalProducts: 0,
        successCount: 0,
        errorCount: 1,
      };
    }

    // Create a scraping job
    const job = await db.job.create(competitorKey, urls);
    
    // Update job status to processing
    await db.job.updateStatus(job.id, 'processing', {
      startedAt: new Date(),
    });

    const products: ScrapedProduct[] = [];
    const errors: Array<{ url: string; error: string }> = [];
    let successCount = 0;
    let errorCount = 0;

    // Scrape each URL
    for (const url of urls) {
      try {
        // Check robots.txt compliance
        const robotsCheck = await checkRobotsCompliance(url);
        if (!robotsCheck.allowed) {
          errors.push({
            url,
            error: `Blocked by robots.txt: ${robotsCheck.error}`
          });
          errorCount++;
          continue;
        }

        // Add rate limiting delay (respect robots.txt crawl delay)
        if (products.length > 0) {
          const crawlDelay = robotsCheck.crawlDelay
            ? Math.max(robotsCheck.crawlDelay * 1000, competitor.rateLimitMs)
            : competitor.rateLimitMs;
          await this.delay(crawlDelay);
        }

        // Call our proxy endpoint
        const response = await fetch(`${this.baseUrl}/api/scraper/proxy`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url,
            selectors: competitor.selectors as any,
            headers: competitor.headers as any,
          }),
        });

        const result = await response.json();

        if (result.success && result.data) {
          const productData: ScrapedProduct = {
            id: `${competitor.key}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            url,
            title: result.data.title || result.metaData?.ogTitle || 'Unknown Product',
            price: result.data.price || parseFloat(result.metaData?.ogPrice || '0') || 0,
            originalPrice: undefined,
            currency: competitor.currency,
            availability: this.parseAvailability(
              result.data.availability || result.metaData?.ogAvailability
            ),
            description: result.data.description || result.metaData?.ogDescription,
            imageUrl: result.data.imageUrl || result.metaData?.ogImage,
            rating: result.data.rating,
            reviewCount: result.data.reviewCount,
            sku: result.data.sku,
            brand: competitor.name,
            category: this.extractCategory(url),
            competitorName: competitor.name,
            competitorKey: competitor.key,
            lastUpdated: new Date().toISOString(),
          };

          products.push(productData);
          successCount++;
        } else {
          errors.push({
            url,
            error: result.error || 'Failed to extract data',
          });
          errorCount++;
        }
      } catch (error) {
        errors.push({
          url,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        errorCount++;
      }
    }

    // Save products to database
    if (products.length > 0) {
      // Transform products to match expected interface
      const productsForDb = products.map(p => ({
        url: p.url,
        title: p.title,
        price: p.price,
        originalPrice: p.originalPrice || undefined,
        currency: p.currency,
        availability: p.availability,
        stockLevel: p.stockLevel,
        description: p.description || undefined,
        imageUrl: p.imageUrl || undefined,
        rating: p.rating || undefined,
        reviewCount: p.reviewCount || undefined,
        brand: p.brand || undefined,
        category: p.category || undefined,
        tags: p.tags || undefined
      }));
      await db.product.saveMany(competitor.key, job.id, productsForDb);
    }

    // Update job status
    await db.job.updateStatus(job.id, errorCount === urls.length ? 'failed' : 'completed', {
      completedAt: new Date(),
      totalProducts: products.length,
      successCount,
      errorCount,
      error: errors.length > 0 ? JSON.stringify(errors) : undefined,
    });

    return {
      success: successCount > 0,
      competitorKey: competitor.key,
      competitorName: competitor.name,
      products,
      errors,
      totalProducts: products.length,
      successCount,
      errorCount,
      jobId: job.id,
    };
  }

  /**
   * Scrape URLs from all enabled competitors
   */
  async scrapeAllCompetitors(urls: string[]): Promise<ScrapingResult[]> {
    const competitors = await db.competitor.getAll();
    const results: ScrapingResult[] = [];

    for (const competitor of competitors) {
      if (competitor.enabled) {
        const result = await this.scrapeWithCompetitor(competitor.key, urls);
        results.push(result);
        
        // Add delay between competitors
        await this.delay(2000);
      }
    }

    return results;
  }

  /**
   * Process pending scraping jobs
   */
  async processPendingJobs(limit = 5): Promise<void> {
    const jobs = await db.job.getPending(limit);

    for (const job of jobs) {
      if (job.competitor) {
        const urls = job.urls as string[];
        await this.scrapeWithCompetitor(job.competitor.key, urls);
      }
    }
  }

  /**
   * Parse availability status
   */
  private parseAvailability(text?: string | null): string {
    if (!text) return 'Out of Stock';
    
    const lower = text.toLowerCase();
    if (lower.includes('in stock') || lower.includes('available')) {
      return 'In Stock';
    }
    if (lower.includes('out of stock') || lower.includes('unavailable')) {
      return 'Out of Stock';
    }
    if (lower.includes('limited')) {
      return 'Limited Stock';
    }
    if (lower.includes('pre-order') || lower.includes('preorder')) {
      return 'Pre-order';
    }
    
    return 'Unknown';
  }

  /**
   * Extract category from URL
   */
  private extractCategory(url: string): string {
    const urlParts = url.split('/');
    const categories = ['rice', 'grain', 'spice', 'organic', 'produce', 'dairy'];
    
    for (const part of urlParts) {
      for (const category of categories) {
        if (part.toLowerCase().includes(category)) {
          return category;
        }
      }
    }
    
    return 'general';
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const serverScraper = new ServerScraper();

export default serverScraper;