import { notFound } from 'next/navigation';
import { logger } from '@/lib/logger';

import Image from 'next/image';
import { Suspense } from 'react';
import { 
  getProductBySlug, 
  getStaticProductSlugs, 
  formatPrice, 
  getProductMainImage, 
  isProductInStock,
  stripHtml 
} from '@/lib/woocommerce';
import { createSafeHtml, sanitizeHtml } from '@/lib/sanitize';
import { WCProduct } from '@/types/woocommerce';
import AddToCartButton from './AddToCartButton';
import ProductGallery from './ProductGallery';
import RelatedProducts from './RelatedProducts';
import Link from 'next/link';
import Breadcrumb from '@/components/Breadcrumb';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import ProductAnalytics from '@/components/ProductAnalytics';
import ProductReviews from './ProductReviews';

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
    '@context': 'https://schema.org/',
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
      url: 'https://shop.agrikoph.com',
      logo: 'https://shop.agrikoph.com/images/Agriko-Logo.png'
    },
    manufacturer: {
      '@type': 'Organization',
      name: 'Agriko Multi-Trade & Enterprise Corp.',
      url: 'https://shop.agrikoph.com'
    },
    category: product.categories?.[0]?.name || 'Organic Products',
    keywords: product.tags?.map(tag => tag.name).join(', ') || '',
    offers: {
      '@type': 'Offer',
      priceCurrency: 'PHP',
      price: product.price,
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      url: `https://shop.agrikoph.com/product/${product.slug}`,
      seller: {
        '@type': 'Organization',
        name: 'Agriko Organic Farm',
        url: 'https://shop.agrikoph.com'
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
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 30,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/FreeReturn'
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
      url: `https://shop.agrikoph.com/category/${category.slug}`
    })) || [],
    potentialAction: {
      '@type': 'BuyAction',
      target: `https://shop.agrikoph.com/product/${product.slug}`,
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div>
            <ProductGallery product={product} />
          </div>

          {/* Product Information */}
          <div className="space-y-6">
            <div>
              <h1 className="text-heading-1 text-gray-900 mb-2">
                {product.name}
              </h1>
              
              {product.sku && (
                <p className="text-sm text-gray-500 mb-4">
                  SKU: {product.sku}
                </p>
              )}

              {/* Price */}
              <div className="flex items-center space-x-4 mb-4">
                {product.on_sale && product.regular_price !== product.price ? (
                  <>
                    <span className="text-3xl font-bold text-primary-600">
                      {formatPrice(product.price)}
                    </span>
                    <span className="text-xl text-gray-500 line-through">
                      {formatPrice(product.regular_price)}
                    </span>
                    <span className="bg-red-100 text-red-800 text-sm px-2 py-1 rounded-full">
                      Sale
                    </span>
                  </>
                ) : (
                  <span className="text-3xl font-bold text-gray-900">
                    {formatPrice(product.price)}
                  </span>
                )}
              </div>

              {/* Stock Status */}
              <div className="flex items-center mb-6">
                {inStock ? (
                  <span className="flex items-center text-green-600">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    In Stock
                  </span>
                ) : (
                  <span className="flex items-center text-red-600">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    Out of Stock
                  </span>
                )}
              </div>
            </div>

            {/* Short Description */}
            {product.short_description && (
              <div 
                className="prose prose-sm text-gray-700"
                dangerouslySetInnerHTML={createSafeHtml(product.short_description, 'default')}
              />
            )}

            {/* Add to Cart */}
            <div className="border-t border-gray-200 pt-6">
              <AddToCartButton product={product} />
            </div>

            {/* Product Categories */}
            {product.categories && product.categories.length > 0 && (
              <div>
                <h3 className="text-heading-3 text-gray-900 mb-2">Categories:</h3>
                <div className="flex flex-wrap gap-2">
                  {product.categories.map((category) => (
                    <span
                      key={category.id}
                      className="inline-block bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full"
                    >
                      {category.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Product Tags */}
            {product.tags && product.tags.length > 0 && (
              <div>
                <h3 className="text-heading-3 text-gray-900 mb-2">Tags:</h3>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="inline-block bg-primary-100 text-primary-700 text-sm px-3 py-1 rounded-full"
                    >
                      #{tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Product Description */}
        {product.description && (
          <div className="mt-16 border-t border-gray-200 pt-16">
            <h2 className="text-heading-2 text-gray-900 mb-6">Product Details</h2>
            <div 
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={createSafeHtml(product.description, 'default')}
            />
          </div>
        )}

        {/* Reviews Section */}
        <div className="mt-16 border-t border-gray-200 pt-16">
          <Suspense fallback={<div className="h-64 bg-gray-100 animate-pulse rounded-lg" />}>
            <ProductReviews productId={product.id} productName={product.name} />
          </Suspense>
        </div>

        {/* Related Products */}
        {product.categories && product.categories.length > 0 && product.categories[0] && (
          <div className="mt-16">
            <Suspense fallback={<div className="h-64 bg-gray-100 animate-pulse rounded-lg" />}>
              <RelatedProducts 
                categoryId={product.categories[0].id} 
                currentProductId={product.id} 
              />
            </Suspense>
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