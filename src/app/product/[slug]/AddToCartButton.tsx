'use client';

import { useState } from 'react';
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
      console.error('Error adding to cart:', error);
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
          className="w-full bg-gray-300 text-gray-500 py-4 px-6 rounded-lg font-semibold text-lg cursor-not-allowed"
        >
          Out of Stock
        </button>
        <p className="text-sm text-gray-500 text-center">
          This product is currently unavailable.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Quantity Selector */}
      <div className="flex items-center space-x-4">
        <label htmlFor="quantity" className="text-sm font-medium text-gray-900">
          Quantity:
        </label>
        <div className="flex items-center border border-gray-300 rounded-lg">
          <button
            onClick={decreaseQuantity}
            className="p-2 hover:bg-gray-100 transition-colors"
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
            className="w-16 p-2 text-center border-0 focus:ring-0"
          />
          <button
            onClick={increaseQuantity}
            className="p-2 hover:bg-gray-100 transition-colors"
            aria-label="Increase quantity"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Add to Cart Button */}
      <button
        onClick={handleAddToCart}
        disabled={isAdding}
        className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white py-4 px-6 rounded-lg font-semibold text-lg transition-colors flex items-center justify-center space-x-2"
      >
        {isAdding ? (
          <>
            <OrganicSpinner size="sm" />
            <span>Adding to cart...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m4.5-5a2 2 0 100 4 2 2 0 000-4zm6 0a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
            <span>Add to Cart</span>
          </>
        )}
      </button>

      {/* Additional Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button className="border border-gray-300 text-gray-700 hover:bg-gray-50 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span>Add to Wishlist</span>
        </button>
        <button className="border border-gray-300 text-gray-700 hover:bg-gray-50 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
          </svg>
          <span>Share</span>
        </button>
      </div>
    </div>
  );
}