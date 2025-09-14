// Cumulative Layout Shift (CLS) optimization utilities
// Helps prevent layout shifts that negatively impact user experience
import React from 'react';

import { logger } from '@/lib/logger';

// CSS-in-JS utilities for preventing layout shifts
export const CLSOptimizedStyles = {
  // Image container with aspect ratio to prevent CLS
  imageContainer: (aspectRatio: string) => ({
    position: 'relative' as const,
    overflow: 'hidden' as const,
    aspectRatio,
    width: '100%',
    backgroundColor: '#f3f4f6', // Gray-100 fallback
  }),

  // Skeleton loader with preserved dimensions
  skeletonLoader: (width?: string | number, height?: string | number) => ({
    width: width ?? '100%',
    height: height ?? 'auto',
    backgroundColor: '#e5e7eb', // Gray-200
    backgroundImage: 'linear-gradient(90deg, #e5e7eb 0%, #f3f4f6 50%, #e5e7eb 100%)',
    backgroundSize: '200px 100%',
    backgroundRepeat: 'no-repeat',
    animation: 'shimmer 1.5s infinite',
    borderRadius: '0.375rem', // Rounded-md
  }),

  // Fixed height container for dynamic content
  dynamicContentContainer: (minHeight: string) => ({
    minHeight,
    position: 'relative' as const,
    overflow: 'hidden' as const,
  }),

  // Sticky elements with proper positioning
  stickyElement: (top: string = '0px') => ({
    position: 'sticky' as const,
    top,
    zIndex: 10,
    backgroundColor: 'inherit',
  }),
};

// Layout shift prevention utilities
export class CLSOptimizer {
  private static resizeObserver?: ResizeObserver;
  private static observedElements = new WeakMap<Element, { width: number; height: number }>();

  // Initialize resize observer for layout monitoring
  static initializeLayoutMonitoring() {
    if (typeof window === 'undefined' || this.resizeObserver) return;

    this.resizeObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        const element = entry.target;
        const { width, height } = entry.contentRect;
        const stored = this.observedElements.get(element);

        if (stored && (Math.abs(stored.width - width) > 1 || Math.abs(stored.height - height) > 1)) {
          logger.warn('🚨 Potential CLS detected:', {
            element: element.tagName,
            className: element.className,
            oldSize: stored,
            newSize: { width, height },
            suggestion: 'Consider setting explicit dimensions or using aspect-ratio CSS'
          });
        }

        this.observedElements.set(element, { width, height });
      });
    });
  }

  // Monitor element for layout shifts
  static monitorElement(element: Element) {
    if (!this.resizeObserver) this.initializeLayoutMonitoring();
    
    if (this.resizeObserver && element) {
      const rect = element.getBoundingClientRect();
      this.observedElements.set(element, { width: rect.width, height: rect.height });
      this.resizeObserver.observe(element);
    }
  }

  // Stop monitoring an element
  static stopMonitoring(element: Element) {
    if (this.resizeObserver && element) {
      this.resizeObserver.unobserve(element);
      this.observedElements.delete(element);
    }
  }

  // Generate placeholder dimensions based on content type
  static getPlaceholderDimensions(contentType: 'image' | 'text' | 'video' | 'iframe', aspectRatio?: string) {
    const placeholders = {
      image: {
        width: '100%',
        aspectRatio: aspectRatio ?? '16/9',
        minHeight: '200px',
      },
      text: {
        width: '100%',
        minHeight: '1.5rem', // Line height
      },
      video: {
        width: '100%',
        aspectRatio: aspectRatio ?? '16/9',
        minHeight: '300px',
      },
      iframe: {
        width: '100%',
        aspectRatio: aspectRatio ?? '16/9',
        minHeight: '400px',
      },
    };

    return placeholders[contentType];
  }

  // Prevent layout shift when loading fonts
  static preloadCriticalFonts() {
    const criticalFonts = [
      {
        family: 'Inter',
        weights: ['400', '500', '600', '700'],
        display: 'swap',
      },
      {
        family: 'Crimson Pro',
        weights: ['400', '600'],
        display: 'swap',
      },
    ];

    criticalFonts.forEach((font) => {
      font.weights.forEach((weight) => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'font';
        link.type = 'font/woff2';
        link.crossOrigin = 'anonymous';
        link.href = `https://fonts.gstatic.com/s/${(font.family.toLowerCase() ?? '')}/v1/${(font.family.replace(' ', '') ?? '')}-${(weight ?? '')}.woff2`;
        document.head.appendChild(link);
      });
    });
  }

  // Calculate and set optimal image dimensions
  static calculateOptimalImageDimensions(
    container: Element,
    originalWidth: number,
    originalHeight: number
  ) {
    const containerRect = container.getBoundingClientRect();
    const containerAspectRatio = containerRect.width / containerRect.height;
    const imageAspectRatio = originalWidth / originalHeight;

    let width: number, height: number;

    if (imageAspectRatio > containerAspectRatio) {
      // Image is wider than container
      width = containerRect.width;
      height = width / imageAspectRatio;
    } else {
      // Image is taller than container
      height = containerRect.height;
      width = height * imageAspectRatio;
    }

    return {
      width: Math.round(width),
      height: Math.round(height),
      aspectRatio: `${originalWidth}/${originalHeight}`,
    };
  }
}

