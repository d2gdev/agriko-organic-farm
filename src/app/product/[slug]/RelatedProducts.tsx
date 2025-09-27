import { Suspense } from 'react';
import { logger } from '@/lib/logger';

import { getProductsByCategory } from '@/lib/woocommerce';
import { serializeProducts } from '@/lib/product-serializer';
import ProductCard from '@/components/ProductCard';
import { GraphRecommendations } from '@/components/GraphRecommendations';

interface RelatedProductsProps {
  categoryId: number;
  currentProductId: number;
}

async function WooCommerceRelatedProducts({ categoryId, currentProductId }: RelatedProductsProps) {
  try {
    const relatedProducts = await getProductsByCategory(categoryId, 8);

    // Serialize and filter out the current product
    const serializedProducts = serializeProducts(relatedProducts);
    const filteredProducts = serializedProducts.filter(product => product.id !== currentProductId);

    if (filteredProducts.length === 0) {
      return null;
    }

    return (
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">From Same Category</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.slice(0, 4).map((product, index) => (
            <ProductCard 
              key={product.id} 
              product={product}
              priority={index < 2}
              fetchPriority={index < 2 ? "high" : "auto"}
            />
          ))}
        </div>
      </div>
    );
  } catch (error) {
    logger.error('Error loading WooCommerce related products:', error as Record<string, unknown>);
    return null;
  }
}

export default function RelatedProducts({ categoryId, currentProductId }: RelatedProductsProps) {
  return (
    <div className="border-t border-gray-200 pt-16">
      <h2 className="text-heading-2 text-gray-900 mb-8 text-center">
        You May Also Like
      </h2>

      {/* Complementary Products - Products that work well together */}
      <Suspense fallback={
        <div className="mb-8">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-300 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="aspect-square bg-gray-300 rounded-lg"></div>
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      }>
        <GraphRecommendations
          productId={currentProductId}
          type="complementary"
          limit={4}
          title="Perfect Pairings"
        />
      </Suspense>

      {/* Frequently Bought Together */}
      <Suspense fallback={
        <div className="mb-8">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-300 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="aspect-square bg-gray-300 rounded-lg"></div>
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      }>
        <GraphRecommendations
          productId={currentProductId}
          type="frequently-bought"
          limit={4}
          title="Frequently Bought Together"
        />
      </Suspense>

      {/* WooCommerce Category-Based Recommendations (Fallback/Additional) */}
      <Suspense fallback={
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="aspect-square bg-gray-300 rounded-lg"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      }>
        <WooCommerceRelatedProducts 
          categoryId={categoryId} 
          currentProductId={currentProductId} 
        />
      </Suspense>
    </div>
  );
}