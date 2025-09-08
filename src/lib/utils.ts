import { WCProduct } from '@/types/woocommerce';

// Client-safe utility functions that don't require API credentials

export function formatPrice(price: string | number, currency: string = 'PHP'): string {
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  // Handle NaN, null, undefined, or invalid prices
  if (isNaN(numericPrice) || numericPrice === null || numericPrice === undefined) {
    return 'N/A';
  }
  
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: currency,
  }).format(numericPrice);
}

export function calculateCartTotal(items: Array<{ price: string; quantity: number }>): number {
  return items.reduce((total, item) => {
    return total + (parseFloat(item.price) * item.quantity);
  }, 0);
}

export function isProductInStock(product: WCProduct): boolean {
  return product.stock_status === 'instock' && 
         (!product.manage_stock || (product.stock_quantity !== null && product.stock_quantity > 0));
}

export function getProductMainImage(product: WCProduct): string {
  return product.images && product.images.length > 0 
    ? product.images[0].src 
    : '/placeholder-product.jpg';
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, '');
}

// Utility function to combine class names (similar to clsx)
export function cn(...classes: (string | string[] | undefined | null | false)[]): string {
  return classes
    .flat()
    .filter(Boolean)
    .join(' ')
    .trim();
}