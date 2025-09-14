import {
  parsePrice,
  safePriceMultiply,
  calculateDiscountPercentage,
  validatePrice,
  formatPriceForDisplay,
  legacyParseFloat
} from '@/lib/price-validation';

describe('Price Validation', () => {
  describe('parsePrice', () => {
    it('should parse valid numeric prices', () => {
      const result = parsePrice(19.99, 'test');
      expect(result.success).toBe(true);
      expect(result.value).toBe(19.99);
    });

    it('should parse valid string prices', () => {
      const result = parsePrice('19.99', 'test');
      expect(result.success).toBe(true);
      expect(result.value).toBe(19.99);
    });

    it('should handle integer prices', () => {
      const result = parsePrice(20, 'test');
      expect(result.success).toBe(true);
      expect(result.value).toBe(20);
    });

    it('should handle string integers', () => {
      const result = parsePrice('20', 'test');
      expect(result.success).toBe(true);
      expect(result.value).toBe(20);
    });

    it('should reject negative prices', () => {
      const result = parsePrice(-10, 'test');
      expect(result.success).toBe(false);
      expect(result.error).toContain('negative');
    });

    it('should reject NaN values', () => {
      const result = parsePrice(NaN, 'test');
      expect(result.success).toBe(false);
      expect(result.error).toContain('not a finite number');
    });

    it('should reject invalid strings', () => {
      const result = parsePrice('invalid', 'test');
      expect(result.success).toBe(false);
      expect(result.error).toContain('invalid format');
    });

    it('should reject empty strings', () => {
      const result = parsePrice('', 'test');
      expect(result.success).toBe(false);
      expect(result.error).toContain('empty');
    });

    it('should reject null values', () => {
      const result = parsePrice(null as any, 'test');
      expect(result.success).toBe(false);
      expect(result.error).toContain('null or undefined');
    });

    it('should reject undefined values', () => {
      const result = parsePrice(undefined as any, 'test');
      expect(result.success).toBe(false);
      expect(result.error).toContain('null or undefined');
    });

    it('should handle very large numbers', () => {
      const result = parsePrice(Number.MAX_SAFE_INTEGER + 1, 'test');
      expect(result.success).toBe(false);
      expect(result.error).toContain('maximum allowed value');
    });

    it('should handle zero', () => {
      const result = parsePrice(0, 'test');
      expect(result.success).toBe(true);
      expect(result.value).toBe(0);
    });

    it('should handle string zero', () => {
      const result = parsePrice('0', 'test');
      expect(result.success).toBe(true);
      expect(result.value).toBe(0);
    });

    it('should handle decimal zero', () => {
      const result = parsePrice('0.00', 'test');
      expect(result.success).toBe(true);
      expect(result.value).toBe(0);
    });

    it('should include context in error messages', () => {
      const result = parsePrice('invalid', 'calculateTotal');
      expect(result.success).toBe(false);
      expect(result.error).toContain('invalid format'); // Context is used for logging, not error message
    });
  });

  describe('validatePrice', () => {
    it('should validate price objects with valid prices', () => {
      expect(validatePrice({ regular: '19.99' })).toBe(true);
      expect(validatePrice({ regular: '19.99', sale: '15.99' })).toBe(true);
    });

    it('should reject price objects with invalid regular prices', () => {
      expect(validatePrice({ regular: '-10' })).toBe(false);
      expect(validatePrice({ regular: 'invalid' })).toBe(false);
    });

    it('should reject price objects with invalid sale prices', () => {
      expect(validatePrice({ regular: '19.99', sale: 'invalid' })).toBe(false);
      expect(validatePrice({ regular: '19.99', sale: '25.99' })).toBe(false); // sale higher than regular
    });

    it('should handle empty price objects', () => {
      expect(validatePrice({})).toBe(false);
    });
  });

  describe('legacyParseFloat', () => {
    it('should parse valid numeric inputs', () => {
      expect(legacyParseFloat(19.99)).toBe(19.99);
      expect(legacyParseFloat('19.99')).toBe(19.99);
    });

    it('should return fallback for invalid inputs', () => {
      expect(legacyParseFloat('invalid')).toBe(0);
      expect(legacyParseFloat(-10)).toBe(0);
      expect(legacyParseFloat(NaN)).toBe(0);
      expect(legacyParseFloat(null as any)).toBe(0);
      expect(legacyParseFloat(undefined as any)).toBe(0);
    });

    it('should handle custom fallback values', () => {
      expect(legacyParseFloat('invalid', 100)).toBe(100);
      expect(legacyParseFloat(-10, 50)).toBe(50);
    });

    it('should handle edge cases', () => {
      expect(legacyParseFloat(0)).toBe(0);
      expect(legacyParseFloat('0')).toBe(0);
      expect(legacyParseFloat('0.00')).toBe(0);
    });

    it('should handle whitespace and currency symbols in strings', () => {
      expect(legacyParseFloat(' 19.99 ')).toBe(19.99);
      expect(legacyParseFloat('$19.99')).toBe(19.99);
    });
  });

  describe('formatPriceForDisplay', () => {
    it('should format valid prices with default currency', () => {
      expect(formatPriceForDisplay(19.99)).toContain('19.99');
      expect(formatPriceForDisplay('19.99')).toContain('19.99');
    });

    it('should handle null and undefined inputs', () => {
      expect(formatPriceForDisplay(null)).toBe('N/A');
      expect(formatPriceForDisplay(undefined)).toBe('N/A');
    });

    it('should handle invalid prices', () => {
      expect(formatPriceForDisplay('invalid')).toBe('N/A');
      expect(formatPriceForDisplay(-10)).toBe('N/A');
    });

    it('should format with custom currency', () => {
      expect(formatPriceForDisplay(19.99, 'USD')).toContain('19.99');
    });

    it('should handle zero prices', () => {
      expect(formatPriceForDisplay(0)).toContain('0');
      expect(formatPriceForDisplay('0')).toContain('0');
    });
  });

  describe('safePriceMultiply', () => {
    it('should multiply valid prices and quantities', () => {
      const result = safePriceMultiply(19.99, 2, 'test');
      expect(result.success).toBe(true);
      expect(result.value).toBe(39.98);
    });

    it('should handle string inputs', () => {
      const result = safePriceMultiply('19.99', 2, 'test');
      expect(result.success).toBe(true);
      expect(result.value).toBe(39.98);
    });

    it('should reject invalid prices', () => {
      const result = safePriceMultiply('invalid', 2, 'test');
      expect(result.success).toBe(false);
      expect(result.error).toContain('invalid format');
    });

    it('should reject invalid quantities', () => {
      const result = safePriceMultiply(19.99, -1, 'test');
      expect(result.success).toBe(false);
      expect(result.error).toContain('negative');
    });

    it('should prevent overflow', () => {
      const result = safePriceMultiply(999999999, 999999999, 'test');
      expect(result.success).toBe(false);
      expect(result.error).toContain('overflow');
    });

    it('should handle zero values', () => {
      const result = safePriceMultiply(19.99, 0, 'test');
      expect(result.success).toBe(true);
      expect(result.value).toBe(0);
    });
  });

  describe('calculateDiscountPercentage', () => {
    it('should calculate discount percentage correctly', () => {
      const result = calculateDiscountPercentage(100, 80, 'test');
      expect(result.success).toBe(true);
      expect(result.value).toBe(20);
    });

    it('should handle string inputs', () => {
      const result = calculateDiscountPercentage('100', '75', 'test');
      expect(result.success).toBe(true);
      expect(result.value).toBe(25);
    });

    it('should reject when sale price is higher than regular', () => {
      const result = calculateDiscountPercentage(80, 100, 'test');
      expect(result.success).toBe(false);
      expect(result.error).toContain('higher than regular');
    });

    it('should reject zero regular prices', () => {
      const result = calculateDiscountPercentage(0, 0, 'test');
      expect(result.success).toBe(false);
      expect(result.error).toContain('regular price is zero');
    });

    it('should handle invalid inputs', () => {
      const result = calculateDiscountPercentage('invalid', 50, 'test');
      expect(result.success).toBe(false);
      expect(result.error).toContain('invalid format');
    });

    it('should handle equal prices (no discount)', () => {
      const result = calculateDiscountPercentage(100, 100, 'test');
      expect(result.success).toBe(true);
      expect(result.value).toBe(0);
    });
  });

  describe('edge cases and security', () => {
    it('should handle very long numeric strings', () => {
      const longNumber = '1'.repeat(1000);
      const result = parsePrice(longNumber, 'test');
      expect(result.success).toBe(false);
    });

    it('should handle scientific notation', () => {
      const result = parsePrice('1e10', 'test');
      expect(result.success).toBe(false);
      expect(result.error).toContain('invalid format');
    });

    it('should handle negative scientific notation', () => {
      const result = parsePrice('-1e2', 'test');
      expect(result.success).toBe(false);
      expect(result.error).toContain('invalid format');
    });

    it('should handle hex numbers', () => {
      const result = parsePrice('0x10', 'test');
      expect(result.success).toBe(false);
      expect(result.error).toContain('invalid format');
    });

    it('should handle octal numbers', () => {
      const result = parsePrice('0o10', 'test');
      expect(result.success).toBe(false);
      expect(result.error).toContain('invalid format');
    });

    it('should handle binary numbers', () => {
      const result = parsePrice('0b10', 'test');
      expect(result.success).toBe(false);
      expect(result.error).toContain('invalid format');
    });
  });
});