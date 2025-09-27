import { NextRequest, NextResponse } from 'next/server';
import { serverScraper } from '@/lib/scrapers/server-scraper';
import { validateScraperAuth, validateScrapingUrl, checkRateLimit } from '@/lib/scrapers/scraper-auth';
import { logger } from '@/lib/logger';
// Using Qdrant semantic database for competitor data
import db from '@/lib/database/competitor-qdrant';

// POST /api/scraper/scrape - Perform actual scraping
export async function POST(request: NextRequest) {
  try {
    // Validate authentication using cookies
    const authResult = await validateScraperAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check rate limiting
    if (!authResult.userId) {
      return NextResponse.json(
        { success: false, error: 'User ID not found for rate limiting' },
        { status: 400 }
      );
    }
    const rateLimitResult = checkRateLimit(authResult.userId);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { success: false, error: rateLimitResult.error },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { competitor, urls, action } = body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { success: false, error: 'URLs array is required' },
        { status: 400 }
      );
    }

    // Validate each URL
    const validUrls: string[] = [];
    for (const url of urls) {
      const validation = validateScrapingUrl(url);
      if (validation.valid) {
        validUrls.push(url);
      } else {
        logger.warn(`Rejected invalid URL: ${url} - ${validation.error}`);
      }
    }

    if (validUrls.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid URLs provided' },
        { status: 400 }
      );
    }

    // Limit URLs to prevent abuse
    const limitedUrls = validUrls.slice(0, 5);

    if (action === 'scrape_all') {
      // Scrape with all competitors
      const results = await serverScraper.scrapeAllCompetitors(limitedUrls);
      
      return NextResponse.json({
        success: true,
        results,
        summary: {
          totalCompetitors: results.length,
          totalProducts: results.reduce((sum, r) => sum + r.totalProducts, 0),
          totalSuccess: results.reduce((sum, r) => sum + r.successCount, 0),
          totalErrors: results.reduce((sum, r) => sum + r.errorCount, 0),
        },
      });
    }

    // Scrape with specific competitor
    if (!competitor) {
      return NextResponse.json(
        { success: false, error: 'Competitor key is required' },
        { status: 400 }
      );
    }

    const result = await serverScraper.scrapeWithCompetitor(competitor, limitedUrls);
    
    return NextResponse.json({
      success: result.success,
      result,
    });
  } catch (error) {
    console.error('Scraping error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// GET /api/scraper/scrape - Get recent scraping jobs
export async function GET(request: NextRequest) {
  try {
    // Validate authentication using cookies
    const authResult = await validateScraperAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Initialize DB if needed
    await db.initialize();

    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');

    if (action === 'jobs') {
      // Get recent jobs
      const jobs = await db.job.getRecent(20);
      return NextResponse.json({
        success: true,
        jobs,
      });
    }

    if (action === 'products') {
      // Get recent products
      const products = await db.product.getRecent(50);
      return NextResponse.json({
        success: true,
        products,
      });
    }

    // Default: return system status
    const competitors = await db.competitor.getAll();
    const recentJobs = await db.job.getRecent(5);
    
    return NextResponse.json({
      success: true,
      status: {
        competitors: {
          total: competitors.length,
          enabled: competitors.filter(c => c.enabled).length,
        },
        recentJobs: recentJobs.map(job => ({
          id: job.id,
          competitor: job.competitor?.name,
          status: job.status,
          products: job.successCount || 0,
          createdAt: job.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}