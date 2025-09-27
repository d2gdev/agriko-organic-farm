import { Money } from '@/lib/money';
import { WCProduct } from '@/types/woocommerce';

// Client-safe utility functions that don't require API credentials

export function formatPrice(price: number | Money | string, currency: string = 'PHP'): string {
  try {
    // Handle string prices from WooCommerce API
    if (typeof price === 'string') {
      const numPrice = parseFloat(price);
      if (isNaN(numPrice)) return 'N/A';
      return Money.pesos(numPrice).format();
    }

    const money = price instanceof Money ? price : Money.pesos(price as number);
    return money.format();
  } catch (error) {
    console.error('formatPrice error:', error, 'for price:', price);
    return 'N/A';
  }
}

export function calculateCartTotal(items: Array<{ price: Money; quantity: number }>): Money {
  return items.reduce((total, item) => {
    try {
      const itemTotal = item.price.multiply(item.quantity);
      return total.add(itemTotal);
    } catch {
      return total; // Skip invalid items instead of breaking
    }
  }, Money.ZERO);
}

export function isProductInStock(product: WCProduct): boolean {
  return product.stock_status === 'instock' &&
         (!product.manage_stock || (product.stock_quantity !== null && product.stock_quantity !== undefined && product.stock_quantity > 0));
}

export function getProductMainImage(product: WCProduct): string {
  if (product.images && product.images.length > 0) {
    const firstImage = product.images[0];
    // Check if src exists and is a string, otherwise fallback
    if (firstImage && typeof firstImage.src === 'string') {
      return firstImage.src;
    }
  }
  
  return 'data:image/svg+xml;base64,' + btoa(`
      <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <text x="50%" y="50%" text-anchor="middle" dy="0.3em" fill="#6b7280" font-family="Arial, sans-serif" font-size="16">
          Product Image
        </text>
      </svg>
    `);
}

export function stripHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }
  
  return html
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Decode HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    // Remove any remaining HTML entities
    .replace(/&[^;]+;/g, '')
    // Clean up extra whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

// Utility function to combine class names (similar to clsx)
export function cn(...classes: (string | string[] | undefined | null | false)[]): string {
  return classes
    .flat()
    .filter(Boolean)
    .join(' ')
    .trim();
}