'use client';

import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';
import { reliableFetch } from '@/lib/reliable-fetch';

import Link from 'next/link';
import OptimizedImage from './OptimizedImage';

interface GraphProduct {
  id: number;
  name: string;
  slug: string;
  price: number;
  rating?: number;
  inStock: boolean;
  featured: boolean;
}

interface GraphRecommendationsProps {
  productId: number;
  type?: 'similar' | 'health-benefit' | 'category';
  healthBenefit?: string;
  category?: string;
  limit?: number;
  title?: string;
}

export function GraphRecommendations({ 
  productId, 
  type = 'similar', 
  healthBenefit,
  category,
  limit = 4,
  title 
}: GraphRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<GraphProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        type,
        limit: limit.toString()
      });

      if (type === 'similar' && productId) {
        params.append('productId', productId.toString());
      } else if (type === 'health-benefit' && healthBenefit) {
        params.append('healthBenefit', healthBenefit);
      } else if (type === 'category' && category) {
        params.append('category', category);
      }

      const response = await reliableFetch(`/api/graph/recommendations?${params}`, {
        timeoutLevel: 'standard'
      });
      const result = await response.json();

      if (result.success) {
        setRecommendations(result.data.recommendations ?? []);
      } else {
        setError(result.error ?? 'Failed to load recommendations');
      }
    } catch (error) {
      logger.error('Graph recommendations error:', error as Record<string, unknown>);
      setError('Unable to load recommendations');
    } finally {
      setLoading(false);
    }
  }, [productId, type, healthBenefit, category, limit]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const getDefaultTitle = () => {
    switch (type) {
      case 'similar':
        return 'You Might Also Like';
      case 'health-benefit':
        return `More Products for ${healthBenefit}`;
      case 'category':
        return `More in ${category}`;
      default:
        return 'Recommended Products';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="py-8">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(limit)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="aspect-square bg-gray-300 rounded-lg"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8">
        <div className="text-center text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>Unable to load recommendations</p>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null; // Don't show empty recommendations section
  }

  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {title ?? getDefaultTitle()}
        </h2>
        <div className="text-sm text-gray-500">
          Powered by Knowledge Graph
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {recommendations.map((product) => (
          <div 
            key={product.id} 
            className="group bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            <Link href={`/product/${product.slug}`} className="block">
              <div className="aspect-square bg-gray-100 relative overflow-hidden">
                <OptimizedImage
                  src={`/images/products/${product.slug}.jpg`}
                  alt={product.name}
                  width={300}
                  height={300}
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {product.featured && (
                  <div className="absolute top-2 left-2">
                    <span className="bg-primary-500 text-white text-xs px-2 py-1 rounded-full">
                      Featured
                    </span>
                  </div>
                )}
                {!product.inStock && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <span className="text-white text-sm font-medium">Out of Stock</span>
                  </div>
                )}
              </div>

              <div className="p-4">
                <h3 className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2 mb-2">
                  {product.name}
                </h3>

                <div className="flex items-center justify-between">
                  <div className="text-lg font-bold text-primary-600">
                    {formatPrice(product.price)}
                  </div>
                  
                  {product.rating && (
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-sm text-gray-600">{product.rating}</span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Learn More Link */}
      <div className="mt-6 text-center">
        <button
          onClick={fetchRecommendations}
          className="text-primary-600 hover:text-primary-700 text-sm font-medium transition-colors"
        >
          Refresh Recommendations
        </button>
      </div>
    </div>
  );
}

// Health Benefit Recommendations Component
interface HealthBenefitRecommendationsProps {
  benefitName: string;
  limit?: number;
}

export function HealthBenefitRecommendations({ benefitName, limit = 4 }: HealthBenefitRecommendationsProps) {
  return (
    <GraphRecommendations
      productId={0} // Not used for health-benefit type
      type="health-benefit"
      healthBenefit={benefitName}
      limit={limit}
      title={`Products for ${benefitName}`}
    />
  );
}

// Category Recommendations Component
interface CategoryRecommendationsProps {
  categoryName: string;
  limit?: number;
}

export function CategoryRecommendations({ categoryName, limit = 4 }: CategoryRecommendationsProps) {
  return (
    <GraphRecommendations
      productId={0} // Not used for category type
      type="category"
      category={categoryName}
      limit={limit}
      title={`More in ${categoryName}`}
    />
  );
}

export default GraphRecommendations;