import { Suspense } from 'react';
import Link from 'next/link';
import { getAllProductsWithPaginationForClient } from '@/lib/woocommerce';
import ProductsWithFilters from '@/components/ProductsWithFilters';
import HeroSection from '@/components/HeroSection';
import CategoryCards from '@/components/CategoryCards';
import { logger } from '@/lib/logger';
import { urlHelpers } from '@/lib/url-constants';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ProductGridSkeleton } from '@/components/LoadingStates';
import Breadcrumb from '@/components/Breadcrumb';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Products - Agriko Organic Farm',
  description: 'Browse our premium organic rice varieties, herbal powders, and health blends. Sustainably grown and carefully processed for maximum nutrition.',
  keywords: 'organic rice, herbal powders, health blends, organic products philippines, agriko products',
  openGraph: {
    title: 'Organic Products - Agriko Farm',
    description: 'Discover our range of premium organic products from our family farm',
    type: 'website',
    url: `${urlHelpers.getShopUrl()}/products`,
    images: [
      {
        url: '/images/og-products.jpg',
        width: 1200,
        height: 630,
        alt: 'Agriko Organic Products',
      },
    ],
  },
  other: {
    'structured-data': JSON.stringify({
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": "Organic Products - Agriko Farm",
      "description": "Browse our premium organic rice varieties, herbal powders, and health blends. Sustainably grown and carefully processed for maximum nutrition.",
      "url": `${urlHelpers.getShopUrl()}/products`,
      "mainEntity": {
        "@type": "ItemList",
        "name": "Agriko Organic Products",
        "description": "Premium organic rice varieties, herbal powders, and health blends from our family farm"
      },
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": urlHelpers.getShopUrl()
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Products",
            "item": `${urlHelpers.getShopUrl()}/products`
          }
        ]
      },
      "provider": {
        "@type": "Organization",
        "name": "Agriko Organic Farm",
        "url": urlHelpers.getShopUrl(),
        "description": "Family-owned organic farm specializing in premium rice varieties and herbal products"
      }
    })
  }
};


