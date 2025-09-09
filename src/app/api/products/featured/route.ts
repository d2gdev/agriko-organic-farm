import { NextRequest, NextResponse } from 'next/server';

const WC_API_URL = process.env.NEXT_PUBLIC_WC_API_URL;
const WC_CONSUMER_KEY = process.env.WC_CONSUMER_KEY;
const WC_CONSUMER_SECRET = process.env.WC_CONSUMER_SECRET;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('per_page') || '8';

    if (!WC_API_URL || !WC_CONSUMER_KEY || !WC_CONSUMER_SECRET) {
      throw new Error('WooCommerce API credentials not configured');
    }

    const credentials = Buffer.from(`${WC_CONSUMER_KEY}:${WC_CONSUMER_SECRET}`).toString('base64');
    
    const url = `${WC_API_URL}/products?featured=true&per_page=${limit}&status=publish`;
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
        'Cache-Control': 'public, max-age=600, s-maxage=3600', // Cache for 10 minutes client, 1 hour CDN
      },
    });
  } catch (error) {
    console.error('Featured products API Error:', error);
    
    // Return empty array for build/static generation compatibility
    return NextResponse.json([], {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=60',
      },
    });
  }
}