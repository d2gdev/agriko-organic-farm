import { NextRequest, NextResponse } from 'next/server';

// Enhanced rate limiting with different strategies
interface RateLimitEntry {
  count: number;
  resetTime: number;
  blocked: boolean;
  blockUntil?: number;
}

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  blockDurationMs?: number; // How long to block after exceeding limit
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (request: NextRequest) => string;
}

// In-memory storage with size limits (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Memory management configuration
const MAX_STORE_SIZE = 10000; // Maximum number of entries
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
const AGGRESSIVE_CLEANUP_THRESHOLD = 0.8; // Trigger aggressive cleanup at 80% capacity

let cleanupInterval: NodeJS.Timeout | null = null;

function startCleanupInterval() {
  if (typeof window === 'undefined' && !cleanupInterval) {
    cleanupInterval = setInterval(() => {
      performCleanup();
    }, CLEANUP_INTERVAL);
  }
}

function performCleanup(aggressive = false) {
  const now = Date.now();
  const entries = Array.from(rateLimitStore.entries());
  
  // Standard cleanup - remove expired entries
  for (const [key, entry] of entries) {
    if (now > entry.resetTime && (!entry.blockUntil || now > entry.blockUntil)) {
      rateLimitStore.delete(key);
    }
  }
  
  // Aggressive cleanup if store is too large
  if (aggressive || rateLimitStore.size > MAX_STORE_SIZE * AGGRESSIVE_CLEANUP_THRESHOLD) {
    const remainingEntries = Array.from(rateLimitStore.entries());
    
    // Sort by last activity (resetTime) and remove oldest entries
    remainingEntries.sort(([, a], [, b]) => a.resetTime - b.resetTime);
    
    const targetSize = Math.floor(MAX_STORE_SIZE * 0.7); // Reduce to 70% capacity
    const entriesToRemove = remainingEntries.length - targetSize;
    
    if (entriesToRemove > 0) {
      for (let i = 0; i < entriesToRemove; i++) {
        const entry = remainingEntries[i];
        if (entry) {
          rateLimitStore.delete(entry[0]);
        }
      }
    }
  }
}

function stopCleanupInterval() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}

// Setup cleanup interval
startCleanupInterval();

// Graceful shutdown handlers (only in Node.js)
if (typeof process !== 'undefined') {
  process.on('SIGINT', stopCleanupInterval);
  process.on('SIGTERM', stopCleanupInterval);
  process.on('beforeExit', stopCleanupInterval);
}

/**
 * Enhanced rate limiting with blocking and different strategies
 */
export function checkAdvancedRateLimit(
  key: string,
  config: RateLimitConfig
): {
  success: boolean;
  limit: number;
  current: number;
  remaining: number;
  resetTime: number;
  blocked?: boolean;
  blockUntil?: number;
} {
  const now = Date.now();
  const {
    maxRequests,
    windowMs,
    blockDurationMs = windowMs * 2, // Block for 2x the window by default
  } = config;

  let entry = rateLimitStore.get(key);

  // Check if store is approaching capacity and trigger cleanup
  if (rateLimitStore.size > MAX_STORE_SIZE * AGGRESSIVE_CLEANUP_THRESHOLD) {
    performCleanup(true);
  }
  
  // Reject if store is at maximum capacity (safety measure)
  if (rateLimitStore.size >= MAX_STORE_SIZE) {
    return {
      success: false,
      limit: maxRequests,
      current: maxRequests,
      remaining: 0,
      resetTime: now + windowMs,
      blocked: true,
      blockUntil: now + (blockDurationMs ?? 0),
    };
  }

  // Initialize or reset if window expired
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + windowMs,
      blocked: false,
    };
  }

  // Check if currently blocked
  if (entry.blocked && entry.blockUntil && now < entry.blockUntil) {
    return {
      success: false,
      limit: maxRequests,
      current: entry.count,
      remaining: 0,
      resetTime: entry.resetTime,
      blocked: true,
      blockUntil: entry.blockUntil,
    };
  }

  // Clear block if expired
  if (entry.blocked && entry.blockUntil && now >= entry.blockUntil) {
    entry.blocked = false;
    entry.blockUntil = undefined;
    entry.count = 0;
    entry.resetTime = now + windowMs;
  }

  // Check rate limit
  if (entry.count >= maxRequests) {
    // Start blocking
    entry.blocked = true;
    entry.blockUntil = now + (blockDurationMs ?? 0);
    
    rateLimitStore.set(key, entry);
    
    return {
      success: false,
      limit: maxRequests,
      current: entry.count,
      remaining: 0,
      resetTime: entry.resetTime,
      blocked: true,
      blockUntil: entry.blockUntil,
    };
  }

  // Increment counter
  entry.count++;
  rateLimitStore.set(key, entry);

  return {
    success: true,
    limit: maxRequests,
    current: entry.count,
    remaining: maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Get client identifier for rate limiting
 */
export function getClientIdentifier(request: NextRequest): string {
  // Try to get the most accurate client identifier
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const clientIp = request.headers.get('cf-connecting-ip'); // Cloudflare
  
  let ip = 'unknown';
  
  if (forwarded) {
    const forwardedParts = forwarded.split(',');
    const firstPart = forwardedParts && forwardedParts.length > 0 ? forwardedParts[0] : undefined;
    ip = firstPart && typeof firstPart === 'string' ? firstPart.trim() : 'unknown';
  } else if (realIp) {
    ip = realIp;
  } else if (clientIp) {
    ip = clientIp;
  } else {
    // Extract IP from request socket if available
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
      const forwardedForParts = forwardedFor.split(',');
      const firstPart = forwardedForParts && forwardedForParts.length > 0 ? forwardedForParts[0] : undefined;
      ip = firstPart && typeof firstPart === 'string' ? firstPart.trim() : 'unknown';
    } else {
      ip = 'unknown';
    }
  }

  // Include user agent for better uniqueness (but not too specific)
  const userAgent = request.headers.get('user-agent') ?? '';
  const userAgentHash = simpleHash(userAgent);
  
  return `${ip}:${userAgentHash}`;
}

