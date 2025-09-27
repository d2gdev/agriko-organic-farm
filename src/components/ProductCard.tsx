'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { WCProduct } from '@/types/woocommerce';
import { formatPrice, getProductMainImage, stripHtml, isProductInStock } from '@/lib/utils';
import { useSafeCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { ecommerceEvent, funnelEvent } from '@/lib/gtag';
import toast from 'react-hot-toast';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Money } from '@/lib/money';
import { SerializedWCProduct, deserializeProduct } from '@/lib/product-serializer';

// Removed APP_CONSTANTS import due to dependency issues

interface ProductCardProps {
  product: SerializedWCProduct;
  className?: string;
  priority?: boolean;
  layout?: 'grid' | 'list';
  fetchPriority?: 'high' | 'low' | 'auto';
}

// Define interfaces for type-safe price handling
interface MoneyLike {
  toNumber(): number;
  isZero: boolean;
}

interface SerializedMoney {
  pesos: number;
  centavos: number;
}

// Utility function to safely extract price number from various price formats
function safePriceToNumber(price: unknown): number {
  try {
    if (!price) return 0;

    if (typeof price === 'object' && price !== null) {
      if ('toNumber' in price && typeof (price as MoneyLike).toNumber === 'function') {
        // It's a Money object
        return (price as MoneyLike).toNumber();
      } else if ('pesos' in price && typeof (price as SerializedMoney).pesos === 'number') {
        // It's a serialized Money object
        return (price as SerializedMoney).pesos;
      }
    }

    if (typeof price === 'number') {
      return price;
    }

    if (typeof price === 'string') {
      const parsed = parseFloat(price);
      return !isNaN(parsed) ? parsed : 0;
    }

    return 0;
  } catch {
    return 0;
  }
}

// Utility function to safely check if price is zero
function safeIsPriceZero(price: unknown): boolean {
  try {
    if (!price) return true;

    if (typeof price === 'object' && price !== null) {
      if ('isZero' in price && typeof (price as MoneyLike).isZero === 'boolean') {
        // It's a Money object
        return (price as MoneyLike).isZero;
      } else if ('pesos' in price && typeof (price as SerializedMoney).pesos === 'number') {
        // It's a serialized Money object
        return (price as SerializedMoney).pesos === 0;
      }
    }

    if (typeof price === 'number') {
      return price === 0;
    }

    if (typeof price === 'string') {
      const parsed = parseFloat(price);
      return isNaN(parsed) || parsed === 0;
    }

    return true;
  } catch {
    return true;
  }
}

