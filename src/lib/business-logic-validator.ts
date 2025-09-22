import { logger } from '@/lib/logger';
import { APIError, ErrorType } from '@/lib/error-handler';

// Business rule violation types
export enum BusinessRuleViolation {
  INSUFFICIENT_STOCK = 'INSUFFICIENT_STOCK',
  INVALID_PRICING = 'INVALID_PRICING',
  CART_CORRUPTION = 'CART_CORRUPTION',
  ORDER_CONSISTENCY = 'ORDER_CONSISTENCY',
  PRODUCT_AVAILABILITY = 'PRODUCT_AVAILABILITY',
  INVENTORY_MISMATCH = 'INVENTORY_MISMATCH',
  PAYMENT_VALIDATION = 'PAYMENT_VALIDATION',
  SHIPPING_VALIDATION = 'SHIPPING_VALIDATION',
}

// Business logic validation result
interface ValidationResult {
  isValid: boolean;
  violations: BusinessRuleViolation[];
  errors: string[];
  warnings: string[];
  metadata?: Record<string, unknown>;
}

// Product business logic validator
export class ProductBusinessValidator {
  static validateProductAvailability(product: unknown): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      violations: [],
      errors: [],
      warnings: []
    };

    try {
      // Check if product exists and is published
      if (!product || typeof product !== 'object') {
        result.isValid = false;
        result.violations.push(BusinessRuleViolation.PRODUCT_AVAILABILITY);
        result.errors.push('Product does not exist');
        return result;
      }

      const productObj = product as Record<string, unknown>;
      if (productObj.status !== 'publish') {
        result.isValid = false;
        result.violations.push(BusinessRuleViolation.PRODUCT_AVAILABILITY);
        result.errors.push('Product is not available for purchase');
        return result;
      }

      // Check price validity
      const price = typeof productObj.price === 'number' ? productObj.price : 0;
      if (!price || price <= 0) {
        result.isValid = false;
        result.violations.push(BusinessRuleViolation.INVALID_PRICING);
        result.errors.push('Product has invalid pricing');
      }

      // Check sale price logic
      const salePrice = typeof productObj.salePrice === 'number' ? productObj.salePrice : null;
      const regularPrice = typeof productObj.regularPrice === 'number' ? productObj.regularPrice : null;
      if (salePrice && regularPrice) {
        if (salePrice >= regularPrice) {
          result.isValid = false;
          result.violations.push(BusinessRuleViolation.INVALID_PRICING);
          result.errors.push('Sale price cannot be greater than or equal to regular price');
        }
      }

      // Stock warnings
      const manageStock = Boolean(productObj.manageStock);
      const stock = typeof productObj.stock === 'number' ? productObj.stock : undefined;
      if (manageStock && stock !== undefined) {
        if (stock <= 0) {
          result.warnings.push('Product is out of stock');
        } else if (stock <= 5) {
          result.warnings.push('Product has low stock');
        }
      }

      return result;
    } catch (error) {
      logger.error('Error validating product availability:', error as Record<string, unknown>);
      result.isValid = false;
      result.errors.push('Failed to validate product availability');
      return result;
    }
  }

  static validateInventoryOperation(
    product: unknown, 
    requestedQuantity: number, 
    operation: 'add' | 'remove' | 'reserve' = 'add'
  ): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      violations: [],
      errors: [],
      warnings: [],
      metadata: { operation, requestedQuantity }
    };

    try {
      if (!product || typeof product !== 'object') {
        result.isValid = false;
        result.errors.push('Invalid product data');
        return result;
      }

      const productObj = product as Record<string, unknown>;
      const manageStock = Boolean(productObj.manageStock);
      
      if (!manageStock) {
        // If stock is not managed, allow operation but log warning
        result.warnings.push('Product stock is not managed');
        return result;
      }

      const currentStock = typeof productObj.stock === 'number' ? productObj.stock : 0;

      switch (operation) {
        case 'add':
        case 'reserve':
          if (currentStock < requestedQuantity) {
            result.isValid = false;
            result.violations.push(BusinessRuleViolation.INSUFFICIENT_STOCK);
            result.errors.push(`Insufficient stock. Available: ${currentStock}, Requested: ${requestedQuantity}`);
            result.metadata = { ...result.metadata, availableStock: currentStock };
          }
          break;

        case 'remove':
          if (requestedQuantity > currentStock) {
            result.warnings.push('Attempting to remove more stock than available');
          }
          break;
      }

      // Check for negative stock
      if (currentStock < 0) {
        result.violations.push(BusinessRuleViolation.INVENTORY_MISMATCH);
        result.errors.push('Product has negative stock');
      }

      return result;
    } catch (error) {
      logger.error('Error validating inventory operation:', error as Record<string, unknown>);
      result.isValid = false;
      result.errors.push('Failed to validate inventory operation');
      return result;
    }
  }
}

