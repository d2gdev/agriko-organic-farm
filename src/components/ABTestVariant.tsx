'use client';

import { Core } from '@/types/TYPE_REGISTRY';
import React, { ReactNode, useEffect, useState } from 'react';
import { logger } from '@/lib/logger';

import { useABTest, shouldShowVariant, getVariantConfig } from '@/lib/ab-testing';
import type {
  ProductCardABTestProps
} from '@/types/ab-testing';
import { ComponentConfig } from '@/types/common';
import Image from 'next/image';

interface ABTestVariantProps {
  testId: string;
  variantId: string;
  children: ReactNode;
  userId?: string;
  sessionId?: string;
  fallback?: ReactNode;
}

interface ABTestProps {
  testId: string;
  userId?: string;
  sessionId?: string;
  children: {
    [variantId: string]: ReactNode;
  };
  fallback?: ReactNode;
}

interface ABTestConfigProps {
  testId: string;
  userId?: string;
  sessionId?: string;
  children: (config: ComponentConfig, variant: string) => ReactNode;
}

// Component to conditionally render based on A/B test variant
export function ABTestVariant({
  testId,
  variantId,
  children,
  userId,
  sessionId,
  fallback = null
}: ABTestVariantProps) {
  const [shouldShow, setShouldShow] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    const show = shouldShowVariant(testId, variantId, userId, sessionId);
    setShouldShow(show);
  }, [testId, variantId, userId, sessionId]);

  // Always render fallback on server and before hydration
  if (!hasMounted) {
    return <div suppressHydrationWarning>{fallback as React.ReactElement}</div>;
  }

  return shouldShow ? (children as React.ReactElement) : (fallback as React.ReactElement);
}

// Component to render different variants based on A/B test assignment
export function ABTest({ testId, userId, sessionId, children, fallback = null }: ABTestProps) {
  const { variant, isInTest } = useABTest(testId, userId, sessionId);

  if (!isInTest) {
    return fallback as React.ReactElement;
  }

  const variantComponent = children[variant];
  return variantComponent ? (variantComponent as React.ReactElement) : (fallback as React.ReactElement);
}

// Component that provides variant configuration to its children
export function ABTestConfig({ testId, userId, sessionId, children }: ABTestConfigProps) {
  const { variant } = useABTest(testId, userId, sessionId);
  const config = getVariantConfig(testId, userId, sessionId);

  return <>{children(config, variant)}</>;
}

// Hook for component-level A/B testing with automatic tracking
export function useABTestWithTracking(testId: string, userId?: string, sessionId?: string) {
  const { variant, isInTest, trackConversion, trackEvent } = useABTest(testId, userId, sessionId);

  useEffect(() => {
    if (isInTest) {
      trackEvent('variant_viewed', {
        timestamp: new Date().toISOString(),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server'
      });
    }
  }, [isInTest, trackEvent]);

  return {
    variant,
    isInTest,
    trackConversion,
    trackEvent
  };
}

// Higher-order component for A/B testing
export function withABTest<P extends object>(
  testId: string,
  variantConfigs: Record<string, (props: P) => ReactNode>
) {
  return function ABTestWrapper(props: P & { userId?: string; sessionId?: string }) {
    const { userId, sessionId, ...componentProps } = props;
    const { variant, isInTest } = useABTest(testId, userId, sessionId);

    if (!isInTest || !variant || !variantConfigs[variant]) {
      const keys = Object.keys(variantConfigs);
      const controlVariant = variantConfigs['control'] ?? (keys.length > 0 && keys[0] ? variantConfigs[keys[0]] : null);
      return controlVariant ? controlVariant(componentProps as P) : null;
    }

    const VariantComponent = variantConfigs[variant];
    return <>{VariantComponent(componentProps as P)}</>;
  };
}

// Example usage components for common A/B tests

// Product Card A/B Test Component - using imported type

export function ProductCardABTest({ product, userId, sessionId }: ProductCardABTestProps) {
  const { trackConversion, trackEvent } = useABTestWithTracking(
    'product_card_v1',
    userId,
    sessionId
  );

  const handleProductClick = () => {
    trackEvent('product_clicked', { productId: product.id });
    trackConversion('click_through_rate', 1);
  };

  const handleAddToCart = () => {
    trackEvent('add_to_cart_clicked', { productId: product.id });
    trackConversion('add_to_cart_rate', 1);
  };

  return (
    <ABTestConfig testId="product_card_v1" userId={userId} sessionId={sessionId}>
      {(config, currentVariant) => {
        const layoutClass = (config.layout as string) === 'compact' 
          ? 'grid-cols-4' 
          : (config.layout as string) === 'detailed' 
          ? 'grid-cols-2' 
          : 'grid-cols-3';

        return (
          <div 

          className={`product-card ${layoutClass}`}
            onClick={handleProductClick}
          >
            <Image 
              src={product.images?.[0]?.src ?? '/placeholder-product.jpg'} 
              alt={product.name}
              width={300}
              height={(config.layout as string) === 'detailed' ? 256 : 192}
              className={(config.layout as string) === 'detailed' ? 'h-64' : 'h-48'}
            />
            <h3 className="text-lg font-semibold">{product.name}</h3>
            <p className="text-green-600 font-bold">${product.price}</p>
            
            {(config.layout as string) === 'detailed' && (
              <p className="text-sm text-gray-600 mt-2">{product.short_description}</p>
            )}
            
            <button 
              onClick={handleAddToCart}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mt-2"
            >
              Add to Cart
            </button>
            
            {process.env.NODE_ENV === 'development' && (
              <div className="text-xs text-gray-400 mt-1">
                Variant: {currentVariant} | Layout: {config.layout as string}
              </div>
            )}
          </div>
        );
      }}
    </ABTestConfig>
  );
}

