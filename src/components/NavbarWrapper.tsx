'use client';

import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { reliableFetch } from '@/lib/reliable-fetch';

import { useRouter } from 'next/navigation';
import Navbar from './Navbar';
import { WCProduct } from '@/types/woocommerce';
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
        // Try API route first (works in development and server deployment)
        const response = await reliableFetch('/api/products?per_page=100&status=publish', {
          timeoutLevel: 'standard'
        });
        if (!cancelled && response.ok) {
          const data = await response.json();
          setProducts(Array.isArray(data) ? data : []);
          logger.info(`Loaded ${Array.isArray(data) ? data.length : 0} products for search`);
          return;
        }

        // Fallback for static export builds - skip product loading
        if (!cancelled) {
          logger.info('API routes not available in static export, skipping product preload');
          setProducts([]);
        }
      } catch (error) {
        if (!cancelled) {
          logger.error('Error fetching products for search:', error as Record<string, unknown>);
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