// Cart business logic validator
export class CartBusinessValidator {
  static validateCartIntegrity(cart: unknown): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      violations: [],
      errors: [],
      warnings: []
    };

    try {
      if (!cart || typeof cart !== 'object') {
        result.isValid = false;
        result.violations.push(BusinessRuleViolation.CART_CORRUPTION);
        result.errors.push('Cart structure is invalid');
        return result;
      }

      const cartObj = cart as Record<string, unknown>;
      if (!Array.isArray(cartObj.items)) {
        result.isValid = false;
        result.violations.push(BusinessRuleViolation.CART_CORRUPTION);
        result.errors.push('Cart structure is invalid');
        return result;
      }

      // Validate item count consistency
      const calculatedItemCount = cartObj.items.reduce((sum: number, item: unknown) => {
        if (!item || typeof item !== 'object') {
          result.violations.push(BusinessRuleViolation.CART_CORRUPTION);
          result.errors.push('Invalid cart item structure');
          return sum;
        }
        const itemObj = item as Record<string, unknown>;
        const quantity = typeof itemObj.quantity === 'number' ? itemObj.quantity : 0;
        if (quantity < 0) {
          result.violations.push(BusinessRuleViolation.CART_CORRUPTION);
          result.errors.push(`Invalid quantity for item ${String(itemObj.productId)}`);
          return sum;
        }
        return sum + quantity;
      }, 0);

      const itemCount = typeof cartObj.itemCount === 'number' ? cartObj.itemCount : 0;
      if (itemCount !== calculatedItemCount) {
        result.isValid = false;
        result.violations.push(BusinessRuleViolation.CART_CORRUPTION);
        result.errors.push('Cart item count does not match actual items');
      }

      // Validate total consistency
      const calculatedTotal = cartObj.items.reduce((sum: number, item: unknown) => {
        if (!item || typeof item !== 'object') {
          result.violations.push(BusinessRuleViolation.CART_CORRUPTION);
          result.errors.push('Invalid cart item structure');
          return sum;
        }
        const itemObj = item as Record<string, unknown>;
        const price = typeof itemObj.price === 'number' ? itemObj.price : 0;
        const quantity = typeof itemObj.quantity === 'number' ? itemObj.quantity : 0;
        if (price < 0) {
          result.violations.push(BusinessRuleViolation.CART_CORRUPTION);
          result.errors.push(`Invalid price for item ${String(itemObj.productId)}`);
          return sum;
        }
        return sum + (price * quantity);
      }, 0);

      const total = typeof cartObj.total === 'number' ? cartObj.total : 0;
      if (Math.abs(total - calculatedTotal) > 0.01) {
        result.isValid = false;
        result.violations.push(BusinessRuleViolation.CART_CORRUPTION);
        result.errors.push('Cart total does not match calculated total');
        result.metadata = {
          expectedTotal: total,
          calculatedTotal,
          difference: total - calculatedTotal
        };
      }

      // Check for duplicate items
      const productIds = cartObj.items.map((item: unknown) => {
        if (!item || typeof item !== 'object') return null;
        const itemObj = item as Record<string, unknown>;
        return itemObj.productId;
      }).filter(id => id != null);
      const uniqueIds = new Set(productIds);
      if (productIds.length !== uniqueIds.size) {
        result.violations.push(BusinessRuleViolation.CART_CORRUPTION);
        result.errors.push('Cart contains duplicate items');
      }

      // Validate individual items
      for (const item of cartObj.items) {
        if (!item || typeof item !== 'object') {
          result.violations.push(BusinessRuleViolation.CART_CORRUPTION);
          result.errors.push('Invalid cart item structure');
          continue;
        }
        
        const itemObj = item as Record<string, unknown>;
        if (!itemObj.productId || !itemObj.name) {
          result.violations.push(BusinessRuleViolation.CART_CORRUPTION);
          result.errors.push('Cart item missing required fields');
        }

        const quantity = typeof itemObj.quantity === 'number' ? itemObj.quantity : 0;
        if (quantity > 100) {
          result.warnings.push(`Very high quantity (${quantity}) for item ${String(itemObj.productId)}`);
        }
      }

      // Check cart size limits
      if (cartObj.items.length > 50) {
        result.warnings.push('Cart has many items, consider checkout');
      }

      if (calculatedTotal > 99999.99) {
        result.warnings.push('Cart total is very high');
      }

      return result;
    } catch (error) {
      logger.error('Error validating cart integrity:', error as Record<string, unknown>);
      result.isValid = false;
      result.violations.push(BusinessRuleViolation.CART_CORRUPTION);
      result.errors.push('Failed to validate cart integrity');
      return result;
    }
  }

  static validateCartOperation(
    cart: unknown, 
    operation: 'add' | 'update' | 'remove', 
    productId: number, 
    quantity?: number
  ): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      violations: [],
      errors: [],
      warnings: [],
      metadata: { operation, productId, quantity }
    };

    try {
      // First validate cart integrity
      const integrityResult = this.validateCartIntegrity(cart);
      if (!integrityResult.isValid) {
        return integrityResult;
      }

      if (!cart || typeof cart !== 'object') {
        result.isValid = false;
        result.errors.push('Invalid cart data');
        return result;
      }

      const cartObj = cart as Record<string, unknown>;
      if (!Array.isArray(cartObj.items)) {
        result.isValid = false;
        result.errors.push('Invalid cart structure');
        return result;
      }

      const existingItem = cartObj.items.find((item: unknown) => {
        if (!item || typeof item !== 'object') return false;
        const itemObj = item as Record<string, unknown>;
        return itemObj.productId === productId;
      }) as Record<string, unknown> | undefined;

      switch (operation) {
        case 'add':
          if (!quantity || quantity <= 0) {
            result.isValid = false;
            result.errors.push('Invalid quantity for add operation');
            break;
          }

          if (existingItem) {
            const existingQuantity = typeof existingItem.quantity === 'number' ? existingItem.quantity : 0;
            const newQuantity = existingQuantity + quantity;
            if (newQuantity > 100) {
              result.warnings.push('Item quantity would exceed recommended maximum');
            }
          }
          break;

        case 'update':
          if (!existingItem) {
            result.isValid = false;
            result.errors.push('Cannot update item that does not exist in cart');
            break;
          }

          if (!quantity || quantity < 0) {
            result.isValid = false;
            result.errors.push('Invalid quantity for update operation');
          }
          break;

        case 'remove':
          if (!existingItem) {
            result.warnings.push('Attempting to remove item that does not exist in cart');
          }
          break;
      }

      return result;
    } catch (error) {
      logger.error('Error validating cart operation:', error as Record<string, unknown>);
      result.isValid = false;
      result.errors.push('Failed to validate cart operation');
      return result;
    }
  }
}