function ProductCard({
  product: rawProduct,
  className = '',
  priority = false,
  layout = 'grid',
  fetchPriority = 'auto'
}: ProductCardProps) {
  void layout; // Mark as intentionally unused

  // Use the serialized product directly (with plain numbers)
  const product = rawProduct;

  const cart = useSafeCart();
  const wishlist = useWishlist();
  const [isLoading, setIsLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [_imageError, setImageError] = useState(false);
  void _imageError; // Preserved for future error display
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const isUnmountedRef = useRef(false);
  const hasTrackedViewRef = useRef(false);
  const isInWishlist = wishlist.isInWishlist(product.id);

  // Track product view when component mounts and is visible
  useEffect(() => {
    if (!hasTrackedViewRef.current) {
      hasTrackedViewRef.current = true;
      const category = product.categories?.[0]?.name ?? 'Uncategorized';

      const price = safePriceToNumber(product.price);

      // Track with Google Analytics
      ecommerceEvent.viewItem(
        product.id.toString(),
        product.name,
        category,
        price
      );

      // Track funnel step
      funnelEvent.viewProductDetail(product.id.toString(), product.name);
    }
  }, [product]);

  // Setup component lifecycle and fallback timeout
  useEffect(() => {
    isUnmountedRef.current = false;

    return () => {
      isUnmountedRef.current = true;
      // Clear timeouts before clearing the array
      const timeouts = [...timeoutsRef.current];
      timeoutsRef.current = []; // Clear the array first
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  // Fallback timeout to show image if onLoad doesn't fire
  useEffect(() => {
    if (!imageLoaded) {
      const fallbackTimeout = setTimeout(() => {
        if (!isUnmountedRef.current) {
          setImageLoaded(true);
        }
      }, 3000); // 3 second fallback

      timeoutsRef.current.push(fallbackTimeout);

      return () => {
        clearTimeout(fallbackTimeout);
      };
    }

    // Return undefined when no cleanup is needed
    return undefined;
  }, [imageLoaded]);

  const handleAddToCart = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!product) {
      toast.error('Product data is not available');
      return;
    }

    if (!cart) {
      toast.error('Cart is not available. Please refresh the page.');
      return;
    }

    if (isUnmountedRef.current) return;
    
    setIsLoading(true);
    
    try {
      const delayTimeout = setTimeout(() => {
        if (isUnmountedRef.current) return;

        if (cart && product) {
          const deserializedProduct = deserializeProduct(product);
          cart.addItem(deserializedProduct);

          // Track add to cart with Google Analytics
          const category = product.categories?.[0]?.name ?? 'Uncategorized';

          const price = safePriceToNumber(product.price);

          ecommerceEvent.addToCart(
            product.id.toString(),
            product.name,
            category,
            price,
            1
          );

          // Track funnel step
          funnelEvent.addToCart(product.id.toString(), product.name, price);
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
      
    } catch {
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
      "price": safePriceToNumber(product.price),
      "priceCurrency": "PHP",
      "availability": isProductInStock(product) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "Agriko Organic Farm"
      },
      "url": `https://agrikoph.com/product/${product.slug}`
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
    if (!product.on_sale || !product.regular_price || !product.price || product.regular_price === product.price) {
      return null;
    }

    const regularPrice = typeof product.regular_price === 'number' ? product.regular_price : 0;
    const salePrice = typeof product.price === 'number' ? product.price : 0;

    if (salePrice >= regularPrice || regularPrice === 0) {
      return null;
    }

    const discount = regularPrice - salePrice;
    const percentage = (discount / regularPrice) * 100;
    return Math.round(percentage);
  }, [product.on_sale, product.regular_price, product.price]);

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
        {/* Card Container with Enhanced Hover */}
        <div className="bg-white rounded-2xl shadow-md border border-neutral-100 hover:shadow-2xl hover:border-primary-300 transition-all duration-500 ease-out overflow-hidden hover:-translate-y-1 hover:scale-[1.02] h-full flex flex-col relative min-h-[480px]">


          <Link href={`/product/${product.slug}`} className="block relative">
              <div className="relative h-64 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden rounded-t-xl group-hover:shadow-inner transition-all duration-500 flex items-center justify-center">

                {/* Premium/Bestseller Badges Overlay on Image - Always render container */}
                <div className="absolute top-8 left-8 z-20 flex flex-col gap-2">
                  {/* Premium Badge for featured products */}
                  {product.featured ? (
                    <div className="bg-gradient-to-r from-amber-400 to-amber-500 text-amber-900 px-3 py-1 text-xs font-bold rounded-full shadow-lg flex items-center space-x-1 w-fit">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span>Premium</span>
                    </div>
                  ) : null}

                  {/* Enhanced Premium Bestseller Badge */}
                  {(product.total_sales && product.total_sales > 50) ? (
                    <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-3 py-1.5 rounded-lg font-black shadow-lg transform -rotate-2 hover:rotate-0 transition-transform duration-300">
                      <span className="text-xs flex items-center gap-1">
                        <span className="text-sm">⭐</span>
                        BESTSELLER
                      </span>
                    </div>
                  ) : null}
                </div>

                {/* Loading Shimmer - Hydration-safe conditional rendering */}
                {!imageLoaded && (
                  <div className="absolute inset-0 bg-neutral-200 animate-pulse transition-opacity duration-300" />
                )}

                {/* Fixed height container for consistent image sizing */}
                <div className="relative w-full h-full flex items-center justify-center p-4 z-0">
                  <Image
                    src={mainImage}
                    alt={product.name}
                    fill
                    className="object-contain transition-all duration-700 ease-out opacity-100 group-hover:scale-115 group-hover:rotate-1"
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
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (isInWishlist) {
                    wishlist.removeItem(product.id);
                  } else {
                    const deserializedProduct = deserializeProduct(product);
                    wishlist.addItem(deserializedProduct);
                  }
                }}
                className={`absolute top-4 right-4 ${isInWishlist ? 'bg-red-50' : 'bg-white/90'} backdrop-blur-sm p-2.5 rounded-full shadow-lg hover:bg-red-50 transition-all duration-300 transform hover:scale-110 pointer-events-auto`}
                aria-label={isInWishlist ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
                aria-describedby={`product-${product.id}-name`}
              >
                <svg
                  className={`w-5 h-5 ${isInWishlist ? 'text-red-500' : 'text-gray-600 hover:text-red-500'} transition-colors`}
                  fill={isInWishlist ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
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
                  className="bg-green-600 text-white px-6 py-2.5 rounded-full font-semibold transform translate-y-8 group-hover:translate-y-0 transition-all duration-300 flex items-center space-x-2 hover:bg-green-700 shadow-xl pointer-events-auto"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <span>Quick Add</span>
                </button>
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

            {/* Enhanced Rating Stars with Animation */}
            <div className="mb-2 h-5 flex items-center space-x-2">
              <div className="flex items-center group-hover:scale-110 transition-transform duration-300" suppressHydrationWarning>
                {[1, 2, 3, 4, 5].map((starIndex) => {
                  const rating = (product.rating_count || 0) > 0
                    ? parseFloat(product.average_rating || '0')
                    : 5; // Default to 5 stars if no ratings
                  const isFilled = starIndex <= Math.round(rating);
                  return (
                    <svg
                      key={starIndex}
                      className={`w-4 h-4 ${isFilled ? 'text-yellow-400 fill-current drop-shadow-sm' : 'text-gray-300 fill-current'} transition-all duration-300`}
                      style={{ animationDelay: `${starIndex * 50}ms` }}
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  );
                })}
              </div>
              {(product.rating_count || 0) > 0 ? (
                <span className="text-xs text-gray-500 font-medium">({product.rating_count} reviews)</span>
              ) : (
                <span className="text-xs text-green-600 font-medium">★ Trusted Quality</span>
              )}
            </div>

            {/* Description with 5-Line Display */}
            <div className="flex-1 flex items-center mb-3">
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
                  {/* Handle zero price products specially */}
                  {safeIsPriceZero(product.price) ? (
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-neutral-600">
                        Price on Request
                      </span>
                      <Link
                        href={`/contact?product=${product.slug}`}
                        className="text-xs text-primary-600 hover:text-primary-700 underline"
                      >
                        Contact for pricing
                      </Link>
                    </div>
                  ) : product.on_sale && product.regular_price !== product.price ? (
                    <>
                      <span className="text-xl font-bold text-primary-700">
                        {formatPrice(product.price)}
                      </span>
                      <span className="text-sm text-neutral-500 line-through">
                        {formatPrice(product.regular_price || product.price)}
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
              {inStock && !safeIsPriceZero(product.price) && (
                <button
                  onClick={handleAddToCart}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-neutral-400 disabled:to-neutral-500 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2 group/button relative overflow-hidden"
                  aria-label={`Add ${product.name} to shopping cart`}
                  aria-describedby={`product-${product.id}-description`}
                  aria-disabled={!inStock || isLoading}
                >
                  {/* Slide-in cart icon effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-green-700 to-green-800 translate-x-full group-hover/button:translate-x-0 transition-transform duration-300 flex items-center justify-center">
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
                  <div className="absolute inset-0 bg-green-500 rounded-xl opacity-0 group-hover/button:opacity-20 blur-sm transition-opacity duration-300"></div>
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