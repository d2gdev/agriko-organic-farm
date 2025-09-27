/**
 * Client-Side Scraper Service
 * Calls the server API to perform actual scraping
 */

import { ScrapingResult } from '@/types/scraping';
// Unused imports: ScrapedProduct, ScrapingSystemStatus

export class ClientScraperService {
  constructor() {
    // Uses httpOnly cookies for authentication
  }

  /**
   * Scrape URLs with a specific competitor
   */
  async scrapeCompetitor(
    competitorKey: string,
    urls: string[]
  ): Promise<ScrapingResult> {
    try {
      const response = await fetch('/api/scraper/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({
          competitor: competitorKey,
          urls,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to scrape');
      }

      return data.result;
    } catch (error) {
      console.error('Scraping error:', error);
      throw error;
    }
  }

  /**
   * Scrape URLs with all competitors
   */
  async scrapeAllCompetitors(urls: string[]): Promise<ScrapingResult[]> {
    try {
      const response = await fetch('/api/scraper/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'scrape_all',
          urls,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to scrape');
      }

      return data.results;
    } catch (error) {
      console.error('Scraping error:', error);
      throw error;
    }
  }

  /**
   * Get recent scraping jobs
   */
  async getRecentJobs() {
    try {
      // Check if user is authenticated first
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

      if (!token) {
        // Return empty array when not authenticated
        return [];
      }

      const response = await fetch('/api/scraper/scrape?action=jobs', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      // If endpoint doesn't exist or unauthorized, return empty array
      if (response.status === 404 || response.status === 401) {
        return [];
      }

      const data = await response.json();

      if (!response.ok) {
        console.warn('Failed to fetch jobs:', data.error || 'Unknown error');
        return [];
      }

      return data.jobs || [];
    } catch (error) {
      console.warn('Error fetching jobs:', error);
      // Return empty array on error instead of throwing
      return [];
    }
  }

  /**
   * Get recent scraped products
   */
  async getRecentProducts() {
    try {
      // Check if user is authenticated first
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

      if (!token) {
        // Return empty array when not authenticated
        return [];
      }

      const response = await fetch('/api/scraper/scrape?action=products', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      // If endpoint doesn't exist or unauthorized, return empty array
      if (response.status === 404 || response.status === 401) {
        return [];
      }

      const data = await response.json();

      if (!response.ok) {
        console.warn('Failed to fetch products:', data.error || 'Unknown error');
        return [];
      }

      return data.products || [];
    } catch (error) {
      console.warn('Error fetching products:', error);
      // Return empty array on error instead of throwing
      return [];
    }
  }

  /**
   * Get system status
   */
  async getStatus() {
    try {
      // Check if user is authenticated first
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

      if (!token) {
        // Return default status when not authenticated
        return {
          authenticated: false,
          message: 'Not authenticated'
        };
      }

      const response = await fetch('/api/scraper/scrape', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      // If endpoint doesn't exist or unauthorized, return default status
      if (response.status === 404 || response.status === 401) {
        return {
          authenticated: false,
          message: 'Scraper API not available'
        };
      }

      const data = await response.json();

      if (!response.ok) {
        console.warn('Scraper status check failed:', data.error || 'Unknown error');
        return {
          authenticated: true,
          message: 'Status unavailable'
        };
      }

      return data.status;
    } catch (error) {
      console.warn('Error fetching scraper status:', error);
      // Return default status on error instead of throwing
      return {
        authenticated: false,
        message: 'Status check failed'
      };
    }
  }

  /**
   * Test proxy endpoint with a single URL
   */
  async testProxy(url: string, selectors?: Record<string, string>) {
    try {
      const response = await fetch('/api/scraper/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          selectors,
        }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Proxy test error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const clientScraper = new ClientScraperService();

export default clientScraper;