import { notFound } from 'next/navigation';
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
import { WCProduct } from '@/types/woocommerce';
import AddToCartButton from './AddToCartButton';
import ProductGallery from './ProductGallery';
import RelatedProducts from './RelatedProducts';
import Link from 'next/link';

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Generate static params for ISR
export async function generateStaticParams() {
  try {
    const slugs = await getStaticProductSlugs();
    return slugs.map((slug) => ({
      slug: slug,
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
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
    console.error('Error generating metadata:', error);
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
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const inStock = isProductInStock(product);

  // JSON-LD structured data for SEO
  const jsonLd = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    image: product.images?.map(img => img.src) || [],
    description: stripHtml(product.description || product.short_description || ''),
    sku: product.sku,
    brand: {
      '@type': 'Brand',
      name: 'Agriko'
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'USD',
      price: product.price,
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `/product/${product.slug}`
    },
    aggregateRating: product.average_rating && String(product.average_rating) !== '0' ? {
      '@type': 'AggregateRating',
      ratingValue: String(product.average_rating),
      reviewCount: product.rating_count || 0
    } : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link href="/" className="text-gray-700 hover:text-primary-600">
                Home
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <Link href="/products" className="ml-1 text-gray-700 hover:text-primary-600 md:ml-2">
                  Products
                </Link>
              </div>
            </li>
            {product.categories && product.categories.length > 0 && (
              <li>
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-1 text-gray-700 md:ml-2">
                    {product.categories[0].name}
                  </span>
                </div>
              </li>
            )}
            <li aria-current="page">
              <div className="flex items-center">
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span className="ml-1 text-gray-500 md:ml-2 truncate">
                  {product.name}
                </span>
              </div>
            </li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div>
            <ProductGallery product={product} />
          </div>

          {/* Product Information */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
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
                dangerouslySetInnerHTML={{ __html: product.short_description }}
              />
            )}

            {/* Add to Cart */}
            <div className="border-t border-gray-200 pt-6">
              <AddToCartButton product={product} />
            </div>

            {/* Product Categories */}
            {product.categories && product.categories.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Categories:</h3>
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
                <h3 className="text-sm font-medium text-gray-900 mb-2">Tags:</h3>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Product Details</h2>
            <div 
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </div>
        )}

        {/* Related Products */}
        {product.categories && product.categories.length > 0 && (
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
    <Suspense fallback={<ProductSkeleton />}>
      <ProductContent slug={slug} />
    </Suspense>
  );
}

// Enable ISR with 1 hour revalidation
export const revalidate = 3600;