// Order business logic validator
export class OrderBusinessValidator {
  static validateOrderConsistency(order: unknown): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      violations: [],
      errors: [],
      warnings: []
    };

    try {
      if (!order || typeof order !== 'object') {
        result.isValid = false;
        result.violations.push(BusinessRuleViolation.ORDER_CONSISTENCY);
        result.errors.push('Order is null or undefined');
        return result;
      }

      const orderObj = order as Record<string, unknown>;

      // Validate required fields
      const requiredFields = ['lineItems', 'total', 'customerEmail', 'billing'];
      for (const field of requiredFields) {
        if (!orderObj[field]) {
          result.isValid = false;
          result.violations.push(BusinessRuleViolation.ORDER_CONSISTENCY);
          result.errors.push(`Order missing required field: ${field}`);
        }
      }

      if (!Array.isArray(orderObj.lineItems) || orderObj.lineItems.length === 0) {
        result.isValid = false;
        result.violations.push(BusinessRuleViolation.ORDER_CONSISTENCY);
        result.errors.push('Order must have at least one line item');
        return result;
      }

      // Validate line items
      let calculatedTotal = 0;
      for (const item of orderObj.lineItems) {
        if (!item || typeof item !== 'object') {
          result.isValid = false;
          result.violations.push(BusinessRuleViolation.ORDER_CONSISTENCY);
          result.errors.push('Invalid line item structure');
          continue;
        }

        const itemObj = item as Record<string, unknown>;
        if (!itemObj.productId || !itemObj.quantity || !itemObj.price) {
          result.isValid = false;
          result.violations.push(BusinessRuleViolation.ORDER_CONSISTENCY);
          result.errors.push('Line item missing required fields');
        }

        const quantity = typeof itemObj.quantity === 'number' ? itemObj.quantity : 0;
        const price = typeof itemObj.price === 'number' ? itemObj.price : 0;
        if (quantity <= 0 || price < 0) {
          result.isValid = false;
          result.violations.push(BusinessRuleViolation.ORDER_CONSISTENCY);
          result.errors.push('Line item has invalid quantity or price');
        }

        const itemTotal = price * quantity;
        const expectedItemTotal = typeof itemObj.total === 'number' ? itemObj.total : null;
        if (expectedItemTotal && Math.abs(expectedItemTotal - itemTotal) > 0.01) {
          result.violations.push(BusinessRuleViolation.ORDER_CONSISTENCY);
          result.errors.push(`Line item total mismatch for product ${String(itemObj.productId)}`);
        }

        calculatedTotal += itemTotal;
      }

      // Validate order total
      const orderTotal = typeof orderObj.total === 'number' ? orderObj.total : 0;
      if (Math.abs(orderTotal - calculatedTotal) > 0.01) {
        result.isValid = false;
        result.violations.push(BusinessRuleViolation.ORDER_CONSISTENCY);
        result.errors.push('Order total does not match line items total');
        result.metadata = {
          expectedTotal: orderTotal,
          calculatedTotal,
          difference: orderTotal - calculatedTotal
        };
      }

      // Validate addresses
      if (orderObj.billing && !this.validateAddress(orderObj.billing)) {
        result.violations.push(BusinessRuleViolation.ORDER_CONSISTENCY);
        result.errors.push('Invalid billing address');
      }

      if (orderObj.shipping && !this.validateAddress(orderObj.shipping)) {
        result.violations.push(BusinessRuleViolation.SHIPPING_VALIDATION);
        result.errors.push('Invalid shipping address');
      }

      // Validate payment method
      const validPaymentMethods = ['credit_card', 'paypal', 'bank_transfer', 'cash_on_delivery'];
      const paymentMethod = typeof orderObj.paymentMethod === 'string' ? orderObj.paymentMethod : null;
      if (paymentMethod && !validPaymentMethods.includes(paymentMethod)) {
        result.violations.push(BusinessRuleViolation.PAYMENT_VALIDATION);
        result.errors.push('Invalid payment method');
      }

      // Business rules
      if (orderTotal > 10000) {
        result.warnings.push('High value order - may require additional verification');
      }

      if (orderObj.lineItems.length > 20) {
        result.warnings.push('Large order - may require special handling');
      }

      return result;
    } catch (error) {
      logger.error('Error validating order consistency:', error as Record<string, unknown>);
      result.isValid = false;
      result.violations.push(BusinessRuleViolation.ORDER_CONSISTENCY);
      result.errors.push('Failed to validate order consistency');
      return result;
    }
  }

  private static validateAddress(address: unknown): boolean {
    if (!address || typeof address !== 'object') return false;
    
    const addressObj = address as Record<string, unknown>;
    const requiredFields = ['street', 'city', 'state', 'zipCode', 'country'];
    return requiredFields.every(field => addressObj[field] && typeof addressObj[field] === 'string');
  }

  static validateOrderStatusTransition(currentStatus: string, newStatus: string): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      violations: [],
      errors: [],
      warnings: []
    };

    const validTransitions: Record<string, string[]> = {
      'pending': ['processing', 'cancelled'],
      'processing': ['shipped', 'cancelled'],
      'shipped': ['delivered', 'cancelled'],
      'delivered': ['refunded'],
      'cancelled': [], // Cannot transition from cancelled
      'refunded': [], // Cannot transition from refunded
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      result.isValid = false;
      result.violations.push(BusinessRuleViolation.ORDER_CONSISTENCY);
      result.errors.push(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }

    return result;
  }
}

