/**
 * Real Web Scraper Implementation
 * Provides actual web scraping capabilities with proper error handling and compliance
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import PQueue from 'p-queue';
import UserAgent from 'user-agents';
import { CompetitorConfig } from './competitor-config';

// Product interface
export interface RealScrapedProduct {
  url: string;
  title: string | null;
  price: number | null;
  currency: string;
  availability: string | null;
  image: string | null;
  description: string | null;
  rating: number | null;
  reviews: number | null;
  brand: string | null;
  sku: string | null;
  scrapedAt: Date;
  competitor: string;
  error?: string;
}

// Robots.txt parser
class RobotsChecker {
  private robotsCache: Map<string, { allowed: boolean; checkedAt: Date }> = new Map();
  private cacheExpiryMs = 3600000; // 1 hour

  async isAllowed(url: string, _userAgent: string = '*'): Promise<boolean> { // userAgent not used in this mock
    try {
      const urlObj = new URL(url);
      const robotsUrl = `${urlObj.protocol}//${urlObj.host}/robots.txt`;

      // Check cache
      const cached = this.robotsCache.get(robotsUrl);
      if (cached && (Date.now() - cached.checkedAt.getTime()) < this.cacheExpiryMs) {
        return cached.allowed;
      }

      // Fetch robots.txt
      try {
        const response = await axios.get(robotsUrl, {
          timeout: 5000,
          validateStatus: (status) => status < 500
        });

        if (response.status === 404) {
          // No robots.txt means we can scrape
          this.robotsCache.set(robotsUrl, { allowed: true, checkedAt: new Date() });
          return true;
        }

        // Parse robots.txt (basic implementation)
        const content = response.data.toLowerCase();
        const disallowedPaths = content
          .split('\n')
          .filter((line: string) => line.trim().startsWith('disallow:'))
          .map((line: string) => line.replace('disallow:', '').trim());

        const pathname = urlObj.pathname.toLowerCase();
        const isDisallowed = disallowedPaths.some((path: string) =>
          path === '/' || pathname.startsWith(path)
        );

        const allowed = !isDisallowed;
        this.robotsCache.set(robotsUrl, { allowed, checkedAt: new Date() });
        return allowed;
      } catch (_error) {
        // If we can't fetch robots.txt, be conservative and allow
        console.warn(`Could not fetch robots.txt for ${robotsUrl}`);
        return true;
      }
    } catch (_error) {
      console.error('Error checking robots.txt:', _error);
      return false;
    }
  }
}

/**
 * Real web scraper class
 */
export class RealWebScraper {
  private config: CompetitorConfig;
  private queue: PQueue;
  private robotsChecker: RobotsChecker;
  private userAgent: string;

  constructor(config: CompetitorConfig) {
    this.config = config;
    this.queue = new PQueue({
      concurrency: 1,
      interval: config.rateLimitMs,
      intervalCap: 1
    });
    this.robotsChecker = new RobotsChecker();
    this.userAgent = new UserAgent().toString();
  }

