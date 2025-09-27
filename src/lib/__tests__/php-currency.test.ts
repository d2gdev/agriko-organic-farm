/**
 * PHP Currency Utilities Test Suite
 */

import { Core } from '@/types/TYPE_REGISTRY';
import {
  formatPrice,
  toCentavos,
  parseWooPrice,
  calculateCartTotal,
  calculateDiscount,
  applyDiscount,
  isValidMoney,
  addMoney,
  multiplyMoney,
  compareMoney,
  serializeMoney,
  deserializeMoney,
  displayMoney,
  parseMoneyInput,
  PHPCurrency
} from '../php-currency';

describe('PHP Currency Utilities', () => {
  describe('formatPrice', () => {
    it('should format centavos to PHP peso display', () => {
      expect(formatPrice(129900 as Core.Money)).toBe('₱1,299.00');
      expect(formatPrice(100 as Core.Money)).toBe('₱1.00');
      expect(formatPrice(50 as Core.Money)).toBe('₱0.50');
      expect(formatPrice(0 as Core.Money)).toBe('₱0.00');
      expect(formatPrice(999999 as Core.Money)).toBe('₱9,999.99');
    });

    it('should handle large amounts', () => {
      expect(formatPrice(1234567890 as Core.Money)).toBe('₱12,345,678.90');
    });
  });

  describe('toCentavos', () => {
    it('should convert pesos to centavos', () => {
      expect(toCentavos(1299.00)).toBe(129900);
      expect(toCentavos(1299.50)).toBe(129950);
      expect(toCentavos(1299.99)).toBe(129999);
      expect(toCentavos(0.01)).toBe(1);
      expect(toCentavos(0.1)).toBe(10);
    });

    it('should round to nearest centavo', () => {
      expect(toCentavos(1299.999)).toBe(130000);
      expect(toCentavos(1299.001)).toBe(129900);
      expect(toCentavos(1299.005)).toBe(129901);
    });
  });

  describe('parseWooPrice', () => {
    it('should parse various price formats', () => {
      expect(parseWooPrice('1299.50')).toBe(129950);
      expect(parseWooPrice('₱1,299.50')).toBe(129950);
      expect(parseWooPrice('PHP 1299.50')).toBe(129950);
      expect(parseWooPrice('₱ 1,299.50')).toBe(129950);
      expect(parseWooPrice(1299.50)).toBe(129950);
    });

    it('should handle edge cases', () => {
      expect(parseWooPrice('0')).toBe(0);
      expect(parseWooPrice('₱0.00')).toBe(0);
      expect(parseWooPrice('invalid')).toBe(0);
      expect(parseWooPrice('')).toBe(0);
    });
  });

  describe('calculateCartTotal', () => {
    it('should calculate cart total correctly', () => {
      const items = [
        { price: 129900 as Core.Money, quantity: 1 },
        { price: 50000 as Core.Money, quantity: 2 },
        { price: 25000 as Core.Money, quantity: 3 }
      ];

      expect(calculateCartTotal(items)).toBe(304900);
    });

    it('should handle empty cart', () => {
      expect(calculateCartTotal([])).toBe(0);
    });

    it('should handle single item', () => {
      const items = [{ price: 129900 as Core.Money, quantity: 1 }];
      expect(calculateCartTotal(items)).toBe(129900);
    });
  });

  describe('calculateDiscount', () => {
    it('should calculate discount amount', () => {
      expect(calculateDiscount(100000 as Core.Money, 10 as Core.Percentage)).toBe(10000);
      expect(calculateDiscount(100000 as Core.Money, 25 as Core.Percentage)).toBe(25000);
      expect(calculateDiscount(100000 as Core.Money, 50 as Core.Percentage)).toBe(50000);
      expect(calculateDiscount(100000 as Core.Money, 100 as Core.Percentage)).toBe(100000);
    });

    it('should handle edge cases', () => {
      expect(calculateDiscount(100000 as Core.Money, 0 as Core.Percentage)).toBe(0);
      expect(calculateDiscount(0 as Core.Money, 50 as Core.Percentage)).toBe(0);
    });
  });

  describe('applyDiscount', () => {
    it('should apply discount correctly', () => {
      expect(applyDiscount(100000 as Core.Money, 10 as Core.Percentage)).toBe(90000);
      expect(applyDiscount(100000 as Core.Money, 25 as Core.Percentage)).toBe(75000);
      expect(applyDiscount(100000 as Core.Money, 50 as Core.Percentage)).toBe(50000);
    });
  });

  describe('isValidMoney', () => {
    it('should validate money amounts', () => {
      expect(isValidMoney(0)).toBe(true);
      expect(isValidMoney(129900)).toBe(true);
      expect(isValidMoney(Number.MAX_SAFE_INTEGER)).toBe(true);

      expect(isValidMoney(-1)).toBe(false);
      expect(isValidMoney(129.50)).toBe(false);
      expect(isValidMoney('129900')).toBe(false);
      expect(isValidMoney(null)).toBe(false);
      expect(isValidMoney(undefined)).toBe(false);
    });
  });

  describe('addMoney', () => {
    it('should add money amounts safely', () => {
      expect(addMoney(100000 as Core.Money, 50000 as Core.Money)).toBe(150000);
      expect(addMoney(0 as Core.Money, 129900 as Core.Money)).toBe(129900);
    });

    it('should throw on overflow', () => {
      const max = Number.MAX_SAFE_INTEGER as Core.Money;
      expect(() => addMoney(max, 1 as Core.Money)).toThrow('overflow');
    });
  });

  describe('multiplyMoney', () => {
    it('should multiply money by quantity', () => {
      expect(multiplyMoney(129900 as Core.Money, 1)).toBe(129900);
      expect(multiplyMoney(129900 as Core.Money, 2)).toBe(259800);
      expect(multiplyMoney(129900 as Core.Money, 10)).toBe(1299000);
    });

    it('should handle decimal quantities', () => {
      expect(multiplyMoney(100000 as Core.Money, 1.5)).toBe(150000);
      expect(multiplyMoney(100000 as Core.Money, 0.5)).toBe(50000);
    });
  });

  describe('compareMoney', () => {
    it('should compare money amounts', () => {
      expect(compareMoney(100000 as Core.Money, 50000 as Core.Money)).toBe(1);
      expect(compareMoney(50000 as Core.Money, 100000 as Core.Money)).toBe(-1);
      expect(compareMoney(100000 as Core.Money, 100000 as Core.Money)).toBe(0);
    });
  });

  describe('serializeMoney', () => {
    it('should serialize money for API', () => {
      const result = serializeMoney(129900 as Core.Money);
      expect(result).toEqual({
        amount: 129900,
        currency: 'PHP'
      });
    });
  });

  describe('deserializeMoney', () => {
    it('should deserialize money from API', () => {
      expect(deserializeMoney({ amount: 129900 })).toBe(129900);
      expect(deserializeMoney({ amount: '1299.00' })).toBe(129900);
      expect(deserializeMoney({ amount: 129900, currency: 'PHP' })).toBe(129900);
    });

    it('should throw for unsupported currency', () => {
      expect(() => deserializeMoney({ amount: 100, currency: 'USD' }))
        .toThrow('Unsupported currency: USD');
    });
  });

  describe('displayMoney', () => {
    it('should display money with or without currency', () => {
      expect(displayMoney(129900 as Core.Money)).toBe('₱1,299.00');
      expect(displayMoney(129900 as Core.Money, true)).toBe('₱1,299.00');
      expect(displayMoney(129900 as Core.Money, false)).toBe('1,299.00');
    });
  });

  describe('parseMoneyInput', () => {
    it('should parse user input', () => {
      expect(parseMoneyInput('1299.50')).toBe(129950);
      expect(parseMoneyInput('₱1,299.50')).toBe(129950);
      expect(parseMoneyInput('1,299.50')).toBe(129950);
      expect(parseMoneyInput('1299')).toBe(129900);
    });

    it('should reject invalid input', () => {
      expect(parseMoneyInput('abc')).toBe(null);
      expect(parseMoneyInput('-100')).toBe(null);
      expect(parseMoneyInput('12.999')).toBe(null);
      expect(parseMoneyInput('')).toBe(null);
    });
  });

  describe('PHPCurrency namespace', () => {
    it('should expose all functions', () => {
      expect(PHPCurrency.format(129900 as Core.Money)).toBe('₱1,299.00');
      expect(PHPCurrency.toCentavos(1299)).toBe(129900);
      expect(PHPCurrency.parseWooPrice('₱1,299.00')).toBe(129900);
      expect(PHPCurrency.isValid(129900)).toBe(true);
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle typical shopping cart', () => {
      // Customer adds items to cart
      const cart = [
        { name: 'Rice 25kg', price: toCentavos(1299.00), quantity: 1 },
        { name: 'Cooking Oil 1L', price: toCentavos(89.50), quantity: 2 },
        { name: 'Sugar 1kg', price: toCentavos(65.75), quantity: 3 }
      ];

      // Calculate subtotal
      const subtotal = calculateCartTotal(cart);
      expect(subtotal).toBe(167525); // ₱1,675.25

      // Apply 10% discount
      const discount = calculateDiscount(subtotal, 10 as Core.Percentage);
      expect(discount).toBe(16753); // ₱167.53

      const total = (subtotal - discount) as Core.Money;
      expect(total).toBe(150772); // ₱1,507.72

      // Display to customer
      expect(formatPrice(total)).toBe('₱1,507.72');
    });

    it('should handle fractional peso amounts', () => {
      // Items with centavo prices
      const price1 = toCentavos(99.99);
      const price2 = toCentavos(149.99);
      const price3 = toCentavos(0.50);

      const total = addMoney(price1, addMoney(price2, price3));
      expect(total).toBe(25048); // ₱250.48
      expect(formatPrice(total)).toBe('₱250.48');
    });
  });
});