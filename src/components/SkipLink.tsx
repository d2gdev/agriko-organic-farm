'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SkipLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
}

/**
 * Skip link component for screen reader accessibility
 * Provides quick navigation to main content areas
 */
export default function SkipLink({ href, children, className }: SkipLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        // Base styles - hidden by default
        'sr-only focus:not-sr-only',
        // Position when focused
        'focus:absolute focus:top-0 focus:left-0 focus:z-50',
        // Visual styling
        'focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:text-sm',
        'focus:rounded-br-md focus:outline-none',
        // Focus ring
        'focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        // Smooth transitions
        'transition-all duration-200',
        // Custom styles
        className
      )}
      onFocus={(e) => {
        // Ensure the skip link is visible when focused
        e.currentTarget.scrollIntoView({ block: 'nearest' });
      }}
    >
      {children}
    </a>
  );
}

/**
 * Collection of common skip links for typical page layouts
 */
export function SkipLinks() {
  return (
    <div className="skip-links" role="navigation" aria-label="Skip links">
      <SkipLink href="#main-content">Skip to main content</SkipLink>
      <SkipLink href="#site-navigation">Skip to navigation</SkipLink>
      <SkipLink href="#site-footer">Skip to footer</SkipLink>
      <SkipLink href="#search">Skip to search</SkipLink>
    </div>
  );
}

/**
 * Product-specific skip links for e-commerce pages
 */
export function ProductSkipLinks() {
  return (
    <div className="skip-links" role="navigation" aria-label="Product skip links">
      <SkipLink href="#main-content">Skip to main content</SkipLink>
      <SkipLink href="#product-details">Skip to product details</SkipLink>
      <SkipLink href="#product-reviews">Skip to reviews</SkipLink>
      <SkipLink href="#related-products">Skip to related products</SkipLink>
      <SkipLink href="#site-navigation">Skip to navigation</SkipLink>
    </div>
  );
}

/**
 * Shopping-specific skip links for cart and checkout pages
 */
export function ShoppingSkipLinks() {
  return (
    <div className="skip-links" role="navigation" aria-label="Shopping skip links">
      <SkipLink href="#main-content">Skip to main content</SkipLink>
      <SkipLink href="#cart-items">Skip to cart items</SkipLink>
      <SkipLink href="#checkout-form">Skip to checkout form</SkipLink>
      <SkipLink href="#order-summary">Skip to order summary</SkipLink>
      <SkipLink href="#site-navigation">Skip to navigation</SkipLink>
    </div>
  );
}