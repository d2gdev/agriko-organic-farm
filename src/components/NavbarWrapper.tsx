'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from './Navbar';
import { WCProduct } from '@/types/woocommerce';
import { useCommerceKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useCart } from '@/context/CartContext';
// Removed direct WooCommerce import - now using API routes

export default function NavbarWrapper() {
  const [products, setProducts] = useState<WCProduct[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
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

  useEffect(() => {
    // Fetch products for search functionality with fallback for static export
    const loadProducts = async () => {
      try {
        // Try API route first (works in development and server deployment)
        const response = await fetch('/api/products?per_page=100&status=publish');
        if (response.ok) {
          const data = await response.json();
          setProducts(Array.isArray(data) ? data : []);
          return;
        }
        
        // Fallback for static export builds - skip product loading
        console.log('API routes not available in static export, skipping product preload');
        setProducts([]);
      } catch (error) {
        console.error('Error fetching products for search:', error);
        // Set empty array on error to prevent UI issues
        setProducts([]);
      }
    };

    loadProducts();
  }, []);

  return (
    <Navbar 
      products={products} 
      isSearchOpen={isSearchOpen}
      setIsSearchOpen={setIsSearchOpen}
    />
  );
}