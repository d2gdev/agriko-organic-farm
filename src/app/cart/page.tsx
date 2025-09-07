'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { formatPrice, getProductMainImage } from '@/lib/utils';
import HeroSection from '@/components/HeroSection';

export default function CartPage() {
  const { state, updateQuantity, removeItem } = useCart();

  // Handle quantity change
  const handleQuantityChange = (productId: number, newQuantity: number, variationId?: number) => {
    if (newQuantity <= 0) {
      removeItem(productId, variationId);
    } else {
      updateQuantity(productId, newQuantity, variationId);
    }
  };

  if (state.items.length === 0) {
    return (
      <>
        <HeroSection 
          title="Agriko"
          subtitle="Shopping Cart"
          description="Your cart is currently empty. Browse our premium organic products and add them to your cart."
          primaryButtonText="Start Shopping"
          primaryButtonHref="/"
          showButtons={false}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <svg className="mx-auto h-24 w-24 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m4.5-5a2 2 0 100 4 2 2 0 000-4zm6 0a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
            <h1 className="text-3xl font-bold text-gray-900 mt-4 mb-2">Your cart is empty</h1>
            <p className="text-lg text-gray-600 mb-8">
              Start shopping to fill your cart with great products.
            </p>
            <Link
              href="/"
              className="inline-block bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <HeroSection 
        title="Agriko"
        subtitle="Shopping Cart"
        description="Review your selected organic products before checkout. Quality farm-fresh items delivered to your door."
        showButtons={false}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
        <p className="text-gray-600 mt-2">
          {state.itemCount} {state.itemCount === 1 ? 'item' : 'items'} in your cart
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Desktop Header */}
            <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-700">
              <div className="col-span-6">Product</div>
              <div className="col-span-2 text-center">Price</div>
              <div className="col-span-2 text-center">Quantity</div>
              <div className="col-span-2 text-center">Total</div>
            </div>

            {/* Cart Items */}
            <div className="divide-y divide-gray-200">
              {state.items.map((item) => {
                const itemKey = `${item.product.id}-${item.variation?.id || 'no-variation'}`;
                const itemTotal = parseFloat(item.product.price) * item.quantity;

                return (
                  <div key={itemKey} className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                      {/* Product Info */}
                      <div className="col-span-1 md:col-span-6 flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <Link href={`/product/${item.product.slug}`}>
                            <Image
                              src={getProductMainImage(item.product)}
                              alt={item.product.name}
                              width={80}
                              height={80}
                              className="rounded-lg object-cover"
                            />
                          </Link>
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link 
                            href={`/product/${item.product.slug}`}
                            className="text-lg font-medium text-gray-900 hover:text-primary-600 transition-colors line-clamp-2"
                          >
                            {item.product.name}
                          </Link>
                          
                          {item.variation && (
                            <div className="text-sm text-gray-500 mt-1">
                              {Object.entries(item.variation.attributes).map(([key, value]) => (
                                <span key={key} className="mr-3">
                                  {key}: {value}
                                </span>
                              ))}
                            </div>
                          )}

                          {item.product.sku && (
                            <p className="text-sm text-gray-500 mt-1">
                              SKU: {item.product.sku}
                            </p>
                          )}

                          <button
                            onClick={() => removeItem(item.product.id, item.variation?.id)}
                            className="text-sm text-red-600 hover:text-red-800 mt-2 transition-colors md:hidden"
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="col-span-1 md:col-span-2 md:text-center">
                        <div className="flex items-center justify-between md:justify-center">
                          <span className="text-sm text-gray-500 md:hidden">Price:</span>
                          <span className="font-medium text-gray-900">
                            {formatPrice(item.product.price)}
                          </span>
                        </div>
                      </div>

                      {/* Quantity */}
                      <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center justify-between md:justify-center">
                          <span className="text-sm text-gray-500 md:hidden">Quantity:</span>
                          <div className="flex items-center border border-gray-300 rounded-lg">
                            <button
                              onClick={() => handleQuantityChange(item.product.id, item.quantity - 1, item.variation?.id)}
                              className="p-2 hover:bg-gray-100 transition-colors"
                              aria-label="Decrease quantity"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                              </svg>
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleQuantityChange(item.product.id, parseInt(e.target.value) || 1, item.variation?.id)}
                              className="w-16 p-2 text-center border-0 focus:ring-0"
                            />
                            <button
                              onClick={() => handleQuantityChange(item.product.id, item.quantity + 1, item.variation?.id)}
                              className="p-2 hover:bg-gray-100 transition-colors"
                              aria-label="Increase quantity"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Total */}
                      <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center justify-between md:justify-center">
                          <span className="text-sm text-gray-500 md:hidden">Total:</span>
                          <div className="text-right md:text-center">
                            <span className="font-semibold text-gray-900">
                              {formatPrice(itemTotal)}
                            </span>
                            <button
                              onClick={() => removeItem(item.product.id, item.variation?.id)}
                              className="hidden md:block text-sm text-red-600 hover:text-red-800 mt-1 transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Continue Shopping */}
          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Continue Shopping
            </Link>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h2>
            
            <div className="space-y-4">
              {/* Subtotal */}
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal ({state.itemCount} items)</span>
                <span className="font-medium">{formatPrice(state.total)}</span>
              </div>

              {/* Shipping */}
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className="font-medium">Calculated at checkout</span>
              </div>

              {/* Tax */}
              <div className="flex justify-between">
                <span className="text-gray-600">Tax</span>
                <span className="font-medium">Calculated at checkout</span>
              </div>

              <hr className="border-gray-200" />

              {/* Total */}
              <div className="flex justify-between">
                <span className="text-lg font-semibold text-gray-900">Total</span>
                <span className="text-lg font-bold text-gray-900">{formatPrice(state.total)}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <Link
              href="/checkout"
              className="w-full bg-primary-600 text-white py-4 px-6 rounded-lg font-semibold text-center hover:bg-primary-700 transition-colors mt-6 block"
            >
              Proceed to Checkout
            </Link>

            {/* Secure Checkout Notice */}
            <div className="flex items-center justify-center mt-4 text-sm text-gray-500">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Secure Checkout
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}