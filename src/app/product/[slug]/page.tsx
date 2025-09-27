import { notFound } from 'next/navigation';
import { logger } from '@/lib/logger';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import {
  getProductBySlug,
  getStaticProductSlugs,
  formatPrice,
  stripHtml
} from '@/lib/woocommerce';
import { isProductInStock } from '@/lib/utils';
import { createSafeHtml } from '@/lib/sanitize';
import { WCProduct } from '@/types/woocommerce';
import AddToCartButton from './AddToCartButton';
import ProductGallery from './ProductGallery';
import Link from 'next/link';
import Breadcrumb from '@/components/Breadcrumb';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { URL_CONSTANTS, urlHelpers } from '@/lib/url-constants';

// Dynamically import heavy components to reduce initial bundle size
const RelatedProducts = dynamic(() => import('./RelatedProducts'), {
  loading: () => <div className="h-96 bg-gray-100 animate-pulse rounded-lg"></div>
});

const ProductAnalytics = dynamic(() => import('@/components/ProductAnalytics'), {
  loading: () => null
});

const ProductReviews = dynamic(() => import('./ProductReviews'), {
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
});

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Generate static params for ISR
export async function generateStaticParams() {
  try {
    const slugs = await getStaticProductSlugs();
    
    // If no slugs (API unavailable during build), provide fallback slugs
    if (slugs.length === 0) {
      logger.warn('No product slugs available, using fallback slugs for static export');
      return [
        { slug: 'honey' },
        { slug: 'black-rice' },
        { slug: '5n1-turmeric-tea-blend-180g' },
        { slug: 'placeholder-product' }
      ];
    }
    
    return slugs.map((slug) => ({
      slug: slug,
    }));
  } catch (error) {
    logger.error('Error generating static params:', error as Record<string, unknown>);
    // Provide fallback slugs to prevent build failure
    return [
      { slug: 'honey' },
      { slug: 'black-rice' },
      { slug: '5n1-turmeric-tea-blend-180g' },
      { slug: 'placeholder-product' }
    ];
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params;
  try {
    const product = await getProductBySlug(slug);
    
    if (!product) {
      return {
        title: 'Product Not Found - Agriko',
        description: 'The requested product could not be found.',
      };
    }

    const cleanDescription = product.short_description 
      ? stripHtml(product.short_description) 
      : product.description 
        ? stripHtml(product.description).substring(0, 160) 
        : `${product.name} - Quality agricultural product from Agriko`;

    return {
      title: `${product.name} - Agriko`,
      description: cleanDescription,
      keywords: `${product.name}, agriculture, farming, ${product.categories?.map(cat => cat.name).join(', ')}`,
      openGraph: {
        title: product.name,
        description: cleanDescription,
        images: product.images?.map(img => ({
          url: img.src,
          width: 800,
          height: 800,
          alt: img.alt || product.name,
        })) || [],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: product.name,
        description: cleanDescription,
        images: product.images?.[0]?.src ? [product.images[0].src] : [],
      },
      alternates: {
        canonical: `/product/${product.slug}`,
      },
    };
  } catch (error) {
    logger.error('Error generating metadata:', error as Record<string, unknown>);
    return {
      title: 'Product - Agriko',
      description: 'Quality agricultural products from Agriko',
    };
  }
}

function ProductSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Image skeleton */}
        <div className="space-y-4">
          <div className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-square bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </div>
        
        {/* Content skeleton */}
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 rounded animate-pulse" />
          <div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
          </div>
          <div className="h-12 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}

