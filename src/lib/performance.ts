// Performance optimization utilities and Core Web Vitals monitoring
import { performanceEvent } from '@/lib/gtag';

import { logger } from '@/lib/logger';

// Performance entry types
interface LCPEntry extends PerformanceEntry {
  startTime: number;
}

interface FIDEntry extends PerformanceEntry {
  processingStart: number;
  startTime: number;
}

interface CLSEntry extends PerformanceEntry {
  hadRecentInput: boolean;
  value: number;
}

interface NavigationEntry extends PerformanceEntry {
  responseStart: number;
  requestStart: number;
  loadEventEnd: number;
  navigationStart: number;
}

// Core Web Vitals thresholds (based on Google recommendations)
export const CORE_WEB_VITALS_THRESHOLDS = {
  LCP: { good: 2500, needsImprovement: 4000 }, // Largest Contentful Paint (ms)
  FID: { good: 100, needsImprovement: 300 },   // First Input Delay (ms)
  CLS: { good: 0.1, needsImprovement: 0.25 }   // Cumulative Layout Shift
};

// Performance metrics interface
export interface PerformanceMetrics {
  lcp?: number;
  fid?: number;
  cls?: number;
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
  pageLoadTime?: number;
}

// Enhanced Core Web Vitals tracking with optimization hints
class PerformanceOptimizer {
  private metrics: PerformanceMetrics = {};
  private observers: PerformanceObserver[] = [];

