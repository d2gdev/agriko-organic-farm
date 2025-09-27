/**
 * PHP Currency Utilities
 * All monetary values stored as centavos (integer) to prevent floating-point errors
 */

import { Core } from '@/types/TYPE_REGISTRY';
import { Money } from '@/lib/money';

/**
 * Format centavos to Philippine Peso display string
 * @param money - Money object or centavos number (for backward compatibility)
 * @returns Formatted string with ₱ symbol and thousand separators
 * @example formatPrice(Money.centavos(129900)) // "₱1,299.00"
 */
export function formatPrice(money: Core.Money | number): string {
  // Handle legacy number input
  if (typeof money === 'number') {
    return Money.centavos(money).format();
  }
  return money.format();
}

/**
 * Convert pesos to centavos for storage and calculation
 * @param pesos - Amount in pesos (e.g., 1299.50)
 * @returns Amount in centavos as number (for backward compatibility)
 * @example toCentavos(1299.50) // 129950
 */
export function toCentavos(pesos: number): number {
  return Math.round(pesos * 100);
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
 * @returns Total as Money object
 */
export function calculateCartTotal(
  items: Array<{ price: Core.Money | number; quantity: number }>
): Core.Money {
  let totalMoney = Money.ZERO;

  for (const item of items) {
    const itemMoney = typeof item.price === 'number'
      ? Money.centavos(item.price)
      : item.price;
    totalMoney = totalMoney.add(itemMoney.multiply(item.quantity));
  }

  return totalMoney;
}

/**
 * Calculate discount amount
 * @param original - Original price as Money or centavos number
 * @param discountPercent - Discount percentage (0-100)
 * @returns Discount amount as Money object
 */
export function calculateDiscount(
  original: Core.Money | number,
  discountPercent: Core.Percentage | number
): Core.Money {
  const money = typeof original === 'number'
    ? Money.centavos(original)
    : original;
  const percent = discountPercent as number;
  return money.percentage(percent);
}

/**
 * Apply discount to price
 * @param price - Original price as Money or centavos number
 * @param discountPercent - Discount percentage (0-100)
 * @returns Final price after discount
 */
export function applyDiscount(
  price: Core.Money | number,
  discountPercent: Core.Percentage | number
): Core.Money {
  const money = typeof price === 'number'
    ? Money.centavos(price)
    : price;
  const discount = calculateDiscount(money, discountPercent);
  return money.subtract(discount);
}

/**
 * Validate if a value is a valid money amount
 * @param value - Value to validate
 * @returns True if valid money amount
 */
export function isValidMoney(value: unknown): value is Core.Money {
  if (value instanceof Money) {
    return true;
  }
  // Check if it's a valid number that can be converted to Money
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= Number.MAX_SAFE_INTEGER
  );
}

/**
 * Safe money addition with overflow protection
 * @param a - First amount as Money or centavos number
 * @param b - Second amount as Money or centavos number
 * @returns Sum as Money object
 */
export function addMoney(a: Core.Money | number, b: Core.Money | number): Core.Money {
  const moneyA = typeof a === 'number' ? Money.centavos(a) : a;
  const moneyB = typeof b === 'number' ? Money.centavos(b) : b;

  // Money class already has overflow protection
  return moneyA.add(moneyB);
}

/**
 * Safe money multiplication (for quantity)
 * @param money - Amount as Money or centavos number
 * @param quantity - Quantity to multiply by
 * @returns Total as Money object
 */
export function multiplyMoney(money: Core.Money | number, quantity: number): Core.Money {
  const moneyObj = typeof money === 'number' ? Money.centavos(money) : money;

  // Money class already has overflow protection
  return moneyObj.multiply(quantity);
}

/**
 * Compare two money amounts
 * @param a - First amount as Money or centavos number
 * @param b - Second amount as Money or centavos number
 * @returns -1 if a < b, 0 if equal, 1 if a > b
 */
export function compareMoney(a: Core.Money | number, b: Core.Money | number): -1 | 0 | 1 {
  const moneyA = typeof a === 'number' ? Money.centavos(a) : a;
  const moneyB = typeof b === 'number' ? Money.centavos(b) : b;

  if (moneyA.lessThan(moneyB)) return -1;
  if (moneyA.greaterThan(moneyB)) return 1;
  return 0;
}

/**
 * Format money for API/database storage
 * @param money - Money object or centavos number
 * @returns Object with amount and currency
 */
export function serializeMoney(money: Core.Money | number): {
  amount: number;
  currency: Core.Currency;
} {
  const moneyObj = typeof money === 'number' ? Money.centavos(money) : money;
  return {
    amount: moneyObj.cents,
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

  return Money.centavos(data.amount);
}

/**
 * Format money for display in components
 * @param centavos - Amount in centavos
 * @param showCurrency - Whether to show ₱ symbol
 * @returns Formatted display string
 */
export function displayMoney(
  money: Core.Money | number,
  showCurrency: boolean = true
): string {
  if (showCurrency) {
    return formatPrice(money);
  }

  const moneyObj = typeof money === 'number' ? Money.centavos(money) : money;
  const pesos = moneyObj.pesos;
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

  return Money.pesos(pesos);
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