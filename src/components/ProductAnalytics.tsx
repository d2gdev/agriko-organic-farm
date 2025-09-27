'use client';

import { useEffect } from 'react';
import { WCProduct } from '@/types/woocommerce';
import { ecommerceEvent } from '@/lib/gtag';

interface ProductAnalyticsProps {
  product: WCProduct;
}

export default function ProductAnalytics({ product }: ProductAnalyticsProps) {
  useEffect(() => {
    // Track view_item event when product page loads
    const price = product.price?.toNumber() || 0;
    const category = product.categories?.[0]?.name || 'Uncategorized';
    
    ecommerceEvent.viewItem(
      product.id.toString(),
      product.name,
      category,
      price
    );
  }, [product]);

  return null; // This component doesn't render anything
}