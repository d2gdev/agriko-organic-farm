'use client';

import Link from 'next/link';
import Image from 'next/image';
import { WCProduct } from '@/types/woocommerce';
import { formatPrice, getProductMainImage, stripHtml, isProductInStock } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import { LoadingButton } from '@/components/LoadingStates';
import toast from 'react-hot-toast';
import { useState } from 'react';

interface ProductCardProps {
  product: WCProduct;
  className?: string;
}

export default function ProductCard({ product, className = '' }: ProductCardProps) {
  const { addItem, toggleCart } = useCart();
  const [isLoading, setIsLoading] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsLoading(true);
    
    try {
      // Simulate brief loading for better UX feedback
      await new Promise(resolve => setTimeout(resolve, 300));
      
      addItem(product);
      
      // Show success toast
      toast.success(`${product.name} added to cart!`, {
        icon: '🛒',
      });
      
      // Brief delay then auto-open cart drawer
      setTimeout(() => {
        toggleCart();
      }, 800);
      
    } catch (error) {
      toast.error('Failed to add item to cart');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate product schema for this individual product
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": stripHtml(product.short_description || product.description || '').substring(0, 200),
    "sku": product.sku || product.id.toString(),
    "image": getProductMainImage(product),
    "brand": {
      "@type": "Brand",
      "name": "Agriko Organic Farm"
    },
    "manufacturer": {
      "@type": "Organization",
      "name": "Agriko Organic Farm"
    },
    "offers": {
      "@type": "Offer",
      "price": product.price,
      "priceCurrency": "PHP",
      "availability": isProductInStock(product) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "Agriko Organic Farm"
      },
      "url": `https://agrikoph.com/product/${product.slug}`
    },
    "category": product.categories?.map(cat => cat.name).join(", ") || "Organic Products"
  };

  const inStock = isProductInStock(product);
  const mainImage = getProductMainImage(product);
  const shortDescription = product.short_description ? stripHtml(product.short_description) : '';

  return (
    <>
      {/* Product Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productSchema)
        }}
      />
      
      <Link href={`/product/${product.slug}`} className={`group ${className}`}>
      <div className="bg-white rounded-xl shadow-lg border border-neutral-100 hover:shadow-xl hover:border-primary-200 transition-all duration-300 ease-out overflow-hidden hover:-translate-y-1 h-full flex flex-col">
        {/* Product Image */}
        <div className="relative aspect-square bg-cream overflow-hidden">
          <Image
            src={mainImage}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            loading="lazy"
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+JNwmsFvI7VvDqiDvVHTlHI/jl1Q2eSgIo4I4a13aebqoaI+oejJQKEpMa4IkKDBd8OgY0N8pTZV/hqiUq/wlEkUx8DqcqLhDsWVz8nYqK/wAI"
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
              disabled={isLoading}
              className="absolute bottom-4 right-4 bg-primary-700 hover:bg-primary-800 disabled:bg-primary-400 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-300 ease-out transform translate-y-2 group-hover:translate-y-0 focus:translate-y-0 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-700 disabled:cursor-not-allowed"
              aria-label={`Add ${product.name} to cart`}
            >
              {isLoading ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              )}
            </button>
          )}
        </div>

        {/* Product Info */}
        <div className="p-6 pb-8 flex-1 flex flex-col">
          <div className="flex-1 flex flex-col">
            <h3 className="product-title text-neutral-900 mb-3 line-clamp-2 leading-snug">
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
                  <span className="text-price-medium text-primary-700">
                    {formatPrice(product.price)}
                  </span>
                  <span className="text-sm text-neutral-500 line-through">
                    {formatPrice(product.regular_price)}
                  </span>
                </>
              ) : (
                <span className="text-price-medium text-neutral-900">
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
            <LoadingButton
              onClick={handleAddToCart}
              isLoading={isLoading}
              className="w-full btn-primary text-button"
              aria-label={`Add ${product.name} to basket`}
            >
              Add to Basket
            </LoadingButton>
          )}

          {/* Categories */}
          <div className="mt-4 h-8 flex flex-wrap gap-2 justify-center items-center">
            {product.categories && product.categories.length > 0 ? (
              <>
                {product.categories.slice(0, 2).map((category) => (
                  <span
                    key={category.id}
                    className="bg-accent-100 text-accent-700 text-xs font-medium px-3 py-1 rounded-full flex items-center justify-center min-h-[24px]"
                  >
                    {category.name}
                  </span>
                ))}
                {product.categories.length > 2 && (
                  <span className="bg-neutral-100 text-neutral-700 text-xs font-medium px-3 py-1 rounded-full flex items-center justify-center min-h-[24px]">
                    +{product.categories.length - 2} more
                  </span>
                )}
              </>
            ) : (
              <div className="h-6"></div>
            )}
          </div>
        </div>
      </div>
      </Link>
    </>
  );
}