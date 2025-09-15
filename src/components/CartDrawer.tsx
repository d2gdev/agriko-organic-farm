'use client';

import React, { useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/utils';
import CartItem from './CartItem';

const CartDrawer = React.memo(function CartDrawer() {
  const { state, closeCart, updateQuantity, removeItem } = useCart();

  // Memoize handlers to prevent re-renders
  const handleOverlayClick = useCallback(() => {
    closeCart();
  }, [closeCart]);

  const handleCloseClick = useCallback(() => {
    closeCart();
  }, [closeCart]);

  const handleContinueShoppingClick = useCallback(() => {
    closeCart();
  }, [closeCart]);

  const handleProductLinkClick = useCallback(() => {
    closeCart();
  }, [closeCart]);

  const handleViewCartClick = useCallback(() => {
    closeCart();
  }, [closeCart]);

  const handleCheckoutClick = useCallback(() => {
    closeCart();
  }, [closeCart]);

  // Memoize total formatting to prevent unnecessary calculations
  const formattedTotal = useMemo(() => formatPrice(state.total), [state.total]);

  if (!state.isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 animate-fadeIn"
        onClick={handleOverlayClick}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out overflow-hidden animate-slideInFromRight">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-heading-2 text-gray-900">
              Shopping Cart ({state.itemCount})
            </h2>
            <button
              onClick={handleCloseClick}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto">
            {state.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m4.5-5a2 2 0 100 4 2 2 0 000-4zm6 0a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
                <h3 className="text-heading-3 text-gray-900 mb-2">Your cart is empty</h3>
                <p className="text-gray-500 mb-6">Start shopping to fill your cart with great products.</p>
                <Link
                  href="/"
                  onClick={handleContinueShoppingClick}
                  className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                >
                  Continue Shopping
                </Link>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {state.items.map((item, index) => (
                  <CartItem
                    key={`${item.product.id}-${item.variation?.id ?? 'no-variation'}`}
                    item={item}
                    index={index}
                    updateQuantity={updateQuantity}
                    removeItem={removeItem}
                    onProductClick={handleProductLinkClick}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {state.items.length > 0 && (
            <div className="border-t border-gray-200 p-4 space-y-4">
              {/* Total */}
              <div className="flex items-center justify-between">
                <span className="text-base font-medium text-gray-900">Total:</span>
                <span className="text-xl font-bold text-gray-900">
                  {formattedTotal}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/cart"
                  onClick={handleViewCartClick}
                  className="bg-gray-200 text-gray-900 px-4 py-3 rounded-lg font-medium text-center hover:bg-gray-300 transition-all duration-200 transform hover:scale-105 active:animate-jiggle"
                >
                  View Cart
                </Link>
                <Link
                  href="/checkout"
                  onClick={handleCheckoutClick}
                  className="bg-primary-600 text-white px-4 py-3 rounded-lg font-medium text-center hover:bg-primary-700 transition-all duration-200 transform hover:scale-105 active:animate-jiggle hover:animate-glow"
                >
                  Checkout
                </Link>
              </div>

              {/* Continue Shopping */}
              <Link
                href="/"
                onClick={handleContinueShoppingClick}
                className="block text-center text-sm text-primary-600 hover:text-primary-700 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
});

CartDrawer.displayName = 'CartDrawer';

export default CartDrawer;