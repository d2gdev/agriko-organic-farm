import { logger } from './logger';

interface PerformanceConfig {
  enableImageOptimization: boolean;
  enableCodeSplitting: boolean;
  enablePreloading: boolean;
  enableCSSOptimization: boolean;
}

export class BundleOptimizer {
  private static instance: BundleOptimizer;
  private config: PerformanceConfig;
  private isOptimizing = false;

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = {
      enableImageOptimization: true,
      enableCodeSplitting: true,
      enablePreloading: true,
      enableCSSOptimization: true,
      ...config
    };
  }

  static getInstance(config?: Partial<PerformanceConfig>): BundleOptimizer {
    if (!BundleOptimizer.instance) {
      BundleOptimizer.instance = new BundleOptimizer(config);
    }
    return BundleOptimizer.instance;
  }

  // Initialize all optimizations
  initializeOptimizations() {
    if (this.isOptimizing || typeof window === 'undefined') return;

    this.isOptimizing = true;

    try {
      if (this.config.enablePreloading) {
        this.preloadCriticalResources();
      }

      if (this.config.enableCSSOptimization) {
        this.optimizeCSS();
      }

      if (this.config.enableImageOptimization) {
        this.optimizeImages();
      }
    } catch (error) {
      logger.error('BundleOptimizer.initializeOptimizations failed', { error });
    }
  }

  // Preload critical resources
  private preloadCriticalResources() {
    try {
      // Skip local font preloading - using Google Fonts instead

      // Preload checkout functionality
      BundleOptimizer.preloadCheckout();
    } catch (error) {
      logger.error('BundleOptimizer.preloadCriticalResources failed', { error });
    }
  }

  // Preload checkout functionality
  private static preloadCheckout() {
    try {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = '/checkout';
      document.head.appendChild(link);
    } catch (error) {
      logger.error('BundleOptimizer.preloadCheckout failed', { error });
    }
  }

  // Remove unused CSS (purge CSS optimization)
  optimizeCSS() {
    if (typeof window === 'undefined') return;

    try {
      // This would be handled by the build process, but we can track usage
      const usedClasses = new Set<string>();

      // Track used Tailwind classes
      const observer = new MutationObserver((mutations) => {
        try {
          mutations.forEach((mutation) => {
            if (!mutation.addedNodes) return;

            // Convert NodeList to Array to ensure forEach is available
            Array.from(mutation.addedNodes).forEach((node) => {
              try {
                if (node && node.nodeType === Node.ELEMENT_NODE) {
                  const element = node as Element;
                  // Handle both regular elements and SVG elements
                  let classes: string[] = [];

                  try {
                    // Use getAttribute for the most reliable className access
                    const classAttr = element.getAttribute('class');
                    if (classAttr && typeof classAttr === 'string' && classAttr.trim().length > 0) {
                      classes = classAttr.trim().split(/\s+/).filter(Boolean);
                    }

                    // Add classes to tracking set
                    classes.forEach(cls => {
                      if (cls && typeof cls === 'string') {
                        usedClasses.add(cls);
                      }
                    });

                    // Also check existing elements for their classes (recursive scan)
                    if (element.children && element.children.length > 0) {
                      Array.from(element.querySelectorAll('*')).forEach(child => {
                        try {
                          const childClassAttr = child.getAttribute('class');
                          if (childClassAttr && typeof childClassAttr === 'string' && childClassAttr.trim().length > 0) {
                            const childClasses = childClassAttr.trim().split(/\s+/).filter(Boolean);
                            childClasses.forEach(cls => {
                              if (cls && typeof cls === 'string') {
                                usedClasses.add(cls);
                              }
                            });
                          }
                        } catch {
                          // Silent fail for child className processing
                        }
                      });
                    }

                  } catch (classError) {
                    // Silent fail for className processing
                    logger.error('BundleOptimizer.optimizeCSS.className failed', { error: classError });
                  }
                }
              } catch (nodeError) {
                // Silent fail for node processing
                logger.error('BundleOptimizer.optimizeCSS.node failed', { error: nodeError });
              }
            });
          });
        } catch (mutationError) {
          logger.error('BundleOptimizer.optimizeCSS.mutation failed', { error: mutationError });
        }
      });

      // Start observing
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class']
      });

      // Store reference for cleanup
      (window as any).__cssOptimizationObserver = observer;

    } catch (error) {
      logger.error('BundleOptimizer.optimizeCSS failed', { error });
    }
  }

  // Optimize images
  private optimizeImages() {
    try {
      // Lazy load images that are not in viewport
      const images = document.querySelectorAll('img[data-src]');

      if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement;
              if (img.dataset.src) {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                imageObserver.unobserve(img);
              }
            }
          });
        });

        Array.from(images).forEach(img => imageObserver.observe(img));
      }
    } catch (error) {
      logger.error('BundleOptimizer.optimizeImages failed', { error });
    }
  }

  // Cleanup method
  cleanup() {
    try {
      if ((window as any).__cssOptimizationObserver) {
        (window as any).__cssOptimizationObserver.disconnect();
        delete (window as any).__cssOptimizationObserver;
      }
      this.isOptimizing = false;
    } catch (error) {
      logger.error('BundleOptimizer.cleanup failed', { error });
    }
  }
}

// Export initialization function
export function initializeBundleOptimizations(config?: Partial<PerformanceConfig>) {
  if (typeof window === 'undefined') return;

  try {
    const optimizer = BundleOptimizer.getInstance(config);
    optimizer.initializeOptimizations();

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      optimizer.cleanup();
    });

    return optimizer;
  } catch (error) {
    logger.error('initializeBundleOptimizations failed', { error });
    return null;
  }
}

export default {
  BundleOptimizer,
  initializeBundleOptimizations
};