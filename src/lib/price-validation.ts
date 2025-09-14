import { logger } from '@/lib/logger';

// Secure price parsing with comprehensive validation
export interface PriceParsingResult {
  success: boolean;
  value: number;
  error?: string;
  originalInput?: string | number;
}

// Price constraints for security
const PRICE_CONSTRAINTS = {
  MIN_VALUE: 0,
  MAX_VALUE: 999999999, // 999 million max
  MAX_DECIMAL_PLACES: 4, // For crypto compatibility if needed
  MAX_STRING_LENGTH: 20, // Prevent extremely long strings
} as const;

/**
 * Safely parse and validate price inputs
 * Handles string/number inputs, validates ranges, prevents overflow
 */
export function parsePrice(input: string | number | null | undefined, context?: string): PriceParsingResult {
  const logContext = context ? ` in ${context}` : '';

  // Handle null/undefined
  if (input === null || input === undefined) {
    logger.warn(`Price parsing: null/undefined input${logContext}`);
    return {
      success: false,
      value: 0,
      error: 'Price input is null or undefined',
      originalInput: undefined
    };
  }

  // Handle numeric input
  if (typeof input === 'number') {
    if (!Number.isFinite(input)) {
      logger.warn(`Price parsing: non-finite number${logContext}`, { input });
      return {
        success: false,
        value: 0,
        error: 'Price is not a finite number',
        originalInput: input
      };
    }

    if (input < PRICE_CONSTRAINTS.MIN_VALUE) {
      logger.warn(`Price parsing: negative price${logContext}`, { input });
      return {
        success: false,
        value: 0,
        error: 'Price cannot be negative',
        originalInput: input
      };
    }

    if (input > PRICE_CONSTRAINTS.MAX_VALUE) {
      logger.warn(`Price parsing: price exceeds maximum${logContext}`, { input });
      return {
        success: false,
        value: PRICE_CONSTRAINTS.MAX_VALUE,
        error: 'Price exceeds maximum allowed value',
        originalInput: input
      };
    }

    return {
      success: true,
      value: Math.round(input * 10000) / 10000, // Round to 4 decimal places
      originalInput: input
    };
  }

  // Handle string input
  if (typeof input === 'string') {
    // Check string length to prevent DoS
    if (input.length > PRICE_CONSTRAINTS.MAX_STRING_LENGTH) {
      logger.warn(`Price parsing: string too long${logContext}`, { length: input.length });
      return {
        success: false,
        value: 0,
        error: 'Price string is too long',
        originalInput: input
      };
    }

    // Trim whitespace
    const trimmed = input.trim();
    if (trimmed === '') {
      logger.warn(`Price parsing: empty string${logContext}`);
      return {
        success: false,
        value: 0,
        error: 'Price string is empty',
        originalInput: input
      };
    }

    // Remove common currency symbols and commas
    let cleaned = trimmed
      .replace(/[$₱€£¥₨₩]/g, '') // Remove currency symbols
      .replace(/,/g, '') // Remove commas
      .trim();

    // Validate format (numbers, decimal point, optional minus sign)
    const pricePattern = /^-?\d+\.?\d*$/;
    if (!pricePattern.test(cleaned)) {
      logger.warn(`Price parsing: invalid format${logContext}`, { input, cleaned });
      return {
        success: false,
        value: 0,
        error: 'Price string has invalid format',
        originalInput: input
      };
    }

    // Count decimal places
    const decimalParts = cleaned.split('.');
    if (decimalParts.length > 2) {
      logger.warn(`Price parsing: multiple decimal points${logContext}`, { input });
      return {
        success: false,
        value: 0,
        error: 'Price has multiple decimal points',
        originalInput: input
      };
    }

    if (decimalParts.length === 2) {
      const decimalPart = decimalParts[1];
      if (decimalPart && decimalPart.length > PRICE_CONSTRAINTS.MAX_DECIMAL_PLACES) {
        logger.warn(`Price parsing: too many decimal places${logContext}`, { 
          input, 
          decimalPlaces: decimalPart.length
        });
        return {
          success: false,
          value: 0,
          error: `Price has too many decimal places (max ${PRICE_CONSTRAINTS.MAX_DECIMAL_PLACES})`,
          originalInput: input
        };
      }
    }

    // Parse the number
    const parsed = parseFloat(cleaned);
    
    // Re-validate the parsed result
    return parsePrice(parsed, context);
  }

  // Handle other types
  logger.warn(`Price parsing: unsupported type${logContext}`, { 
    input, 
    type: typeof input 
  });
  return {
    success: false,
    value: 0,
    error: `Unsupported price type: ${typeof input}`,
    originalInput: input
  };
}

