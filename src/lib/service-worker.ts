import { logger } from '@/lib/logger';
import type {
  ServiceWorkerMessage,
  ServiceWorkerResponse,
  CacheInfo,
  ServiceWorkerStatus
  // BackgroundSyncOptions // Preserved for future background sync implementation
} from '@/types/service-worker';
// Service Worker registration and management utilities

// Service Worker Manager interface for no-op fallback
// interface ServiceWorkerManagerInterface {
//   register(): Promise<boolean>;
//   checkForUpdates(): Promise<void>;
//   unregister(): Promise<boolean>;
//   sendMessage(message: ServiceWorkerMessage): Promise<ServiceWorkerResponse>;
//   registerBackgroundSync(tag: string, options?: BackgroundSyncOptions): Promise<void>;
//   getCacheInfo(): Promise<CacheInfo | null>;
//   clearCache(): Promise<boolean>;
//   getStatus(): ServiceWorkerStatus;
// } // Preserved for future service worker implementation

// Add a new interface that extends the base interface with all required properties
// interface FullServiceWorkerManagerInterface extends ServiceWorkerManagerInterface {
//   registration: ServiceWorkerRegistration | null;
//   isSupported: boolean;
//   updateCheckInterval: NodeJS.Timeout | null;
//   handleUpdate(): void;
//   showUpdateNotification(): void;
// } // Preserved for future full service worker implementation

// Background sync registration interface
interface ServiceWorkerRegistrationWithSync extends ServiceWorkerRegistration {
  sync?: {
    register(tag: string): Promise<void>;
  };
}

// Layout shift entry interface
interface LayoutShiftEntry extends PerformanceEntry {
  entryType: 'layout-shift';
  hadRecentInput: boolean;
  value: number;
}

