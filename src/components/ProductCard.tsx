'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { WCProduct } from '@/types/woocommerce';
import { formatPrice, getProductMainImage, stripHtml, isProductInStock } from '@/lib/utils';
import { useSafeCart } from '@/context/CartContext';
import toast from 'react-hot-toast';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { calculateDiscountPercentage } from '@/lib/price-validation';

interface ProductCardProps {
  product: WCProduct;
  className?: string;
  priority?: boolean;
  layout?: 'grid' | 'list';
  fetchPriority?: 'high' | 'low' | 'auto';
}

function ProductCard({
  product,
  className = '',
  priority = false,
  layout = 'grid',
  fetchPriority = 'auto'
}: ProductCardProps) {
  const cart = useSafeCart();
  const [isLoading, setIsLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const isUnmountedRef = useRef(false);

  // Cleanup timeouts on unmount and prevent state updates after unmount
  useEffect(() => {
    isUnmountedRef.current = false;
    
    // Fallback timeout to show image if onLoad doesn't fire
    const fallbackTimeout = setTimeout(() => {
      if (!isUnmountedRef.current && !imageLoaded) {
        setImageLoaded(true);
      }
    }, 3000); // 3 second fallback
    
    timeoutsRef.current.push(fallbackTimeout);
    
    return () => {
      isUnmountedRef.current = true;
      // Clear timeouts before clearing the array
      const timeouts = [...timeoutsRef.current];
      timeoutsRef.current = []; // Clear the array first
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [imageLoaded]);

  const handleAddToCart = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!cart) {
      toast.error('Cart is not available. Please refresh the page.');
      return;
    }
    
    if (isUnmountedRef.current) return;
    
    setIsLoading(true);
    
    try {
      const delayTimeout = setTimeout(() => {
        if (isUnmountedRef.current) return;
        
        if (cart) {
          cart.addItem(product);
        }
        
        toast.success(
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <span>{product.name} added to cart!</span>
          </div>,
          {
            duration: 3000,
            style: {
              background: 'white',
              color: '#1f2937',
              borderRadius: '12px',
              boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              border: '1px solid #e5e7eb',
              padding: '16px',
            },
          }
        );
        
        const toggleTimeout = setTimeout(() => {
          if (!isUnmountedRef.current && cart) {
            cart.toggleCart();
          }
        }, 1200);
        
        if (!isUnmountedRef.current) {
          timeoutsRef.current.push(toggleTimeout);
        } else {
          clearTimeout(toggleTimeout);
        }
      }, 600);
      
      timeoutsRef.current.push(delayTimeout);
      
    } catch (error) {
      if (!isUnmountedRef.current) {
        toast.error('Failed to add item to cart');
      }
    } finally {
      if (!isUnmountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [cart, product]);

  // Generate product schema for this individual product
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": stripHtml(product.short_description ?? product.description ?? '').substring(0, 200),
    "sku": product.sku ?? product.id.toString(),
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
      "url": `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://shop.agrikoph.com'}/product/${product.slug}`
    },
    "category": product.categories?.map(cat => cat.name).join(", ") ?? "Organic Products"
  };

  // Memoized expensive calculations
  const inStock = useMemo(() => isProductInStock(product), [product]);
  const mainImage = useMemo(() => getProductMainImage(product), [product]);

  const shortDescription = useMemo(() => {
    return product.short_description
      ? stripHtml(product.short_description)
      : product.description
        ? stripHtml(product.description)
        : '';
  }, [product.short_description, product.description]);

  const discountPercentage = useMemo(() => {
    return product.on_sale && product.regular_price !== product.price
      ? (() => {
          const discountResult = calculateDiscountPercentage(
            product.regular_price,
            product.price,
            `ProductCard ${product.name}`
          );
          return discountResult.success ? Math.round(discountResult.value) : null;
        })()
      : null;
  }, [product.on_sale, product.regular_price, product.price, product.name]);

  return (
    <>
      {/* Product Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productSchema)
        }}
      />
      
      <article className={`group relative ${className} animate-fadeInUp w-full`} role="article" aria-labelledby={`product-${product.id}-name`}>
        {/* Card Container */}
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 hover:shadow-xl hover:border-primary-200 transition-all duration-500 ease-out overflow-hidden hover:-translate-y-2 h-full flex flex-col relative min-h-[480px]">

          {(product.featured || ((product as unknown as Record<string, unknown>).total_sales && ((product as unknown as Record<string, unknown>).total_sales as number) > 50)) ? (
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
              {/* Premium Badge for featured products */}
              {product.featured ? (
                <div className="bg-gradient-to-r from-amber-400 to-amber-500 text-amber-900 px-3 py-1 text-xs font-bold rounded-full shadow-lg flex items-center space-x-1 w-fit">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span>Premium</span>
                </div>
              ) : null}

              {/* Enhanced Premium Bestseller Badge - Gold Ribbon Style */}
              {((product as unknown as Record<string, unknown>).total_sales && ((product as unknown as Record<string, unknown>).total_sales as number) > 50) ? (
              <div className="relative">
                {/* Main ribbon badge */}
                <div className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-amber-900 px-4 py-2 text-xs font-bold shadow-xl flex items-center space-x-2 w-fit border border-amber-300/50 relative overflow-hidden">
                  {/* Ribbon cut effect */}
                  <div className="absolute left-0 top-0 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-amber-600 border-t-[12px] border-t-amber-600"></div>
                  <div className="absolute right-0 bottom-0 w-0 h-0 border-l-[8px] border-l-amber-600 border-r-[8px] border-r-transparent border-b-[12px] border-b-amber-600"></div>

                  {/* Premium crown icon */}
                  <svg className="w-4 h-4 drop-shadow-sm" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 4a1 1 0 00-.894 1.447l2 4A1 1 0 007 10h1.394l.8-2.4a1 1 0 011.612 0l.8 2.4H13a1 1 0 00.894-.553l2-4A1 1 0 0015 4a1 1 0 00-1 1v.5a1 1 0 01-2 0V5a1 1 0 00-1-1 1 1 0 00-1 1v.5a1 1 0 01-2 0V5a1 1 0 00-1-1 1 1 0 00-1 1v.5a1 1 0 01-2 0V5a1 1 0 00-1-1z"/>
                  </svg>
                  <span className="uppercase tracking-wider font-extrabold">Bestseller</span>

                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-pulse"></div>
                </div>

                {/* Glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 rounded blur opacity-25 animate-pulse"></div>
              </div>
            ) : null}
            </div>
          ) : null}

          <div className="block relative">
            <Link href={`/product/${product.slug}`} className="block">
              <div className="relative h-80 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden rounded-xl group-hover:shadow-2xl transition-all duration-500 flex items-center justify-center">

                {/* Loading Shimmer - Only show while loading */}
                {!imageLoaded && (
                  <div className="absolute inset-0 bg-neutral-200 animate-pulse" />
                )}

                {/* Inner container for perfect centering and consistent sizing */}
                <div className="relative w-full h-full max-w-[240px] max-h-[240px] flex items-center justify-center p-6">
                  <Image
                    src={mainImage}
                    alt={product.name}
                    fill
                    className="object-contain transition-all duration-700 ease-out opacity-100 group-hover:scale-110"
                    sizes="(max-width: 768px) 200px, (max-width: 1200px) 240px, 240px"
                    priority={priority}
                    fetchPriority={fetchPriority}
                    onLoad={() => {
                      if (!isUnmountedRef.current) {
                        setImageLoaded(true);
                        setImageError(false);
                      }
                    }}
                    onError={() => {
                      if (!isUnmountedRef.current) {
                        setImageError(true);
                        setImageLoaded(true);
                      }
                    }}
                  />
                </div>

                {/* Sale Badge with Percentage */}
                {product.on_sale && discountPercentage && (
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 text-sm font-bold rounded-full shadow-lg transform -rotate-3 group-hover:rotate-0 transition-transform duration-300">
                    -{discountPercentage}%
                  </div>
                )}

                {/* Stock Status */}
                {!inStock && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="bg-white text-neutral-900 px-4 py-2 rounded-full font-semibold shadow-lg">
                      Out of Stock
                    </div>
                  </div>
                )}
              </div>
            </Link>

            {/* Enhanced Quick Actions Overlay - Outside Link */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

              {/* Heart/Wishlist Icon */}
              <button className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2.5 rounded-full shadow-lg hover:bg-red-50 transition-all duration-300 transform hover:scale-110 pointer-events-auto">
                <svg className="w-5 h-5 text-gray-600 hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>

              {/* Quick Add Button */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToCart(e);
                  }}
                  className="bg-red-600 text-white px-6 py-2.5 rounded-full font-semibold transform translate-y-8 group-hover:translate-y-0 transition-all duration-300 flex items-center space-x-2 hover:bg-red-700 shadow-xl pointer-events-auto"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <span>Quick Add</span>
                </button>
              </div>
            </div>
          </div>

          {/* Product Information */}
          <div className="p-6 flex-1 flex flex-col">
            {/* Category Tags */}
            <div className="flex flex-wrap gap-2 mb-3 min-h-[2rem]">
              {product.categories && product.categories.length > 0 && 
                product.categories.slice(0, 1).map((category) => (
                  <span
                    key={category.id}
                    className="inline-block bg-green-50 text-green-700 text-xs font-medium px-2 py-1 rounded-full border border-green-100"
                  >
                    {category.name}
                  </span>
                ))
              }
            </div>

            {/* Product Name */}
            <Link
              href={`/product/${product.slug}`}
              className="block"
              aria-label={`View details for ${product.name}`}
            >
              <h3
                id={`product-${product.id}-name`}
                className="text-lg font-semibold text-neutral-900 mb-1 line-clamp-2 leading-tight group-hover:text-primary-700 transition-colors duration-200 min-h-[3.5rem]"
              >
                {product.name}
              </h3>
            </Link>

            {/* Rating Stars - Consistent rendering to avoid hydration mismatch */}
            <div className="mb-3 h-5 flex items-center space-x-2">
              {product.rating_count > 0 && (
                <>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-4 h-4 ${i < Math.round(parseFloat(product.average_rating || '0')) ? 'text-yellow-400 fill-current' : 'text-gray-300 fill-current'}`}
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-xs text-gray-500">({product.rating_count})</span>
                </>
              )}
            </div>

            {/* Description with 5-Line Display */}
            <div className="flex-1 flex items-center mb-4">
              {shortDescription && (
                <p
                  id={`product-${product.id}-description`}
                  className="text-neutral-600 text-sm leading-relaxed line-clamp-5"
                >
                  {shortDescription}
                </p>
              )}
            </div>

            {/* Price Section */}
            <div className="mt-auto">
              <div className="flex items-center justify-between mb-4">
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

                {/* Stock Indicator */}
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${inStock ? 'bg-green-400' : 'bg-red-400'}`}></div>
                  <span className={`text-xs font-medium ${inStock ? 'text-green-700' : 'text-red-700'}`}>
                    {inStock ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>
              </div>

              {/* Enhanced Add to Cart Button */}
              {inStock && (
                <button
                  onClick={handleAddToCart}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-neutral-400 disabled:to-neutral-500 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2 group/button relative overflow-hidden"
                  aria-label={`Add ${product.name} to shopping cart`}
                  aria-describedby={`product-${product.id}-description`}
                  aria-disabled={!inStock || isLoading}
                >
                  {/* Slide-in cart icon effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-red-700 to-red-800 translate-x-full group-hover/button:translate-x-0 transition-transform duration-300 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5" />
                    </svg>
                  </div>

                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 transition-all duration-300 group-hover/button:scale-110 group-hover/button:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span className="relative z-10 group-hover/button:text-white transition-colors">Add to Cart</span>
                    </>
                  )}

                  {/* Hover glow effect */}
                  <div className="absolute inset-0 bg-red-500 rounded-xl opacity-0 group-hover/button:opacity-20 blur-sm transition-opacity duration-300"></div>
                </button>
              )}
            </div>
          </div>
        </div>
      </article>
    </>
  );
}

// Memoize the component to prevent unnecessary re-renders when props haven't changed
export default React.memo(ProductCard);