import { Suspense } from 'react';
import Link from 'next/link';
import { getAllProductsWithPagination } from '@/lib/woocommerce';
import ProductsWithFilters from '@/components/ProductsWithFilters';
import HeroSection from '@/components/HeroSection';
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

// Enhanced Product categories with stronger contrast and icons
function CategoryCards() {
  const categories = [
    {
      name: 'Rice Varieties',
      description: 'Premium organic black, brown, red, and white rice varieties',
      icon: '🌾',
      href: '/products?category=rice',
      // Stronger contrast with deeper colors
      gradient: 'from-amber-100 to-orange-100',
      borderColor: 'border-amber-300',
      iconBg: 'bg-gradient-to-br from-amber-50 to-orange-50',
      hoverGradient: 'hover:from-amber-200 hover:to-orange-200',
      shadowColor: 'hover:shadow-amber-200/50',
    },
    {
      name: 'Herbal Powders',
      description: 'Pure, nutrient-dense superfoods with powerful health benefits',
      icon: '🌿',
      href: '/products?category=herbs',
      // Enhanced green tones
      gradient: 'from-green-100 to-emerald-100',
      borderColor: 'border-green-300',
      iconBg: 'bg-gradient-to-br from-green-50 to-emerald-50',
      hoverGradient: 'hover:from-green-200 hover:to-emerald-200',
      shadowColor: 'hover:shadow-green-200/50',
    },
    {
      name: 'Health Blends',
      description: 'Specially crafted blends and organic honey for complete wellness',
      icon: '🍶',
      href: '/products?category=blends',
      // Rich honey/golden tones
      gradient: 'from-yellow-100 to-amber-100',
      borderColor: 'border-yellow-300',
      iconBg: 'bg-gradient-to-br from-yellow-50 to-amber-50',
      hoverGradient: 'hover:from-yellow-200 hover:to-amber-200',
      shadowColor: 'hover:shadow-yellow-200/50',
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-white via-orange-50/20 to-yellow-50/20 border-t border-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-6">
            Shop by Category
          </h2>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed">
            Explore our three main product categories, each carefully cultivated and processed to deliver maximum nutrition and authentic flavors.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {categories.map((category) => (
            <Link
              key={category.name}
              href={category.href}
              className={`group relative bg-gradient-to-br ${category.gradient} ${category.hoverGradient} rounded-xl p-8 border-2 ${category.borderColor} shadow-lg hover:shadow-2xl ${category.shadowColor} transform hover:-translate-y-2 transition-all duration-300 overflow-hidden`}
            >
              {/* Enhanced accent circles */}
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-white opacity-30 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
              <div className="absolute -left-8 -bottom-8 w-24 h-24 bg-white opacity-20 rounded-full blur-xl group-hover:scale-125 transition-transform duration-700" />

              <div className="relative text-center">
                <div className={`inline-flex items-center justify-center w-24 h-24 ${category.iconBg} rounded-full mb-6 mx-auto group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
                  <span className="text-5xl">{category.icon}</span>
                </div>
                <h3 className="text-2xl font-bold text-neutral-900 mb-3 group-hover:text-green-700 transition-colors">
                  {category.name}
                </h3>
                <p className="text-neutral-600 mb-6 leading-relaxed">
                  {category.description}
                </p>
                <div className="inline-flex items-center text-green-700 font-semibold group-hover:gap-3 transition-all">
                  <span>Browse {category.name}</span>
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

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

    const result = await getAllProductsWithPagination({
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

      {/* Hero Section with Product-Centric Design */}
      <div className="relative bg-gradient-to-br from-[#f5f2ed] via-[#faf8f3] to-[#f0e9df] overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 text-8xl transform rotate-12">🌾</div>
          <div className="absolute bottom-20 left-20 text-8xl transform -rotate-12">🌿</div>
          <div className="absolute top-1/2 right-1/3 text-6xl">🍯</div>
        </div>
        <HeroSection
          title="Our Products"
          subtitle="From Our Family Farm to Your Table"
          description="Pure Organic Rice & Herbal Blends — Sustainably grown, carefully harvested, and lovingly packaged for your family's wellness."
          showButtons={false}
        />
      </div>

      {/* Category Cards */}
      <CategoryCards />

      {/* Trust Badges */}
      <TrustBadges />

      {/* Products with Filters */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
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

      {/* Softer Call to Action with Organic Feel */}
      <section className="py-20 bg-gradient-to-br from-[#f5e8dc] via-[#faf4ed] to-[#f0e9df] relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 text-8xl transform rotate-12">🌱</div>
          <div className="absolute bottom-10 right-10 text-8xl transform -rotate-12">👨‍🌾</div>
          <div className="absolute top-1/2 left-1/4 text-6xl">🌾</div>
        </div>

        <div className="max-w-4xl mx-auto text-center px-4 relative">
          {/* Warm illustration-like header */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/80 rounded-full mb-6 shadow-lg">
            <span className="text-4xl">💬</span>
          </div>

          <h2 className="text-3xl font-bold text-[#6b4423] mb-4">
            Need Help Choosing?
          </h2>
          <p className="text-xl text-[#8b6f47] mb-8 max-w-2xl mx-auto">
            Our family is here to help you find the perfect organic products for your wellness journey
          </p>

          {/* Softer button styling with warm colors */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="group inline-flex items-center justify-center px-8 py-4 bg-white text-[#8b6f47] rounded-full font-semibold hover:bg-[#faf8f5] transition-all duration-300 shadow-lg border-2 border-[#e8d5c4] hover:border-[#d4b896]"
            >
              <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Contact Our Team
            </Link>
            <Link
              href="/faq"
              className="group inline-flex items-center justify-center px-8 py-4 bg-[#a3b88c] text-white rounded-full font-semibold hover:bg-[#8fa775] transition-all duration-300 shadow-lg"
            >
              <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Common Questions
            </Link>
          </div>

          {/* Trust message */}
          <p className="mt-8 text-sm text-[#a08968]">
            ✨ Personal service from our family farm since 2015
          </p>
        </div>
      </section>
    </>
  );
}

export const revalidate = 3600; // Revalidate every hour