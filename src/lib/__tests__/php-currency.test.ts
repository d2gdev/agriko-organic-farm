/**
 * PHP Currency Utilities Test Suite
 */

import { Core } from '@/types/TYPE_REGISTRY';
import { Money } from '@/lib/money';
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
      expect(formatPrice(Money.centavos(129900))).toBe('₱1,299.00');
      expect(formatPrice(Money.centavos(100))).toBe('₱1.00');
      expect(formatPrice(Money.centavos(50))).toBe('₱0.50');
      expect(formatPrice(Money.centavos(0))).toBe('₱0.00');
      expect(formatPrice(Money.centavos(999999))).toBe('₱9,999.99');
      // Test backward compatibility with numbers
      expect(formatPrice(129900)).toBe('₱1,299.00');
    });

    it('should handle large amounts', () => {
      expect(formatPrice(Money.centavos(1234567890))).toBe('₱12,345,678.90');
      // Test backward compatibility
      expect(formatPrice(1234567890)).toBe('₱12,345,678.90');
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
      expect(parseWooPrice('1299.50').cents).toBe(129950);
      expect(parseWooPrice('₱1,299.50').cents).toBe(129950);
      expect(parseWooPrice('PHP 1299.50').cents).toBe(129950);
      expect(parseWooPrice('₱ 1,299.50').cents).toBe(129950);
      expect(parseWooPrice(1299.50).cents).toBe(129950);
    });

    it('should handle edge cases', () => {
      expect(parseWooPrice('0').cents).toBe(0);
      expect(parseWooPrice('₱0.00').cents).toBe(0);
      expect(parseWooPrice('invalid').cents).toBe(0);
      expect(parseWooPrice('').cents).toBe(0);
    });
  });

  describe('calculateCartTotal', () => {
    it('should calculate cart total correctly', () => {
      const items = [
        { price: Money.centavos(129900), quantity: 1 },
        { price: Money.centavos(50000), quantity: 2 },
        { price: Money.centavos(25000), quantity: 3 }
      ];

      expect(calculateCartTotal(items).cents).toBe(304900);
    });

    it('should handle empty cart', () => {
      expect(calculateCartTotal([]).cents).toBe(0);
    });

    it('should handle single item', () => {
      const items = [{ price: Money.centavos(129900), quantity: 1 }];
      expect(calculateCartTotal(items).cents).toBe(129900);
    });
  });

  describe('calculateDiscount', () => {
    it('should calculate discount amount', () => {
      expect(calculateDiscount(Money.centavos(100000), 10).cents).toBe(10000);
      expect(calculateDiscount(Money.centavos(100000), 25).cents).toBe(25000);
      expect(calculateDiscount(Money.centavos(100000), 50).cents).toBe(50000);
      expect(calculateDiscount(Money.centavos(100000), 100).cents).toBe(100000);
    });

    it('should handle edge cases', () => {
      expect(calculateDiscount(Money.centavos(100000), 0).cents).toBe(0);
      expect(calculateDiscount(Money.centavos(0), 50).cents).toBe(0);
    });
  });

  describe('applyDiscount', () => {
    it('should apply discount correctly', () => {
      expect(applyDiscount(Money.centavos(100000), 10).cents).toBe(90000);
      expect(applyDiscount(Money.centavos(100000), 25).cents).toBe(75000);
      expect(applyDiscount(Money.centavos(100000), 50).cents).toBe(50000);
    });
  });

  describe('isValidMoney', () => {
    it('should validate money amounts', () => {
      // Test Money instances
      expect(isValidMoney(Money.centavos(0))).toBe(true);
      expect(isValidMoney(Money.centavos(129900))).toBe(true);

      // Test numbers (backward compatibility)
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
      expect(addMoney(Money.centavos(100000), Money.centavos(50000)).cents).toBe(150000);
      expect(addMoney(Money.centavos(0), Money.centavos(129900)).cents).toBe(129900);
    });

    it('should throw on overflow', () => {
      const max = Money.centavos(99999999999); // Max safe value for Money class
      expect(() => addMoney(max, Money.centavos(1))).toThrow();
    });
  });

  describe('multiplyMoney', () => {
    it('should multiply money by quantity', () => {
      expect(multiplyMoney(Money.centavos(129900), 1).cents).toBe(129900);
      expect(multiplyMoney(Money.centavos(129900), 2).cents).toBe(259800);
      expect(multiplyMoney(Money.centavos(129900), 10).cents).toBe(1299000);
    });

    it('should handle decimal quantities', () => {
      expect(multiplyMoney(Money.centavos(100000), 1.5).cents).toBe(150000);
      expect(multiplyMoney(Money.centavos(100000), 0.5).cents).toBe(50000);
    });
  });

  describe('compareMoney', () => {
    it('should compare money amounts', () => {
      expect(compareMoney(Money.centavos(100000), Money.centavos(50000))).toBe(1);
      expect(compareMoney(Money.centavos(50000), Money.centavos(100000))).toBe(-1);
      expect(compareMoney(Money.centavos(100000), Money.centavos(100000))).toBe(0);
    });
  });

  describe('serializeMoney', () => {
    it('should serialize money for API', () => {
      const result = serializeMoney(Money.centavos(129900));
      expect(result).toEqual({
        amount: 129900,
        currency: 'PHP'
      });
    });
  });

  describe('deserializeMoney', () => {
    it('should deserialize money from API', () => {
      expect(deserializeMoney({ amount: 129900 })).toBe(129900);
      expect(deserializeMoney({ amount: '1299.00' }).cents).toBe(129900);
      expect(deserializeMoney({ amount: 129900, currency: 'PHP' }).cents).toBe(129900);
    });

    it('should throw for unsupported currency', () => {
      expect(() => deserializeMoney({ amount: 100, currency: 'USD' }))
        .toThrow('Unsupported currency: USD');
    });
  });

  describe('displayMoney', () => {
    it('should display money with or without currency', () => {
      expect(displayMoney(Money.centavos(129900))).toBe('₱1,299.00');
      expect(displayMoney(Money.centavos(129900), true)).toBe('₱1,299.00');
      expect(displayMoney(Money.centavos(129900), false)).toBe('1,299.00');
    });
  });

  describe('parseMoneyInput', () => {
    it('should parse user input', () => {
      expect(parseMoneyInput('1299.50')?.cents).toBe(129950);
      expect(parseMoneyInput('₱1,299.50')?.cents).toBe(129950);
      expect(parseMoneyInput('1,299.50')?.cents).toBe(129950);
      expect(parseMoneyInput('1299')?.cents).toBe(129900);
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
      expect(PHPCurrency.format(Money.centavos(129900))).toBe('₱1,299.00');
      expect(PHPCurrency.toCentavos(1299)).toBe(129900);
      expect(PHPCurrency.parseWooPrice('₱1,299.00').cents).toBe(129900);
      expect(PHPCurrency.isValid(Money.centavos(129900))).toBe(true);
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle typical shopping cart', () => {
      // Customer adds items to cart
      const cart = [
        { name: 'Rice 25kg', price: Money.centavos(toCentavos(1299.00)), quantity: 1 },
        { name: 'Cooking Oil 1L', price: Money.centavos(toCentavos(89.50)), quantity: 2 },
        { name: 'Sugar 1kg', price: Money.centavos(toCentavos(65.75)), quantity: 3 }
      ];

      // Calculate subtotal
      const subtotal = calculateCartTotal(cart);
      expect(subtotal.cents).toBe(167525); // ₱1,675.25

      // Apply 10% discount
      const discount = calculateDiscount(subtotal, 10);
      expect(discount.cents).toBe(16753); // ₱167.53

      const total = subtotal.subtract(discount);
      expect(total.cents).toBe(150772); // ₱1,507.72

      // Display to customer
      expect(formatPrice(total)).toBe('₱1,507.72');
    });

    it('should handle fractional peso amounts', () => {
      // Items with centavo prices
      const price1 = Money.centavos(toCentavos(99.99));
      const price2 = Money.centavos(toCentavos(149.99));
      const price3 = Money.centavos(toCentavos(0.50));

      const total = addMoney(price1, addMoney(price2, price3));
      expect(total.cents).toBe(25048); // ₱250.48
      expect(formatPrice(total)).toBe('₱250.48');
    });
  });
});