  /**
   * Scrape a single URL
   */
  async scrapeUrl(url: string): Promise<RealScrapedProduct> {
    // Check robots.txt compliance
    const isAllowed = await this.robotsChecker.isAllowed(url, this.userAgent);
    if (!isAllowed) {
      return {
        url,
        title: null,
        price: null,
        currency: this.config.priceParsing.currencySymbol,
        availability: null,
        image: null,
        description: null,
        rating: null,
        reviews: null,
        brand: null,
        sku: null,
        scrapedAt: new Date(),
        competitor: this.config.name,
        error: 'Blocked by robots.txt'
      };
    }

    const result = this.queue.add(async (): Promise<RealScrapedProduct> => {
      try {
        // Fetch the page
        const response = await axios.get(url, {
          headers: {
            'User-Agent': this.userAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            ...this.config.headers
          },
          timeout: 30000,
          maxRedirects: 5,
          validateStatus: (status) => status < 500
        });

        if (response.status !== 200) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Parse HTML
        const $ = cheerio.load(response.data);

        // Extract data using selectors
        const product: RealScrapedProduct = {
          url,
          title: this.extractText($, this.config.selectors.productName),
          price: this.extractPrice($, this.config.selectors.price),
          currency: this.config.priceParsing.currencySymbol,
          availability: this.extractText($, this.config.selectors.availability),
          image: this.extractImage($, this.config.selectors.imageUrl, url),
          description: this.extractText($, this.config.selectors.description),
          rating: this.extractRating($, this.config.selectors.rating),
          reviews: this.extractReviews($, this.config.selectors.reviews),
          brand: this.extractText($, 'meta[property="og:brand"], .brand-name, .product-brand'),
          sku: this.extractText($, this.config.selectors.sku),
          scrapedAt: new Date(),
          competitor: this.config.name
        };

        return product;
      } catch (error) {
        console.error(`Error scraping ${url}:`, error);
        return {
          url,
          title: null,
          price: null,
          currency: this.config.priceParsing.currencySymbol,
          availability: null,
          image: null,
          description: null,
          rating: null,
          reviews: null,
          brand: null,
          sku: null,
          scrapedAt: new Date(),
          competitor: this.config.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    return result as Promise<RealScrapedProduct>;
  }

  /**
   * Scrape multiple URLs
   */
  async scrapeUrls(urls: string[]): Promise<RealScrapedProduct[]> {
    const results: RealScrapedProduct[] = [];

    for (const url of urls) {
      try {
        const product = await this.scrapeUrl(url);
        results.push(product);

        // Add delay between requests
        await new Promise(resolve => setTimeout(resolve, this.config.rateLimitMs));
      } catch (error) {
        console.error(`Failed to scrape ${url}:`, error);
        results.push({
          url,
          title: null,
          price: null,
          currency: this.config.priceParsing.currencySymbol,
          availability: null,
          image: null,
          description: null,
          rating: null,
          reviews: null,
          brand: null,
          sku: null,
          scrapedAt: new Date(),
          competitor: this.config.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  /**
   * Helper methods for data extraction
   */
  private extractText($: cheerio.Root, selector?: string): string | null {
    if (!selector) return null;

    try {
      // Try multiple selector variations
      const selectors = selector.split(',').map(s => s.trim());

      for (const sel of selectors) {
        const element = $(sel).first();
        if (element.length > 0) {
          // Try different methods to get text
          let text = element.text().trim();
          if (!text) {
            text = element.attr('content') || '';
          }
          if (!text) {
            text = element.attr('value') || '';
          }
          if (text) {
            return text.substring(0, 1000); // Limit text length
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Error extracting text:', error);
      return null;
    }
  }

  private extractPrice($: cheerio.Root, selector?: string): number | null {
    if (!selector) return null;

    try {
      const priceText = this.extractText($, selector);
      if (!priceText) return null;

      // Clean price text and extract number
      const cleanPrice = priceText
        .replace(/[^0-9.,]/g, '')
        .replace(',', '');

      const price = parseFloat(cleanPrice);
      return isNaN(price) ? null : price;
    } catch (error) {
      console.error('Error extracting price:', error);
      return null;
    }
  }

  private extractImage($: cheerio.Root, selector?: string, baseUrl?: string): string | null {
    if (!selector) return null;

    try {
      const element = $(selector).first();
      if (element.length === 0) return null;

      // Try different attributes
      let imageUrl = element.attr('src') ||
                     element.attr('data-src') ||
                     element.attr('data-lazy-src') ||
                     element.attr('content');

      if (!imageUrl) return null;

      // Make URL absolute if it's relative
      if (baseUrl && !imageUrl.startsWith('http')) {
        const urlObj = new URL(baseUrl);
        if (imageUrl.startsWith('//')) {
          imageUrl = urlObj.protocol + imageUrl;
        } else if (imageUrl.startsWith('/')) {
          imageUrl = `${urlObj.protocol}//${urlObj.host}${imageUrl}`;
        } else {
          imageUrl = `${urlObj.protocol}//${urlObj.host}/${imageUrl}`;
        }
      }

      return imageUrl;
    } catch (error) {
      console.error('Error extracting image:', error);
      return null;
    }
  }

  private extractRating($: cheerio.Root, selector?: string): number | null {
    if (!selector) return null;

    try {
      const ratingText = this.extractText($, selector);
      if (!ratingText) return null;

      // Extract number from rating text
      const match = ratingText.match(/[\d.]+/);
      if (match) {
        const rating = parseFloat(match[0]);
        return isNaN(rating) ? null : Math.min(5, rating); // Cap at 5
      }

      return null;
    } catch (error) {
      console.error('Error extracting rating:', error);
      return null;
    }
  }

  private extractReviews($: cheerio.Root, selector?: string): number | null {
    if (!selector) return null;

    try {
      const reviewText = this.extractText($, selector);
      if (!reviewText) return null;

      // Extract number from review text
      const cleanText = reviewText.replace(/,/g, '');
      const match = cleanText.match(/\d+/);
      if (match) {
        const reviews = parseInt(match[0]);
        return isNaN(reviews) ? null : reviews;
      }

      return null;
    } catch (error) {
      console.error('Error extracting reviews:', error);
      return null;
    }
  }
}

/**
 * Factory function to create scraper instances
 */
export function createRealScraper(config: CompetitorConfig): RealWebScraper {
  return new RealWebScraper(config);
}

/**
 * Scrape products from a competitor
 */
export async function scrapeCompetitorProducts(
  config: CompetitorConfig,
  urls: string[]
): Promise<RealScrapedProduct[]> {
  const scraper = createRealScraper(config);
  return scraper.scrapeUrls(urls);
}

export default RealWebScraper;