// Trust badges section
function TrustBadges() {
  const badges = [
    { icon: '🌱', title: '100% Organic', description: 'Certified organic farming' },
    { icon: '👨‍🌾', title: 'Family Farm', description: 'Locally grown with care' },
    { icon: '🌿', title: 'Sustainable', description: 'Eco-friendly practices' },
    { icon: '✨', title: 'Premium Quality', description: 'Hand-selected products' },
  ];

  return (
    <section className="py-12 bg-white border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {badges.map((badge) => (
            <div key={badge.title} className="text-center">
              <div className="text-4xl mb-2">{badge.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-1">{badge.title}</h3>
              <p className="text-sm text-gray-600">{badge.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Products content component with server-side pagination
async function ProductsContent({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  try {
    const page = Math.max(1, Math.min(1000, parseInt(searchParams.page || '1', 10))); // Bounds: 1-1000
    const perPage = 12;
    const category = searchParams.category;
    const sortBy = searchParams.sortBy;
    const search = searchParams.search;
    const minPrice = searchParams.minPrice;
    const maxPrice = searchParams.maxPrice;

    // Determine sort parameters
    let orderby = 'menu_order';
    let order: 'asc' | 'desc' = 'asc';

    switch (sortBy) {
      case 'name':
        orderby = 'title';
        order = 'asc';
        break;
      case 'price_low':
        orderby = 'price';
        order = 'asc';
        break;
      case 'price_high':
        orderby = 'price';
        order = 'desc';
        break;
      case 'newest':
        orderby = 'date';
        order = 'desc';
        break;
      case 'popularity':
        orderby = 'popularity';
        order = 'desc';
        break;
    }

    const result = await getAllProductsWithPaginationForClient({
      per_page: perPage,
      page: page,
      orderby,
      order,
      status: 'publish',
      ...(category && { category }),
      ...(search && { search }),
      ...(minPrice && { min_price: minPrice }),
      ...(maxPrice && { max_price: maxPrice })
    });

    // Debug logging to verify serialization
    if (result.products.length > 0) {
      const firstProduct = result.products[0];
      if (firstProduct) {
        console.log('First product price type:', typeof firstProduct.price, firstProduct.price);
        console.log('First product regular_price type:', typeof firstProduct.regular_price, firstProduct.regular_price);
        console.log('Has toJSON method:', firstProduct.price && typeof firstProduct.price === 'object' && 'toJSON' in firstProduct.price);
      }
    }

    if (!result.products || result.products.length === 0) {
      return (
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414a1 1 0 00-.707-.293H4" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
        </div>
      );
    }

    return (
      <ProductsWithFilters
        products={result.products}
        searchParams={searchParams}
        totalProducts={result.total}
        totalPages={result.totalPages}
        currentPage={page}
      />
    );
  } catch (error) {
    logger.error('Error loading products:', error as Record<string, unknown>);
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Unable to load products</h3>
          <p className="text-red-600">Please try refreshing the page or check back later.</p>
        </div>
      </div>
    );
  }
}

export default async function ProductsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const resolvedSearchParams = await searchParams;
  return (
    <>
      {/* Breadcrumb Navigation */}
      <Breadcrumb items={[{ name: 'Products' }]} />

      <HeroSection
        title="Our Products"
        subtitle="From Our Family Farm to Your Table"
        description="Pure Organic Rice & Herbal Blends — Sustainably grown, carefully harvested, and lovingly packaged for your family's wellness."
        secondaryButtonText="Our Story"
        secondaryButtonHref="/about"
        videoSrc="/videos/Hero-Shop.mp4"
      />

      {/* Category Cards */}
      <CategoryCards />

      {/* Trust Badges */}
      <TrustBadges />

      {/* Products with Filters */}
      <section id="all-products" className="py-40 lg:py-48 bg-gradient-to-br from-neutral-50 via-white to-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-24">
            <h2 className="text-5xl lg:text-6xl font-bold text-neutral-900 mb-8 font-[family-name:var(--font-crimson)]">
              All Products
            </h2>
            <p className="text-lg text-gray-600">
              Browse our complete collection of organic products
            </p>
          </div>

          <ErrorBoundary fallback={
            <div className="text-center py-12">
              <div className="text-red-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 6.5c-.77.833-.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to load products</h3>
              <p className="text-gray-600">There was an error loading our product catalog. Please try refreshing the page.</p>
            </div>
          }>
            <Suspense fallback={<ProductGridSkeleton count={12} />}>
              <ProductsContent searchParams={resolvedSearchParams} />
            </Suspense>
          </ErrorBoundary>
        </div>
      </section>

      {/* Enhanced Need Help Section Matching Homepage CTA Style */}
      <section className="py-24 lg:py-32 relative overflow-hidden">
        {/* Gradient background matching homepage CTA */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-yellow-50/30 to-green-50/20"></div>

        {/* Decorative Elements with animation */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 text-8xl transform rotate-12 animate-pulse">📞</div>
          <div className="absolute bottom-10 right-10 text-8xl transform -rotate-12 animate-pulse" style={{ animationDelay: '1s' }}>💬</div>
          <div className="absolute top-1/2 left-1/4 text-6xl animate-pulse" style={{ animationDelay: '2s' }}>✉️</div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center px-4">
          {/* Badge */}
          <div className="inline-flex items-center bg-green-100 rounded-full px-4 py-2 mb-8">
            <span className="text-green-600 font-semibold">🌟 Personal Support</span>
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-neutral-900 mb-6">
            Need Help Choosing?
          </h2>
          <p className="text-xl md:text-2xl text-neutral-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            Our family is here to help you find the perfect organic products for your wellness journey
          </p>

          {/* Enhanced Buttons Matching Homepage Style */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="group inline-flex items-center justify-center bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-4 px-10 rounded-full transition-all duration-300 transform hover:scale-105 shadow-xl text-lg"
            >
              <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Contact Our Team
            </Link>
            <Link
              href="/faq"
              className="group inline-flex items-center justify-center bg-transparent hover:bg-green-50 text-green-700 font-bold py-4 px-10 rounded-full transition-all duration-300 border-2 border-green-600 hover:shadow-xl text-lg"
            >
              <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Common Questions
            </Link>
          </div>

          {/* Trust message */}
          <p className="mt-8 text-sm text-neutral-600">
            ✨ Personal service from our family farm since 2016
          </p>
        </div>
      </section>
    </>
  );
}

export const revalidate = 3600; // Revalidate every hour