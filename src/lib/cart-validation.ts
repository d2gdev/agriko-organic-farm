import { z } from 'zod';
import { logger } from '@/lib/logger';
import { Money } from '@/lib/money';

import { CartItem } from '@/context/CartContext';
import { WCProduct } from '@/types/woocommerce';

// Custom Zod schema for price fields - WooCommerce sends prices as strings
const priceSchema = z.union([
  z.string(), // WooCommerce sends prices as strings like "299.00"
  z.undefined(),
  z.null()
]).optional();

// Keep the old name for compatibility
const moneySchema = priceSchema;

// Cart item validation schema
const cartItemValidationSchema = z.object({
  product: z.object({
    id: z.number().int().positive(),
    name: z.string().min(1).max(200),
    price: priceSchema, // WooCommerce sends as string
    slug: z.string().min(1).max(100),
    permalink: z.string().optional(),
    description: z.string().optional(),
    short_description: z.string().optional(),
    regular_price: priceSchema, // WooCommerce sends as string
    sale_price: priceSchema, // WooCommerce sends as string
    on_sale: z.boolean().optional(),
    status: z.enum(['draft', 'pending', 'private', 'publish']).optional(),
    featured: z.boolean().optional(),
    catalog_visibility: z.enum(['visible', 'catalog', 'search', 'hidden']).optional(),
    sku: z.string().optional(),
    stock_status: z.enum(['instock', 'outofstock', 'onbackorder']).optional(),
    stock_quantity: z.union([z.number(), z.null()]).optional(), // WooCommerce sends as number or null
    manage_stock: z.boolean().optional(),
    categories: z.array(z.unknown()).optional(),
    tags: z.array(z.unknown()).optional(),
    images: z.array(z.unknown()).optional(),
    attributes: z.array(z.unknown()).optional(),
    variations: z.array(z.number()).optional(),
    weight: z.string().optional(),
    dimensions: z.unknown().optional(),
    meta_data: z.array(z.unknown()).optional(),
    average_rating: z.string().optional(), // WooCommerce sends as string
    rating_count: z.number().optional(), // WooCommerce sends as number
    date_created: z.string().optional(),
    date_modified: z.string().optional(),
    // Allow additional product fields but validate core ones
  }).passthrough(),
  quantity: z.number().int().min(1).max(999),
  variation: z.object({
    id: z.number().int().positive(),
    attributes: z.record(z.string().max(100)).optional(),
  }).optional(),
});

// Cart validation schema
const cartValidationSchema = z.array(cartItemValidationSchema).max(100);

/**
 * Validates cart data from localStorage
 * @param cartData - Raw cart data from localStorage
 * @returns Validated cart items or null if invalid
 */
export function validateCartData(cartData: unknown): CartItem[] | null {
  try {
    // First check if it's an array
    if (!Array.isArray(cartData)) {
      logger.warn('Cart data is not an array, resetting cart');
      return null;
    }

    // Validate with Zod schema
    const validation = cartValidationSchema.safeParse(cartData);
    
    if (!validation.success) {
      logger.warn('Cart data validation failed:', validation.error.errors as unknown as Record<string, unknown>);
      return null;
    }

    // Transform the validated data to match CartItem type
    // We need to ensure the product has all required WCProduct fields
    const validatedData = validation.data.map(item => ({
      ...item,
      product: {
        ...item.product,
        permalink: item.product.permalink ?? '',
        description: item.product.description ?? '',
        short_description: item.product.short_description ?? '',
        regular_price: item.product.regular_price ?? item.product.price ?? 0,
        sale_price: item.product.sale_price ?? 0,
        on_sale: item.product.on_sale ?? false,
        status: item.product.status ?? 'publish',
        featured: item.product.featured ?? false,
        catalog_visibility: item.product.catalog_visibility ?? 'visible',
        sku: item.product.sku ?? '',
        stock_status: item.product.stock_status ?? 'instock',
        stock_quantity: item.product.stock_quantity !== undefined ? item.product.stock_quantity : null,
        manage_stock: item.product.manage_stock ?? false,
        categories: item.product.categories ?? [],
        tags: item.product.tags ?? [],
        images: item.product.images ?? [],
        attributes: item.product.attributes ?? [],
        variations: item.product.variations ?? [],
        weight: item.product.weight ?? '',
        dimensions: item.product.dimensions ?? { length: '', width: '', height: '' },
        meta_data: item.product.meta_data ?? [],
        average_rating: item.product.average_rating ?? '0',
        rating_count: item.product.rating_count ?? 0,
        date_created: item.product.date_created ?? new Date().toISOString(),
        date_modified: item.product.date_modified ?? new Date().toISOString(),
      } as WCProduct
    }));
    
    return validatedData as CartItem[];
  } catch (error) {
    logger.error('Error validating cart data:', error as Record<string, unknown>);
    return null;
  }
}

