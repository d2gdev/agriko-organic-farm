import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { searchConsoleService } from '@/lib/search-console';

export const runtime = 'nodejs';

// Google Search Console API integration - now using real data
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const metric = searchParams.get('metric') || 'overview';
  const days = parseInt(searchParams.get('days') || '30');
  
  try {
    const useMock = searchParams.get('mock') === 'true';

    // Use mock data only if explicitly requested
    if (useMock) {
      return NextResponse.json({
        success: true,
        data: getMockSearchConsoleData(metric, days),
        source: 'mock_data_requested',
        timestamp: new Date().toISOString()
      });
    }

    // Get real Search Console data
    const searchConsoleData = await searchConsoleService.getSearchConsoleData(days);
    
    let responseData;
    
    switch (metric) {
      case 'queries':
        responseData = { topQueries: searchConsoleData.topQueries };
        break;
      case 'pages':
        responseData = { topPages: searchConsoleData.topPages };
        break;
      case 'seo-issues':
        responseData = { seoIssues: searchConsoleData.seoIssues };
        break;
      case 'overview':
      default:
        responseData = {
          overview: searchConsoleData.overview,
          topQueries: searchConsoleData.topQueries.slice(0, 3),
          topPages: searchConsoleData.topPages.slice(0, 3)
        };
    }

    return NextResponse.json({
      success: true,
      data: responseData,
      source: 'google_search_console',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Search Console API error:', error as Record<string, unknown>);

    // Return error state instead of mock data
    return NextResponse.json({
      success: false,
      error: 'Search Console API unavailable',
      message: 'Please configure Google Search Console API credentials',
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}

// Fallback mock data function
function getMockSearchConsoleData(metric: string, days: number) {
  const mockData = {
    overview: {
      totalClicks: Math.floor(Math.random() * 1000) + 500,
      totalImpressions: Math.floor(Math.random() * 10000) + 5000,
      avgCtr: Math.round((Math.random() * 5 + 2) * 100) / 100,
      avgPosition: Math.round((Math.random() * 10 + 5) * 10) / 10,
      period: `${days} days`,
      lastUpdated: new Date().toISOString()
    },
    topQueries: [
      { query: 'organic black rice philippines', clicks: 45, impressions: 892, ctr: 5.04, position: 3.2 },
      { query: 'turmeric powder organic', clicks: 38, impressions: 756, ctr: 5.03, position: 4.1 },
      { query: 'pure honey philippines', clicks: 32, impressions: 623, ctr: 5.14, position: 2.8 },
      { query: 'moringa powder benefits', clicks: 28, impressions: 542, ctr: 5.17, position: 3.5 },
      { query: 'organic rice varieties', clicks: 25, impressions: 487, ctr: 5.13, position: 4.2 }
    ],
    topPages: [
      { page: '/', clicks: 156, impressions: 3421, ctr: 4.56, position: 3.1 },
      { page: '/product/black-rice', clicks: 89, impressions: 1832, ctr: 4.86, position: 2.8 },
      { page: '/product/honey', clicks: 67, impressions: 1456, ctr: 4.60, position: 3.2 },
      { page: '/products', clicks: 54, impressions: 1234, ctr: 4.38, position: 3.8 },
      { page: '/product/5n1-turmeric-tea-blend-180g', clicks: 43, impressions: 987, ctr: 4.36, position: 4.1 }
    ],
    seoIssues: {
      indexedPages: 23,
      nonIndexedPages: 2,
      crawlErrors: 0,
      mobileUsability: 0,
      coreWebVitals: {
        good: 18,
        needsImprovement: 3,
        poor: 2
      }
    }
  };

  switch (metric) {
    case 'queries':
      return { topQueries: mockData.topQueries };
    case 'pages':
      return { topPages: mockData.topPages };
    case 'seo-issues':
      return { seoIssues: mockData.seoIssues };
    case 'overview':
    default:
      return {
        overview: mockData.overview,
        topQueries: mockData.topQueries.slice(0, 3),
        topPages: mockData.topPages.slice(0, 3)
      };
  }
}