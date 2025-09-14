/**
 * Safe localStorage wrapper that handles SSR and private browsing gracefully
 */

export class SafeLocalStorage {
  private static isAvailable: boolean | null = null;
  private static lastCheck: number = 0;
  private static readonly RECHECK_INTERVAL = 30000; // 30 seconds

  /**
   * Check if localStorage is available
   */
  private static checkAvailability(): boolean {
    const now = Date.now();
    
    // If we have a cached result and it's not too old, use it
    if (this.isAvailable !== null && (now - this.lastCheck) < this.RECHECK_INTERVAL) {
      return this.isAvailable;
    }

    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        this.isAvailable = false;
        return false;
      }

      // Check if localStorage is accessible
      const testKey = '__localStorage_test__';
      window.localStorage.setItem(testKey, 'test');
      window.localStorage.removeItem(testKey);
      this.isAvailable = true;
      this.lastCheck = now;
      return true;
    } catch (error) {
      // localStorage is not available (private browsing, disabled, etc.)
      this.isAvailable = false;
      this.lastCheck = now;
      return false;
    }
  }

  /**
   * Safely get an item from localStorage
   */
  static getItem(key: string): string | null {
    if (!this.checkAvailability()) {
      return null;
    }

    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      console.warn(`SafeLocalStorage: Failed to get item "${key}":`, error);
      return null;
    }
  }

  /**
   * Safely set an item in localStorage
   */
  static setItem(key: string, value: string): boolean {
    if (!this.checkAvailability()) {
      return false;
    }

    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn(`SafeLocalStorage: Failed to set item "${key}":`, error);
      return false;
    }
  }

  /**
   * Safely remove an item from localStorage
   */
  static removeItem(key: string): boolean {
    if (!this.checkAvailability()) {
      return false;
    }

    try {
      window.localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`SafeLocalStorage: Failed to remove item "${key}":`, error);
      return false;
    }
  }

  /**
   * Safely clear all localStorage
   */
  static clear(): boolean {
    if (!this.checkAvailability()) {
      return false;
    }

    try {
      window.localStorage.clear();
      return true;
    } catch (error) {
      console.warn('SafeLocalStorage: Failed to clear localStorage:', error);
      return false;
    }
  }

  /**
   * Get an item and parse as JSON safely
   */
  static getJSON<T>(key: string): T | null {
    const item = this.getItem(key);
    if (!item) {
      return null;
    }

    try {
      return JSON.parse(item) as T;
    } catch (error) {
      console.warn(`SafeLocalStorage: Failed to parse JSON for "${key}":`, error);
      return null;
    }
  }

  /**
   * Set an item as JSON safely
   */
  static setJSON(key: string, value: unknown): boolean {
    try {
      const serialized = JSON.stringify(value);
      return this.setItem(key, serialized);
    } catch (error) {
      console.warn(`SafeLocalStorage: Failed to serialize JSON for "${key}":`, error);
      return false;
    }
  }

  /**
   * Check if localStorage is available (public method)
   */
  static isLocalStorageAvailable(): boolean {
    return this.checkAvailability();
  }

  /**
   * Reset availability cache to force recheck
   */
  static resetAvailabilityCache(): void {
    this.isAvailable = null;
    this.lastCheck = 0;
  }
}

export default SafeLocalStorage;