// Comprehensive business validator
export class BusinessValidator {
  static validateProductPurchase(product: unknown, quantity: number): ValidationResult {
    // Combine multiple validations
    const availabilityResult = ProductBusinessValidator.validateProductAvailability(product);
    if (!availabilityResult.isValid) {
      return availabilityResult;
    }

    const inventoryResult = ProductBusinessValidator.validateInventoryOperation(product, quantity, 'reserve');
    
    // Merge results
    return {
      isValid: availabilityResult.isValid && inventoryResult.isValid,
      violations: [...availabilityResult.violations, ...inventoryResult.violations],
      errors: [...availabilityResult.errors, ...inventoryResult.errors],
      warnings: [...availabilityResult.warnings, ...inventoryResult.warnings],
      metadata: {
        availability: availabilityResult.metadata,
        inventory: inventoryResult.metadata
      }
    };
  }

  static throwOnValidationFailure(result: ValidationResult, context?: string): void {
    if (!result.isValid) {
      const errorMessage = result.errors.join('; ');
      const contextPrefix = context ? `${context}: ` : '';
      
      // Determine error type based on violations
      if (result.violations.includes(BusinessRuleViolation.INSUFFICIENT_STOCK)) {
        throw new APIError(
          `${contextPrefix}${errorMessage}`,
          ErrorType.CONFLICT,
          409,
          result.metadata,
          'INSUFFICIENT_STOCK'
        );
      }
      
      if (result.violations.includes(BusinessRuleViolation.PRODUCT_AVAILABILITY)) {
        throw new APIError(
          `${contextPrefix}${errorMessage}`,
          ErrorType.NOT_FOUND,
          404,
          result.metadata,
          'PRODUCT_NOT_AVAILABLE'
        );
      }
      
      // Default to validation error
      throw new APIError(
        `${contextPrefix}${errorMessage}`,
        ErrorType.VALIDATION,
        400,
        result.metadata,
        'BUSINESS_RULE_VIOLATION'
      );
    }
  }

  static logValidationResult(result: ValidationResult, context: string): void {
    if (!result.isValid) {
      logger.error(`Business validation failed: ${context}`, {
        violations: result.violations,
        errors: result.errors,
        metadata: result.metadata
      } as Record<string, unknown>);
    }

    if (result.warnings.length > 0) {
      logger.warn(`Business validation warnings: ${context}`, {
        warnings: result.warnings,
        metadata: result.metadata
      } as Record<string, unknown>);
    }
  }
}

const businessValidatorModule = {
  BusinessRuleViolation,
  ProductBusinessValidator,
  CartBusinessValidator,
  OrderBusinessValidator,
  BusinessValidator,
};

export default businessValidatorModule;