/**
 * Calculate safe price multiplication with overflow protection
 */
export function safePriceMultiply(price: string | number, quantity: number, context?: string): PriceParsingResult {
  const priceResult = parsePrice(price, context);
  if (!priceResult.success) {
    return priceResult;
  }

  const quantityResult = parsePrice(quantity, `${context} quantity`);
  if (!quantityResult.success) {
    return quantityResult;
  }

  // Check for overflow before multiplication
  if (priceResult.value > 0 && quantityResult.value > PRICE_CONSTRAINTS.MAX_VALUE / priceResult.value) {
    logger.error(`Price multiplication overflow prevented`, {
      price: priceResult.value,
      quantity: quantityResult.value,
      context
    });
    return {
      success: false,
      value: PRICE_CONSTRAINTS.MAX_VALUE,
      error: 'Price calculation would cause overflow',
      originalInput: `${price} * ${quantity}`
    };
  }

  const result = priceResult.value * quantityResult.value;
  return {
    success: true,
    value: Math.round(result * 10000) / 10000, // Round to 4 decimal places
    originalInput: `${price} * ${quantity}`
  };
}

/**
 * Calculate discount percentage safely
 */
export function calculateDiscountPercentage(
  regularPrice: string | number, 
  salePrice: string | number,
  context?: string
): PriceParsingResult {
  const regularResult = parsePrice(regularPrice, `${context} regular price`);
  if (!regularResult.success) {
    return regularResult;
  }

  const saleResult = parsePrice(salePrice, `${context} sale price`);
  if (!saleResult.success) {
    return saleResult;
  }

  // Validate relationship
  if (saleResult.value > regularResult.value) {
    logger.warn(`Price calculation: sale price higher than regular${context ? ` in ${context}` : ''}`, {
      regular: regularResult.value,
      sale: saleResult.value
    });
    return {
      success: false,
      value: 0,
      error: 'Sale price is higher than regular price',
      originalInput: `${regularPrice} vs ${salePrice}`
    };
  }

  if (regularResult.value === 0) {
    return {
      success: false,
      value: 0,
      error: 'Cannot calculate discount: regular price is zero',
      originalInput: `${regularPrice} vs ${salePrice}`
    };
  }

  const discount = ((regularResult.value - saleResult.value) / regularResult.value) * 100;
  
  return {
    success: true,
    value: Math.round(discount * 100) / 100, // Round to 2 decimal places
    originalInput: `${regularPrice} vs ${salePrice}`
  };
}

/**
 * Validate a price object structure
 */
export function validatePrice(priceObj: { regular?: string; sale?: string }): boolean {
  if (!priceObj.regular) {
    return false;
  }

  const regularResult = parsePrice(priceObj.regular, 'validatePrice regular');
  if (!regularResult.success) {
    return false;
  }

  if (priceObj.sale) {
    const saleResult = parsePrice(priceObj.sale, 'validatePrice sale');
    if (!saleResult.success) {
      return false;
    }

    // Sale price cannot be higher than regular price
    if (saleResult.value > regularResult.value) {
      return false;
    }
  }

  return true;
}

/**
 * Format price for display with currency
 */
export function formatPriceForDisplay(price: string | number | null | undefined, currency: string = 'PHP'): string {
  if (price === null || price === undefined) {
    return 'N/A';
  }

  const priceResult = parsePrice(price, 'formatPriceForDisplay');
  if (!priceResult.success) {
    return 'N/A';
  }

  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: currency,
  }).format(priceResult.value);
}

/**
 * Legacy parseFloat replacement - DEPRECATED, use parsePrice instead
 * This is for gradual migration only
 */
export function legacyParseFloat(input: string | number, fallback: number = 0): number {
  const result = parsePrice(input, 'legacy-migration');
  if (!result.success) {
    logger.warn('Using legacy parseFloat fallback', { input, fallback, error: result.error });
    return fallback;
  }
  return result.value;
}