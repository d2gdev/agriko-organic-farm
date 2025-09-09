import { NextRequest, NextResponse } from 'next/server';

// Static export configuration  
export const dynamic = 'force-static';

const WC_API_URL = process.env.NEXT_PUBLIC_WC_API_URL;
const WC_CONSUMER_KEY = process.env.WC_CONSUMER_KEY;
const WC_CONSUMER_SECRET = process.env.WC_CONSUMER_SECRET;

export async function GET(request: NextRequest) {
  // For static export builds, return empty array
  if (process.env.NODE_ENV === 'production' && !WC_CONSUMER_KEY) {
    return NextResponse.json([]);
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = searchParams.get('limit') || '20';
    
    if (!query || query.trim().length < 2) {
      return NextResponse.json([]);
    }

    if (!WC_API_URL || !WC_CONSUMER_KEY || !WC_CONSUMER_SECRET) {
      return NextResponse.json([]);
    }

    const credentials = Buffer.from(`${WC_CONSUMER_KEY}:${WC_CONSUMER_SECRET}`).toString('base64');
    
    const url = `${WC_API_URL}/products?search=${encodeURIComponent(query)}&per_page=${limit}&status=publish`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`WooCommerce API error: ${response.status}`);
    }

    const products = await response.json();
    
    return NextResponse.json(products, {
      headers: {
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (error) {
    console.error('Product search API Error:', error);
    return NextResponse.json([]);
  }
}