  // Maximum number of observers to prevent memory leaks
  private readonly MAX_OBSERVERS = 10;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeObservers();
    }
  }

  // Initialize all performance observers
  private initializeObservers() {
    this.observeLCP();
    this.observeFID();
    this.observeCLS();
    this.observeFCP();
    this.observeNavigation();
  }

  // Add observer with size limit enforcement
  private addObserver(observer: PerformanceObserver): void {
    // Enforce size limit to prevent memory leaks
    if (this.observers.length >= this.MAX_OBSERVERS) {
      logger.warn('Max observers limit reached, cleaning up oldest observer');
      const oldestObserver = this.observers.shift();
      if (oldestObserver) {
        oldestObserver.disconnect();
      }
    }
    this.observers.push(observer);
  }

  // Largest Contentful Paint observer
  private observeLCP() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as LCPEntry;
        
        if (lastEntry) {
          this.metrics.lcp = lastEntry.startTime;
          this.trackMetric('lcp', lastEntry.startTime, CORE_WEB_VITALS_THRESHOLDS.LCP);
          
          // LCP optimization suggestions
          if (lastEntry.startTime > CORE_WEB_VITALS_THRESHOLDS.LCP.needsImprovement) {
            logger.warn('🚨 LCP Performance Issue:', {
              value: lastEntry.startTime,
              threshold: CORE_WEB_VITALS_THRESHOLDS.LCP.good,
              suggestions: [
                'Optimize largest image on page',
                'Remove unused JavaScript',
                'Implement resource preloading',
                'Upgrade server response time'
              ]
            });
          }
        }
      });

      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      this.addObserver(observer);
    } catch {
      logger.warn('LCP observer not supported');
    }
  }

  // First Input Delay observer
  private observeFID() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach((entry) => {
          const fidEntry = entry as FIDEntry;
          if (fidEntry.processingStart && fidEntry.startTime) {
            const fid = fidEntry.processingStart - fidEntry.startTime;
            this.metrics.fid = fid;
            this.trackMetric('fid', fid, CORE_WEB_VITALS_THRESHOLDS.FID);

            // FID optimization suggestions
            if (fid > CORE_WEB_VITALS_THRESHOLDS.FID.needsImprovement) {
              logger.warn('🚨 FID Performance Issue:', {
                value: fid,
                threshold: CORE_WEB_VITALS_THRESHOLDS.FID.good,
                suggestions: [
                  'Break up long tasks',
                  'Optimize third-party code',
                  'Use a web worker',
                  'Reduce JavaScript execution time'
                ]
              });
            }
          }
        });
      });

      observer.observe({ entryTypes: ['first-input'] });
      this.addObserver(observer);
    } catch {
      logger.warn('FID observer not supported');
    }
  }

  // Cumulative Layout Shift observer
  private observeCLS() {
    try {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach((entry) => {
          const clsEntry = entry as CLSEntry;
          if (clsEntry.hadRecentInput === false && clsEntry.value) {
            clsValue += clsEntry.value;
          }
        });

        if (clsValue > 0) {
          this.metrics.cls = clsValue;
          this.trackMetric('cls', clsValue, CORE_WEB_VITALS_THRESHOLDS.CLS);

          // CLS optimization suggestions
          if (clsValue > CORE_WEB_VITALS_THRESHOLDS.CLS.needsImprovement) {
            logger.warn('🚨 CLS Performance Issue:', {
              value: clsValue,
              threshold: CORE_WEB_VITALS_THRESHOLDS.CLS.good,
              suggestions: [
                'Set size attributes on images and videos',
                'Reserve space for dynamic content',
                'Avoid inserting content above existing content',
                'Use transform animations instead of changing layout properties'
              ]
            });
          }
        }
      });

      observer.observe({ entryTypes: ['layout-shift'] });
      this.addObserver(observer);
    } catch {
      logger.warn('CLS observer not supported');
    }
  }

  // First Contentful Paint observer
  private observeFCP() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
        
        if (fcpEntry) {
          this.metrics.fcp = fcpEntry.startTime;
          this.trackMetric('fcp', fcpEntry.startTime, { good: 1800, needsImprovement: 3000 });
        }
      });

      observer.observe({ entryTypes: ['paint'] });
      this.addObserver(observer);
    } catch {
      logger.warn('FCP observer not supported');
    }
  }

  // Navigation timing observer
  private observeNavigation() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach((entry) => {
          const navEntry = entry as NavigationEntry;
          if (navEntry.responseStart && navEntry.requestStart) {
            this.metrics.ttfb = navEntry.responseStart - navEntry.requestStart;
            this.trackMetric('ttfb', this.metrics.ttfb, { good: 800, needsImprovement: 1800 });
          }

          if (navEntry.loadEventEnd && navEntry.navigationStart) {
            this.metrics.pageLoadTime = navEntry.loadEventEnd - navEntry.navigationStart;
            this.trackMetric('page_load', this.metrics.pageLoadTime, { good: 3000, needsImprovement: 5000 });
          }
        });
      });

      observer.observe({ entryTypes: ['navigation'] });
      this.addObserver(observer);
    } catch {
      logger.warn('Navigation observer not supported');
    }
  }

  // Track performance metric with scoring
  private trackMetric(name: string, value: number, thresholds: { good: number; needsImprovement: number }) {
    const score = value <= thresholds.good ? 'good' : 
                  value <= thresholds.needsImprovement ? 'needs_improvement' : 'poor';

    performanceEvent.pageLoad(window.location.pathname, value, this.metrics);

    // Track individual metric (skip on localhost)
    const isLocalhost = window.location.hostname === 'localhost' ||
                        window.location.hostname === '127.0.0.1' ||
                        window.location.hostname.startsWith('192.168.');
    if (typeof window !== 'undefined' && window.gtag && !isLocalhost) {
      window.gtag('event', `performance_${name}`, {
        value: Math.round(value),
        score: score,
        page_path: window.location.pathname
      });
    }
  }

  // Get current performance metrics
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  // Generate performance report
  generateReport(): PerformanceReport {
    const scores = {
      lcp: this.metrics.lcp ? this.getScore(this.metrics.lcp, CORE_WEB_VITALS_THRESHOLDS.LCP) : null,
      fid: this.metrics.fid ? this.getScore(this.metrics.fid, CORE_WEB_VITALS_THRESHOLDS.FID) : null,
      cls: this.metrics.cls ? this.getScore(this.metrics.cls, CORE_WEB_VITALS_THRESHOLDS.CLS) : null
    };

    const overallScore = this.calculateOverallScore(scores);

    return {
      metrics: this.metrics,
      scores,
      overallScore,
      recommendations: this.generateRecommendations(scores),
      timestamp: Date.now()
    };
  }

  // Get performance score for a metric
  private getScore(value: number, thresholds: { good: number; needsImprovement: number }): 'good' | 'needs_improvement' | 'poor' {
    return value <= thresholds.good ? 'good' : 
           value <= thresholds.needsImprovement ? 'needs_improvement' : 'poor';
  }

  // Calculate overall performance score
  private calculateOverallScore(scores: Record<string, string | null>): number {
    const validScores = Object.values(scores).filter(score => score !== null);
    if (validScores.length === 0) return 0;

    const scoreValues = validScores.map(score => {
      switch (score) {
        case 'good': return 100;
        case 'needs_improvement': return 50;
        case 'poor': return 0;
        default: return 0;
      }
    });

    return Math.round(scoreValues.reduce((sum: number, score) => sum + score, 0) / validScores.length);
  }

  // Generate performance recommendations
  private generateRecommendations(scores: Record<string, string | null>): string[] {
    const recommendations: string[] = [];

    if (scores.lcp === 'needs_improvement' || scores.lcp === 'poor') {
      recommendations.push(
        'Optimize Largest Contentful Paint: Compress images, remove unused JavaScript, implement preloading'
      );
    }

    if (scores.fid === 'needs_improvement' || scores.fid === 'poor') {
      recommendations.push(
        'Improve First Input Delay: Break up long tasks, optimize third-party scripts, consider web workers'
      );
    }

    if (scores.cls === 'needs_improvement' || scores.cls === 'poor') {
      recommendations.push(
        'Reduce Cumulative Layout Shift: Set image dimensions, reserve space for dynamic content, use transform animations'
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('Great job! Your Core Web Vitals are performing well.');
    }

    return recommendations;
  }

  // Clean up observers
  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Performance report interface
export interface PerformanceReport {
  metrics: PerformanceMetrics;
  scores: Record<string, string | null>;
  overallScore: number;
  recommendations: string[];
  timestamp: number;
}

// Advanced performance monitoring and optimization
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private budgets: PerformanceBudgets = {
    lcp: 2500,
    fid: 100,
    cls: 0.1,
    bundleSize: 250000, // 250KB
    imageSize: 150000   // 150KB
  };

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Store page-specific metrics
  storePageMetrics(page: string, metrics: PerformanceMetrics) {
    this.metrics.set(page, metrics);
    this.checkPerformanceBudgets(page, metrics);
  }

  // Get aggregated metrics across all pages
  getAggregatedMetrics(): AggregatedMetrics {
    const allMetrics = Array.from(this.metrics.values());
    if (allMetrics.length === 0) return this.getEmptyAggregatedMetrics();

    return {
      avgLCP: this.calculateAverage(allMetrics, 'lcp'),
      avgFID: this.calculateAverage(allMetrics, 'fid'),
      avgCLS: this.calculateAverage(allMetrics, 'cls'),
      avgTTFB: this.calculateAverage(allMetrics, 'ttfb'),
      avgPageLoad: this.calculateAverage(allMetrics, 'pageLoadTime'),
      pageCount: allMetrics.length,
      performanceScore: this.calculateAggregatedScore(allMetrics)
    };
  }

  // Check if metrics exceed performance budgets
  private checkPerformanceBudgets(page: string, metrics: PerformanceMetrics) {
    const violations: string[] = [];

    if (metrics.lcp && metrics.lcp > this.budgets.lcp) {
      violations.push(`LCP budget exceeded: ${metrics.lcp}ms > ${this.budgets.lcp}ms`);
    }
    if (metrics.fid && metrics.fid > this.budgets.fid) {
      violations.push(`FID budget exceeded: ${metrics.fid}ms > ${this.budgets.fid}ms`);
    }
    if (metrics.cls && metrics.cls > this.budgets.cls) {
      violations.push(`CLS budget exceeded: ${metrics.cls} > ${this.budgets.cls}`);
    }

    if (violations.length > 0) {
      logger.warn(`🚨 Performance Budget Violations on ${page}:`, { violations });
      
      // Send budget violation to analytics (skip on localhost)
      const isLocalhost = typeof window !== 'undefined' && (
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.startsWith('192.168.')
      );
      if (typeof window !== 'undefined' && window.gtag && !isLocalhost) {
        window.gtag('event', 'performance_budget_violation', {
          page_path: page,
          violations: violations.length,
          custom_parameter: violations.join(', ')
        });
      }
    }
  }

  private calculateAverage(metrics: PerformanceMetrics[], key: keyof PerformanceMetrics): number {
    const values = metrics.map(m => m[key]).filter(v => v !== undefined && typeof v === 'number');
    return values.length > 0 ? values.reduce((sum: number, val) => sum + val, 0) / values.length : 0;
  }

  private calculateAggregatedScore(metrics: PerformanceMetrics[]): number {
    const scores = metrics.map(m => {
      const lcpScore = m.lcp ? (m.lcp <= 2500 ? 100 : m.lcp <= 4000 ? 50 : 0) : 100;
      const fidScore = m.fid ? (m.fid <= 100 ? 100 : m.fid <= 300 ? 50 : 0) : 100;
      const clsScore = m.cls ? (m.cls <= 0.1 ? 100 : m.cls <= 0.25 ? 50 : 0) : 100;
      return (lcpScore + fidScore + clsScore) / 3;
    });
    return scores.length > 0 ? scores.reduce((sum: number, score) => sum + score, 0) / scores.length : 0;
  }

  private getEmptyAggregatedMetrics(): AggregatedMetrics {
    return { avgLCP: 0, avgFID: 0, avgCLS: 0, avgTTFB: 0, avgPageLoad: 0, pageCount: 0, performanceScore: 0 };
  }
}

