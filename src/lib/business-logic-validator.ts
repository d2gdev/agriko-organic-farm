import { Core } from '@/types/TYPE_REGISTRY';
import { logger } from '@/lib/logger';
import { APIError, ErrorType } from '@/lib/error-handler';

// Business entity interfaces
export interface WooCommerceProduct {
  id: number;
  name: string;
  status: 'publish' | 'private' | 'draft';
  stock_status: 'instock' | 'outofstock' | 'onbackorder';
  manage_stock: boolean;
  stock_quantity: number | null;
  price: string;
  regular_price: string;
  sale_price: Core.Money;
  type: 'simple' | 'grouped' | 'external' | 'variable';
  categories: Array<{ id: number; name: string; slug: string }>;
  weight?: string;
  dimensions?: {
    length: string;
    width: string;
    height: string;
  };
}

export interface ShoppingCart {
  items: CartItem[];
  total: number;
  currency: string;
  session_id: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  product_id: number;
  quantity: number;
  price: number;
  product_name: string;
  product_sku?: string;
  variation_id?: number;
}

export interface Order {
  id: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded';
  total: number;
  currency: string;
  line_items: OrderLineItem[];
  billing: BillingAddress;
  shipping?: ShippingAddress;
  payment_method: string;
  payment_method_title: string;
  customer_id?: number;
  date_created: string;
}

export interface OrderLineItem {
  id: number;
  product_id: number;
  variation_id?: number;
  quantity: number;
  name: string;
  price: number;
  total: number;
  sku?: string;
}

export interface BillingAddress {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address_1: string;
  address_2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
}

