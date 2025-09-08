'use client';

import Link from 'next/link';
import Image from 'next/image';
import { WCProduct } from '@/types/woocommerce';
import { formatPrice, getProductMainImage, stripHtml, isProductInStock } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import toast from 'react-hot-toast';
import { useState } from 'react';

interface EnhancedProductCardProps {
  product: WCProduct;
  className?: string;
  priority?: boolean;
}

export default function EnhancedProductCard({ 
  product, 
  className = '', 
  priority = false 
}: EnhancedProductCardProps) {
  const { addItem, toggleCart } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 600));
      addItem(product);
      
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
      
      setTimeout(() => toggleCart(), 1200);
      
    } catch (error) {
      toast.error('Failed to add item to cart');
    } finally {
      setIsLoading(false);
    }
  };

  const inStock = isProductInStock(product);
  const mainImage = getProductMainImage(product);
  const shortDescription = product.short_description ? stripHtml(product.short_description) : '';
  const discountPercentage = product.on_sale && product.regular_price !== product.price 
    ? Math.round(((parseFloat(product.regular_price) - parseFloat(product.price)) / parseFloat(product.regular_price)) * 100)
    : null;

  return (
    <div className={`group relative ${className}`}>
      {/* Card Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 hover:shadow-xl hover:border-primary-200 transition-all duration-500 ease-out overflow-hidden hover:-translate-y-2 h-full flex flex-col relative">
        
        {/* Premium Badge for featured products */}
        {product.featured && (
          <div className="absolute top-4 left-4 z-10 bg-gradient-to-r from-amber-400 to-amber-500 text-amber-900 px-3 py-1 text-xs font-bold rounded-full shadow-lg flex items-center space-x-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span>Premium</span>
          </div>
        )}

        {/* Product Image Container */}
        <Link href={`/product/${product.slug}`} className="block relative">
          <div className="relative aspect-square bg-gradient-to-br from-neutral-50 to-neutral-100 overflow-hidden group-hover:from-primary-50 group-hover:to-primary-100 transition-colors duration-500">
            
            {/* Loading Shimmer */}
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse">
                <div className="absolute inset-0 bg-neutral-200 animate-shimmer"></div>
              </div>
            )}
            
            <Image
              src={mainImage}
              alt={product.name}
              fill
              className={`object-cover transition-all duration-700 ease-out ${
                imageLoaded ? 'opacity-100 group-hover:scale-110' : 'opacity-0'
              }`}
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              priority={priority}
              onLoad={() => setImageLoaded(true)}
            />
            
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

            {/* Quick View Overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
                <div className="bg-white/90 backdrop-blur-sm text-neutral-900 px-4 py-2 rounded-full font-medium shadow-lg border">
                  Quick View
                </div>
              </div>
            </div>
          </div>
        </Link>

        {/* Product Information */}
        <div className="p-6 flex-1 flex flex-col">
          {/* Category Tags */}
          {product.categories && product.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {product.categories.slice(0, 1).map((category) => (
                <span
                  key={category.id}
                  className="inline-block bg-green-50 text-green-700 text-xs font-medium px-2 py-1 rounded-full border border-green-100"
                >
                  {category.name}
                </span>
              ))}
            </div>
          )}

          <Link href={`/product/${product.slug}`} className="block flex-1">
            {/* Product Name */}
            <h3 className="text-lg font-semibold text-neutral-900 mb-3 line-clamp-2 leading-tight group-hover:text-primary-700 transition-colors duration-200">
              {product.name}
            </h3>
            
            {/* Description */}
            {shortDescription && (
              <p className="text-neutral-600 text-sm mb-4 line-clamp-3 leading-relaxed">
                {shortDescription}
              </p>
            )}
          </Link>

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

            {/* Add to Cart Button */}
            {inStock && (
              <button
                onClick={handleAddToCart}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 disabled:from-neutral-400 disabled:to-neutral-500 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2 group/button"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Adding...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 group-hover/button:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5" />
                    </svg>
                    <span>Add to Cart</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}