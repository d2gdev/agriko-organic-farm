import { logger } from '@/lib/logger';
// First Input Delay (FID) optimization utilities
// Helps reduce input delay and improve user interaction responsiveness

// Scheduler API types (experimental)
interface SchedulerPostTaskOptions {
  priority?: 'user-blocking' | 'user-visible' | 'background';
  delay?: number;
}

interface Scheduler {
  postTask<T>(callback: () => T | Promise<T>, options?: SchedulerPostTaskOptions): Promise<T>;
}

declare global {
  interface Window {
    scheduler?: Scheduler;
  }
}

// Task scheduling utilities
export class TaskScheduler {
  private static tasks: Array<{ fn: Function; priority: number }> = [];
  private static isProcessing = false;

  // Add task to scheduler with priority
  static addTask(task: Function, priority: number = 0) {
    this.tasks.push({ fn: task, priority });
    this.tasks.sort((a, b) => b.priority - a.priority); // Higher priority first
    
    if (!this.isProcessing) {
      this.processTasks();
    }
  }

  // Process tasks using scheduler
  private static async processTasks() {
    if (this.tasks.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;

    while (this.tasks.length > 0) {
      const task = this.tasks.shift();
      if (task) {
        try {
          // Use scheduler if available, fallback to timeout
          const hasScheduler = 'scheduler' in window && 
            window.scheduler && 
            typeof window.scheduler === 'object' && 
            'postTask' in window.scheduler && 
            typeof window.scheduler.postTask === 'function';
          
          if (hasScheduler && window.scheduler) {
            await window.scheduler.postTask(task.fn as () => unknown, {
              priority: task.priority > 5 ? 'user-blocking' : 
                       task.priority > 0 ? 'user-visible' : 'background'
            });
          } else {
            // Fallback: break up long tasks
            await this.yieldToMain(task.fn);
          }
        } catch (error) {
          logger.error('Task execution failed:', error as Record<string, unknown>);
        }
      }
    }

    this.isProcessing = false;
  }

  // Yield to main thread between tasks
  private static yieldToMain(task: Function): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        task();
        resolve();
      }, 0);
    });
  }
}

// Long task breaking utilities
export const LongTaskBreaker = {
  // Break up large arrays into smaller chunks
  processArrayInChunks: async <T>(
    array: T[],
    processor: (item: T) => void,
    chunkSize: number = 100
  ): Promise<void> => {
    for (let i = 0; i < array.length; i += chunkSize) {
      const chunk = array.slice(i, i + chunkSize);
      
      // Process chunk
      chunk.forEach(processor);
      
      // Yield to main thread
      if (i + chunkSize < array.length) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
  },

  // Time-sliced execution
  timeSlicedExecution: async (
    tasks: Function[],
    timeSlice: number = 5 // milliseconds
  ): Promise<void> => {
    let taskIndex = 0;
    
    const processBatch = async () => {
      const start = performance.now();
      
      while (taskIndex < tasks.length && (performance.now() - start) < timeSlice) {
        const task = tasks[taskIndex];
        if (task) {
          task();
        }
        taskIndex++;
      }
      
      if (taskIndex < tasks.length) {
        // Yield to main thread
        await new Promise(resolve => setTimeout(resolve, 0));
        await processBatch();
      }
    };
    
    await processBatch();
  },

  // Batch DOM operations
  batchDOMUpdates: (updates: Array<() => void>): void => {
    // Use requestAnimationFrame for DOM batching
    requestAnimationFrame(() => {
      updates.forEach(update => update());
    });
  }
};

// Third-party script optimization
export class ThirdPartyOptimizer {
  private static loadedScripts = new Set<string>();
  private static observers = new Map<string, IntersectionObserver>();
  private static eventHandlers = new Map<string, EventListener[]>();

  // Maximum number of observers to prevent memory leaks
  private static readonly MAX_OBSERVERS = 10;

  // Load script only when needed
  static async loadOnDemand(
    scriptUrl: string,
    condition: () => boolean = () => true
  ): Promise<void> {
    if (this.loadedScripts.has(scriptUrl) || !condition()) {
      return;
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = scriptUrl;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        this.loadedScripts.add(scriptUrl);
        resolve();
      };
      
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Load script when element is visible
  static loadOnVisible(scriptUrl: string, targetSelector: string): void {
    if (this.loadedScripts.has(scriptUrl)) return;

    // Enforce size limit to prevent memory leaks
    if (this.observers.size >= this.MAX_OBSERVERS) {
      logger.warn('Max observers limit reached, cleaning up oldest observers');
      const oldestKey = this.observers.keys().next().value;
      if (oldestKey) {
        const oldObserver = this.observers.get(oldestKey);
        if (oldObserver) {
          oldObserver.disconnect();
        }
        this.observers.delete(oldestKey);
      }
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.loadOnDemand(scriptUrl);
          observer.unobserve(entry.target);
          observer.disconnect();
          this.observers.delete(scriptUrl);
        }
      });
    });

    const target = document.querySelector(targetSelector);
    if (target) {
      observer.observe(target);
      this.observers.set(scriptUrl, observer);
    }
  }

  // Load script on user interaction
  static loadOnInteraction(
    scriptUrl: string,
    events: string[] = ['click', 'touchstart', 'keypress']
  ): void {
    if (this.loadedScripts.has(scriptUrl)) return;

    const loadScript = () => {
      this.loadOnDemand(scriptUrl);
      // Clean up event listeners
      const handlers = this.eventHandlers.get(scriptUrl) || [];
      handlers.forEach((handler, index) => {
        const event = events[index];
        if (event) {
          document.removeEventListener(event, handler);
        }
      });
      this.eventHandlers.delete(scriptUrl);
    };

    // Store event handlers for cleanup
    const handlers: EventListener[] = [];
    events.forEach(event => {
      const handler = loadScript;
      handlers.push(handler);
      document.addEventListener(event, handler);
    });
    this.eventHandlers.set(scriptUrl, handlers);
  }

  // Cleanup observers and event handlers
  static cleanup(): void {
    this.observers.forEach((observer, scriptUrl) => {
      observer.disconnect();
      this.loadedScripts.delete(scriptUrl);
    });
    this.observers.clear();

    // Clean up event handlers
    this.eventHandlers.forEach((handlers, scriptUrl) => {
      // Note: We can't remove event listeners here without the event names
      // Event listeners should be cleaned up when the script loads or via the loadScript callback
      this.loadedScripts.delete(scriptUrl);
    });
    this.eventHandlers.clear();
  }
}

