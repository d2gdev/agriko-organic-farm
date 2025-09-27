/**
 * Comprehensive tests for Money class
 * Proves the Money class eliminates all type assertion needs
 */

import { Money, MoneyError, MoneyUtils } from '../money';

describe('Money Class', () => {
  describe('Construction', () => {
    it('creates Money from pesos', () => {
      const money = Money.pesos(299.50);
      expect(money.pesos).toBe(299.50);
      expect(money.cents).toBe(29950);
    });

    it('creates Money from centavos', () => {
      const money = Money.centavos(29950);
      expect(money.pesos).toBe(299.50);
      expect(money.cents).toBe(29950);
    });

    it('handles zero values', () => {
      expect(Money.pesos(0).isZero).toBe(true);
      expect(Money.ZERO.isZero).toBe(true);
    });

    it('throws on negative amounts', () => {
      expect(() => Money.pesos(-1)).toThrow(MoneyError);
      expect(() => Money.centavos(-1)).toThrow(MoneyError);
    });

    it('throws on invalid amounts', () => {
      expect(() => Money.pesos(NaN)).toThrow(MoneyError);
      expect(() => Money.pesos(Infinity)).toThrow(MoneyError);
    });
  });

  describe('Parsing', () => {
    it('parses WooCommerce price strings', () => {
      expect(Money.parse('299.50').pesos).toBe(299.50);
      expect(Money.parse('₱299.50').pesos).toBe(299.50);
      expect(Money.parse('$299.50').pesos).toBe(299.50);
      expect(Money.parse('299,999.50').pesos).toBe(299999.50);
    });

    it('handles null and undefined', () => {
      expect(Money.parse(null).isZero).toBe(true);
      expect(Money.parse(undefined).isZero).toBe(true);
      expect(Money.parse('').isZero).toBe(true);
    });

    it('parses numeric inputs', () => {
      expect(Money.parse(299.50).pesos).toBe(299.50);
      expect(Money.parse(0).isZero).toBe(true);
    });

    it('throws on invalid strings', () => {
      expect(() => Money.parse('invalid')).toThrow(MoneyError);
      expect(() => Money.parse('abc123')).toThrow(MoneyError);
    });

    it('handles WooCommerce API responses', () => {
      expect(Money.fromWooCommerce('299.50').pesos).toBe(299.50);
      expect(Money.fromWooCommerce(null).isZero).toBe(true);
      expect(Money.fromWooCommerce('').isZero).toBe(true);
    });
  });

  describe('Arithmetic Operations', () => {
    const price1 = Money.pesos(100);
    const price2 = Money.pesos(50);

    it('adds money amounts', () => {
      const sum = price1.add(price2);
      expect(sum.pesos).toBe(150);
    });

    it('subtracts money amounts', () => {
      const diff = price1.subtract(price2);
      expect(diff.pesos).toBe(50);
    });

    it('throws on negative subtraction', () => {
      expect(() => price2.subtract(price1)).toThrow(MoneyError);
    });

    it('multiplies by quantities', () => {
      const total = price1.multiply(3);
      expect(total.pesos).toBe(300);
    });

    it('calculates percentages', () => {
      const tax = price1.percentage(10);
      expect(tax.pesos).toBe(10);
    });

    it('divides amounts', () => {
      const half = price1.divide(2);
      expect(half.pesos).toBe(50);
    });

    it('throws on invalid operations', () => {
      expect(() => price1.multiply(-1)).toThrow(MoneyError);
      expect(() => price1.divide(0)).toThrow(MoneyError);
      expect(() => price1.divide(-1)).toThrow(MoneyError);
    });
  });

  describe('Comparisons', () => {
    const money1 = Money.pesos(100);
    const money2 = Money.pesos(50);
    const money3 = Money.pesos(100);

    it('compares equality', () => {
      expect(money1.equals(money3)).toBe(true);
      expect(money1.equals(money2)).toBe(false);
    });

    it('compares greater than', () => {
      expect(money1.greaterThan(money2)).toBe(true);
      expect(money2.greaterThan(money1)).toBe(false);
    });

    it('compares less than', () => {
      expect(money2.lessThan(money1)).toBe(true);
      expect(money1.lessThan(money2)).toBe(false);
    });
  });

  describe('Formatting', () => {
    const money = Money.pesos(299.50);

    it('formats for display', () => {
      expect(money.format()).toBe('₱299.50');
      expect(money.toString()).toBe('₱299.50');
    });

    it('formats for WooCommerce API', () => {
      expect(money.toWooCommerce()).toBe('299.50');
    });

    it('converts to number', () => {
      expect(money.toNumber()).toBe(299.50);
    });
  });

  describe('JSON Serialization', () => {
    const money = Money.pesos(299.50);

    it('serializes to JSON', () => {
      const json = money.toJSON();
      expect(json).toEqual({
        pesos: 299.50,
        centavos: 29950
      });
    });

    it('deserializes from JSON', () => {
      const json = { pesos: 299.50, centavos: 29950 };
      const restored = Money.fromJSON(json);
      expect(restored.equals(money)).toBe(true);
    });

    it('handles invalid JSON', () => {
      expect(() => Money.fromJSON({})).toThrow(MoneyError);
    });
  });

  describe('Utility Functions', () => {
    const amounts = [
      Money.pesos(100),
      Money.pesos(200),
      Money.pesos(50)
    ];

    it('sums amounts', () => {
      const total = MoneyUtils.sum(amounts);
      expect(total.pesos).toBe(350);
    });

    it('finds minimum', () => {
      const min = MoneyUtils.min(amounts);
      expect(min.pesos).toBe(50);
    });

    it('finds maximum', () => {
      const max = MoneyUtils.max(amounts);
      expect(max.pesos).toBe(200);
    });

    it('calculates average', () => {
      const avg = MoneyUtils.average(amounts);
      expect(avg.pesos).toBeCloseTo(116.67, 2);
    });

    it('throws on empty arrays', () => {
      expect(() => MoneyUtils.min([])).toThrow(MoneyError);
      expect(() => MoneyUtils.max([])).toThrow(MoneyError);
      expect(() => MoneyUtils.average([])).toThrow(MoneyError);
    });
  });

  describe('Real World Scenarios', () => {
    it('handles cart calculations', () => {
      const items = [
        { price: Money.pesos(299.50), quantity: 2 },
        { price: Money.pesos(149.99), quantity: 1 },
        { price: Money.pesos(89.00), quantity: 3 }
      ];

      const total = items.reduce((sum, item) =>
        sum.add(item.price.multiply(item.quantity)),
        Money.ZERO
      );

      expect(total.pesos).toBe(1116.99);
    });

    it('handles WooCommerce product data', () => {
      // Simulate WooCommerce API response
      const productData = {
        price: '299.50',
        regular_price: '349.99',
        sale_price: '299.50'
      };

      const price = Money.fromWooCommerce(productData.price);
      const regularPrice = Money.fromWooCommerce(productData.regular_price);
      const discount = regularPrice.subtract(price);

      expect(price.pesos).toBe(299.50);
      expect(regularPrice.pesos).toBe(349.99);
      expect(discount.pesos).toBe(50.49);
    });

    it('handles tax calculations', () => {
      const subtotal = Money.pesos(1000);
      const taxRate = 12; // 12% VAT in Philippines
      const tax = subtotal.percentage(taxRate);
      const total = subtotal.add(tax);

      expect(tax.pesos).toBe(120);
      expect(total.pesos).toBe(1120);
    });

    it('prevents floating point errors', () => {
      // Test case that would fail with regular JavaScript numbers
      const price = Money.pesos(0.1);
      const quantity = 3;
      const total = price.multiply(quantity);

      // This would be 0.30000000000000004 with regular numbers
      expect(total.pesos).toBe(0.3);
      expect(total.toString()).toBe('₱0.30');
    });
  });
});