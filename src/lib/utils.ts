import { WCProduct } from '@/types/woocommerce';
import { parsePrice } from '@/lib/price-validation';

// Client-safe utility functions that don't require API credentials

export function formatPrice(price: string | number, currency: string = 'PHP'): string {
  const priceResult = parsePrice(price, 'formatPrice');
  
  // Handle parsing failures
  if (!priceResult.success) {
    return 'N/A';
  }
  
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: currency,
  }).format(priceResult.value);
}

export function calculateCartTotal(items: Array<{ price: string; quantity: number }>): number {
  return items.reduce((total, item) => {
    const priceResult = parsePrice(item.price, 'calculateCartTotal');
    const quantityResult = parsePrice(item.quantity, 'calculateCartTotal quantity');
    
    if (!priceResult.success || !quantityResult.success) {
      return total; // Skip invalid items instead of breaking
    }
    
    const itemTotal = priceResult.value * quantityResult.value;
    
    // Check for overflow before addition
    const MAX_SAFE_TOTAL = 999999999;
    if (total > MAX_SAFE_TOTAL - itemTotal) {
      return MAX_SAFE_TOTAL; // Cap at maximum safe value
    }
    
    return total + itemTotal;
  }, 0);
}

export function isProductInStock(product: WCProduct): boolean {
  return product.stock_status === 'instock' && 
         (!product.manage_stock || (product.stock_quantity !== null && product.stock_quantity > 0));
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