// Event handling optimization
export const OptimizedEventHandlers = {
  // Debounced event handler
  debounce: <T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(null, args), wait);
    };
  },

  // Throttled event handler
  throttle: <T extends (...args: unknown[]) => unknown>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func.apply(null, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Passive event listener setup
  addPassiveListener: (
    element: Element | Window,
    event: string,
    handler: EventListener
  ): (() => void) => {
    element.addEventListener(event, handler, { passive: true });
    
    // Return cleanup function
    return () => element.removeEventListener(event, handler);
  },

  // Optimized scroll handler
  optimizedScroll: (callback: (scrollY: number) => void): (() => void) => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          callback(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => window.removeEventListener('scroll', handleScroll);
  },

  // Optimized resize handler
  optimizedResize: (callback: (width: number, height: number) => void): (() => void) => {
    let ticking = false;
    
    const handleResize = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          callback(window.innerWidth, window.innerHeight);
          ticking = false;
        });
        ticking = true;
      }
    };
    
    window.addEventListener('resize', handleResize, { passive: true });
    
    return () => window.removeEventListener('resize', handleResize);
  }
};

// Main thread optimization
export class MainThreadOptimizer {
  private static taskQueue: Array<{ task: Function; priority: number }> = [];
  private static isIdle = true;

  // Schedule work during idle time
  static scheduleIdleWork(task: Function, priority: number = 0): void {
    this.taskQueue.push({ task, priority });
    this.taskQueue.sort((a, b) => b.priority - a.priority);
    
    if (this.isIdle) {
      this.processIdleTasks();
    }
  }

  // Process tasks during idle periods
  private static processIdleTasks(): void {
    if (this.taskQueue.length === 0) {
      this.isIdle = true;
      return;
    }

    this.isIdle = false;

    const processChunk = (deadline: IdleDeadline) => {
      while (deadline.timeRemaining() > 0 && this.taskQueue.length > 0) {
        const taskItem = this.taskQueue.shift();
        if (!taskItem) break;
        const { task } = taskItem;
        try {
          task();
        } catch (error) {
          logger.error('Idle task failed:', error as Record<string, unknown>);
        }
      }

      if (this.taskQueue.length > 0) {
        this.requestIdleCallback(processChunk);
      } else {
        this.isIdle = true;
      }
    };

    this.requestIdleCallback(processChunk);
  }