async function ProductContent({ slug }: { slug: string }) {
  let product: WCProduct | null = null;
  
  try {
    product = await getProductBySlug(slug);
  } catch (error) {
    logger.error('Failed to fetch product:', error as Record<string, unknown>);
    
    // Return an error page instead of throwing
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Unable to Load Product
          </h1>
          <p className="text-gray-600 mb-6">
            We&apos;re experiencing technical difficulties. Please try again in a few moments.
          </p>
          <Link 
            href="/" 
            className="bg-primary-600 text-white px-6 py-3 rounded-md hover:bg-primary-700 transition-colors inline-block"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  if (!product) {
    notFound();
  }

  const inStock = isProductInStock(product);

  // Enhanced JSON-LD structured data for SEO
  const jsonLd = {
    '@context': URL_CONSTANTS.SCHEMA.BASE,
    '@type': 'Product',
    name: product.name,
    image: product.images?.map(img => img.src) || [],
    description: stripHtml(product.description || product.short_description || ''),
    sku: product.sku,
    gtin: product.sku,
    mpn: product.sku,
    brand: {
      '@type': 'Brand',
      name: 'Agriko Organic Farm',
      url: urlHelpers.getShopUrl(),
      logo: `${urlHelpers.getShopUrl()}/images/Agriko-Logo.png`
    },
    manufacturer: {
      '@type': 'Organization',
      name: 'Agriko Multi-Trade & Enterprise Corp.',
      url: urlHelpers.getShopUrl()
    },
    category: product.categories?.[0]?.name || 'Organic Products',
    keywords: product.tags?.map(tag => tag.name).join(', ') || '',
    offers: {
      '@type': 'Offer',
      priceCurrency: 'PHP',
      price: product.price,
      priceValidUntil: '2024-04-15', // Static date to prevent hydration mismatch
      availability: inStock ? `${URL_CONSTANTS.SCHEMA.BASE}/InStock` : `${URL_CONSTANTS.SCHEMA.BASE}/OutOfStock`,
      itemCondition: `${URL_CONSTANTS.SCHEMA.BASE}/NewCondition`,
      url: `${urlHelpers.getShopUrl()}/product/${product.slug}`,
      seller: {
        '@type': 'Organization',
        name: 'Agriko Organic Farm',
        url: urlHelpers.getShopUrl()
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: '0',
          currency: 'PHP'
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 1,
            maxValue: 2,
            unitCode: 'DAY'
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 3,
            maxValue: 7,
            unitCode: 'DAY'
          }
        }
      },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'PH',
        returnPolicyCategory: `${URL_CONSTANTS.SCHEMA.BASE}/MerchantReturnFiniteReturnWindow`,
        merchantReturnDays: 30,
        returnMethod: `${URL_CONSTANTS.SCHEMA.BASE}/ReturnByMail`,
        returnFees: `${URL_CONSTANTS.SCHEMA.BASE}/FreeReturn`
      }
    },
    aggregateRating: product.average_rating && String(product.average_rating) !== '0' ? {
      '@type': 'AggregateRating',
      ratingValue: String(product.average_rating),
      reviewCount: product.rating_count || 0,
      bestRating: '5',
      worstRating: '1'
    } : undefined,
    additionalProperty: product.tags?.map(tag => ({
      '@type': 'PropertyValue',
      name: 'Product Tag',
      value: tag.name
    })) || [],
    isRelatedTo: product.categories?.map(category => ({
      '@type': 'Thing',
      name: category.name,
      url: `${urlHelpers.getShopUrl()}/category/${category.slug}`
    })) || [],
    potentialAction: {
      '@type': 'BuyAction',
      target: `${urlHelpers.getShopUrl()}/product/${product.slug}`,
      object: {
        '@type': 'Product',
        name: product.name
      }
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* Track product view analytics */}
      <ProductAnalytics product={product} />
      
      {/* Breadcrumbs */}
      <Breadcrumb 
        items={[
          { name: 'Products', href: '/' },
          ...(product.categories && product.categories.length > 0 && product.categories[0]
            ? [{ name: product.categories[0].name }] 
            : []
          ),
          { name: product.name }
        ]}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero-style product banner */}
        <div className="relative mb-12 rounded-3xl overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-amber-50 p-8 shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-200/30 to-amber-200/30 rounded-full transform translate-x-16 -translate-y-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-red-200/20 to-orange-200/20 rounded-full transform -translate-x-12 translate-y-12"></div>
          <div className="relative z-10">
            <span className="inline-block bg-red-100 text-red-800 text-sm font-bold px-4 py-2 rounded-full mb-4">
              ✨ Premium Organic Product
            </span>
            <h1 className="text-heading-1 text-gray-900 mb-4 font-[family-name:var(--font-crimson)]">
              {product.name}
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div>
            <ProductGallery product={product} />
          </div>

          {/* Product Information */}
          <div className="space-y-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              {product.sku && (
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <p className="text-sm text-gray-600 font-medium">
                    Product ID: {product.sku}
                  </p>
                </div>
              )}

              {/* Price */}
              <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-6 mb-6 border border-red-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {product.on_sale && product.regular_price !== product.price ? (
                      <>
                        <div className="text-right">
                          <div className="text-4xl font-bold text-red-600 font-[family-name:var(--font-crimson)]">
                            {formatPrice((product.price || 0) as number)}
                          </div>
                          <div className="text-lg text-gray-500 line-through">
                            {formatPrice((product.regular_price || product.price) as number)}
                          </div>
                        </div>
                        <div className="bg-red-600 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg animate-pulse">
                          🎉 On Sale!
                        </div>
                      </>
                    ) : (
                      <div className="text-4xl font-bold text-red-600 font-[family-name:var(--font-crimson)]">
                        {formatPrice((product.price || 0) as number)}
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    📦 Free shipping on orders over ₱1,500
                  </div>
                </div>
              </div>

              {/* Stock Status */}
              <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4 mb-6">
                {inStock ? (
                  <div className="flex items-center text-green-600">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold">In Stock & Ready to Ship</div>
                      <div className="text-sm text-gray-600">Usually ships within 1-2 business days</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center text-red-600">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold">Currently Out of Stock</div>
                      <div className="text-sm text-gray-600">Notify me when available</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Short Description */}
            {product.short_description && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                <h3 className="text-lg font-bold text-gray-900 mb-3 font-[family-name:var(--font-crimson)]">Why You&apos;ll Love This Product</h3>
                <div
                  className="prose prose-sm text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={createSafeHtml(product.short_description, 'default')}
                />
              </div>
            )}

            {/* Add to Cart */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900 mb-2 font-[family-name:var(--font-crimson)]">Ready to Order?</h3>
                <p className="text-sm text-gray-600">Join thousands of satisfied customers who trust Agriko for premium organic products.</p>
              </div>
              <AddToCartButton product={product} />
              <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                <div className="text-sm">
                  <div className="text-green-600 font-semibold">🌱 100% Organic</div>
                </div>
                <div className="text-sm">
                  <div className="text-blue-600 font-semibold">🛡️ Quality Guaranteed</div>
                </div>
                <div className="text-sm">
                  <div className="text-purple-600 font-semibold">📦 Fast Shipping</div>
                </div>
              </div>
            </div>

            {/* Product Categories */}
            {product.categories && product.categories.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4 font-[family-name:var(--font-crimson)]">Product Categories</h3>
                <div className="flex flex-wrap gap-3">
                  {product.categories.map((category) => (
                    <span
                      key={category.id}
                      className="inline-flex items-center bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 text-sm font-medium px-4 py-2 rounded-full border border-green-200 hover:from-green-200 hover:to-emerald-200 transition-all duration-200"
                    >
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      {category.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Product Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4 font-[family-name:var(--font-crimson)]">Product Benefits & Features</h3>
                <div className="flex flex-wrap gap-3">
                  {product.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="inline-flex items-center bg-gradient-to-r from-red-100 to-orange-100 text-red-800 text-sm font-medium px-4 py-2 rounded-full border border-red-200 hover:from-red-200 hover:to-orange-200 transition-all duration-200"
                    >
                      <span className="text-red-500 mr-1">#</span>
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Product Description */}
        {product.description && (
          <div className="mt-16">
            <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 rounded-3xl p-8 shadow-lg border border-orange-100">
              <div className="text-center mb-8">
                <h2 className="text-4xl font-bold text-gray-900 mb-4 font-[family-name:var(--font-crimson)]">Product Details</h2>
                <p className="text-gray-600 max-w-2xl mx-auto">Discover everything you need to know about this premium organic product, from its benefits to how it&apos;s made.</p>
              </div>
              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <div
                  className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={createSafeHtml(product.description, 'default')}
                />
              </div>
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <div className="mt-16">
          <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-3xl p-8 shadow-lg border border-blue-100">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-gray-900 mb-4 font-[family-name:var(--font-crimson)]">Customer Reviews</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">See what our customers have to say about this product. Real reviews from real people who trust Agriko.</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <Suspense fallback={<div className="h-64 bg-gradient-to-r from-gray-100 to-gray-200 animate-pulse" />}>
                <ProductReviews productId={product.id} productName={product.name} />
              </Suspense>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {product.categories && product.categories.length > 0 && product.categories[0] && (
          <div className="mt-16">
            <div className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 rounded-3xl p-8 shadow-lg border border-emerald-100">
              <div className="text-center mb-8">
                <h2 className="text-4xl font-bold text-gray-900 mb-4 font-[family-name:var(--font-crimson)]">You Might Also Like</h2>
                <p className="text-gray-600 max-w-2xl mx-auto">Discover more premium organic products from the same category. Handpicked for quality and taste.</p>
              </div>
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <Suspense fallback={<div className="h-64 bg-gradient-to-r from-gray-100 to-gray-200 animate-pulse" />}>
                  <RelatedProducts
                    categoryId={product.categories[0].id}
                    currentProductId={product.id}
                  />
                </Suspense>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  return (
    <ErrorBoundary>
      <Suspense fallback={<ProductSkeleton />}>
        <ProductContent slug={slug} />
      </Suspense>
    </ErrorBoundary>
  );
}

// Enable ISR with 1 hour revalidation
export const revalidate = 3600;