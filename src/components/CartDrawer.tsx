'use client';

import React, { Fragment, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart, type CartItem as CartItemType } from '@/context/CartContext';
import { formatPrice, getProductMainImage } from '@/lib/utils';

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

  // Create memoized cart item component
  const CartItem = React.memo(({ item, index }: { item: CartItemType; index: number }) => {
    const itemKey = `${item.product.id}-${item.variation?.id ?? 'no-variation'}`;

    const handleDecreaseQuantity = useCallback(() => {
      updateQuantity(item.product.id, item.quantity - 1, item.variation?.id);
    }, [item.product.id, item.quantity, item.variation?.id]);

    const handleIncreaseQuantity = useCallback(() => {
      updateQuantity(item.product.id, item.quantity + 1, item.variation?.id);
    }, [item.product.id, item.quantity, item.variation?.id]);

    const handleRemoveItem = useCallback(() => {
      removeItem(item.product.id, item.variation?.id);
    }, [item.product.id, item.variation?.id]);

    const productImage = useMemo(() => getProductMainImage(item.product), [item.product]);
    const formattedPrice = useMemo(() => formatPrice(item.product.price), [item.product.price]);

    return (
      <div key={itemKey} className={`flex items-start space-x-4 bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-all duration-200 animate-fadeInUp`} style={{animationDelay: `${index * 100}ms`}}>
        {/* Product Image */}
        <div className="flex-shrink-0">
          <Image
            src={productImage}
            alt={item.product.name}
            width={64}
            height={64}
            className="rounded-md object-cover"
          />
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <Link
            href={`/product/${item.product.slug}`}
            onClick={handleProductLinkClick}
            className="text-sm font-medium text-gray-900 hover:text-primary-600 transition-colors line-clamp-2"
          >
            {item.product.name}
          </Link>

          {item.variation && (
            <div className="text-xs text-gray-500 mt-1">
              {Object.entries(item.variation.attributes).map(([key, value]) => (
                <span key={key} className="mr-2">
                  {key}: {value}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-2">
            <span className="text-sm font-semibold text-gray-900">
              {formattedPrice}
            </span>

            {/* Quantity Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleDecreaseQuantity}
                className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-full text-gray-600 transition-all duration-200 hover:scale-110 active:animate-jiggle"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>

              <span className="text-sm font-medium text-gray-900 w-8 text-center">
                {item.quantity}
              </span>

              <button
                onClick={handleIncreaseQuantity}
                className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-full text-gray-600 transition-all duration-200 hover:scale-110 active:animate-jiggle"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>
          </div>

          {/* Remove Button */}
          <button
            onClick={handleRemoveItem}
            className="text-xs text-red-500 hover:text-red-700 mt-2 transition-all duration-200 hover:scale-105 active:animate-jiggle"
          >
            Remove
          </button>
        </div>
      </div>
    );
  });

  CartItem.displayName = 'CartItem';

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
                  <CartItem key={`${item.product.id}-${item.variation?.id ?? 'no-variation'}`} item={item} index={index} />
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