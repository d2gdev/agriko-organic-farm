'use client';

import { useState } from 'react';
import { logger } from '@/lib/logger';

import { WCProduct } from '@/types/woocommerce';
import { useCart } from '@/context/CartContext';
import { isProductInStock } from '@/lib/utils';
import { OrganicSpinner } from '@/components/OrganicLoadingStates';

interface AddToCartButtonProps {
  product: WCProduct;
}

export default function AddToCartButton({ product }: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const { addItem, openCart } = useCart();

  const inStock = isProductInStock(product);

  const handleAddToCart = async () => {
    if (!inStock) return;
    
    setIsAdding(true);
    try {
      addItem(product, quantity);
      
      // Show success feedback
      setTimeout(() => {
        openCart();
      }, 200);
    } catch (error) {
      logger.error('Error adding to cart:', error as Record<string, unknown>);
    } finally {
      setIsAdding(false);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const increaseQuantity = () => {
    setQuantity(quantity + 1);
  };

  if (!inStock) {
    return (
      <div className="space-y-4">
        <button
          disabled
          className="w-full bg-gradient-to-r from-gray-300 to-gray-400 text-gray-600 py-4 px-6 rounded-2xl font-bold text-lg cursor-not-allowed shadow-lg border border-gray-300"
        >
          🙅 Out of Stock
        </button>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <p className="text-sm text-amber-800 font-medium">
            ⚠️ This product is currently unavailable. Sign up for notifications when it&apos;s back!
          </p>
          <button className="mt-2 text-amber-700 underline hover:text-amber-900 transition-colors">
            Notify me when available
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quantity Selector */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <label htmlFor="quantity" className="text-sm font-bold text-gray-900">
            📊 Quantity:
          </label>
          <div className="flex items-center bg-white border-2 border-gray-300 rounded-xl shadow-sm">
            <button
              onClick={decreaseQuantity}
              className="p-3 hover:bg-red-50 transition-all duration-200 rounded-l-xl border-r border-gray-200 text-red-600 hover:text-red-700"
              aria-label="Decrease quantity"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-20 p-3 text-center border-0 focus:ring-0 font-bold text-lg text-gray-900 bg-transparent"
            />
            <button
              onClick={increaseQuantity}
              className="p-3 hover:bg-green-50 transition-all duration-200 rounded-r-xl border-l border-gray-200 text-green-600 hover:text-green-700"
              aria-label="Increase quantity"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Add to Cart Button */}
      <button
        onClick={handleAddToCart}
        disabled={isAdding}
        className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-red-400 disabled:to-red-500 text-white py-5 px-8 rounded-2xl font-bold text-xl transition-all duration-300 flex items-center justify-center space-x-3 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 active:translate-y-0"
      >
        {isAdding ? (
          <>
            <OrganicSpinner size="sm" />
            <span>🛍️ Adding to cart...</span>
          </>
        ) : (
          <>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m4.5-5a2 2 0 100 4 2 2 0 000-4zm6 0a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
            <span>🛍️ Add to Cart</span>
          </>
        )}
      </button>

      {/* Additional Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button className="bg-gradient-to-r from-pink-100 to-red-100 border-2 border-pink-200 text-pink-700 hover:from-pink-200 hover:to-red-200 hover:border-pink-300 py-4 px-4 rounded-2xl font-bold transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span>💖 Wishlist</span>
        </button>
        <button className="bg-gradient-to-r from-blue-100 to-indigo-100 border-2 border-blue-200 text-blue-700 hover:from-blue-200 hover:to-indigo-200 hover:border-blue-300 py-4 px-4 rounded-2xl font-bold transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
          </svg>
          <span>📤 Share</span>
        </button>
      </div>
    </div>
  );
}