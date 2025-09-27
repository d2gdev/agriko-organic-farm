'use client';

import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { reliableFetch } from '@/lib/reliable-fetch';

import { useRouter } from 'next/navigation';
import Navbar from './Navbar';
import { WCProduct } from '@/types/woocommerce';
import { SerializedWCProduct, deserializeProduct } from '@/lib/product-serializer';
import { useCommerceKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useCart } from '@/context/CartContext';
// Removed direct WooCommerce import - now using API routes

export default function NavbarWrapper() {
  const [products, setProducts] = useState<WCProduct[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const { toggleCart } = useCart();

  // Global keyboard shortcuts
  useCommerceKeyboardShortcuts({
    onSearch: () => setIsSearchOpen(true),
    onCart: () => toggleCart(),
    onHome: () => router.push('/'),
    onProducts: () => router.push('/products'),
    enabled: true
  });

  // Track mounted state first
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load products effect with proper dependency handling
  useEffect(() => {
    // Only load products after mounting to prevent SSR/client mismatch
    if (!isMounted || isLoading) return;

    let cancelled = false;

    // Fetch products for search functionality with fallback for static export
    const loadProducts = async () => {
      setIsLoading(true);
      try {
        // Check if we're on localhost and be more permissive with timeouts
        const isLocalhost = typeof window !== 'undefined' &&
          (window.location.hostname === 'localhost' ||
           window.location.hostname === '127.0.0.1' ||
           window.location.hostname.startsWith('192.168.'));

        // On localhost, use a shorter timeout and no retries to fail fast
        const response = await reliableFetch('/api/products?per_page=100&status=publish', {
          timeoutLevel: isLocalhost ? 'critical' : 'background', // 5s on localhost, 30s elsewhere
          retries: 0, // No retries to fail fast
          onError: () => {
            if (isLocalhost) {
              logger.debug('Products API not available on localhost, using empty product list for search');
            } else {
              logger.debug('Products API not available, using empty product list');
            }
          }
        });

        if (!cancelled && response.ok) {
          const data = await response.json();
          // Convert serialized products to WCProduct objects for compatibility
          const serializedProducts: SerializedWCProduct[] = Array.isArray(data) ? data : [];
          const deserializedProducts: WCProduct[] = serializedProducts.map(deserializeProduct);
          setProducts(deserializedProducts);
          logger.info(`Loaded ${serializedProducts.length} products for search (deserialized)`);
          return;
        }

        // Fallback: use empty product list (search will still work, just no autocomplete)
        if (!cancelled) {
          logger.debug('API routes not available, using empty product list for search');
          setProducts([]);
        }
      } catch (error) {
        if (!cancelled) {
          const isLocalhost = typeof window !== 'undefined' &&
            (window.location.hostname === 'localhost' ||
             window.location.hostname === '127.0.0.1' ||
             window.location.hostname.startsWith('192.168.'));

          if (isLocalhost) {
            logger.debug('Products API failed on localhost - WooCommerce server may not be accessible');
          } else {
            logger.warn('Error fetching products for search:', error as Record<string, unknown>);
          }
          // Set empty array on error to prevent UI issues
          setProducts([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadProducts();

    // Cleanup function
    return () => {
      cancelled = true;
    };
  }, [isMounted, isLoading]); // Include isLoading in dependencies

  return (
    <Navbar 
      products={products} 
      isSearchOpen={isSearchOpen}
      setIsSearchOpen={setIsSearchOpen}
    />
  );
}