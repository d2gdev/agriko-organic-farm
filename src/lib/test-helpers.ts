/**
 * Test helpers for creating mock data
 */

import { Money } from '@/lib/money';
import { WCProduct } from '@/types/woocommerce';

/**
 * Create a minimal valid WCProduct for testing
 * Ensures all required fields are present
 */
export function createMockProduct(overrides: Partial<WCProduct> = {}): WCProduct {
  const defaultPrice = Money.pesos(19.99);
  const price = overrides.price || defaultPrice;
  const regular_price = overrides.regular_price || price;
  const sale_price = overrides.sale_price !== undefined ? overrides.sale_price : null;

  return {
    id: 1,
    name: 'Test Product',
    slug: 'test-product',
    stock_status: 'instock',
    images: [],
    categories: [],
    tags: [],
    ...overrides,
    // Ensure price fields are always set correctly
    price,
    regular_price,
    sale_price,
  };
}