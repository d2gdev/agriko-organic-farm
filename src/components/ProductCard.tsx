'use client';

import Link from 'next/link';
import Image from 'next/image';
import { WCProduct } from '@/types/woocommerce';
import { formatPrice, getProductMainImage, stripHtml, isProductInStock } from '@/lib/utils';
import { useCart } from '@/context/CartContext';

interface ProductCardProps {
  product: WCProduct;
  className?: string;
}

export default function ProductCard({ product, className = '' }: ProductCardProps) {
  const { addItem } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
  };

  const inStock = isProductInStock(product);
  const mainImage = getProductMainImage(product);
  const shortDescription = product.short_description ? stripHtml(product.short_description) : '';

  return (
    <Link href={`/product/${product.slug}`} className={`group ${className}`}>
      <div className="bg-white rounded-xl shadow-lg border border-neutral-100 hover:shadow-xl hover:border-primary-200 transition-all duration-300 overflow-hidden hover:-translate-y-1 h-full flex flex-col">
        {/* Product Image */}
        <div className="relative aspect-square bg-cream overflow-hidden">
          <Image
            src={mainImage}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
          
          {/* Sale Badge */}
          {product.on_sale && (
            <div className="absolute top-4 left-4 bg-primary-700 text-white px-3 py-1 text-sm font-semibold rounded-lg shadow-md">
              Sale
            </div>
          )}
          
          {/* Stock Status */}
          {!inStock && (
            <div className="absolute top-4 right-4 bg-neutral-800 text-white px-3 py-1 text-sm font-medium rounded-lg">
              Out of Stock
            </div>
          )}

          {/* Quick Add to Cart Button */}
          {inStock && (
            <button
              onClick={handleAddToCart}
              className="absolute bottom-4 right-4 bg-primary-700 hover:bg-primary-800 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 shadow-lg hover:shadow-xl"
              aria-label="Add to cart"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          )}
        </div>

        {/* Product Info */}
        <div className="p-6 pb-8 flex-1 flex flex-col">
          <div className="flex-1 flex flex-col">
            <h3 className="font-serif font-semibold text-neutral-900 mb-3 text-lg line-clamp-2 leading-snug">
              {product.name}
            </h3>
            
            {shortDescription ? (
              <p className="text-neutral-600 mb-4 line-clamp-2 leading-relaxed flex-1">
                {shortDescription}
              </p>
            ) : (
              <div className="mb-4 flex-1"></div>
            )}
          </div>

          {/* Price */}
          <div className="flex items-center justify-between mb-4 mt-auto">
            <div className="flex items-center space-x-2">
              {product.on_sale && product.regular_price !== product.price ? (
                <>
                  <span className="text-xl font-bold text-primary-700">
                    {formatPrice(product.price)}
                  </span>
                  <span className="text-sm text-neutral-500 line-through">
                    {formatPrice(product.regular_price)}
                  </span>
                </>
              ) : (
                <span className="text-xl font-bold text-neutral-900">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>

            {/* Stock indicator */}
            <div className="flex items-center">
              {inStock ? (
                <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded-full">In Stock</span>
              ) : (
                <span className="text-xs text-red-600 font-medium bg-red-50 px-2 py-1 rounded-full">Out of Stock</span>
              )}
            </div>
          </div>

          {/* Shop Now Button */}
          {inStock && (
            <button 
              onClick={handleAddToCart}
              className="w-full bg-primary-700 hover:bg-primary-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 text-sm"
            >
              Add to Basket
            </button>
          )}

          {/* Categories */}
          <div className="mt-4 h-8 flex flex-wrap gap-2">
            {product.categories && product.categories.length > 0 ? (
              <>
                {product.categories.slice(0, 2).map((category) => (
                  <span
                    key={category.id}
                    className="inline-block bg-accent-100 text-accent-700 text-xs font-medium px-2 py-1 rounded-full"
                  >
                    {category.name}
                  </span>
                ))}
                {product.categories.length > 2 && (
                  <span className="inline-block bg-neutral-100 text-neutral-700 text-xs px-2 py-1 rounded-full">
                    +{product.categories.length - 2} more
                  </span>
                )}
              </>
            ) : (
              <div></div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}