export interface ShippingAddress {
  first_name: string;
  last_name: string;
  address_1: string;
  address_2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
}

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
  static validateProductAvailability(product: WooCommerceProduct): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      violations: [],
      errors: [],
      warnings: []
    };

    try {
      // Check if product exists and is published
      if (!product) {
        result.isValid = false;
        result.violations.push(BusinessRuleViolation.PRODUCT_AVAILABILITY);
        result.errors.push('Product does not exist');
        return result;
      }

      if (product.status !== 'publish') {
        result.isValid = false;
        result.violations.push(BusinessRuleViolation.PRODUCT_AVAILABILITY);
        result.errors.push('Product is not available for purchase');
        return result;
      }

      // Check price validity
      const price = parseFloat(product.price);
      if (!price || price <= 0) {
        result.isValid = false;
        result.violations.push(BusinessRuleViolation.INVALID_PRICING);
        result.errors.push('Product has invalid pricing');
      }

      // Check sale price logic
      const salePrice = product.sale_price || null;
      const regularPrice = product.regular_price;
      if (salePrice && regularPrice && typeof salePrice === "number" && typeof regularPrice === "number") {
        if (salePrice >= regularPrice) {
          result.isValid = false;
          result.violations.push(BusinessRuleViolation.INVALID_PRICING);
          result.errors.push('Sale price cannot be greater than or equal to regular price');
        }
      }

      // Stock warnings
      const manageStock = product.manage_stock;
      const stock = product.stock_quantity;
      if (manageStock && stock !== null && stock !== undefined) {
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
    product: WooCommerceProduct,
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

      const manageStock = product.manage_stock;
      
      if (!manageStock) {
        // If stock is not managed, allow operation but log warning
        result.warnings.push('Product stock is not managed');
        return result;
      }

      const currentStock = product.stock_quantity ?? 0;

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
  static validateCartIntegrity(cart: ShoppingCart): ValidationResult {
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

      if (!Array.isArray(cart.items)) {
        result.isValid = false;
        result.violations.push(BusinessRuleViolation.CART_CORRUPTION);
        result.errors.push('Cart structure is invalid');
        return result;
      }

      // Validate item count consistency
      const calculatedItemCount = cart.items.reduce((sum: number, item) => {
        if (!item || typeof item !== 'object') {
          result.violations.push(BusinessRuleViolation.CART_CORRUPTION);
          result.errors.push('Invalid cart item structure');
          return sum;
        }
        const quantity = typeof item.quantity === 'number' ? item.quantity : 0;
        if (quantity < 0) {
          result.violations.push(BusinessRuleViolation.CART_CORRUPTION);
          result.errors.push(`Invalid quantity for item ${String(item.product_id)}`);
          return sum;
        }
        return sum + quantity;
      }, 0);

      // ShoppingCart doesn't have itemCount field, so skip this check
      // The actual item count is cart.items.length
      if (cart.items.length !== calculatedItemCount) {
        result.isValid = false;
        result.violations.push(BusinessRuleViolation.CART_CORRUPTION);
        result.errors.push('Cart item count does not match actual items');
      }

      // Validate total consistency
      const calculatedTotal = cart.items.reduce((sum: number, item) => {
        if (!item || typeof item !== 'object') {
          result.violations.push(BusinessRuleViolation.CART_CORRUPTION);
          result.errors.push('Invalid cart item structure');
          return sum;
        }
        const price = typeof item.price === 'number' ? item.price : 0;
        const quantity = typeof item.quantity === 'number' ? item.quantity : 0;
        if (price < 0) {
          result.violations.push(BusinessRuleViolation.CART_CORRUPTION);
          result.errors.push(`Invalid price for item ${String(item.product_id)}`);
          return sum;
        }
        return sum + (price * quantity);
      }, 0);

      const total = typeof cart.total === 'number' ? cart.total : 0;
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
      const productIds = cart.items.map((item) => {
        return item.product_id;
      }).filter(id => id != null);
      const uniqueIds = new Set(productIds);
      if (productIds.length !== uniqueIds.size) {
        result.violations.push(BusinessRuleViolation.CART_CORRUPTION);
        result.errors.push('Cart contains duplicate items');
      }

      // Validate individual items
      for (const item of cart.items) {
        if (!item || typeof item !== 'object') {
          result.violations.push(BusinessRuleViolation.CART_CORRUPTION);
          result.errors.push('Invalid cart item structure');
          continue;
        }
        
        // CartItem has product_id, not productId
        if (!item.product_id || !item.product_name) {
          result.violations.push(BusinessRuleViolation.CART_CORRUPTION);
          result.errors.push('Cart item missing required fields');
        }

        const quantity = typeof item.quantity === 'number' ? item.quantity : 0;
        if (quantity > 100) {
          result.warnings.push(`Very high quantity (${quantity}) for item ${String(item.product_id)}`);
        }
      }

      // Check cart size limits
      if (cart.items.length > 50) {
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
    cart: ShoppingCart,
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

      const existingItem = cart.items.find((item) => {
        return item.product_id === productId;
      });

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
  static validateOrderConsistency(order: Order): ValidationResult {
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

      // Validate required fields
      if (!order.line_items) {
        result.isValid = false;
        result.violations.push(BusinessRuleViolation.ORDER_CONSISTENCY);
        result.errors.push('Order missing required field: line_items');
      }
      if (!order.total) {
        result.isValid = false;
        result.violations.push(BusinessRuleViolation.ORDER_CONSISTENCY);
        result.errors.push('Order missing required field: total');
      }
      // Note: Order doesn't have customerEmail, it's in billing.email
      if (!order.billing) {
        result.isValid = false;
        result.violations.push(BusinessRuleViolation.ORDER_CONSISTENCY);
        result.errors.push('Order missing required field: billing');
      }

      if (!Array.isArray(order.line_items) || order.line_items.length === 0) {
        result.isValid = false;
        result.violations.push(BusinessRuleViolation.ORDER_CONSISTENCY);
        result.errors.push('Order must have at least one line item');
        return result;
      }

      // Validate line items
      let calculatedTotal = 0;
      for (const item of order.line_items) {
        if (!item || typeof item !== 'object') {
          result.isValid = false;
          result.violations.push(BusinessRuleViolation.ORDER_CONSISTENCY);
          result.errors.push('Invalid line item structure');
          continue;
        }

        // OrderLineItem has product_id, not productId
        if (!item.product_id || !item.quantity || !item.price) {
          result.isValid = false;
          result.violations.push(BusinessRuleViolation.ORDER_CONSISTENCY);
          result.errors.push('Line item missing required fields');
        }

        const quantity = typeof item.quantity === 'number' ? item.quantity : 0;
        const price = typeof item.price === 'number' ? item.price : 0;
        if (quantity <= 0 || price < 0) {
          result.isValid = false;
          result.violations.push(BusinessRuleViolation.ORDER_CONSISTENCY);
          result.errors.push('Line item has invalid quantity or price');
        }

        const itemTotal = price * quantity;
        const expectedItemTotal = typeof item.total === 'number' ? item.total : null;
        if (expectedItemTotal && Math.abs(expectedItemTotal - itemTotal) > 0.01) {
          result.violations.push(BusinessRuleViolation.ORDER_CONSISTENCY);
          result.errors.push(`Line item total mismatch for product ${String(item.product_id)}`);
        }

        calculatedTotal += itemTotal;
      }

      // Validate order total
      const orderTotal = typeof order.total === 'number' ? order.total : 0;
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
      if (order.billing && !this.validateAddress(order.billing as BillingAddress)) {
        result.violations.push(BusinessRuleViolation.ORDER_CONSISTENCY);
        result.errors.push('Invalid billing address');
      }

      if (order.shipping && !this.validateAddress(order.shipping as ShippingAddress)) {
        result.violations.push(BusinessRuleViolation.SHIPPING_VALIDATION);
        result.errors.push('Invalid shipping address');
      }

      // Validate payment method
      const validPaymentMethods = ['credit_card', 'paypal', 'bank_transfer', 'cash_on_delivery'];
      const paymentMethod = typeof order.payment_method === 'string' ? order.payment_method : null;
      if (paymentMethod && !validPaymentMethods.includes(paymentMethod)) {
        result.violations.push(BusinessRuleViolation.PAYMENT_VALIDATION);
        result.errors.push('Invalid payment method');
      }

      // Business rules
      if (orderTotal > 10000) {
        result.warnings.push('High value order - may require additional verification');
      }

      if (order.line_items.length > 20) {
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

  private static validateAddress(address: BillingAddress | ShippingAddress): boolean {
    if (!address || typeof address !== 'object') return false;

    // Check required fields based on actual interface
    return Boolean(
      address.first_name && typeof address.first_name === 'string' &&
      address.last_name && typeof address.last_name === 'string' &&
      address.address_1 && typeof address.address_1 === 'string' &&
      address.city && typeof address.city === 'string' &&
      address.state && typeof address.state === 'string' &&
      address.postcode && typeof address.postcode === 'string' &&
      address.country && typeof address.country === 'string' &&
      ('email' in address ? address.email && typeof address.email === 'string' : true)
    );
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
  static validateProductPurchase(product: WooCommerceProduct, quantity: number): ValidationResult {
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