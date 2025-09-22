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
  type?: 'similar' | 'health-benefit' | 'category' | 'complementary' | 'frequently-bought';
  healthBenefit?: string;
  category?: string;
  limit?: number;
  title?: string;
  showExplanation?: boolean;
}

export function GraphRecommendations({
  productId,
  type = 'similar',
  healthBenefit,
  category,
  limit = 4,
  title,
  showExplanation = false
}: GraphRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<GraphProduct[]>([]);
  const [explanation, setExplanation] = useState<string | null>(null);
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

      if ((type === 'similar' || type === 'complementary' || type === 'frequently-bought') && productId) {
        params.append('productId', productId.toString());
      } else if (type === 'health-benefit' && healthBenefit) {
        params.append('healthBenefit', healthBenefit);
      } else if (type === 'category' && category) {
        params.append('category', category);
      }

      if (showExplanation) {
        params.append('explain', 'true');
      }

      const response = await reliableFetch(`/api/graph/recommendations?${params}`, {
        timeoutLevel: 'standard'
      });
      const result = await response.json();

      if (result.success) {
        setRecommendations(result.data.recommendations ?? []);
        if (showExplanation && result.data.explanation) {
          setExplanation(result.data.explanation);
        }
      } else {
        setError(result.error ?? 'Failed to load recommendations');
      }
    } catch (error) {
      logger.error('Graph recommendations error details:', {
        error,
        productId,
        type,
        url: `/api/graph/recommendations?productId=${productId}&type=${type}&limit=${limit}${showExplanation ? '&explain=true' : ''}${healthBenefit ? `&healthBenefit=${healthBenefit}` : ''}${category ? `&category=${category}` : ''}`
      });
      logger.error('Graph recommendations error:', error as Record<string, unknown>);
      setError('Unable to load recommendations');
    } finally {
      setLoading(false);
    }
  }, [productId, type, healthBenefit, category, limit, showExplanation]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const getDefaultTitle = () => {
    switch (type) {
      case 'similar':
        return 'You Might Also Like';
      case 'complementary':
        return 'Works Well With This';
      case 'frequently-bought':
        return 'Frequently Bought Together';
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

  // Map product slugs to actual image filenames
  const getProductImageSrc = (slug: string) => {
    const imageMap: Record<string, string> = {
      'honey': 'agriko-pure-organic-honey-jar.jpg',
      'pure-salabat': 'agriko-pure-salabat-ginger-tea-100g.jpg',
      '5n1-turmeric-tea-blend-180g': 'agriko-turmeric-5in1-blend-180g-organic.jpg',
      '5n1-turmeric-tea-blend': 'agriko-turmeric-5in1-blend-500g-health-supplement.jpg',
      'cacao-with-5n1-turmeric-blend': 'agriko-turmeric-5in1-blend-500g-health-supplement.jpg',
      'roasted-black-rice': 'agriko-turmeric-5in1-blend-180g-organic.jpg', // placeholder
      'agribata-kids-cereal': 'agriko-turmeric-5in1-blend-180g-organic.jpg', // placeholder
      'pure-moringa': 'agriko-turmeric-5in1-blend-180g-organic.jpg', // placeholder
    };

    return `/images/${imageMap[slug] || 'placeholder-product.svg'}`;
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
          {type === 'complementary' && (
            <span className="inline-flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Curated Pairings
            </span>
          )}
          {type === 'frequently-bought' && (
            <span className="inline-flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Popular Combinations
            </span>
          )}
          {type === 'similar' && 'Powered by Knowledge Graph'}
          {type === 'health-benefit' && 'Health-Focused Recommendations'}
          {type === 'category' && 'Category Suggestions'}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {recommendations.map((product, index) => (
          <div
            key={`${type}-${product.id}-${index}`}
            className="group bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            <Link href={`/product/${product.slug}`} className="block">
              <div className="aspect-square bg-gray-100 relative overflow-hidden">
                <OptimizedImage
                  src={getProductImageSrc(product.slug)}
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

      {/* Explanation Section */}
      {showExplanation && explanation && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-primary-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-gray-600">{explanation}</p>
          </div>
        </div>
      )}

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

// Complementary Products Component
interface ComplementaryProductsProps {
  productId: number;
  limit?: number;
  showExplanation?: boolean;
}

export function ComplementaryProducts({ productId, limit = 4, showExplanation = false }: ComplementaryProductsProps) {
  return (
    <GraphRecommendations
      productId={productId}
      type="complementary"
      limit={limit}
      title="Works Well With This Product"
      showExplanation={showExplanation}
    />
  );
}

// Frequently Bought Together Component
interface FrequentlyBoughtProps {
  productId: number;
  limit?: number;
  showExplanation?: boolean;
}

export function FrequentlyBoughtTogether({ productId, limit = 4, showExplanation = false }: FrequentlyBoughtProps) {
  return (
    <GraphRecommendations
      productId={productId}
      type="frequently-bought"
      limit={limit}
      title="Frequently Bought Together"
      showExplanation={showExplanation}
    />
  );
}

export default GraphRecommendations;