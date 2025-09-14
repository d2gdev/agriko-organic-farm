import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getAllProducts } from '@/lib/woocommerce';
import { WCProduct } from '@/types/woocommerce';

export async function GET() {
  try {
    // Resolve base URL from env with safe fallback
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://shop.agrikoph.com';
    const currentDate = new Date().toISOString();

    // Crawl all products in pages to include in sitemap
    const products: Array<WCProduct> = [];
    const perPage = 100;
    const maxPages = 10; // safety cap to prevent runaway requests
    for (let page = 1; page <= maxPages; page++) {
      const batch = await getAllProducts({ per_page: perPage, page, status: 'publish' }).catch(() => []);
      if (!batch || batch.length === 0) break;
      products.push(...batch);
      if (batch.length < perPage) break; // reached the last page
    }

    // Static pages
    const staticPages = [
      {
        url: `${baseUrl}/`,
        lastModified: currentDate,
        changeFrequency: 'weekly',
        priority: 1.0,
      },
      {
        url: `${baseUrl}/products`,
        lastModified: currentDate,
        changeFrequency: 'daily',
        priority: 0.9,
      },
      {
        url: `${baseUrl}/about`,
        lastModified: currentDate,
        changeFrequency: 'monthly',
        priority: 0.8,
      },
      {
        url: `${baseUrl}/contact`,
        lastModified: currentDate,
        changeFrequency: 'monthly',
        priority: 0.7,
      },
      {
        url: `${baseUrl}/find-us`,
        lastModified: currentDate,
        changeFrequency: 'monthly',
        priority: 0.6,
      },
    ];

    // Product pages
    const productPages = products
      .filter((p) => !!p?.slug)
      .map((product) => ({
        url: `${baseUrl}/product/${product.slug}`,
        lastModified: (product.date_modified || product.date_created || currentDate) as string,
        changeFrequency: 'weekly',
        priority: 0.8,
      }));

    const allPages = [...staticPages, ...productPages];

    // Generate XML sitemap
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${allPages
  .map(
    (page) => `  <url>
    <loc>${page.url}</loc>
    <lastmod>${(page.lastModified || currentDate).toString().split('T')[0]}</lastmod>
    <changefreq>${page.changeFrequency}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

    return new NextResponse(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    logger.error('Error generating sitemap', error as Record<string, unknown>, 'sitemap');
    
    // Return minimal sitemap on error
    const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://shop.agrikoph.com/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;

    return new NextResponse(fallbackSitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=300, s-maxage=300',
      },
    });
  }
}
