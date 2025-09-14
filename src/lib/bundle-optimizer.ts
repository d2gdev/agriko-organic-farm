import { logger } from '@/lib/logger';
// JavaScript bundle optimization utilities
// Helps reduce bundle size and improve First Input Delay (FID)

// Dynamic import utilities for code splitting
export const DynamicImports = {
  // Lazy load heavy components
  lazy: {
    // Analytics components
    AnalyticsDashboard: () => import('@/components/AnalyticsDashboard'),
    SemanticSearchModal: () => import('@/components/SemanticSearchModal'),
    
    // Feature-specific components
    ABTestVariant: () => import('@/components/ABTestVariant'),
  },

  // Preload important modules on interaction
  preload: {
    searchModal: () => {
      const link = document.createElement('link');
      link.rel = 'modulepreload';
      link.href = '/_next/static/chunks/semantic-search.js';
      document.head.appendChild(link);
    },
    
    checkout: () => {
      const link = document.createElement('link');
      link.rel = 'modulepreload';
      link.href = '/_next/static/chunks/checkout.js';
      document.head.appendChild(link);
    }
  },

  // Load modules on user interaction
  loadOnInteraction: {
    search: () => DynamicImports.lazy.SemanticSearchModal(),
    analytics: () => DynamicImports.lazy.AnalyticsDashboard(),
  }
};

// Critical resource hints
export const ResourceHints = {
  // DNS prefetch for external domains
  dnsPrefetch: [
    'https://agrikoph.com',
    'https://www.googletagmanager.com',
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com'
  ],

  // Preconnect to critical domains
  preconnect: [
    { href: 'https://agrikoph.com', crossorigin: true },
    { href: 'https://fonts.googleapis.com', crossorigin: false },
    { href: 'https://fonts.gstatic.com', crossorigin: true }
  ],

  // Preload critical resources
  preload: [
    { href: '/images/hero-organic-farm.jpg', as: 'image' },
    { href: '/images/logo.png', as: 'image' },
  ]
};

// Code splitting configuration
export const CodeSplitting = {
  // Vendor chunks configuration
  vendors: {
    react: ['react', 'react-dom'],
    ui: ['@headlessui/react', 'react-hot-toast'],
    analytics: ['@/lib/gtag', '@/lib/performance'],
    search: ['@/lib/pinecone', '@/lib/embeddings']
  },

  // Route-based splitting
  routes: {
    '/analytics-dashboard': 'analytics',
    '/admin': 'admin',
    '/checkout': 'checkout',
    '/product/*': 'product'
  }
};

// Bundle size optimization utilities
export class BundleOptimizer {
  private static loadedModules = new Set<string>();
  private static pendingModules = new Map<string, Promise<unknown>>();

  // Load module with deduplication
  static async loadModule(moduleId: string, loader: () => Promise<unknown>): Promise<unknown> {
    // Return if already loaded
    if (this.loadedModules.has(moduleId)) {
      return;
    }

    // Return pending promise if already loading
    if (this.pendingModules.has(moduleId)) {
      return this.pendingModules.get(moduleId);
    }

    // Start loading
    const promise = loader()
      .then((module) => {
        this.loadedModules.add(moduleId);
        this.pendingModules.delete(moduleId);
        return module;
      })
      .catch((error) => {
        this.pendingModules.delete(moduleId);
        throw error;
      });

    this.pendingModules.set(moduleId, promise);
    return promise;
  }

