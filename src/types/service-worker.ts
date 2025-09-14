// Service Worker type definitions

export interface ServiceWorkerMessage {
  type: 'CACHE_CLEAR' | 'SYNC_BACKGROUND' | 'UPDATE_CHECK' | 'STATUS_REQUEST';
  payload?: {
    cacheNames?: string[];
    syncTag?: string;
    [key: string]: unknown;
  };
}

export interface ServiceWorkerResponse {
  success: boolean;
  message?: string;
  data?: {
    cacheSize?: number;
    syncStatus?: 'pending' | 'completed' | 'failed';
    updateAvailable?: boolean;
    [key: string]: unknown;
  };
  error?: string;
}

export interface CacheInfo {
  name: string;
  size: number;
  lastModified: string;
}

export interface ServiceWorkerStatus {
  supported: boolean;
  registered: boolean;
  updateAvailable?: boolean;
  scope?: string;
}

export interface BackgroundSyncOptions {
  tag: string;
  data?: Record<string, unknown>;
  minDelay?: number;
  maxRetries?: number;
}