'use client';

import Link from 'next/link';
import Image from 'next/image';
import { WCProduct } from '@/types/woocommerce';

// Simple utility functions to avoid external dependencies
function formatPrice(price: number): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return `$${numPrice.toFixed(2)}`;
}

function getProductMainImage(product: WCProduct): string {
  if (product.images && product.images.length > 0 && product.images[0]) {
    return product.images[0].src || '';
  }
  return '';
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

interface ProductCardSimpleProps {
  product: WCProduct;
  className?: string;
  priority?: boolean;
  layout?: 'grid' | 'list';
  fetchPriority?: 'high' | 'low' | 'auto';
}

export default function ProductCardSimple({
  product,
  className = '',
  priority = false,
  layout: _layout = 'grid',
  fetchPriority = 'auto'
}: ProductCardSimpleProps) {

  const mainImage = getProductMainImage(product);
  const description = stripHtml(product.short_description || product.description || '').substring(0, 100);

  return (
    <Link
      href={`/product/${product.slug}`}
      className={`group block bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200 ${className}`}
    >
      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        {mainImage ? (
          <Image
            src={mainImage}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-200"
            priority={priority}
            fetchPriority={fetchPriority}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Sale Badge */}
        {product.sale_price && product.regular_price && (
          <div className="absolute top-3 left-3">
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              Sale
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors duration-200 line-clamp-2">
          {product.name}
        </h3>

        {description && (
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {description}...
          </p>
        )}

        {/* Price */}
        <div className="mt-2 flex items-center space-x-2">
          {product.sale_price && product.regular_price ? (
            <>
              <span className="text-lg font-bold text-primary-600">
                {formatPrice(product.sale_price)}
              </span>
              <span className="text-sm text-gray-500 line-through">
                {formatPrice(product.regular_price)}
              </span>
            </>
          ) : (
            <span className="text-lg font-bold text-gray-900">
              {formatPrice((product.price || 0) as number)}
            </span>
          )}
        </div>

        {/* Stock Status */}
        <div className="mt-2">
          {product.stock_status === 'instock' ? (
            <span className="text-xs text-green-600 font-medium">In Stock</span>
          ) : (
            <span className="text-xs text-red-600 font-medium">Out of Stock</span>
          )}
        </div>
      </div>
    </Link>
  );
}