export class ServiceWorkerManager {
  private static instance: ServiceWorkerManager;
  private registration: ServiceWorkerRegistration | null = null;
  private isSupported: boolean = false;
  private updateCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.isSupported = typeof window !== 'undefined' && 'serviceWorker' in navigator;
  }

  static getInstance(): ServiceWorkerManager {
    if (typeof window === 'undefined') {
      // Return a no-op instance during SSR
      return {
        register: async () => false,
        checkForUpdates: async () => {},
        unregister: async () => false,
        sendMessage: async () => Promise.reject(new Error('Not available during SSR')),
        registerBackgroundSync: async () => Promise.reject(new Error('Not available during SSR')),
        getCacheInfo: async () => null,
        clearCache: async () => false,
        getStatus: () => ({ supported: false, registered: false }),
        // Add missing properties for SSR fallback
        registration: null,
        isSupported: false,
        updateCheckInterval: null,
        handleUpdate: () => {},
        showUpdateNotification: () => {}
      } as unknown as ServiceWorkerManager;
    }
    
    if (!ServiceWorkerManager.instance) {
      ServiceWorkerManager.instance = new ServiceWorkerManager();
    }
    return ServiceWorkerManager.instance;
  }

  // Register the service worker
  async register(): Promise<boolean> {
    if (!this.isSupported) {
      logger.warn('Service Worker not supported in this browser');
      return false;
    }

    try {
      logger.info('🔧 Registering Service Worker...');
      
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'imports' // Better caching strategy
      });

      logger.info('✅ Service Worker registered successfully:', { scope: this.registration.scope });

      // Listen for updates
      this.registration.addEventListener('updatefound', () => {
        this.handleUpdate();
      });

      // Check for updates periodically (every 24 hours)
      this.updateCheckInterval = setInterval(() => {
        this.checkForUpdates();
      }, 24 * 60 * 60 * 1000);

      return true;

    } catch (error) {
      logger.error('❌ Service Worker registration failed:', { error: error instanceof Error ? error.message : String(error) });
      return false;
    }
  }

  // Handle service worker updates
  private handleUpdate() {
    if (!this.registration) return;

    const newWorker = this.registration.installing;
    if (!newWorker) return;

    logger.info('🔄 New Service Worker available');

    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        // New version is available
        this.showUpdateNotification();
      }
    });
  }

  // Show update notification to user
  private showUpdateNotification() {
    if (typeof window === 'undefined') return;
    
    // In a production app, you might show a toast or banner
    logger.info('📢 New version available! Refresh to update.');
    
    // Auto-refresh in development, manual in production
    if (process.env.NODE_ENV === 'development') {
      window.location.reload();
    } else {
      // You could dispatch a custom event here for the UI to handle
      window.dispatchEvent(new CustomEvent('sw-update-available'));
    }
  }

  // Check for service worker updates
  async checkForUpdates(): Promise<void> {
    if (!this.registration) return;

    try {
      await this.registration.update();
      logger.info('🔍 Checked for Service Worker updates');
    } catch (error) {
      logger.error('Failed to check for updates:', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  // Unregister service worker (for testing or cleanup)
  async unregister(): Promise<boolean> {
    // Clear update check interval
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
      this.updateCheckInterval = null;
    }

    if (!this.registration) return false;

    try {
      const result = await this.registration.unregister();
      logger.info('🗑️ Service Worker unregistered:', { result });
      return result;
    } catch (error) {
      logger.error('Failed to unregister Service Worker:', { error: error instanceof Error ? error.message : String(error) });
      return false;
    }
  }

  // Send message to service worker
  async sendMessage(message: ServiceWorkerMessage): Promise<ServiceWorkerResponse> {
    if (typeof window === 'undefined' || !navigator.serviceWorker.controller) {
      throw new Error('No service worker controlling this page');
    }

    return new Promise<ServiceWorkerResponse>((resolve, reject) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        const response = event.data as ServiceWorkerResponse;
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      };

      navigator.serviceWorker.controller?.postMessage(message, [messageChannel.port2]);
    });
  }

  // Background sync for offline actions
  async registerBackgroundSync(tag: string): Promise<void> {
    if (!this.registration) {
      throw new Error('Service Worker not registered');
    }

    if ('sync' in this.registration) {
      try {
        const syncRegistration = this.registration as ServiceWorkerRegistrationWithSync;
        if (syncRegistration.sync) {
          await syncRegistration.sync.register(tag);
        }
        logger.info('📅 Background sync registered:', { tag });
      } catch (error) {
        logger.error('Background sync registration failed:', { error: error instanceof Error ? error.message : String(error) });
      }
    } else {
      logger.warn('Background sync not supported');
    }
  }

  // Get cache storage info
  async getCacheInfo(): Promise<CacheInfo[] | null> {
    if (typeof window === 'undefined' || !('caches' in window)) return null;

    try {
      const cacheNames = await caches.keys();
      const cacheInfo: CacheInfo[] = [];

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        cacheInfo.push({
          name: cacheName,
          size: keys.length,
          lastModified: new Date().toISOString()
        });
      }

      return cacheInfo;
    } catch (error) {
      logger.error('Failed to get cache info:', { error: error instanceof Error ? error.message : String(error) });
      return null;
    }
  }

  // Clear specific cache
  async clearCache(cacheName?: string): Promise<boolean> {
    if (typeof window === 'undefined' || !('caches' in window)) return false;

    try {
      if (cacheName) {
        await caches.delete(cacheName);
        logger.info('🗑️ Cache cleared:', { cacheName });
      } else {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        logger.info('🗑️ All caches cleared');
      }
      return true;
    } catch (error) {
      logger.error('Failed to clear cache:', { error: error instanceof Error ? error.message : String(error) });
      return false;
    }
  }

  // Get service worker status
  getStatus(): ServiceWorkerStatus {
    return {
      supported: this.isSupported,
      registered: !!this.registration,
      scope: this.registration?.scope
    };
  }
}

// Offline queue for analytics and form data
// interface OfflineQueueInterface {
//   add(item: Omit<QueueItem, 'id' | 'timestamp' | 'retries'>): void;
//   getStatus(): { items: number; isOnline: boolean };
// } // Preserved for future offline queue interface

interface QueueItem {
  id: string;
  type: 'analytics' | 'form' | 'api';
  data: Record<string, unknown>;
  timestamp: number;
  retries: number;
  maxRetries: number;
}

// Add interface for SSR fallback
// interface FullOfflineQueueInterface extends OfflineQueueInterface {
//   queue: QueueItem[];
//   isOnline: boolean;
//   setupOnlineListener(): void;
//   processQueue(): Promise<void>;
//   processItem(item: QueueItem): Promise<void>;
//   saveQueue(): void;
//   loadQueue(): void;
// } // Preserved for future full offline queue implementation

