'use client';

import React, { useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { type CartItem as CartItemType } from '@/context/CartContext';
import { formatPrice, getProductMainImage } from '@/lib/utils';

interface CartItemProps {
  item: CartItemType;
  index: number;
  updateQuantity: (productId: number, quantity: number, variationId?: number) => void;
  removeItem: (productId: number, variationId?: number) => void;
  onProductClick: () => void;
}

const CartItem = React.memo(({
  item,
  index,
  updateQuantity,
  removeItem,
  onProductClick
}: CartItemProps) => {
  const itemKey = `${item.product.id}-${item.variation?.id ?? 'no-variation'}`;

  const handleDecreaseQuantity = useCallback(() => {
    updateQuantity(item.product.id, item.quantity - 1, item.variation?.id);
  }, [updateQuantity, item.product.id, item.quantity, item.variation?.id]);

  const handleIncreaseQuantity = useCallback(() => {
    updateQuantity(item.product.id, item.quantity + 1, item.variation?.id);
  }, [updateQuantity, item.product.id, item.quantity, item.variation?.id]);

  const handleRemoveItem = useCallback(() => {
    removeItem(item.product.id, item.variation?.id);
  }, [removeItem, item.product.id, item.variation?.id]);

  const productImage = useMemo(() => getProductMainImage(item.product), [item.product]);
  const formattedPrice = useMemo(() => formatPrice(item.product.price), [item.product.price]);

  return (
    <div
      className="flex items-start space-x-4 bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-all duration-200 animate-fadeInUp"
      style={{animationDelay: `${index * 100}ms`}}
    >
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
          onClick={onProductClick}
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
              aria-label={`Decrease quantity of ${item.product.name}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>

            <span className="text-sm font-medium text-gray-900 w-8 text-center" aria-label={`Quantity: ${item.quantity}`}>
              {item.quantity}
            </span>

            <button
              onClick={handleIncreaseQuantity}
              className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-full text-gray-600 transition-all duration-200 hover:scale-110 active:animate-jiggle"
              aria-label={`Increase quantity of ${item.product.name}`}
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
          aria-label={`Remove ${item.product.name} from cart`}
        >
          Remove
        </button>
      </div>
    </div>
  );
});

CartItem.displayName = 'CartItem';

export default CartItem;