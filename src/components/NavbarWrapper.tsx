'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from './Navbar';
import { WCProduct } from '@/types/woocommerce';
import { useCommerceKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useCart } from '@/context/CartContext';
import { getAllProducts } from '@/lib/woocommerce';

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
    // Fetch products for search functionality directly from WooCommerce
    const loadProducts = async () => {
      try {
        const data = await getAllProducts({ per_page: 100 });
        setProducts(data);
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