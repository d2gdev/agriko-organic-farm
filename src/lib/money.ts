/**
 * Bulletproof Money class for PHP currency handling
 * Eliminates all type assertions and string/number confusion
 */

export class MoneyError extends Error {
  constructor(message: string, public readonly input?: unknown) {
    super(message);
    this.name = 'MoneyError';
  }
}

/**
 * Immutable Money class that handles PHP currency with centavo precision
 * Replaces all Core.Money branded types and price validation utilities
 */
export class Money {
  private constructor(private readonly centavos: number) {
    if (!Number.isInteger(centavos)) {
      throw new MoneyError(`Money must be stored as integer centavos, got: ${centavos}`);
    }
    if (centavos < 0) {
      throw new MoneyError(`Money cannot be negative, got: ${centavos} centavos`);
    }
    if (centavos > 99999999999) { // 999 million pesos max
      throw new MoneyError(`Money exceeds maximum value, got: ${centavos} centavos`);
    }
  }

  /**
   * Create Money from peso amount
   * @param pesos - Amount in pesos (e.g., 299.50)
   */
  static pesos(pesos: number): Money {
    if (!Number.isFinite(pesos)) {
      throw new MoneyError(`Invalid peso amount: ${pesos}`);
    }
    if (pesos < 0) {
      throw new MoneyError(`Peso amount cannot be negative: ${pesos}`);
    }

    // Round to avoid floating point precision issues
    const centavos = Math.round(pesos * 100);
    return new Money(centavos);
  }

  /**
   * Create Money from centavo amount
   * @param centavos - Amount in centavos (e.g., 29950 for ₱299.50)
   */
  static centavos(centavos: number): Money {
    if (!Number.isInteger(centavos)) {
      throw new MoneyError(`Centavos must be integer, got: ${centavos}`);
    }
    return new Money(centavos);
  }

  /**
   * Parse Money from string or number
   * Handles WooCommerce price strings and numeric inputs
   */
  static parse(input: string | number | null | undefined): Money {
    if (input === null || input === undefined) {
      return Money.centavos(0);
    }

    if (typeof input === 'number') {
      return Money.pesos(input);
    }

    if (typeof input === 'string') {
      // Clean the string - remove currency symbols, commas, whitespace
      const cleaned = input
        .trim()
        .replace(/[₱$,\s]/g, '')
        .replace(/[^\d.-]/g, '');

      if (cleaned === '' || cleaned === '-') {
        return Money.centavos(0);
      }

      const parsed = parseFloat(cleaned);
      if (!Number.isFinite(parsed)) {
        throw new MoneyError(`Cannot parse price string: "${input}"`);
      }

      return Money.pesos(parsed);
    }

    throw new MoneyError(`Unsupported money input type: ${typeof input}`, input);
  }

  /**
   * Create Money from WooCommerce API response
   * Specifically handles WooCommerce price strings
   */
  static fromWooCommerce(priceString: string | null | undefined): Money {
    if (!priceString || priceString === '') {
      return Money.centavos(0);
    }
    return Money.parse(priceString);
  }

  /**
   * Zero money constant
   */
  static readonly ZERO = new Money(0);

  /**
   * Get amount in pesos (e.g., 299.50)
   */
  get pesos(): number {
    return this.centavos / 100;
  }

  /**
   * Get amount in centavos (e.g., 29950)
   */
  get cents(): number {
    return this.centavos;
  }

  /**
   * Check if this money amount is zero
   */
  get isZero(): boolean {
    return this.centavos === 0;
  }

  /**
   * Check if this money amount is positive
   */
  get isPositive(): boolean {
    return this.centavos > 0;
  }

  /**
   * Add another Money amount
   */
  add(other: Money): Money {
    return new Money(this.centavos + other.centavos);
  }

  /**
   * Subtract another Money amount
   */
  subtract(other: Money): Money {
    const result = this.centavos - other.centavos;
    if (result < 0) {
      throw new MoneyError(`Subtraction would result in negative money: ${this.pesos} - ${other.pesos}`);
    }
    return new Money(result);
  }

  /**
   * Multiply by a number (for quantity calculations)
   */
  multiply(factor: number): Money {
    if (!Number.isFinite(factor) || factor < 0) {
      throw new MoneyError(`Invalid multiplication factor: ${factor}`);
    }

    const result = Math.round(this.centavos * factor);
    return new Money(result);
  }

  /**
   * Divide by a number
   */
  divide(divisor: number): Money {
    if (!Number.isFinite(divisor) || divisor <= 0) {
      throw new MoneyError(`Invalid division divisor: ${divisor}`);
    }

    const result = Math.round(this.centavos / divisor);
    return new Money(result);
  }

  /**
   * Calculate percentage of this amount
   */
  percentage(percent: number): Money {
    if (!Number.isFinite(percent)) {
      throw new MoneyError(`Invalid percentage: ${percent}`);
    }

    return this.multiply(percent / 100);
  }

  /**
   * Compare with another Money amount
   */
  equals(other: Money): boolean {
    return this.centavos === other.centavos;
  }

  /**
   * Check if this amount is greater than another
   */
  greaterThan(other: Money): boolean {
    return this.centavos > other.centavos;
  }

  /**
   * Check if this amount is less than another
   */
  lessThan(other: Money): boolean {
    return this.centavos < other.centavos;
  }

  /**
   * Format for display with peso symbol
   */
  format(): string {
    return `₱${this.pesos.toFixed(2)}`;
  }

  /**
   * Format for WooCommerce API (plain number string)
   */
  toWooCommerce(): string {
    return this.pesos.toFixed(2);
  }

  /**
   * Convert to plain number (for calculations where needed)
   */
  toNumber(): number {
    return this.pesos;
  }

  /**
   * String representation (formatted)
   */
  toString(): string {
    return this.format();
  }

  /**
   * JSON serialization
   */
  toJSON(): { pesos: number; centavos: number } {
    return {
      pesos: this.pesos,
      centavos: this.centavos
    };
  }

  /**
   * Create Money from JSON
   */
  static fromJSON(json: { pesos?: number; centavos?: number }): Money {
    if (typeof json.centavos === 'number') {
      return Money.centavos(json.centavos);
    }
    if (typeof json.pesos === 'number') {
      return Money.pesos(json.pesos);
    }
    throw new MoneyError('Invalid Money JSON format', json);
  }
}

/**
 * Type guard to check if value is Money instance
 */
export function isMoney(value: unknown): value is Money {
  return value instanceof Money;
}

/**
 * Utility functions for common operations
 */
export const MoneyUtils = {
  /**
   * Sum an array of Money amounts
   */
  sum(amounts: Money[]): Money {
    return amounts.reduce((total, amount) => total.add(amount), Money.ZERO);
  },

  /**
   * Find minimum amount from array
   */
  min(amounts: Money[]): Money {
    if (amounts.length === 0) {
      throw new MoneyError('Cannot find minimum of empty array');
    }
    return amounts.reduce((min, amount) => amount.lessThan(min) ? amount : min);
  },

  /**
   * Find maximum amount from array
   */
  max(amounts: Money[]): Money {
    if (amounts.length === 0) {
      throw new MoneyError('Cannot find maximum of empty array');
    }
    return amounts.reduce((max, amount) => amount.greaterThan(max) ? amount : max);
  },

  /**
   * Calculate average of Money amounts
   */
  average(amounts: Money[]): Money {
    if (amounts.length === 0) {
      throw new MoneyError('Cannot calculate average of empty array');
    }
    return this.sum(amounts).divide(amounts.length);
  }
};