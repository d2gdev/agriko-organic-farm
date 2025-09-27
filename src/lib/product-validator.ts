/**
 * Product Validation Service
 * Validates WooCommerce products against business rules
 */

import { WCProduct } from '@/types/woocommerce';
import { Money } from '@/lib/money';
import { logger } from '@/lib/logger';

export interface ValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
  severity: 'ok' | 'warning' | 'error';
}

export interface ProductMetrics {
  totalProducts: number;
  validProducts: number;
  warningProducts: number;
  errorProducts: number;
  zeroPrice: number;
  missingImages: number;
  outOfStock: number;
}

class ProductValidator {
  private metrics: ProductMetrics = {
    totalProducts: 0,
    validProducts: 0,
    warningProducts: 0,
    errorProducts: 0,
    zeroPrice: 0,
    missingImages: 0,
    outOfStock: 0,
  };

  /**
   * Validate a single product
   */
  validate(product: WCProduct): ValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Critical: Product must have valid ID and name
    if (!product.id || product.id <= 0) {
      errors.push('Product has invalid ID');
    }
    if (!product.name || product.name.trim() === '') {
      errors.push('Product has no name');
    }

    // Warning: Zero price (but adapter guarantees this won't crash)
    if (product.price.isZero) {
      warnings.push(`Product "${product.name}" has zero price`);
      this.metrics.zeroPrice++;
    }

    // Warning: Sale price higher than regular price
    if (product.sale_price && product.sale_price.greaterThan(product.regular_price)) {
      warnings.push(`Sale price (${product.sale_price.format()}) is higher than regular price (${product.regular_price.format()})`);
    }

    // Warning: No images
    if (!product.images || product.images.length === 0) {
      warnings.push('Product has no images');
      this.metrics.missingImages++;
    }

    // Info: Out of stock
    if (product.stock_status === 'outofstock') {
      this.metrics.outOfStock++;
    }

    // Update metrics
    this.metrics.totalProducts++;
    if (errors.length > 0) {
      this.metrics.errorProducts++;
    } else if (warnings.length > 0) {
      this.metrics.warningProducts++;
    } else {
      this.metrics.validProducts++;
    }

    return {
      valid: errors.length === 0,
      warnings,
      errors,
      severity: errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'ok',
    };
  }

  /**
   * Validate multiple products and return summary
   */
  validateBatch(products: WCProduct[]): {
    results: Map<number, ValidationResult>;
    metrics: ProductMetrics;
  } {
    const results = new Map<number, ValidationResult>();

    // Reset metrics for this batch
    this.resetMetrics();

    for (const product of products) {
      const result = this.validate(product);
      results.set(product.id, result);

      // Log significant issues
      if (result.errors.length > 0) {
        logger.error('Product validation error', {
          productId: product.id,
          productName: product.name,
          errors: result.errors,
        });
      } else if (result.warnings.length > 0) {
        logger.warn('Product validation warning', {
          productId: product.id,
          productName: product.name,
          warnings: result.warnings,
        });
      }
    }

    return {
      results,
      metrics: { ...this.metrics },
    };
  }

  /**
   * Get current metrics
   */
  getMetrics(): ProductMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalProducts: 0,
      validProducts: 0,
      warningProducts: 0,
      errorProducts: 0,
      zeroPrice: 0,
      missingImages: 0,
      outOfStock: 0,
    };
  }

  /**
   * Check if product should be displayed
   * (Business rule: hide products with critical errors)
   */
  shouldDisplay(product: WCProduct): boolean {
    const result = this.validate(product);

    // Don't display products with errors
    if (!result.valid) {
      return false;
    }

    // Optionally hide zero-price products (configurable)
    if (product.price.isZero && process.env.NEXT_PUBLIC_HIDE_ZERO_PRICE === 'true') {
      return false;
    }

    return true;
  }

  /**
   * Get display-safe product
   * (Ensures product can be safely displayed even with data issues)
   */
  getSafeProduct(product: WCProduct): WCProduct {
    const result = this.validate(product);

    // If product has errors, return a safe version
    if (!result.valid) {
      return {
        ...product,
        name: product.name || 'Unknown Product',
        price: product.price.isZero ? Money.pesos(0.01) : product.price,
        regular_price: product.regular_price || product.price,
        images: product.images?.length ? product.images : [{
          id: 0,
          src: '/images/placeholder-product.jpg',
          name: 'Placeholder',
          alt: 'Product image not available',
        }],
      };
    }

    return product;
  }
}

// Singleton instance
export const productValidator = new ProductValidator();

// Export for convenience
export const validateProduct = (product: WCProduct) => productValidator.validate(product);
export const validateProducts = (products: WCProduct[]) => productValidator.validateBatch(products);
export const shouldDisplayProduct = (product: WCProduct) => productValidator.shouldDisplay(product);
export const getSafeProduct = (product: WCProduct) => productValidator.getSafeProduct(product);