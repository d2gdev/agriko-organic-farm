/**
 * Product serialization utilities for Next.js 15 server-to-client component compatibility
 * Converts Money objects to plain objects to avoid serialization errors
 */

import { Money } from '@/lib/money';
import { WCProduct } from '@/types/woocommerce';

/**
 * Simplified serialized version for client components - using plain numbers instead of objects
 */
export interface SerializedWCProduct extends Omit<WCProduct, 'price' | 'regular_price' | 'sale_price'> {
  price: number | null;
  regular_price: number | null;
  sale_price: number | null;
}

/**
 * Serialize a Money object to a plain number (pesos)
 * This avoids all object serialization issues with Next.js 15
 */
export function serializeMoney(money: Money | number | null | undefined): number | null {
  if (!money) return null;

  try {
    // If it's a Money instance, use its methods
    if (money instanceof Money) {
      return money.pesos;
    }
    // If it's already a plain number (pesos), return as-is
    else if (typeof money === 'number') {
      return money;
    }
    // If it's already a plain object with centavos
    else if (typeof money === 'object' && 'centavos' in money && typeof (money as any).centavos === 'number') {
      return (money as any).centavos / 100;
    }
    // If it's already a plain object with pesos
    else if (typeof money === 'object' && 'pesos' in money && typeof (money as any).pesos === 'number') {
      return (money as any).pesos;
    }
    else {
      return null;
    }
  } catch (error) {
    return null;
  }
}

/**
 * Serialize a WCProduct to be safe for client components
 */
export function serializeProduct(product: WCProduct): SerializedWCProduct {
  return {
    ...product,
    price: serializeMoney(product.price),
    regular_price: serializeMoney(product.regular_price),
    sale_price: serializeMoney(product.sale_price),
  };
}

/**
 * Serialize an array of WCProducts
 */
export function serializeProducts(products: WCProduct[]): SerializedWCProduct[] {
  return products.map(serializeProduct);
}

/**
 * Deserialize a serialized number back to Money object on the client side
 */
export function deserializeMoney(serialized: number | null): Money | null {
  if (serialized === null || serialized === undefined) return null;
  return Money.pesos(serialized);
}

/**
 * Deserialize a SerializedWCProduct back to WCProduct on the client side
 */
export function deserializeProduct(serialized: SerializedWCProduct): WCProduct {
  return {
    ...serialized,
    price: deserializeMoney(serialized.price) || Money.ZERO,
    regular_price: deserializeMoney(serialized.regular_price) || Money.ZERO,
    sale_price: deserializeMoney(serialized.sale_price),
  };
}