  // Polyfill for requestIdleCallback
  private static requestIdleCallback(callback: (deadline: IdleDeadline) => void): void {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(callback);
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        const start = Date.now();
        callback({
          didTimeout: false,
          timeRemaining: () => Math.max(0, 50 - (Date.now() - start))
        } as IdleDeadline);
      }, 1);
    }
  }

  // Break up heavy computations
  static async yieldingLoop<T>(
    items: T[],
    processor: (item: T, index: number) => void,
    yieldEvery: number = 50
  ): Promise<void> {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item !== undefined) {
        processor(item, i);
      }
      
      // Yield every N iterations
      if (i % yieldEvery === 0 && i > 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
  }

  // Monitor main thread blocking
  static monitorMainThread(): () => void {
    let lastTime = performance.now();
    
    const checkMainThread = () => {
      const currentTime = performance.now();
      const delta = currentTime - lastTime;
      
      // If more than 50ms has passed, the main thread was likely blocked
      if (delta > 50) {
        logger.warn('🚨 Main thread blocked for', { duration: Math.round(delta), unit: 'ms' });
      }
      
      lastTime = currentTime;
      requestAnimationFrame(checkMainThread);
    };
    
    const rafId = requestAnimationFrame(checkMainThread);
    
    // Return cleanup function
    return () => cancelAnimationFrame(rafId);
  }
}

// FID optimization recommendations
export const FIDOptimizer = {
  // Initialize all FID optimizations
  initialize(): () => void {
    const cleanupFunctions: Array<() => void> = [];

    // Monitor main thread blocking
    cleanupFunctions.push(MainThreadOptimizer.monitorMainThread());

    // Setup optimized third-party loading
    ThirdPartyOptimizer.loadOnInteraction('https://www.googletagmanager.com/gtag/js');

    // Break up initialization tasks
    const initTasks = [
      () => logger.info('🚀 FID optimizations initialized'),
      // Add other initialization tasks here
    ];

    TaskScheduler.addTask(() => {
      LongTaskBreaker.timeSlicedExecution(initTasks, 5);
    }, 10);

    logger.info('⚡ FID optimizer initialized');

    // Return cleanup function
    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
      ThirdPartyOptimizer.cleanup();
    };
  },

  // Get FID optimization recommendations
  getRecommendations(): string[] {
    const recommendations: string[] = [];

    // Check for long tasks
    const longTaskCount = this.getLongTaskCount();
    if (longTaskCount > 0) {
      recommendations.push(`Found ${longTaskCount} long tasks that could be broken up`);
    }

    // Check for unoptimized event handlers
    const eventListeners = this.getEventListenerCount();
    if (eventListeners > 50) {
      recommendations.push('Consider debouncing/throttling some event handlers');
    }

    // Check for third-party scripts
    const thirdPartyScripts = this.getThirdPartyScriptCount();
    if (thirdPartyScripts > 5) {
      recommendations.push('Load third-party scripts on-demand to reduce initial bundle size');
    }

    if (recommendations.length === 0) {
      recommendations.push('FID optimizations look good! 🎉');
    }

    return recommendations;
  },

  // Helper methods for analysis
  getLongTaskCount(): number {
    // This would integrate with PerformanceObserver in a real implementation
    return 0;
  },

  getEventListenerCount(): number {
    // Estimate based on common patterns
    return document.querySelectorAll('[onclick], [onscroll], [onresize]').length;
  },

  getThirdPartyScriptCount(): number {
    const scripts = Array.from(document.scripts);
    return scripts.filter(script => 
      script.src && !script.src.includes(window.location.hostname)
    ).length;
  }
};

// React-specific FID optimizations
export const ReactFIDOptimizer = {
  // Optimize heavy renders with time slicing
  useTimeSlicedRender: <T>(
    items: T[],
    renderItem: (item: T) => React.ReactNode,
    chunkSize: number = 20
  ) => {
    const [renderedItems, setRenderedItems] = React.useState<T[]>([]);
    const [currentIndex, setCurrentIndex] = React.useState(0);

    React.useEffect(() => {
      if (currentIndex >= items.length) return;

      const timeSliceRender = async () => {
        const nextChunk = items.slice(currentIndex, currentIndex + chunkSize);
        setRenderedItems(prev => [...prev, ...nextChunk]);
        setCurrentIndex(prev => prev + chunkSize);
        
        // Yield to main thread
        await new Promise(resolve => setTimeout(resolve, 0));
      };

      timeSliceRender();
    }, [currentIndex, items, chunkSize]);

    return renderedItems.map(renderItem);
  },

  // Debounced state updates
  useDebouncedState: <T>(initialValue: T, delay: number = 300) => {
    const [value, setValue] = React.useState(initialValue);
    const [debouncedValue, setDebouncedValue] = React.useState(initialValue);

    React.useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      return () => clearTimeout(handler);
    }, [value, delay]);

    return [debouncedValue, setValue] as const;
  }
};

// Add React import if not already present
declare global {
  namespace React {
    function useState<T>(initialState: T | (() => T)): [T, (value: T | ((prev: T) => T)) => void];
    function useEffect(effect: () => void | (() => void), deps?: unknown[]): void;
  }
}
