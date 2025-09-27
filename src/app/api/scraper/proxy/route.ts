import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { validateScraperAuth, validateScrapingUrl, checkRateLimit } from '@/lib/scrapers/scraper-auth';
import { logger } from '@/lib/logger';

// Server-side proxy with security controls
export async function POST(request: NextRequest) {
  try {
    // Validate authentication
    const authResult = await validateScraperAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check rate limiting
    if (!authResult.userId) {
      return NextResponse.json(
        { error: 'User ID not found for rate limiting' },
        { status: 400 }
      );
    }
    const rateLimitResult = checkRateLimit(authResult.userId);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.error },
        { status: 429 }
      );
    }

    const { url, selectors, headers = {} } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL is allowed
    const urlValidation = validateScrapingUrl(url);
    if (!urlValidation.valid) {
      logger.warn(`Blocked scraping attempt for URL: ${url} by user: ${authResult.userId}`);
      return NextResponse.json(
        { error: urlValidation.error },
        { status: 403 }
      );
    }

    // Fetch the page server-side (no CORS issues)
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        ...headers,
      },
      timeout: 30000,
      maxRedirects: 5,
    });

    // Parse HTML with cheerio
    const $ = cheerio.load(response.data);

    // Extract data based on selectors
    const extractedData: Record<string, unknown> = {};

    if (selectors) {
      // Extract product name
      if (selectors.productName) {
        extractedData.title = $(selectors.productName).first().text().trim() || null;
      }

      // Extract price
      if (selectors.price) {
        const priceText = $(selectors.price).first().text().trim();
        const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
        extractedData.price = isNaN(price) ? null : price;
      }

      // Extract availability
      if (selectors.availability) {
        extractedData.availability = $(selectors.availability).first().text().trim() || null;
      }

      // Extract image URL
      if (selectors.imageUrl) {
        const img = $(selectors.imageUrl).first();
        extractedData.imageUrl = img.attr('src') || img.attr('data-src') || img.attr('data-lazy-src') || null;
        
        // Make URL absolute if relative
        if (extractedData.imageUrl && typeof extractedData.imageUrl === 'string' && !extractedData.imageUrl.startsWith('http')) {
          const urlObj = new URL(url);
          if (typeof extractedData.imageUrl === 'string' && extractedData.imageUrl.startsWith('//')) {
            extractedData.imageUrl = urlObj.protocol + extractedData.imageUrl;
          } else if (typeof extractedData.imageUrl === 'string' && extractedData.imageUrl.startsWith('/')) {
            extractedData.imageUrl = `${urlObj.protocol}//${urlObj.host}${extractedData.imageUrl}`;
          }
        }
      }

      // Extract description
      if (selectors.description) {
        extractedData.description = $(selectors.description).first().text().trim() || null;
      }

      // Extract rating
      if (selectors.rating) {
        const ratingText = $(selectors.rating).first().text().trim();
        const rating = parseFloat(ratingText.match(/[\d.]+/)?.[0] || '0');
        extractedData.rating = isNaN(rating) ? null : Math.min(5, rating);
      }

      // Extract review count
      if (selectors.reviews) {
        const reviewText = $(selectors.reviews).first().text().trim();
        const reviews = parseInt(reviewText.replace(/\D/g, ''));
        extractedData.reviewCount = isNaN(reviews) ? null : reviews;
      }

      // Extract SKU
      if (selectors.sku) {
        extractedData.sku = $(selectors.sku).first().text().trim() || null;
      }
    }

    // Also extract meta tags for additional data
    const metaData = {
      ogTitle: $('meta[property="og:title"]').attr('content'),
      ogDescription: $('meta[property="og:description"]').attr('content'),
      ogImage: $('meta[property="og:image"]').attr('content'),
      ogPrice: $('meta[property="product:price:amount"]').attr('content'),
      ogCurrency: $('meta[property="product:price:currency"]').attr('content'),
      ogAvailability: $('meta[property="product:availability"]').attr('content'),
    };

    // Extract JSON-LD structured data if available
    let structuredData = null;
    const jsonLdScript = $('script[type="application/ld+json"]').first().html();
    if (jsonLdScript) {
      try {
        structuredData = JSON.parse(jsonLdScript);
      } catch {
        // Ignore parsing errors
      }
    }

    return NextResponse.json({
      success: true,
      url,
      data: {
        ...extractedData,
        url,
        scrapedAt: new Date().toISOString(),
      },
      metaData,
      structuredData,
      statusCode: response.status,
    });
  } catch (error: unknown) {
    console.error('Proxy scraping error:', error);
    
    // Return detailed error information
    const err = error as any;
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Failed to fetch URL',
        code: err.code,
        statusCode: err.response?.status,
      },
      { status: err.response?.status || 500 }
    );
  }
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({
    message: 'Scraper proxy endpoint',
    usage: 'POST with { url, selectors, headers }',
    example: {
      url: 'https://example.com/product',
      selectors: {
        productName: 'h1.product-title',
        price: '.price',
        availability: '.stock-status',
      },
    },
  });
}