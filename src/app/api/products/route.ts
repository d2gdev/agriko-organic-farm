import { NextRequest, NextResponse } from 'next/server';
import { getAllProducts } from '@/lib/woocommerce';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Extract query parameters
    const params = {
      per_page: searchParams.get('per_page') ? parseInt(searchParams.get('per_page') as string) : undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page') as string) : undefined,
      status: searchParams.get('status') || undefined,
      featured: searchParams.get('featured') === 'true' ? true : undefined,
      category: searchParams.get('category') || undefined,
      tag: searchParams.get('tag') || undefined,
      search: searchParams.get('search') || undefined,
      orderby: searchParams.get('orderby') || undefined,
      order: (searchParams.get('order') as 'asc' | 'desc') || undefined,
    };

    // Remove undefined values
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== undefined)
    );

    logger.info('📦 Products API called', { params: cleanParams });

    const products = await getAllProducts(cleanParams);

    // Ensure we're returning a valid JSON response
    if (!products || !Array.isArray(products)) {
      logger.warn('Products API returned invalid data format', { products: typeof products });
      return NextResponse.json([], {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      });
    }

    return NextResponse.json(products, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });

  } catch (error) {
    logger.error('❌ Products API error:', { error: error instanceof Error ? error.message : String(error) });

    return NextResponse.json(
      { error: 'Failed to fetch products', message: error instanceof Error ? error.message : 'Unknown error' },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}