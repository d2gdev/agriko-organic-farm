import { createApiHandler, successResponse, errorResponse, AuthenticatedRequest } from '@/lib/api/middleware';
import {
  createCompetitorScraper,
  getAvailableCompetitors,
  scrapeAllCompetitors
} from '@/lib/scrapers/competitor-scraper';
import { ScrapingResult } from '@/types/scraping';
import { z } from 'zod';

const scrapeRequestSchema = z.object({
  competitor: z.string().optional(),
  urls: z.array(z.string().url()).min(1).max(10), // Limit to 10 URLs per request
  action: z.enum(['scrape', 'list_competitors']).default('scrape')
});

// POST /api/scrapers/competitors - Scrape competitor product data
export const POST = createApiHandler(
  async (request: AuthenticatedRequest) => {
    try {
      const body = await request.json();
      const { competitor, urls, action } = scrapeRequestSchema.parse(body);

      // Handle list competitors action
      if (action === 'list_competitors') {
        const competitors = getAvailableCompetitors();
        return successResponse({
          competitors,
          total: competitors.length
        });
      }

      // Handle scraping action
      if (!urls || urls.length === 0) {
        return errorResponse('URLs are required for scraping', 400);
      }

      let results: ScrapingResult[];

      if (competitor) {
        // Scrape specific competitor
        try {
          const scraper = createCompetitorScraper(competitor);
          const result = await scraper.scrapeProducts(urls);
          results = [result];
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          return errorResponse(`Invalid competitor: ${errorMessage}`, 400);
        }
      } else {
        // Scrape all competitors
        results = await scrapeAllCompetitors(urls);
      }

      // Calculate summary statistics
      const summary = {
        totalCompetitors: results.length,
        successfulScrapers: results.filter(r => r.success).length,
        totalProducts: results.reduce((sum, r) => sum + (r.productsFound || r.totalProducts || 0), 0),
        errors: results.filter(r => !r.success).map(r => ({
          competitor: r.competitorName,
          error: r.error || 'Unknown error'
        }))
      };

      return successResponse({
        results,
        summary,
        scrapedAt: new Date().toISOString(),
        requestedUrls: urls
      });

    } catch (error) {
      console.error('Competitor scraping error:', error);

      if (error instanceof z.ZodError) {
        return errorResponse(`Validation error: ${error.errors.map(e => e.message).join(', ')}`, 400);
      }

      return errorResponse('Failed to scrape competitor data', 500);
    }
  },
  {
    requireAuth: true,
    allowedRoles: ['admin', 'analyst'],
    rateLimit: { maxRequests: 10, windowMs: 300000 }, // 10 requests per 5 minutes (scraping is resource intensive)
  }
);

// GET /api/scrapers/competitors - Get available competitors
export const GET = createApiHandler(
  async (_request: AuthenticatedRequest) => {
    try {
      const competitors = getAvailableCompetitors();

      return successResponse({
        competitors,
        total: competitors.length,
        message: 'Available competitors for scraping'
      });

    } catch (error) {
      console.error('Error fetching competitors:', error);
      return errorResponse('Failed to fetch available competitors', 500);
    }
  },
  {
    requireAuth: true,
    allowedRoles: ['admin', 'analyst'],
    rateLimit: { maxRequests: 60, windowMs: 60000 }, // 60 requests per minute
  }
);