import { NextRequest, NextResponse } from 'next/server';

const WC_API_URL = process.env.NEXT_PUBLIC_WC_API_URL;
const WC_CONSUMER_KEY = process.env.WC_CONSUMER_KEY;
const WC_CONSUMER_SECRET = process.env.WC_CONSUMER_SECRET;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = searchParams.get('limit') || '20';
    
    if (!query || query.trim().length < 2) {
      return NextResponse.json([]);
    }

    if (!WC_API_URL || !WC_CONSUMER_KEY || !WC_CONSUMER_SECRET) {
      throw new Error('WooCommerce API credentials not configured');
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
        'Cache-Control': 'public, max-age=300', // Cache search results for 5 minutes
      },
    });
  } catch (error) {
    console.error('Product search API Error:', error);
    
    return NextResponse.json(
      { error: 'Failed to search products' },
      { status: 500 }
    );
  }
}