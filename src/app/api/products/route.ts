import { NextRequest, NextResponse } from 'next/server';

const WC_API_URL = process.env.NEXT_PUBLIC_WC_API_URL;
const WC_CONSUMER_KEY = process.env.WC_CONSUMER_KEY;
const WC_CONSUMER_SECRET = process.env.WC_CONSUMER_SECRET;

// Helper function to create WooCommerce request
async function wcRequest(endpoint: string, options: RequestInit = {}) {
  if (!WC_API_URL || !WC_CONSUMER_KEY || !WC_CONSUMER_SECRET) {
    throw new Error('WooCommerce API credentials not configured');
  }

  const credentials = Buffer.from(`${WC_CONSUMER_KEY}:${WC_CONSUMER_SECRET}`).toString('base64');
  
  const url = `${WC_API_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`WooCommerce API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Build query string from search params
    const queryString = searchParams.toString();
    const endpoint = `/products${queryString ? `?${queryString}` : ''}`;
    
    const products = await wcRequest(endpoint);
    
    return NextResponse.json(products, {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=3600', // Cache for 5 minutes client, 1 hour CDN
      },
    });
  } catch (error) {
    console.error('Products API Error:', error);
    
    // Return empty array for build/static generation compatibility
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json([], {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=60', // Short cache on errors
        },
      });
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch products' },
      { status: 500 }
    );
  }
}