/**
 * PHP Currency Utilities
 * All monetary values stored as centavos (integer) to prevent floating-point errors
 */

import { Core } from '@/types/TYPE_REGISTRY';
import { Money } from '@/lib/money';

/**
 * Format centavos to Philippine Peso display string
 * @param centavos - Amount in centavos (e.g., 129900 for ₱1,299.00)
 * @returns Formatted string with ₱ symbol and thousand separators
 * @example formatPrice(129900) // "₱1,299.00"
 */
export function formatPrice(money: Core.Money): string {
  return money.format();
}

/**
 * Convert pesos to centavos for storage and calculation
 * @param pesos - Amount in pesos (e.g., 1299.50)
 * @returns Amount in centavos as Core.Money
 * @example toCentavos(1299.50) // 129950
 */
export function toCentavos(pesos: number): Core.Money {
  return Math.round(pesos * 100) as Core.Money;
}

/**
 * Parse WooCommerce price string to centavos
 * Handles various formats: "1299.50", "₱1,299.50", "PHP 1299.50"
 * @param price - Price string from WooCommerce
 * @returns Amount in centavos
 */
export function parseWooPrice(price: string | number): Core.Money {
  if (typeof price === 'number') {
    return Money.pesos(price);
  }
  return Money.parse(price);
}

/**
 * Calculate cart total from items
 * @param items - Array of cart items with price and quantity
 * @returns Total in centavos
 */
export function calculateCartTotal(
  items: Array<{ price: Core.Money; quantity: number }>
): Core.Money {
  const total = items.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);

  return total as Core.Money;
}

/**
 * Calculate discount amount
 * @param original - Original price in centavos
 * @param discountPercent - Discount percentage (0-100)
 * @returns Discount amount in centavos
 */
export function calculateDiscount(
  original: Core.Money,
  discountPercent: Core.Percentage
): Core.Money {
  const discount = Math.round((original * discountPercent) / 100);
  return discount as Core.Money;
}

/**
 * Apply discount to price
 * @param price - Original price in centavos
 * @param discountPercent - Discount percentage (0-100)
 * @returns Final price after discount
 */
export function applyDiscount(
  price: Core.Money,
  discountPercent: Core.Percentage
): Core.Money {
  const discount = calculateDiscount(price, discountPercent);
  return (price - discount) as Core.Money;
}

/**
 * Validate if a value is a valid money amount
 * @param value - Value to validate
 * @returns True if valid money amount
 */
export function isValidMoney(value: unknown): value is Core.Money {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= Number.MAX_SAFE_INTEGER
  );
}

/**
 * Safe money addition with overflow protection
 * @param a - First amount in centavos
 * @param b - Second amount in centavos
 * @returns Sum in centavos
 */
export function addMoney(a: Core.Money, b: Core.Money): Core.Money {
  const sum = a + b;

  if (sum > Number.MAX_SAFE_INTEGER) {
    throw new Error('Money overflow: sum exceeds maximum safe integer');
  }

  return sum as Core.Money;
}

/**
 * Safe money multiplication (for quantity)
 * @param money - Amount in centavos
 * @param quantity - Quantity to multiply by
 * @returns Total in centavos
 */
export function multiplyMoney(money: Core.Money, quantity: number): Core.Money {
  const result = money * quantity;

  if (result > Number.MAX_SAFE_INTEGER) {
    throw new Error('Money overflow: result exceeds maximum safe integer');
  }

  return Math.round(result) as Core.Money;
}

/**
 * Compare two money amounts
 * @param a - First amount
 * @param b - Second amount
 * @returns -1 if a < b, 0 if equal, 1 if a > b
 */
export function compareMoney(a: Core.Money, b: Core.Money): -1 | 0 | 1 {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/**
 * Format money for API/database storage
 * @param centavos - Amount in centavos
 * @returns Object with amount and currency
 */
export function serializeMoney(centavos: Core.Money): {
  amount: number;
  currency: Core.Currency;
} {
  return {
    amount: centavos,
    currency: 'PHP'
  };
}

/**
 * Parse money from API/database
 * @param data - Money data from API
 * @returns Amount in centavos
 */
export function deserializeMoney(data: {
  amount: number | string;
  currency?: string;
}): Core.Money {
  if (data.currency && data.currency !== 'PHP') {
    throw new Error(`Unsupported currency: ${data.currency}. Only PHP is supported.`);
  }

  if (typeof data.amount === 'string') {
    return parseWooPrice(data.amount);
  }

  return data.amount as Core.Money;
}

/**
 * Format money for display in components
 * @param centavos - Amount in centavos
 * @param showCurrency - Whether to show ₱ symbol
 * @returns Formatted display string
 */
export function displayMoney(
  centavos: Core.Money,
  showCurrency: boolean = true
): string {
  if (showCurrency) {
    return formatPrice(centavos);
  }

  const pesos = centavos / 100;
  return pesos.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Parse user input for money (from forms)
 * @param input - User input string
 * @returns Amount in centavos or null if invalid
 */
export function parseMoneyInput(input: string): Core.Money | null {
  // Remove spaces and currency symbols
  const cleaned = input.replace(/[₱\s,]/g, '');

  // Check if valid number
  if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) {
    return null;
  }

  const pesos = parseFloat(cleaned);

  if (isNaN(pesos) || pesos < 0) {
    return null;
  }

  return toCentavos(pesos);
}

// Export all functions as a namespace for convenience
export const PHPCurrency = {
  format: formatPrice,
  toCentavos,
  parseWooPrice,
  calculateTotal: calculateCartTotal,
  calculateDiscount,
  applyDiscount,
  isValid: isValidMoney,
  add: addMoney,
  multiply: multiplyMoney,
  compare: compareMoney,
  serialize: serializeMoney,
  deserialize: deserializeMoney,
  display: displayMoney,
  parseInput: parseMoneyInput
};

export default PHPCurrency;