export class OfflineQueue {
  private static instance: OfflineQueue;
  private queue: QueueItem[] = [];
  private isOnline: boolean = typeof window !== 'undefined' ? navigator.onLine : true;

  constructor() {
    this.setupOnlineListener();
    this.loadQueue();
  }

  static getInstance(): OfflineQueue {
    if (typeof window === 'undefined') {
      // Return a no-op instance during SSR
      return {
        add: () => {},
        getStatus: () => ({ items: 0, isOnline: true }),
        // Add missing properties for SSR fallback
        queue: [],
        isOnline: true,
        setupOnlineListener: () => {},
        processQueue: async () => {},
        processItem: async () => {},
        saveQueue: () => {},
        loadQueue: () => {}
      } as unknown as OfflineQueue;
    }
    
    if (!OfflineQueue.instance) {
      OfflineQueue.instance = new OfflineQueue();
    }
    return OfflineQueue.instance;
  }

  private setupOnlineListener() {
    if (typeof window === 'undefined') return;
    
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  // Add item to queue
  add(item: Omit<QueueItem, 'id' | 'timestamp' | 'retries'>) {
    this.queue.push({
      ...item,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      retries: 0
    });
    
    this.saveQueue();

    if (this.isOnline) {
      this.processQueue();
    }
  }

  // Process queued items
  private async processQueue() {
    if (this.queue.length === 0) return;

    logger.info('📤 Processing offline queue:', { length: this.queue.length });

    const itemsToProcess = [...this.queue];
    this.queue = [];

    for (const item of itemsToProcess) {
      try {
        await this.processItem(item);
        logger.info('✅ Queue item processed:', { id: item.id });
      } catch (error) {
        logger.error('❌ Failed to process queue item:', { error: error instanceof Error ? error.message : String(error) });
        // Re-add failed items to queue
        this.queue.push(item);
      }
    }

    this.saveQueue();
  }

  // Process individual item
  private async processItem(item: QueueItem): Promise<void> {
    const { type, data } = item;

    switch (type) {
      case 'analytics':
        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        break;
        
      case 'form':
        await fetch(data.url as string, {
          method: (data.method as string) || 'POST',
          headers: (data.headers as Record<string, string>) || { 'Content-Type': 'application/json' },
          body: JSON.stringify(data.body)
        });
        break;

      default:
        logger.warn('Unknown queue item type:', { type });
    }
  }

  // Save queue to localStorage
  private saveQueue() {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('agriko_offline_queue', JSON.stringify(this.queue));
    } catch (error) {
      logger.error('Failed to save offline queue:', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  // Load queue from localStorage
  private loadQueue() {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem('agriko_offline_queue');
      if (stored) {
        this.queue = JSON.parse(stored) as QueueItem[];
      }
    } catch (error) {
      logger.error('Failed to load offline queue:', { error: error instanceof Error ? error.message : String(error) });
      this.queue = [];
    }
  }

  // Get queue status
  getStatus() {
    return {
      items: this.queue.length,
      isOnline: this.isOnline
    };
  }
}

// Initialize service worker and offline capabilities
export async function initializePerformanceOptimizations(): Promise<void> {
  if (typeof window === 'undefined') return;

  const swManager = ServiceWorkerManager.getInstance();
  const _offlineQueue = OfflineQueue.getInstance();
  void _offlineQueue; // Preserved for future offline queue integration

  // Register service worker
  await swManager.register();

  // Setup performance monitoring
  if ('PerformanceObserver' in window) {
    // Monitor for layout shifts and other performance issues
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'layout-shift') {
          const layoutShiftEntry = entry as LayoutShiftEntry;
          if (!layoutShiftEntry.hadRecentInput) {
            const clsValue = layoutShiftEntry.value;
            if (clsValue > 0.1) {
              logger.warn('🚨 High CLS detected:', { value: clsValue });
            }
          }
        }
      });
    });

    observer.observe({ entryTypes: ['layout-shift'] });
  }

  logger.info('🚀 Performance optimizations initialized');
}

// Export singleton instances (lazy initialization to avoid SSR issues)
export const getServiceWorkerManager = () => ServiceWorkerManager.getInstance();
export const getOfflineQueue = () => OfflineQueue.getInstance();