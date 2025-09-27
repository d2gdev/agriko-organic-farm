'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { formatPrice, getProductMainImage } from '@/lib/utils';
import { Money } from '@/lib/money';
import HeroSection from '@/components/HeroSection';
import { Core } from '@/types/TYPE_REGISTRY';

export default function CartPage() {
  const { state, updateQuantity, removeItem } = useCart();

  // Handle quantity change with validation
  const handleQuantityChange = (productId: number, newQuantity: number, variationId?: number, maxStock?: number) => {
    // Validate minimum quantity
    if (newQuantity <= 0) {
      removeItem(productId, variationId);
      return;
    }
    
    // Validate maximum quantity against stock
    if (maxStock && newQuantity > maxStock) {
      newQuantity = maxStock;
    }
    
    // Ensure quantity is a positive integer
    const validQuantity = Math.max(1, Math.floor(newQuantity));
    updateQuantity(productId, validQuantity, variationId);
  };

  // Handle quantity input change with validation
  const handleQuantityInputChange = (productId: number, inputValue: string, variationId?: number, maxStock?: number) => {
    const parsedValue = parseInt(inputValue);
    if (isNaN(parsedValue) || parsedValue < 1) {
      // Don't update if invalid, let user correct
      return;
    }
    handleQuantityChange(productId, parsedValue, variationId, maxStock);
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
          <div className="text-center max-w-md mx-auto">
            {/* Enhanced empty cart illustration */}
            <div className="relative">
              <svg className="mx-auto h-32 w-32 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m4.5-5a2 2 0 100 4 2 2 0 000-4zm6 0a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
              {/* Floating organic elements */}
              <div className="absolute -top-2 -right-4 w-8 h-8 bg-accent-100 rounded-full opacity-60 animate-pulse"></div>
              <div className="absolute -bottom-3 -left-2 w-6 h-6 bg-primary-100 rounded-full opacity-40 animate-pulse delay-75"></div>
            </div>
            
            <h1 className="text-heading-1 text-neutral-900 mt-6 mb-3">Your cart is empty</h1>
            <p className="text-lg text-neutral-600 mb-8 leading-relaxed">
              Discover our premium organic products from Agriko Farm. Fresh rice varieties, herbal powders, and natural health blends await you!
            </p>
            
            {/* Featured categories */}
            <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
              <div className="bg-accent-50 rounded-lg p-4 text-center">
                <div className="text-accent-700 font-medium">🌾 Organic Rice</div>
                <div className="text-neutral-600 mt-1">Black, Brown, Red, White</div>
              </div>
              <div className="bg-primary-50 rounded-lg p-4 text-center">
                <div className="text-primary-700 font-medium">🌿 Herbal Powders</div>
                <div className="text-neutral-600 mt-1">Turmeric, Ginger, Moringa</div>
              </div>
            </div>
            
            <div className="space-y-4">
              <Link
                href="/"
                className="inline-block bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-4 rounded-xl font-bold hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Explore Our Products
              </Link>
              
              {/* Cart persistence notice */}
              <p className="text-xs text-neutral-500 flex items-center justify-center mt-4">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                Items you add will be saved for your next visit
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <HeroSection
        title="Agriko"
        subtitle="Your Wellness Selection"
        description="Review your carefully chosen organic products before checkout. Quality farm-fresh wellness delivered to your door."
        showButtons={false}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-heading-1 text-neutral-900">Shopping Cart</h1>
        <p className="text-neutral-600 mt-2">
          {state.itemCount} {state.itemCount === 1 ? 'item' : 'items'} in your cart
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
            {/* Desktop Header */}
            <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-4 bg-neutral-50 border-b border-neutral-200 text-sm font-medium text-neutral-700">
              <div className="col-span-6">Product</div>
              <div className="col-span-2 text-center">Price</div>
              <div className="col-span-2 text-center">Quantity</div>
              <div className="col-span-2 text-center">Total</div>
            </div>

            {/* Cart Items */}
            <div className="divide-y divide-gray-200">
              {state.items.map((item) => {
                const itemKey = `${item.product.id}-${item.variation?.id || 'no-variation'}`;
                const itemTotal = Money.parse(String(item.product.price || '0')).multiply(item.quantity);

                return (
                  <div key={itemKey} className="p-6 animate-fadeInUp hover:bg-gray-50 transition-colors duration-200">
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
                            className="text-lg font-medium text-neutral-900 hover:text-primary-600 transition-colors line-clamp-2"
                          >
                            {item.product.name}
                          </Link>
                          
                          {item.variation && (
                            <div className="text-sm text-neutral-500 mt-1">
                              {Object.entries(item.variation.attributes).map(([key, value]) => (
                                <span key={key} className="mr-3">
                                  {key}: {value}
                                </span>
                              ))}
                            </div>
                          )}

                          {item.product.sku && (
                            <p className="text-sm text-neutral-500 mt-1">
                              SKU: {item.product.sku}
                            </p>
                          )}

                          <button
                            onClick={() => removeItem(item.product.id, item.variation?.id)}
                            className="text-sm text-red-600 hover:text-red-700 mt-2 transition-colors font-medium md:hidden"
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="col-span-1 md:col-span-2 md:text-center">
                        <div className="flex items-center justify-between md:justify-center">
                          <span className="text-sm text-neutral-500 md:hidden">Price:</span>
                          <span className="font-medium text-neutral-900">
                            {formatPrice((item.product.price || 0) as Core.Money)}
                          </span>
                        </div>
                      </div>

                      {/* Quantity */}
                      <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center justify-between md:justify-center">
                          <span className="text-sm text-neutral-500 md:hidden">Quantity:</span>
                          <div className="flex items-center border border-neutral-300 rounded-lg">
                            <button
                              onClick={() => handleQuantityChange(item.product.id, item.quantity - 1, item.variation?.id, item.product.stock_quantity ?? undefined)}
                              className="p-2 hover:bg-neutral-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              aria-label="Decrease quantity"
                              disabled={item.quantity <= 1}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                              </svg>
                            </button>
                            <input
                              type="number"
                              min="1"
                              max={item.product.stock_quantity || 999}
                              value={item.quantity}
                              onChange={(e) => handleQuantityInputChange(item.product.id, e.target.value, item.variation?.id, item.product.stock_quantity ?? undefined)}
                              className="w-16 p-2 text-center border-0 focus:ring-0 focus:outline-none"
                              aria-label={`Quantity for ${item.product.name}`}
                            />
                            <button
                              onClick={() => handleQuantityChange(item.product.id, item.quantity + 1, item.variation?.id, item.product.stock_quantity ?? undefined)}
                              className="p-2 hover:bg-neutral-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              aria-label="Increase quantity"
                              disabled={item.product.stock_quantity ? item.quantity >= item.product.stock_quantity : false}
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
                          <span className="text-sm text-neutral-500 md:hidden">Total:</span>
                          <div className="text-right md:text-center">
                            <span className="font-semibold text-neutral-900">
                              {formatPrice(itemTotal)}
                            </span>
                            <button
                              onClick={() => removeItem(item.product.id, item.variation?.id)}
                              className="hidden md:block text-sm text-red-600 hover:text-red-700 mt-1 transition-colors font-medium"
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
              className="inline-flex items-center text-green-600 hover:text-green-700 font-semibold transition-colors duration-200 group"
            >
              <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Continue Shopping
            </Link>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-xl border-2 border-gray-100 p-8 sticky top-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="text-2xl">📋</span>
              Order Summary
            </h2>
            
            <div className="space-y-4">
              {/* Items breakdown */}
              <div className="space-y-2 pb-2">
                {state.items.slice(0, 3).map((item) => {
                  const itemKey = `${item.product.id}-${item.variation?.id || 'no-variation'}`;
                  const itemTotal = Money.parse(String(item.product.price || '0')).multiply(item.quantity);
                  return (
                    <div key={itemKey} className="flex justify-between text-sm">
                      <span className="text-neutral-600 truncate mr-2">
                        {item.product.name.length > 25 
                          ? `${item.product.name.substring(0, 25)}...`
                          : item.product.name
                        } ({item.quantity}×)
                      </span>
                      <span className="font-medium text-neutral-800">{formatPrice(itemTotal)}</span>
                    </div>
                  );
                })}
                {state.items.length > 3 && (
                  <div className="flex justify-between text-sm text-neutral-500">
                    <span>+ {state.items.length - 3} more items</span>
                    <span>...</span>
                  </div>
                )}
              </div>

              <hr className="border-neutral-200" />

              {/* Subtotal */}
              <div className="flex justify-between">
                <span className="text-neutral-600">Subtotal ({state.itemCount} items)</span>
                <span className="font-semibold text-neutral-900">{formatPrice(state.total)}</span>
              </div>

              {/* Shipping */}
              <div className="flex justify-between">
                <span className="text-neutral-600">Shipping</span>
                <span className="font-medium text-green-600">Free delivery*</span>
              </div>

              {/* Tax */}
              <div className="flex justify-between">
                <span className="text-neutral-600">Tax</span>
                <span className="font-medium">Calculated at checkout</span>
              </div>

              <hr className="border-neutral-200" />

              {/* Total */}
              <div className="flex justify-between">
                <span className="text-lg font-semibold text-neutral-900">Total</span>
                <span className="text-xl font-bold text-red-600">{formatPrice(state.total)}</span>
              </div>

              {/* Savings indicator */}
              <div className="text-center text-sm text-green-700 bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-3 border border-green-200">
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                You&apos;re saving on shipping costs!
              </div>
            </div>

            {/* Checkout Button */}
            <Link
              href="/checkout"
              className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-4 px-6 rounded-xl font-bold text-center hover:from-red-700 hover:to-red-800 transition-all duration-300 mt-6 block transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Proceed to Checkout
            </Link>

            {/* Secure Checkout Notice */}
            <div className="flex items-center justify-center mt-4 text-sm text-gray-600 font-medium">
              <span className="text-lg mr-1">🔒</span>
              Secure Checkout
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}