/**
 * Safely parse JSON cart data with validation
 * @param jsonString - JSON string from localStorage
 * @returns Validated cart items or empty array
 */
export function parseCartData(jsonString: string): CartItem[] {
  try {
    const parsed = JSON.parse(jsonString);
    const validated = validateCartData(parsed);
    return validated ?? [];
  } catch (error) {
    logger.error('Error parsing cart JSON:', error as Record<string, unknown>);
    return [];
  }
}

/**
 * Deep equality comparison for cart variations
 * More efficient than JSON.stringify comparison
 */
export function compareVariations(
  a: CartItem['variation'], 
  b: CartItem['variation']
): boolean {
  // Handle null/undefined cases
  if (!a && !b) return true;
  if (!a || !b) return false;
  
  // Compare IDs first (most common case)
  if (a.id !== b.id) return false;
  
  // Compare attributes if they exist
  if (!a.attributes && !b.attributes) return true;
  if (!a.attributes || !b.attributes) return false;
  
  const aKeys = Object.keys(a.attributes);
  const bKeys = Object.keys(b.attributes);
  
  if (aKeys.length !== bKeys.length) return false;
  
  return aKeys.every(key => a.attributes?.[key] === b.attributes?.[key]);
}

/**
 * Validates a single cart item before adding to cart
 * @param product - Product to validate
 * @param quantity - Quantity to validate
 * @param variation - Variation to validate
 * @returns True if valid, false otherwise
 */
export function validateCartItem(
  product: WCProduct,
  quantity: number,
  variation?: CartItem['variation']
): boolean {
  try {
    // Early check for undefined/null product
    if (!product) {
      logger.error('Cart item validation failed: Product is undefined or null');
      return false;
    }

    const validation = cartItemValidationSchema.safeParse({
      product,
      quantity,
      variation
    });

    if (!validation.success) {
      logger.warn('Cart item validation failed:', {
        errors: validation.error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message,
          code: e.code,
          expected: e.expected,
          received: e.received,
          input: e.input
        })),
        product: {
          id: product?.id,
          name: product?.name,
          price: product?.price,
          priceType: typeof product?.price,
          priceValue: product?.price,
          slug: product?.slug,
          hasAllFields: Boolean(product?.id && product?.name && product?.slug)
        },
        quantity
      });
      return false;
    }
    
    // Additional stock validation
    const stockQuantity = product.stock_quantity;
    if (stockQuantity !== null && stockQuantity !== undefined && stockQuantity >= 0) {
      if (quantity > stockQuantity) {
        logger.warn('Cart item validation failed: Insufficient stock', { 
          requested: quantity, 
          available: stockQuantity, 
          productId: product.id 
        });
        return false;
      }
    }
    
    // Check if product is purchasable (available for purchase)
    if ((product.status !== 'publish') || (product.stock_status !== 'instock')) {
      logger.warn('Cart item validation failed: Product not purchasable', { productId: product.id });
      return false;
    }
    
    return true;
  } catch (error) {
    logger.error('Error validating cart item:', error as Record<string, unknown>);
    return false;
  }
}

const cartValidation = {
  validateCartData,
  parseCartData,
  compareVariations,
  validateCartItem,
};

export default cartValidation;
