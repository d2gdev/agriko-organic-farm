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
    // Fetch products for search functionality via secure API route
    const loadProducts = async () => {
      try {
        const response = await fetch('/api/products?per_page=100&status=publish');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setProducts(Array.isArray(data) ? data : []);
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