'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';
import { reliableFetch } from '@/lib/reliable-fetch';
import type { Product } from '@/lib/validation-schemas';
import { Star, TrendingUp, Heart, Clock, MapPin, Target } from 'lucide-react';
import Image from 'next/image';

interface LocalRecommendationScore {
  productId: number;
  totalScore: number;
  factors: {
    collaborative: number;
    contentBased: number;
    graphBased: number;
    popularity: number;
    seasonal: number;
    health: number;
    geographical: number;
  };
  reasons: string[];
  confidence: number;
  product?: Product;
}

interface UserProfile {
  purchaseHistory?: number[];
  viewHistory?: number[];
  healthGoals?: string[];
  preferredCategories?: string[];
  location?: string;
}

interface RecommendationEngineProps {
  userProfile?: UserProfile;
  currentProductId?: number;
  type?: 'personalized' | 'similar' | 'health' | 'seasonal';
  healthCondition?: string;
  season?: string;
  limit?: number;
  className?: string;
}

export default function RecommendationEngine({
  userProfile,
  currentProductId,
  type = 'personalized',
  healthCondition,
  season,
  limit = 5,
  className = ''
}: RecommendationEngineProps) {
  const [recommendations, setRecommendations] = useState<LocalRecommendationScore[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<Record<string, unknown> | null>(null);

  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const payload: Record<string, unknown> = {
        type,
        userProfile,
        context: { limit }
      };

      if (currentProductId) payload.productId = currentProductId;
      if (healthCondition) payload.healthCondition = healthCondition;
      if (season) payload.season = season;

      const response = await reliableFetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        timeoutLevel: 'standard'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setRecommendations(data.recommendations);
      } else {
        throw new Error(data.error ?? 'Failed to fetch recommendations');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      logger.error('Error fetching recommendations:', err as Record<string, unknown>);
    } finally {
      setLoading(false);
    }
  }, [userProfile, currentProductId, type, healthCondition, season, limit]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const getExplanation = async (productId: number) => {
    try {
      const response = await reliableFetch('/api/recommendations/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          userProfile: userProfile ?? {}
        }),
        timeoutLevel: 'standard'
      });

      if (response.ok) {
        const data = await response.json();
        setExplanation(data);
      }
    } catch (err) {
      logger.error('Error fetching explanation:', err as Record<string, unknown>);
    }
  };

  const getFactorIcon = (factor: string) => {
    switch (factor) {
      case 'collaborative': return <TrendingUp className="w-4 h-4" />;
      case 'contentBased': return <Target className="w-4 h-4" />;
      case 'graphBased': return <Star className="w-4 h-4" />;
      case 'popularity': return <Star className="w-4 h-4" />;
      case 'seasonal': return <Clock className="w-4 h-4" />;
      case 'health': return <Heart className="w-4 h-4" />;
      case 'geographical': return <MapPin className="w-4 h-4" />;
      default: return <Star className="w-4 h-4" />;
    }
  };

  const getFactorColor = (factor: string) => {
    switch (factor) {
      case 'collaborative': return 'text-blue-600';
      case 'contentBased': return 'text-green-600';
      case 'graphBased': return 'text-purple-600';
      case 'popularity': return 'text-yellow-600';
      case 'seasonal': return 'text-orange-600';
      case 'health': return 'text-red-600';
      case 'geographical': return 'text-teal-600';
      default: return 'text-gray-600';
    }
  };

  const getTypeTitle = () => {
    switch (type) {
      case 'similar': return 'Similar Products';
      case 'health': return `Health-Based Recommendations${healthCondition ? ` for ${healthCondition}` : ''}`;
      case 'seasonal': return `${season ? season.charAt(0).toUpperCase() + season.slice(1) : 'Seasonal'} Recommendations`;
      default: return 'Personalized Recommendations';
    }
  };

  if (loading) {
    return (
      <div className={`p-6 bg-white rounded-lg shadow-sm border ${className}`}>
        <h3 className="text-lg font-semibold mb-4">{getTypeTitle()}</h3>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex space-x-4">
                <div className="w-20 h-20 bg-gray-200 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 bg-white rounded-lg shadow-sm border border-red-200 ${className}`}>
        <h3 className="text-lg font-semibold mb-4 text-red-800">{getTypeTitle()}</h3>
        <div className="text-red-600">
          <p className="mb-2">Failed to load recommendations:</p>
          <p className="text-sm">{error}</p>
          <button 
            onClick={fetchRecommendations}
            className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className={`p-6 bg-white rounded-lg shadow-sm border ${className}`}>
        <h3 className="text-lg font-semibold mb-4">{getTypeTitle()}</h3>
        <p className="text-gray-500">No recommendations available at the moment.</p>
      </div>
    );
  }

  return (
    <div className={`p-6 bg-white rounded-lg shadow-sm border ${className}`}>
      <h3 className="text-lg font-semibold mb-4">{getTypeTitle()}</h3>
      
      <div className="space-y-4">
        {recommendations.map((rec) => (
          <div key={rec.productId} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex space-x-4">
              {rec.product?.images?.[0] && (
                <Image 
                  src={rec.product.images[0].src} 
                  alt={rec.product.name}
                  width={80}
                  height={80}
                  className="w-20 h-20 object-cover rounded-lg"
                />
              )}
              
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {rec.product?.name ?? `Product ${rec.productId}`}
                    </h4>
                    {rec.product?.price && (
                      <p className="text-lg font-semibold text-green-600 mt-1">
                        ${rec.product.price}
                      </p>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center space-x-1 text-sm">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="font-medium">{rec.totalScore.toFixed(1)}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {(rec.confidence * 100).toFixed(0)}% confidence
                    </div>
                  </div>
                </div>

                {/* Recommendation Reasons */}
                <div className="mt-2">
                  <div className="flex flex-wrap gap-2">
                    {rec.reasons.slice(0, 2).map((reason: string, i: number) => (
                      <span 
                        key={i}
                        className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                      >
                        {reason}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Factor Breakdown */}
                <div className="mt-3">
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(rec.factors)
                      .filter(([_, score]) => (score as number) > 0)
                      .sort(([,a], [,b]) => (b as number) - (a as number))
                      .slice(0, 4)
                      .map(([factor, score]) => (
                        <div 
                          key={factor}
                          className="flex items-center space-x-1 text-xs"
                          title={`${factor}: ${(score as number).toFixed(2)}`}
                        >
                          <span className={getFactorColor(factor)}>
                            {getFactorIcon(factor)}
                          </span>
                          <span className="text-gray-600 capitalize">
                            {factor.replace(/([A-Z])/g, ' $1').toLowerCase()}
                          </span>
                        </div>
                      ))
                    }
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-3 flex space-x-2">
                  {rec.product?.slug && (
                    <a 
                      href={`/product/${rec.product.slug}`}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                    >
                      View Product
                    </a>
                  )}
                  <button
                    onClick={() => getExplanation(rec.productId)}
                    className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200"
                  >
                    Why recommended?
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Explanation Modal */}
      {explanation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h4 className="font-semibold mb-3">Why we recommend this</h4>
            <p className="text-gray-700 mb-4">{(explanation.explanation as string)}</p>
            <div className="space-y-2">
              {(explanation.factors as string[])?.map((factor: string, i: number) => (
                <div key={i} className="flex items-center space-x-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>{factor}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setExplanation(null)}
              className="mt-4 w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}