  // Preload modules on interaction
  static setupInteractionPreloading() {
    // Preload search on hover
    document.addEventListener('mouseover', (e) => {
      const target = e.target as HTMLElement;
      if (target.matches('[data-search-trigger]')) {
        this.preloadSearch();
      }
    });

    // Preload checkout on cart interaction
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.matches('[data-cart-trigger]')) {
        this.preloadCheckout();
      }
    });
  }

  // Preload search functionality
  private static preloadSearch() {
    this.loadModule('search', DynamicImports.lazy.SemanticSearchModal);
    ResourceHints.preload.forEach(hint => {
      if (hint.href.includes('search')) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = hint.href;
        link.as = hint.as;
        document.head.appendChild(link);
      }
    });
  }

  // Preload checkout functionality
  private static preloadCheckout() {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = '/checkout';
    document.head.appendChild(link);
  }

  // Remove unused CSS (purge CSS optimization)
  static optimizeCSS() {
    // This would be handled by the build process, but we can track usage
    const usedClasses = new Set<string>();

    // Track used Tailwind classes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            // Handle both regular elements and SVG elements
            let classes: string[] = [];

            try {
              const className = element.className;

              // More robust className handling
              if (typeof className === 'string') {
                classes = className.split(' ');
              } else if (className && typeof className === 'object') {
                // Handle SVGAnimatedString
                if ('baseVal' in className) {
                  const baseVal = (className as SVGAnimatedString).baseVal;
                  if (typeof baseVal === 'string') {
                    classes = baseVal.split(' ');
                  }
                }
                // Handle DOMTokenList (modern browsers)
                else if ('toString' in className && typeof (className as Record<string, unknown>).toString === 'function') {
                  const classStr = (className as Record<string, unknown>).toString();
                  if (classStr) {
                    classes = classStr.split(' ');
                  }
                }
              }

              // Final fallback: use getAttribute
              if (classes.length === 0 && element.getAttribute) {
                const classAttr = element.getAttribute('class');
                if (classAttr && typeof classAttr === 'string') {
                  classes = classAttr.split(' ');
                }
              }
            } catch (error) {
              // Silently skip elements that cause issues
              logger.debug('Bundle optimizer: Skipping element due to className access error:', { error: error instanceof Error ? error.message : String(error) });
              return;
            }

            classes.forEach(cls => {
              if (cls && typeof cls === 'string' && cls.trim()) {
                usedClasses.add(cls.trim());
              }
            });
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Return cleanup function
    return () => observer.disconnect();
  }

  // Tree shaking helper for development
  static analyzeUnusedImports() {
    if (process.env.NODE_ENV !== 'development') return;

    // Track module usage for bundle analysis
    const moduleUsage = new Map<string, number>();
    
    // Override require/import for tracking
    const originalRequire = (window as unknown as Record<string, unknown>).require as ((moduleName: string, ...args: unknown[]) => unknown) | undefined;
    if (originalRequire) {
      (window as unknown as Record<string, unknown>).require = function(moduleName: string, ...args: unknown[]) {
        const count = moduleUsage.get(moduleName) ?? 0;
        moduleUsage.set(moduleName, count + 1);
        return originalRequire?.apply(this, [moduleName, ...args]);
      };
    }

    // Log usage statistics after 5 seconds
    setTimeout(() => {
      console.group('📦 Module Usage Analysis');
      console.table(Array.from(moduleUsage.entries()).map(([module, count]) => ({
        module,
        count,
        category: this.categorizeModule(module)
      })));
      console.groupEnd();
    }, 5000);
  }

  // Categorize modules for analysis
  private static categorizeModule(moduleName: string): string {
    if (moduleName.includes('react')) return 'React';
    if (moduleName.includes('@/components')) return 'Components';
    if (moduleName.includes('@/lib')) return 'Utilities';
    if (moduleName.includes('node_modules')) return 'Third-party';
    if (moduleName.includes('analytics')) return 'Analytics';
    return 'Other';
  }

  // Get bundle optimization recommendations
  static getOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];

    // Check for large bundles
    if (this.loadedModules.size > 50) {
      recommendations.push('Consider lazy loading more components');
    }

    // Check for third-party libraries
    const hasHeavyLibraries = Array.from(this.loadedModules).some(module =>
      ['chart.js', 'moment', 'lodash'].some(lib => module.includes(lib))
    );

    if (hasHeavyLibraries) {
      recommendations.push('Replace heavy libraries with lighter alternatives');
    }

    // Check for duplicate code
    const duplicates = this.findPotentialDuplicates();
    if (duplicates.length > 0) {
      recommendations.push(`Potential code duplication found in: ${duplicates.join(', ')}`);
    }

    return recommendations;
  }

  // Find potential duplicate code patterns
  private static findPotentialDuplicates(): string[] {
    // This would be more sophisticated in a real implementation
    const moduleNames = Array.from(this.loadedModules);
    const duplicates: string[] = [];

    // Simple pattern matching for similar module names
    moduleNames.forEach((name, index) => {
      moduleNames.slice(index + 1).forEach(otherName => {
        if (this.areSimilar(name, otherName)) {
          duplicates.push(`${name} & ${otherName}`);
        }
      });
    });

    return duplicates;
  }

  // Check if two module names are similar (potential duplicates)
  private static areSimilar(name1: string, name2: string): boolean {
    // Simple similarity check
    const words1 = name1.split(/[\/\-_]/);
    const words2 = name2.split(/[\/\-_]/);
    
    const commonWords = words1.filter(word => 
      words2.includes(word) && word.length > 3
    );

    return commonWords.length > 0;
  }
}

// Performance budget utilities
export const PerformanceBudget = {
  // Bundle size limits (in KB)
  limits: {
    main: 250,      // Main bundle
    vendor: 200,    // Vendor libraries
    async: 100,     // Async chunks
    css: 50,        // CSS files
    images: 500,    // Image assets per page
  },

  // Check if bundle exceeds budget
  checkBudget(bundleName: string, size: number): boolean {
    const limit = (this.limits as Record<string, number>)[bundleName] ?? 100;
    const exceeded = size > limit;
    
    if (exceeded) {
      logger.warn(`📊 Performance Budget Exceeded:`, {
        bundle: bundleName,
        size: `${size}KB`,
        limit: `${limit}KB`,
        overage: `${size - limit}KB`
      });
    }

    return !exceeded;
  },

  // Get budget status
  getBudgetStatus(): { [key: string]: { size: number; limit: number; ok: boolean } } {
    // This would integrate with build tools to get actual sizes
    return Object.keys(this.limits).reduce((status, bundleName) => {
      status[bundleName] = {
        size: 0, // Would be populated by build process
        limit: (this.limits as Record<string, number>)[bundleName] ?? 0,
        ok: true
      };
      return status;
    }, {} as { [key: string]: { size: number; limit: number; ok: boolean } });
  }
};

// Initialize bundle optimizations
export function initializeBundleOptimizations(): (() => void) | void {
  if (typeof window === 'undefined') return;

  // Setup resource hints
  ResourceHints.dnsPrefetch.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = domain;
    document.head.appendChild(link);
  });

  ResourceHints.preconnect.forEach(({ href, crossorigin }) => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = href;
    if (crossorigin) link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });

  // Setup interaction-based preloading
  BundleOptimizer.setupInteractionPreloading();

  // Enable CSS optimization tracking
  const cleanupCSS = BundleOptimizer.optimizeCSS();

  // Analyze bundle usage in development
  BundleOptimizer.analyzeUnusedImports();

  logger.info('⚡ Bundle optimizations initialized');

  // Cleanup function
  return () => {
    cleanupCSS();
  };
}