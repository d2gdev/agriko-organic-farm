/**
 * Migration utilities to convert from branded Core.Money to proper Money class
 * Use these to eliminate all type assertions systematically
 */

import { Money } from './money';

/**
 * Convert old branded Money (number) to new Money class
 * Use this during migration to replace all (x as Core.Money) patterns
 */
export function migrateBrandedMoney(oldMoney: number): Money {
  // Old branded types stored centavos as numbers
  return Money.centavos(oldMoney);
}

/**
 * Convert WooCommerce price strings to Money
 * Replaces all parseFloat(price) as Core.Money patterns
 */
export function migrateWooPrice(priceString: string | number | null | undefined): Money {
  return Money.parse(priceString);
}

/**
 * Convert database price values to Money
 * Handles both string and number inputs from database
 */
export function migrateDatabasePrice(dbPrice: unknown): Money {
  if (typeof dbPrice === 'string' || typeof dbPrice === 'number') {
    return Money.parse(dbPrice);
  }
  return Money.ZERO;
}

/**
 * Batch convert array of old money values
 */
export function migratePriceArray(prices: (string | number | null | undefined)[]): Money[] {
  return prices.map(price => Money.parse(price));
}

/**
 * Convert calculation results back to Money
 * Replaces patterns like: (price * quantity) as Core.Money
 */
export function migrateCalculationResult(calculation: number): Money {
  return Money.centavos(calculation);
}

/**
 * Migration validator - throws if conversion would lose data
 */
export function validateMigration(
  original: unknown,
  converted: Money,
  context: string
): void {
  if (typeof original === 'number') {
    const expectedCentavos = Math.round(original * 100);
    if (converted.toCentavos() !== expectedCentavos) {
      throw new Error(
        `Migration validation failed in ${context}: ` +
        `original ${original} pesos (${expectedCentavos} centavos) != ` +
        `converted ${converted.toCentavos()} centavos`
      );
    }
  }
}

/**
 * Common migration patterns
 */
export const MigrationPatterns = {
  /**
   * Replace: product.price || (0 as Core.Money)
   * With: Money.parse(product.price)
   */
  fallbackPrice: (price: string | number | null | undefined): Money => {
    return Money.parse(price);
  },

  /**
   * Replace: parseFloat(priceString) as Core.Money
   * With: Money.fromWooCommerce(priceString)
   */
  wooCommercePrice: (priceString: string): Money => {
    return Money.fromWooCommerce(priceString);
  },

  /**
   * Replace: (price * quantity) as Core.Money
   * With: Money.parse(price).multiply(quantity)
   */
  priceCalculation: (price: string | number | null | undefined, quantity: number): Money => {
    return Money.parse(price).multiply(quantity);
  },

  /**
   * Replace: Number(money) / 100
   * With: money.pesos
   */
  toPesos: (money: Money): number => {
    return money.pesos;
  },

  /**
   * Replace: money.toString()
   * With: money.toWooCommerce()
   */
  toApiString: (money: Money): string => {
    return money.toWooCommerce();
  }
};