interface PerformanceBudgets {
  lcp: number;
  fid: number;
  cls: number;
  bundleSize: number;
  imageSize: number;
}

interface AggregatedMetrics {
  avgLCP: number;
  avgFID: number;
  avgCLS: number;
  avgTTFB: number;
  avgPageLoad: number;
  pageCount: number;
  performanceScore: number;
}

// Bundle analyzer utility
export const BundleAnalyzer = {
  // Analyze bundle size and suggest optimizations
  async analyzeBundleSize(): Promise<BundleAnalysis> {
    try {
      const performance = window.performance;
      const _navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      void _navigationEntries; // Preserved for future navigation timing analysis
      const resourceEntries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

      const jsResources = resourceEntries.filter(entry => 
        entry.name.includes('.js') || entry.name.includes('/_next/static/chunks/')
      );

      const cssResources = resourceEntries.filter(entry => 
        entry.name.includes('.css') || entry.name.includes('/_next/static/css/')
      );

      const totalJSSize = jsResources.reduce((sum, entry) => sum + (entry.transferSize || 0), 0);
      const totalCSSSize = cssResources.reduce((sum, entry) => sum + (entry.transferSize || 0), 0);

      return {
        totalJSSize,
        totalCSSSize,
        totalBundleSize: totalJSSize + totalCSSSize,
        jsFileCount: jsResources.length,
        cssFileCount: cssResources.length,
        largestJSFile: this.findLargestResource(jsResources),
        suggestions: this.generateBundleSuggestions(totalJSSize + totalCSSSize),
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error('Bundle analysis failed:', { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      return this.getEmptyBundleAnalysis();
    }
  },

  findLargestResource(resources: PerformanceResourceTiming[]): { name: string; size: number } | null {
    if (resources.length === 0) return null;
    
    const largest = resources.reduce((max, current) => 
      (current.transferSize ?? 0) > (max.transferSize ?? 0) ? current : max
    );

    return {
      name: largest.name.split('/').pop() ?? largest.name,
      size: largest.transferSize ?? 0
    };
  },

  generateBundleSuggestions(totalSize: number): string[] {
    const suggestions: string[] = [];
    
    if (totalSize > 250000) { // 250KB
      suggestions.push('Bundle size exceeds 250KB - consider code splitting');
    }
    if (totalSize > 500000) { // 500KB
      suggestions.push('Bundle size is very large - implement dynamic imports');
      suggestions.push('Use tree shaking to remove unused code');
    }
    if (totalSize > 1000000) { // 1MB
      suggestions.push('Critical bundle size issue - immediate optimization required');
      suggestions.push('Consider lazy loading non-critical components');
    }

    if (suggestions.length === 0) {
      suggestions.push('Bundle size is within acceptable limits');
    }

    return suggestions;
  },

  getEmptyBundleAnalysis(): BundleAnalysis {
    return {
      totalJSSize: 0,
      totalCSSSize: 0,
      totalBundleSize: 0,
      jsFileCount: 0,
      cssFileCount: 0,
      largestJSFile: null,
      suggestions: ['Unable to analyze bundle'],
      timestamp: Date.now()
    };
  }
};

export interface BundleAnalysis {
  totalJSSize: number;
  totalCSSSize: number;
  totalBundleSize: number;
  jsFileCount: number;
  cssFileCount: number;
  largestJSFile: { name: string; size: number } | null;
  suggestions: string[];
  timestamp: number;
}

// Global performance optimizer instance
export const performanceOptimizer = new PerformanceOptimizer();
export const performanceMonitor = PerformanceMonitor.getInstance();

// Resource preloading utilities
export const ResourcePreloader = {
  // Preload critical resources based on current page
  preloadCriticalResources() {
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

    // Clean up any legacy preload links first - run immediately and repeatedly
    this.cleanupLegacyPreloads();

    // Set up periodic cleanup to remove any legacy preloads that might get added
    if (typeof window !== 'undefined') {
      setTimeout(() => this.cleanupLegacyPreloads(), 1000);
      setTimeout(() => this.cleanupLegacyPreloads(), 3000);
    }

    // Always preload critical fonts
    const fontResource = {
      href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Crimson+Pro:wght@400;600&display=swap',
      as: 'style'
    };

    // Only preload images if they're likely to be used on the current page
    const criticalResources = [fontResource];

    // Add page-specific image preloads based on actual usage
    if (currentPath === '/' || currentPath === '/about') {
      // Main hero image used on home and about pages
      criticalResources.push({ href: '/images/hero.png', as: 'image' });
    }

    if (currentPath === '/') {
      // Featured product images on home page
      criticalResources.push({ href: '/images/agriko-turmeric-5in1-blend-500g-health-supplement.jpg', as: 'image' });
    }

    if (currentPath === '/products') {
      // Products page specific images
      criticalResources.push({ href: '/images/organic-rice-varieties.jpg', as: 'image' });
    }

    // Debug logging to track what's being preloaded
    if (process.env.NODE_ENV === 'development') {
      logger.debug('🔄 Preloading resources for path:', { currentPath, resources: criticalResources.map(r => r.href) });
    }

    criticalResources.forEach(resource => {
      // Check if resource is already preloaded to avoid duplicates
      const existingLink = document.head.querySelector(`link[rel="preload"][href="${resource.href}"]`);
      if (existingLink) {
        if (process.env.NODE_ENV === 'development') {
          logger.debug('⏭️ Skipping duplicate preload:', { href: resource.href });
        }
        return;
      }

      // Explicitly prevent preloading of unused legacy images
      if (resource.href.includes('hero-organic-farm.jpg') || resource.href.includes('products-hero.jpg')) {
        console.warn('🚫 Blocked legacy image preload:', resource.href);
        return;
      }

      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource.href;
      link.as = resource.as;
      if (resource.as === 'style') {
        link.onload = () => {
          link.rel = 'stylesheet';
        };
      }

      if (process.env.NODE_ENV === 'development') {
        logger.debug('✅ Preloading:', { href: resource.href });
      }

      document.head.appendChild(link);
    });
  },

  // Clean up legacy preload links that shouldn't be there
  cleanupLegacyPreloads() {
    const legacyImages = ['hero-organic-farm.jpg', 'products-hero.jpg'];
    legacyImages.forEach(imageName => {
      // Check both head and body for preload links
      const allLinks = document.querySelectorAll(`link[rel="preload"][href*="${imageName}"]`);
      allLinks.forEach(link => {
        console.warn('🗑️ Removing legacy preload:', link.getAttribute('href'));
        link.remove();
      });
    });

    // Set up mutation observer to prevent future legacy preloads
    if (typeof window !== 'undefined' && !this._cleanupObserver) {
      this._cleanupObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1 && node.nodeName === 'LINK') {
              const link = node as HTMLLinkElement;
              if (link.rel === 'preload' &&
                  (link.href.includes('hero-organic-farm.jpg') || link.href.includes('products-hero.jpg'))) {
                console.warn('🚫 Blocked dynamic legacy preload:', link.href);
                link.remove();
              }
            }
          });
        });
      });

      this._cleanupObserver.observe(document.head, {
        childList: true,
        subtree: true
      });
    }
  },

  _cleanupObserver: null as MutationObserver | null,

  // Cleanup the mutation observer
  cleanup() {
    if (this._cleanupObserver) {
      this._cleanupObserver.disconnect();
      this._cleanupObserver = null;
    }
  },

  // Prefetch next page resources
  prefetchNextPageResources() {
    const prefetchUrls = [
      '/products',
      '/about',
      '/contact'
    ];

    prefetchUrls.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      document.head.appendChild(link);
    });
  },

  // Preconnect to external domains
  preconnectExternalDomains() {
    const domains = [
      'URL_CONSTANTS.COMPANY_BASE_URL',
      'https://www.googletagmanager.com',
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com'
    ];

    domains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = domain;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  }
};

// Image optimization utilities
export const ImageOptimizer = {
  _imageObserver: null as IntersectionObserver | null,

  // Create responsive image component props
  getOptimizedImageProps(src: string, alt: string, width?: number, height?: number) {
    return {
      src,
      alt,
      width,
      height,
      loading: 'lazy' as const,
      placeholder: 'blur' as const,
      blurDataURL: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==',
      style: width && height ? { aspectRatio: `${width}/${height}` } : undefined
    };
  },

  // Lazy load images with intersection observer
  lazyLoadImages() {
    if ('IntersectionObserver' in window && !this._imageObserver) {
      this._imageObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.dataset.src;
            if (src) {
              img.src = src;
              img.classList.remove('blur-sm');
              this._imageObserver!.unobserve(img);
            }
          }
        });
      });

      Array.from(document.querySelectorAll('img[data-src]')).forEach(img => {
        this._imageObserver!.observe(img);
      });
    }
  },

  // Cleanup the image observer
  cleanup() {
    if (this._imageObserver) {
      this._imageObserver.disconnect();
      this._imageObserver = null;
    }
  }
};