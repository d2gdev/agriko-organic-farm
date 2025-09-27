'use client';

import { useWishlist } from '@/context/WishlistContext';
import { useSafeCart } from '@/context/CartContext';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';
import Image from 'next/image';
import { formatPrice, getProductMainImage } from '@/lib/utils';
import { serializeProducts } from '@/lib/product-serializer';
import { WCProduct } from '@/types/woocommerce';
import { Money } from '@/lib/money';
import toast from 'react-hot-toast';

export default function WishlistPage() {
  const wishlist = useWishlist();
  const cart = useSafeCart();
  const { items: rawItems } = wishlist.state;
  const items = serializeProducts(rawItems);

  const handleMoveToCart = (productId: number) => {
    const originalProduct = rawItems.find(p => p.id === productId);
    if (originalProduct) {
      cart?.addItem(originalProduct);
      wishlist.removeItem(productId);
      toast.success(`${originalProduct.name} moved to cart!`);
    }
  };

  const handleRemoveFromWishlist = (productId: number) => {
    wishlist.removeItem(productId);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-md">
          <svg
            className="w-24 h-24 mx-auto mb-6 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Your Wishlist is Empty</h1>
          <p className="text-gray-500 mb-8">
            Save your favorite products to your wishlist and they will appear here.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Wishlist</h1>
        <p className="text-gray-600">
          You have {items.length} {items.length === 1 ? 'item' : 'items'} in your wishlist
        </p>
      </div>

      {/* Grid view for larger screens */}
      <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map((product) => (
          <div key={product.id} className="relative">
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      {/* List view for mobile */}
      <div className="md:hidden space-y-4">
        {items.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-lg shadow-md p-4 flex gap-4"
          >
            <div className="flex-shrink-0">
              <Image
                src={getProductMainImage(product)}
                alt={product.name}
                width={80}
                height={80}
                className="rounded-lg object-cover"
              />
            </div>

            <div className="flex-1 min-w-0">
              <Link
                href={`/product/${product.slug}`}
                className="text-lg font-semibold text-gray-900 hover:text-primary-600 transition-colors"
              >
                {product.name}
              </Link>

              <p className="text-lg font-bold text-primary-600 mt-1">
                {formatPrice(product.price || Money.ZERO)}
              </p>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleMoveToCart(product.id)}
                  className="flex-1 px-3 py-2 bg-primary-600 text-white text-sm rounded hover:bg-primary-700 transition-colors"
                >
                  Add to Cart
                </button>
                <button
                  onClick={() => handleRemoveFromWishlist(product.id)}
                  className="px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <Link
          href="/products"
          className="text-primary-600 hover:text-primary-700 transition-colors"
        >
          ← Continue Shopping
        </Link>

        {items.length > 0 && (
          <button
            onClick={() => {
              wishlist.clearWishlist();
            }}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Clear Wishlist
          </button>
        )}
      </div>
    </div>
  );
}