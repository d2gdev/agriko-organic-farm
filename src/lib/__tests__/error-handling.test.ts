import { parsePrice, safePriceMultiply } from '../price-validation';

describe('Error Handling', () => {
  describe('Price Validation Error Cases', () => {
    it('should handle null inputs gracefully', () => {
      const result = parsePrice(null, 'test');
      expect(result.success).toBe(false);
      expect(result.error).toContain('null or undefined');
      expect(result.value).toBe(0);
    });

    it('should handle undefined inputs gracefully', () => {
      const result = parsePrice(undefined, 'test');
      expect(result.success).toBe(false);
      expect(result.error).toContain('null or undefined');
      expect(result.value).toBe(0);
    });

    it('should handle non-finite numbers', () => {
      const infinityResult = parsePrice(Infinity, 'test');
      expect(infinityResult.success).toBe(false);
      expect(infinityResult.error).toContain('not a finite number');

      const nanResult = parsePrice(NaN, 'test');
      expect(nanResult.success).toBe(false);
      expect(nanResult.error).toContain('not a finite number');
    });

    it('should handle extremely long strings', () => {
      const longString = 'x'.repeat(100);
      const result = parsePrice(longString, 'test');
      expect(result.success).toBe(false);
      expect(result.error).toContain('too long');
    });

    it('should handle strings with multiple decimal points', () => {
      const result = parsePrice('12.34.56', 'test');
      expect(result.success).toBe(false);
      expect(result.error).toContain('invalid format'); // Caught by regex first
    });

    it('should handle strings with too many decimal places', () => {
      const result = parsePrice('12.123456', 'test');
      expect(result.success).toBe(false);
      expect(result.error).toContain('too many decimal places');
    });

    it('should handle negative prices', () => {
      const result = parsePrice(-50, 'test');
      expect(result.success).toBe(false);
      expect(result.error).toContain('cannot be negative');
    });

    it('should handle prices exceeding maximum value', () => {
      const result = parsePrice(1000000000, 'test');
      expect(result.success).toBe(false);
      expect(result.error).toContain('exceeds maximum');
    });

    it('should handle empty strings', () => {
      const result = parsePrice('', 'test');
      expect(result.success).toBe(false);
      expect(result.error).toContain('empty');
    });

    it('should handle whitespace-only strings', () => {
      const result = parsePrice('   ', 'test');
      expect(result.success).toBe(false);
      expect(result.error).toContain('empty');
    });

    it('should handle invalid string formats', () => {
      const result = parsePrice('abc123', 'test');
      expect(result.success).toBe(false);
      expect(result.error).toContain('invalid format');
    });

    it('should handle unsupported input types', () => {
      const result = parsePrice({} as any, 'test');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported price type');
    });
  });

  describe('Safe Price Multiplication Error Cases', () => {
    it('should handle overflow in multiplication', () => {
      const result = safePriceMultiply(999999999, 2, 'test');
      expect(result.success).toBe(false);
      expect(result.error).toContain('overflow');
    });

    it('should handle invalid price in multiplication', () => {
      const result = safePriceMultiply('invalid', 5, 'test');
      expect(result.success).toBe(false);
      expect(result.error).toContain('invalid format');
    });

    it('should handle invalid quantity in multiplication', () => {
      const result = safePriceMultiply('100', 'invalid' as any, 'test');
      expect(result.success).toBe(false);
      expect(result.error).toContain('invalid format');
    });

    it('should succeed with valid inputs', () => {
      const result = safePriceMultiply('50.99', 3, 'test');
      expect(result.success).toBe(true);
      expect(result.value).toBeCloseTo(152.97, 2);
    });
  });

  describe('Context and Logging', () => {
    it('should include context in error messages', () => {
      const result = parsePrice('invalid', 'checkout-total');
      expect(result.success).toBe(false);
      expect(result.originalInput).toBe('invalid');
    });

    it('should handle missing context gracefully', () => {
      const result = parsePrice('invalid');
      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero values correctly', () => {
      const result = parsePrice(0, 'test');
      expect(result.success).toBe(true);
      expect(result.value).toBe(0);
    });

    it('should handle very small decimal values', () => {
      const result = parsePrice('0.0001', 'test');
      expect(result.success).toBe(true);
      expect(result.value).toBe(0.0001);
    });

    it('should handle currency symbols', () => {
      const result = parsePrice('$50.99', 'test');
      expect(result.success).toBe(true);
      expect(result.value).toBe(50.99);
    });

    it('should handle comma separators', () => {
      const result = parsePrice('1,234.56', 'test');
      expect(result.success).toBe(true);
      expect(result.value).toBe(1234.56);
    });

    it('should reject strings with more than 4 decimal places', () => {
      const result = parsePrice('12.123456', 'test');
      expect(result.success).toBe(false);
      expect(result.error).toContain('too many decimal places');
    });
  });
});