// Search Interface A/B Test Component
interface LocalSearchInterfaceABTestProps {
  onSearch: (query: string, type: 'traditional' | 'semantic') => void;
  userId?: string;
  sessionId?: string;
}

export function SearchInterfaceABTest({ onSearch, userId, sessionId }: LocalSearchInterfaceABTestProps) {
  const { trackConversion, trackEvent } = useABTestWithTracking(
    'search_ui_v1',
    userId,
    sessionId
  );

  const handleSearch = (query: string, type: 'traditional' | 'semantic') => {
    trackEvent('search_performed', { query, searchType: type });
    trackConversion('search_usage_rate', 1);
    onSearch(query, type);
  };

  return (
    <ABTestConfig testId="search_ui_v1" userId={userId} sessionId={sessionId}>
      {(config, currentVariant) => (
        <div className="search-interface">
          {(config.searchType as string) === 'traditional' ? (
            <div className="traditional-search">
              <input
                type="text"
                placeholder="Search products..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch((e.target as HTMLInputElement).value, 'traditional');
                  }
                }}
              />
            </div>
          ) : (
            <div className="semantic-search">
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Ask me anything about our products..."
                  className="w-full px-4 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch((e.target as HTMLInputElement).value, 'semantic');
                    }
                  }}
                />
                <p className="text-sm text-gray-600">
                  Try: &quot;What helps with digestion?&quot; or &quot;Antioxidant-rich foods&quot;
                </p>
              </div>
            </div>
          )}
          
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-gray-400 mt-1">
              Variant: {currentVariant} | Search Type: {config.searchType as string}
            </div>
          )}
        </div>
      )}
    </ABTestConfig>
  );
}

// Recommendation Algorithm A/B Test Component
interface RecommendationItem {
  id: number;
  name: string;
  price: Core.Money;
  images?: Array<{ src: string }>;
}

interface LocalRecommendationABTestProps {
  productId: number;
  userId?: string;
  sessionId?: string;
  onRecommendationClick: (recommendedProductId: number, algorithm: string) => void;
}

export function RecommendationABTest({ 
  productId, 
  userId, 
  sessionId, 
  onRecommendationClick 
}: LocalRecommendationABTestProps) {
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const { variant, trackConversion, trackEvent } = useABTestWithTracking(
    'rec_algo_v1',
    userId,
    sessionId
  );

  useEffect(() => {
    const config = getVariantConfig('rec_algo_v1', userId, sessionId);
    
    const fetchRecommendations = async () => {
      try {
        const algorithm = (config.algorithm as string) ?? 'collaborative';
        const response = await fetch(`/api/recommendations?productId=${productId}&algorithm=${algorithm}`);
        const data = await response.json();
        setRecommendations(data.recommendations ?? []);

        trackEvent('recommendations_loaded', {
          algorithm,
          count: data.recommendations?.length ?? 0
        });
      } catch (error) {
        logger.error('Failed to fetch recommendations', { error: error instanceof Error ? error.message : String(error) });
      }
    };

    fetchRecommendations();
  }, [productId, userId, sessionId, trackEvent]);

  const handleRecommendationClick = (recommendedProductId: number) => {
    const config = getVariantConfig('rec_algo_v1', userId, sessionId);
    trackEvent('recommendation_clicked', {
      productId: recommendedProductId,
      algorithm: config.algorithm as string,
      sourceProductId: productId
    });
    trackConversion('click_through_rate', 1);
    onRecommendationClick(recommendedProductId, config.algorithm as string);
  };

  // Get algorithm for development display
  const devConfig = getVariantConfig('rec_algo_v1', userId, sessionId);
  const devAlgorithm = devConfig.algorithm as string;

  return (
    <div className="recommendations-section">
      <h3 className="text-xl font-semibold mb-4">You might also like</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {recommendations.map((product: RecommendationItem) => (
          <div 
            key={product.id}
            className="recommendation-card cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handleRecommendationClick(product.id)}
          >
            <Image 
              src={product.images?.[0]?.src ?? '/placeholder-product.jpg'} 
              alt={product.name}
              width={200}
              height={128}
              className="w-full h-32 object-cover rounded"
            />
            <h4 className="text-sm font-medium mt-2">{product.name}</h4>
            <p className="text-green-600 font-semibold">${product.price}</p>
          </div>
        ))}
      </div>
      
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-400 mt-2">
          Variant: {variant} | Algorithm: {devAlgorithm}
        </div>
      )}
    </div>
  );
}

export default ABTestVariant;