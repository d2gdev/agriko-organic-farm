import { NextRequest, NextResponse } from 'next/server';
import { ScraperService, testScraper } from '@/lib/scrapers/scraper-service';

// Test endpoint for real scraper
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { competitor, url, action } = body;

    if (action === 'test_single') {
      // Test a single URL with a specific competitor
      if (!competitor || !url) {
        return NextResponse.json(
          { error: 'Both competitor and url are required' },
          { status: 400 }
        );
      }

      const result = await testScraper(competitor, url);
      return NextResponse.json(result);
    }

    if (action === 'test_service') {
      // Test the full scraper service
      const urls = body.urls || [url];
      if (!competitor || urls.length === 0) {
        return NextResponse.json(
          { error: 'Competitor and URLs are required' },
          { status: 400 }
        );
      }

      const service = new ScraperService(competitor, {
        useRealScraping: true,
        fallbackToMock: true,
        maxRetries: 2
      });

      const result = await service.scrapeProducts(urls);
      return NextResponse.json({
        success: true,
        result,
        summary: {
          totalProducts: result.products.length,
          successCount: result.successCount,
          errorCount: result.errorCount,
          usedRealScraping: result.successCount > 0
        }
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use test_single or test_service' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Test scraper error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Test failed',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// GET endpoint to test with sample URLs
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const competitor = searchParams.get('competitor') || 'whole_foods';
  
  // Test URLs for different competitors
  const testUrls: Record<string, string> = {
    whole_foods: 'https://www.wholefoodsmarket.com/product/lundberg-family-farms-organic-black-pearl-rice',
    natures_basket: 'https://www.naturesbasket.co.in/Products/Organic-Black-Rice',
    fresh_direct: 'https://www.freshdirect.com/pdp.jsp?productId=orgveg_rice_black',
    walmart: 'https://www.walmart.com/ip/Lundberg-Black-Pearl-Rice-Organic/123456',
    amazon_fresh: 'https://www.amazon.com/dp/B001234567',
    kroger: 'https://www.kroger.com/p/item/0001111041700',
    safeway: 'https://www.safeway.com/shop/product-details.960123456.html',
    instacart: 'https://www.instacart.com/products/123456-organic-black-rice'
  };

  const testUrl = testUrls[competitor as keyof typeof testUrls] || testUrls.whole_foods;

  try {
    const result = await testScraper(competitor!, testUrl!);
    
    return NextResponse.json({
      test: 'GET request test',
      competitor,
      url: testUrl,
      result
    });
  } catch (error) {
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Test failed',
        competitor,
        url: testUrl
      },
      { status: 500 }
    );
  }
}