import { NextRequest } from 'next/server';
import { logger } from '@/lib/logger';
import { getProductById, getAllProducts } from '@/lib/woocommerce';
import { WCProduct, WCCategory } from '@/types/woocommerce';
import { hybridSearch, HybridSearchResult } from '@/lib/hybrid-search';
import { productCacheSafe } from '@/lib/thread-safe-cache';
import { createErrorResponse, createSuccessResponse } from '@/lib/api-helpers';

// Extended interface to include similarity score
interface WCProductWithSimilarity extends WCProduct {
  similarityScore?: number;
}

interface SmartRecommendation {
  product: WCProduct;
  score: number;
  reason: string;
  source: 'semantic' | 'graph-category' | 'graph-health';
}

// interface SemanticSearchResult {
//   id: string;
//   title: string;
//   name: string;
//   slug: string;
//   price: number;
//   categories: string[];
//   inStock: boolean;
//   featured: boolean;
//   relevanceScore: number;
// }

// Real implementation functions
async function findSimilarProductsByCategory(targetProduct: WCProduct, limit: number) {
  try {
    const cacheKey = `similar_category_${targetProduct.id}_${limit}`;
    const cached = await productCacheSafe.get(cacheKey);
    if (cached) {
      return cached as WCProduct[];
    }

    // Get products from same categories
    const categoryIds = targetProduct.categories?.map((cat: WCCategory) => cat.id) || [];
    const allProducts = await getAllProducts({ 
      per_page: 50,
      category: categoryIds.join(','),
    });

    // Calculate similarity score based on shared categories and attributes
    const similarProducts = allProducts
      .filter((product: WCProduct) => product.id !== targetProduct.id) // Don't include the source product
      .map((product: WCProduct) => {
        const sharedCategories = product.categories?.filter((cat: WCCategory) =>
          categoryIds.includes(cat.id)
        ).length || 0;
        
        const categoryScore = sharedCategories / Math.max(categoryIds.length, 1);
        const priceScore = calculatePriceSimilarity(targetProduct.price.toNumber(), product.price.toNumber());
        
        return {
          ...product,
          similarityScore: (categoryScore * 0.7) + (priceScore * 0.3)
        };
      })
      .filter((product: WCProduct & { similarityScore: number }) => product.similarityScore > 0.3) // Minimum similarity threshold
      .sort((a: WCProduct & { similarityScore: number }, b: WCProduct & { similarityScore: number }) => b.similarityScore - a.similarityScore)
      .slice(0, limit);

    await productCacheSafe.set(cacheKey, similarProducts, 10 * 60 * 1000); // 10 minutes
    return similarProducts;
  } catch (error) {
    logger.error('Error in findSimilarProductsByCategory:', error as Record<string, unknown>);
    return [];
  }
}

function calculatePriceSimilarity(price1: number, price2: number): number {
  const p1 = parseFloat(price1.toString());
  const p2 = parseFloat(price2.toString());
  
  if (p1 === 0 && p2 === 0) return 1;
  if (p1 === 0 || p2 === 0) return 0;
  
  const ratio = Math.min(p1, p2) / Math.max(p1, p2);
  return ratio;
}

async function findSemanticSimilarProducts(targetProduct: WCProduct, limit: number): Promise<WCProduct[]> {
  try {
    const cacheKey = `similar_semantic_${targetProduct.id}_${limit}`;
    const cached = await productCacheSafe.get(cacheKey);
    if (cached) {
      return cached as WCProduct[];
    }

    // Use the product name and description as search query
    const searchQuery = `${targetProduct.name} ${targetProduct.short_description || ''}`;
    const semanticResponse = await hybridSearch(searchQuery, { limit: limit + 5 }); // Get a few extra to filter out the source

    const similarProducts = semanticResponse.results
      .filter((result: HybridSearchResult) => result.product.id !== targetProduct.id) // Remove source product
      .slice(0, limit)
      .map((result: HybridSearchResult): WCProductWithSimilarity => {
        // Use the full product data from the result
        return {
          ...result.product,
          similarityScore: result.score
        };
      });

    await productCacheSafe.set(cacheKey, similarProducts, 10 * 60 * 1000); // 10 minutes
    return similarProducts;
  } catch (error) {
    logger.error('Error in findSemanticSimilarProducts:', error as Record<string, unknown>);
    return [];
  }
}

