/**
 * Data Quality Monitoring API
 * Provides real-time metrics on product data quality
 */

import { NextResponse } from 'next/server';
import { getAllProducts } from '@/lib/woocommerce';
import { productValidator } from '@/lib/product-validator';
import { logger } from '@/lib/logger';
import type { WCProduct } from '@/types/woocommerce';

export async function GET() {
  try {
    // Fetch all products
    const products = await getAllProducts({ per_page: 100 });

    // Validate all products
    const { results, metrics } = productValidator.validateBatch(products);

    // Find problematic products
    const problemProducts = Array.from(results.entries())
      .filter(([_, result]) => result.severity !== 'ok')
      .map(([productId, result]) => {
        const product = products.find((p: WCProduct) => p.id === productId);
        return {
          id: productId,
          name: product?.name || 'Unknown',
          severity: result.severity,
          errors: result.errors,
          warnings: result.warnings,
        };
      });

    // Calculate percentages
    const qualityScore = metrics.totalProducts > 0
      ? Math.round((metrics.validProducts / metrics.totalProducts) * 100)
      : 0;

    const response = {
      timestamp: new Date().toISOString(),
      metrics: {
        ...metrics,
        qualityScore: `${qualityScore}%`,
        issues: {
          critical: metrics.errorProducts,
          warning: metrics.warningProducts,
          zeroPrice: metrics.zeroPrice,
          missingImages: metrics.missingImages,
          outOfStock: metrics.outOfStock,
        },
      },
      problemProducts: problemProducts.slice(0, 20), // Top 20 issues
      recommendations: generateRecommendations(metrics),
    };

    // Log metrics for monitoring
    logger.info('Data quality check completed', {
      qualityScore,
      errorCount: metrics.errorProducts,
      warningCount: metrics.warningProducts,
    });

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Data quality monitoring failed', { error });
    return NextResponse.json(
      { error: 'Failed to check data quality' },
      { status: 500 }
    );
  }
}

function generateRecommendations(metrics: any): string[] {
  const recommendations: string[] = [];

  if (metrics.zeroPrice > 0) {
    recommendations.push(
      `${metrics.zeroPrice} products have zero price. Review pricing in WooCommerce admin.`
    );
  }

  if (metrics.missingImages > 0) {
    recommendations.push(
      `${metrics.missingImages} products have no images. Add product photos for better conversion.`
    );
  }

  if (metrics.errorProducts > 0) {
    recommendations.push(
      `${metrics.errorProducts} products have critical errors. These won't display on the site.`
    );
  }

  if (metrics.outOfStock > metrics.totalProducts * 0.3) {
    recommendations.push(
      'Over 30% of products are out of stock. Consider restocking or hiding unavailable items.'
    );
  }

  if (recommendations.length === 0) {
    recommendations.push('Product data quality looks good! No immediate action needed.');
  }

  return recommendations;
}