/**
 * Different rate limiting strategies
 */
export const rateLimitConfigs = {
  // Login endpoints - very strict
  authentication: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    blockDurationMs: 30 * 60 * 1000, // 30 minutes block
  },
  
  // Admin APIs - strict
  admin: {
    maxRequests: 20,
    windowMs: 60 * 1000, // 1 minute
    blockDurationMs: 5 * 60 * 1000, // 5 minutes block
  },
  
  // Search APIs - moderate
  search: {
    maxRequests: 50,
    windowMs: 60 * 1000, // 1 minute
    blockDurationMs: 2 * 60 * 1000, // 2 minutes block
  },
  
  // Public APIs - lenient
  public: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
    blockDurationMs: 60 * 1000, // 1 minute block
  },
  
  // Analytics - very lenient
  analytics: {
    maxRequests: 200,
    windowMs: 60 * 1000, // 1 minute
    blockDurationMs: 30 * 1000, // 30 seconds block
  },
};

/**
 * Check rate limit for specific endpoint type
 */
export function checkEndpointRateLimit(
  request: NextRequest,
  endpointType: keyof typeof rateLimitConfigs
) {
  const clientId = getClientIdentifier(request);
  const config = rateLimitConfigs[endpointType];
  
  return checkAdvancedRateLimit(clientId, config);
}

/**
 * Create rate limit response
 */
export function createRateLimitResponse(rateLimitResult: ReturnType<typeof checkAdvancedRateLimit>) {
  const status = rateLimitResult.blocked ? 429 : 429;
  const retryAfter = rateLimitResult.blockUntil 
    ? Math.ceil((rateLimitResult.blockUntil - Date.now()) / 1000)
    : Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-RateLimit-Limit': rateLimitResult.limit.toString(),
    'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
    'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
    'Retry-After': retryAfter.toString(),
  };

  if (rateLimitResult.blocked && rateLimitResult.blockUntil) {
    headers['X-RateLimit-Blocked'] = 'true';
    headers['X-RateLimit-Block-Until'] = rateLimitResult.blockUntil.toString();
  }

  const message = rateLimitResult.blocked
    ? `Too many requests. You are temporarily blocked. Try again in ${retryAfter} seconds.`
    : `Rate limit exceeded. Try again in ${retryAfter} seconds.`;

  return NextResponse.json(
    {
      error: 'Rate limit exceeded',
      message,
      retryAfter,
      limit: rateLimitResult.limit,
      remaining: rateLimitResult.remaining,
      resetTime: rateLimitResult.resetTime,
      blocked: rateLimitResult.blocked ?? false,
    },
    { status, headers }
  );
}

/**
 * Simple hash function for user agent
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * IP-based rate limiting (simpler version)
 */
export function checkSimpleRateLimit(
  request: NextRequest,
  maxRequests = 100,
  windowMs = 60000
): boolean {
  const clientId = getClientIdentifier(request);
  const result = checkAdvancedRateLimit(clientId, { maxRequests, windowMs });
  return result.success;
}

/**
 * Reset rate limit for a client (admin function)
 */
export function resetRateLimit(clientId: string): boolean {
  return rateLimitStore.delete(clientId);
}

/**
 * Get rate limit stats for monitoring
 */
export function getRateLimitStats() {
  const now = Date.now();
  const stats = {
    totalEntries: rateLimitStore.size,
    blockedClients: 0,
    activeClients: 0,
  };

  for (const entry of rateLimitStore.values()) {
    if (entry.blocked && entry.blockUntil && now < entry.blockUntil) {
      stats.blockedClients++;
    }
    if (now < entry.resetTime) {
      stats.activeClients++;
    }
  }

  return stats;
}

const rateLimit = {
  checkAdvancedRateLimit,
  getClientIdentifier,
  rateLimitConfigs,
  checkEndpointRateLimit,
  createRateLimitResponse,
  checkSimpleRateLimit,
  resetRateLimit,
  getRateLimitStats,
};

export default rateLimit;