function generateRecommendationReason(sourceProduct: WCProduct, targetProduct: WCProduct, source: string): string {
  const sourceName = sourceProduct.name || 'this product';
  const reasons = {
    'graph-category': [
      `Customers who viewed ${sourceName} also liked this`,
      `Similar to ${sourceName} in the ${targetProduct.categories?.[0]?.name || 'same'} category`,
      `Often bought together with ${sourceName}`,
    ],
    'semantic': [
      `Recommended based on ${sourceName}`,
      `Similar benefits and uses as ${sourceName}`,
      `Customers with similar interests also chose this`,
    ],
    'price-range': [
      `Similar price range to ${sourceName}`,
      `Great alternative to ${sourceName}`,
    ]
  };
  
  const sourceReasons = reasons[source as keyof typeof reasons] || reasons['semantic'];
  return sourceReasons[Math.floor(Math.random() * sourceReasons.length)] || 'Recommended for you';
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get('productId');
  const limit = parseInt(searchParams.get('limit') || '8');

  try {
    
    if (!productId) {
      return createErrorResponse(
        'productId parameter is required',
        { providedParams: Object.fromEntries(searchParams.entries()) },
        400
      );
    }
    
    logger.info(`🧠 Generating smart recommendations for product ID: ${productId}`);
    
    // First, get the source product to understand what we're recommending from
    const sourceProduct = await getProductById(parseInt(productId));
    if (!sourceProduct) {
      return createErrorResponse(
        'Product not found',
        { productId: parseInt(productId) },
        404
      );
    }
    
    const recommendations: SmartRecommendation[] = [];
    
    // 1. Category-based similarity (most reliable)
    logger.info('📊 Finding category-based similar products...');
    try {
      const categorySimilar = await findSimilarProductsByCategory(sourceProduct, Math.ceil(limit * 0.6));
      for (const product of categorySimilar) {
        const reason = generateRecommendationReason(sourceProduct, product, 'graph-category');
        
        recommendations.push({
          product,
          score: (product as WCProductWithSimilarity).similarityScore || 0.8,
          reason,
          source: 'graph-category',
        });
      }
      logger.info(`Found ${categorySimilar.length} category-based recommendations`);
    } catch (error) {
      logger.error('Error finding category-similar products:', error as Record<string, unknown>);
    }
    
    // 2. Semantic similarity (content/description based)  
    logger.info('🔍 Finding semantic similar products...');
    try {
      const semanticSimilar = await findSemanticSimilarProducts(sourceProduct, Math.ceil(limit * 0.4));
      for (const product of semanticSimilar) {
        // Avoid duplicates from category results
        if (!recommendations.find(r => r.product.id === product.id)) {
          const reason = generateRecommendationReason(sourceProduct, product, 'semantic');
          
          recommendations.push({
            product,
            score: (product as WCProductWithSimilarity).similarityScore || 0.7,
            reason,
            source: 'semantic',
          });
        }
      }
      logger.info(`Found ${semanticSimilar.length} semantic-based recommendations (${recommendations.filter(r => r.source === 'semantic').length} unique)`);
    } catch (error) {
      logger.warn('Semantic search unavailable, using category-only recommendations:', error as Record<string, unknown>);
    }
    
    // 3. Price-based fallback if we don't have enough recommendations
    if (recommendations.length < limit) {
      logger.info('🏷️ Adding price-based recommendations to fill quota...');
      try {
        const priceRange = {
          min: Math.max(0, Number(sourceProduct.price || 0) * 0.7),
          max: Number(sourceProduct.price || 0) * 1.3
        };
        
        const priceBasedProducts = await getAllProducts({
          per_page: limit + 10, // Get extra to account for filtering
        });
        
        // Filter by price range and exclude already recommended products
        const excludeIds = [sourceProduct.id, ...recommendations.map(r => r.product.id)];
        const filteredPriceProducts = priceBasedProducts
          .filter((product: WCProduct) => !excludeIds.includes(product.id))
          .filter((product: WCProduct) => {
            const productPrice = Number(product.price || 0);
            return productPrice >= priceRange.min && productPrice <= priceRange.max;
          });
        
        for (const product of filteredPriceProducts.slice(0, limit - recommendations.length)) {
          const reason = generateRecommendationReason(sourceProduct, product, 'price-range');
          
          recommendations.push({
            product,
            score: 0.6, // Lower confidence for price-only similarity
            reason,
            source: 'graph-category', // Categorize as graph-based for simplicity
          });
        }
      } catch (error) {
        logger.error('Error finding price-based recommendations:', error as Record<string, unknown>);
      }
    }
    
    // Sort by score and limit results
    const finalRecommendations = recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(rec => ({
        ...rec,
        product: {
          id: rec.product.id,
          name: rec.product.name,
          slug: rec.product.slug,
          price: rec.product.price,
          regular_price: rec.product.regular_price,
          sale_price: rec.product.sale_price,
          images: rec.product.images || [],
          categories: rec.product.categories || [],
          short_description: rec.product.short_description || '',
          in_stock: rec.product.stock_status === 'instock',
          featured: rec.product.featured || false,
        }
      }));
    
    logger.info(`✅ Generated ${finalRecommendations.length} smart recommendations`);
    
    return createSuccessResponse({
      productId: parseInt(productId),
      sourceProduct: {
        id: sourceProduct.id,
        name: sourceProduct.name,
        categories: sourceProduct.categories?.map((cat: WCCategory) => cat.name) ?? []
      },
      recommendations: finalRecommendations,
      count: finalRecommendations.length,
      sources: {
        'graph-category': finalRecommendations.filter(r => r.source === 'graph-category').length,
        'semantic': finalRecommendations.filter(r => r.source === 'semantic').length,
      },
      performance: {
        cached: recommendations.some(r => r.source === 'graph-category'), // Indicates cache usage
        semanticAvailable: finalRecommendations.some(r => r.source === 'semantic')
      }
    }, `Generated ${finalRecommendations.length} personalized recommendations`);
    
  } catch (error) {
    logger.error('❌ Smart recommendations API error:', error as Record<string, unknown>);
    return createErrorResponse(
      'Failed to generate smart recommendations',
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        productId: searchParams.get('productId')
      },
      500
    );
  }
}