// React hook for CLS optimization
export function useCLSOptimization(elementRef: React.RefObject<Element>) {
  React.useEffect(() => {
    const element = elementRef.current;
    if (element) {
      CLSOptimizer.monitorElement(element);

      return () => {
        CLSOptimizer.stopMonitoring(element);
      };
    }
    return undefined;
  }, [elementRef]); // Depend on the ref object itself, not its current value
}

// CSS keyframes for shimmer effect (add to global CSS)
export const shimmerKeyframes = `
@keyframes shimmer {
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
}
`;

// Utility functions for common CLS prevention patterns
export const CLSUtils = {
  // Generate aspect ratio CSS for images
  getAspectRatioCSS: (width: number, height: number) => ({
    aspectRatio: `${width ?? ''}/${height ?? ''}`,
    width: '100%',
    height: 'auto',
  }),

  // Reserve space for dynamic content
  reserveSpace: (minHeight: string, backgroundColor = 'transparent') => ({
    minHeight,
    backgroundColor,
    display: 'block',
  }),

  // Smooth transition styles to prevent abrupt changes
  smoothTransition: (properties: string[] = ['all']) => ({
    transition: properties.map(prop => `${prop} 0.2s ease-in-out`).join(', '),
  }),

  // Grid with consistent sizing
  stableGrid: (columns: number, gap: string = '1rem') => ({
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap,
    width: '100%',
  }),

  // Flexible container that maintains proportions
  flexibleContainer: (aspectRatio?: string) => ({
    width: '100%',
    ...(aspectRatio && { aspectRatio }),
    display: 'flex',
    flexDirection: 'column' as const,
  }),
};

// Common CLS prevention components data
export const CLSPreventionData = {
  // Common aspect ratios for different content types
  aspectRatios: {
    square: '1/1',
    landscape: '16/9',
    portrait: '9/16',
    golden: '1.618/1',
    standard: '4/3',
    wide: '21/9',
  },

  // Skeleton dimensions for common components
  skeletonDimensions: {
    productCard: { width: '100%', height: '400px' },
    navbar: { width: '100%', height: '64px' },
    heroSection: { width: '100%', height: '500px' },
    textLine: { width: '100%', height: '1.25rem' },
    button: { width: '120px', height: '40px' },
    avatar: { width: '40px', height: '40px' },
  },

  // Font loading strategies
  fontLoadingStrategies: {
    critical: ['Inter 400', 'Inter 600'], // Above-the-fold fonts
    deferred: ['Crimson Pro 400', 'Crimson Pro 600'], // Below-the-fold fonts
  },
};