import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

import { randomBytes, createHash } from 'crypto';

// CSRF token storage (use Redis in production)
const csrfTokens = new Map<string, { token: string; expires: number; used: boolean }>();

// Cleanup expired tokens periodically
const CLEANUP_INTERVAL = 10 * 60 * 1000; // 10 minutes
const csrfCleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, data] of csrfTokens.entries()) {
    if (now > data.expires || data.used) {
      csrfTokens.delete(key);
    }
  }
}, CLEANUP_INTERVAL);

// Cleanup on process termination
if (typeof process !== 'undefined') {
  const cleanup = () => {
    clearInterval(csrfCleanupInterval);
  };
  
  process.on('SIGTERM', cleanup);
  process.on('SIGINT', cleanup);
  process.on('exit', cleanup);
}

/**
 * Generate a secure CSRF token
 */
export function generateCSRFToken(sessionId?: string): { token: string; hash: string } {
  const token = randomBytes(32).toString('hex');
  const timestamp = Date.now().toString();
  const sessionIdentifier = sessionId ?? 'anonymous';
  
  // Create a hash that can be verified later
  const hash = createHash('sha256')
    .update(`${token}:${timestamp}:${sessionIdentifier}`)
    .digest('hex');
  
  // Store token with expiration (1 hour)
  const expires = Date.now() + 60 * 60 * 1000;
  csrfTokens.set(hash, { token, expires, used: false });
  
  return { token, hash };
}

/**
 * Verify CSRF token
 */
export function verifyCSRFToken(
  token: string, 
  hash: string, 
  sessionId?: string
): { valid: boolean; error?: string } {
  if (!token || !hash) {
    return { valid: false, error: 'Missing CSRF token or hash' };
  }

  const storedData = csrfTokens.get(hash);
  if (!storedData) {
    return { valid: false, error: 'Invalid or expired CSRF token' };
  }

  if (storedData.used) {
    csrfTokens.delete(hash);
    return { valid: false, error: 'CSRF token already used' };
  }

  if (Date.now() > storedData.expires) {
    csrfTokens.delete(hash);
    return { valid: false, error: 'CSRF token expired' };
  }

  if (storedData.token !== token) {
    return { valid: false, error: 'CSRF token mismatch' };
  }

  // Mark token as used (one-time use)
  storedData.used = true;
  
  return { valid: true };
}

/**
 * Extract CSRF token from request
 */
export function extractCSRFToken(request: NextRequest): { token?: string; hash?: string } {
  // Check headers first (for API requests)
  const headerToken = request.headers.get('X-CSRF-Token');
  const headerHash = request.headers.get('X-CSRF-Hash');
  
  if (headerToken && headerHash) {
    return { token: headerToken, hash: headerHash };
  }

  // Check cookies (for form submissions)
  const cookieToken = request.cookies.get('csrf-token')?.value;
  const cookieHash = request.cookies.get('csrf-hash')?.value;
  
  return { token: cookieToken, hash: cookieHash };
}

/**
 * Middleware function to protect against CSRF attacks
 */
export function createCSRFProtection(options: {
  methods?: string[];
  skipPaths?: string[];
  requireForApi?: boolean;
} = {}) {
  const {
    methods = ['POST', 'PUT', 'DELETE', 'PATCH'],
    skipPaths = [],
    requireForApi = true
  } = options;

  return function csrfMiddleware(request: NextRequest): NextResponse | null {
    const { pathname } = request.nextUrl;
    const method = request.method;

    // Skip GET, HEAD, OPTIONS
    if (!methods.includes(method)) {
      return null;
    }

    // Skip specified paths
    if (skipPaths.some(path => pathname.startsWith(path))) {
      return null;
    }

    // Check if this is an API route
    const isApiRoute = pathname.startsWith('/api/');
    
    if (isApiRoute && !requireForApi) {
      return null;
    }

    // Extract CSRF tokens
    const { token, hash } = extractCSRFToken(request);
    
    // Get session ID for verification
    const sessionId = request.cookies.get('session-id')?.value ?? 
                     request.headers.get('X-Session-ID');

    // Verify CSRF token
    const verification = verifyCSRFToken(token ?? '', hash ?? '', sessionId ?? undefined);
    
    if (!verification.valid) {
      logger.warn(`❌ CSRF protection failed for ${method} ${pathname}: ${verification.error}`);
      
      return NextResponse.json(
        {
          error: 'CSRF token validation failed',
          message: 'Invalid or missing CSRF token. Please refresh the page and try again.',
          code: 'CSRF_TOKEN_INVALID'
        },
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Protection': 'failed'
          }
        }
      );
    }

    logger.info(`✅ CSRF protection passed for ${method} ${pathname}`);
    return null; // Continue processing
  };
}

/**
 * Generate CSRF tokens for forms
 */
export function getCSRFTokens(sessionId?: string) {
  return generateCSRFToken(sessionId);
}

/**
 * React hook for CSRF protection
 */
export function useCSRFToken() {
  if (typeof window === 'undefined') {
    return { token: '', hash: '' };
  }

  // Get from meta tags or cookies
  const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
  const hash = document.querySelector('meta[name="csrf-hash"]')?.getAttribute('content') ?? '';
  
  return { token, hash };
}

/**
 * Add CSRF headers to fetch requests
 */
export function addCSRFHeaders(headers: Record<string, string> = {}): Record<string, string> {
  if (typeof window === 'undefined') {
    return headers;
  }

  const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  const hash = document.querySelector('meta[name="csrf-hash"]')?.getAttribute('content');
  
  if (token && hash) {
    headers['X-CSRF-Token'] = token;
    headers['X-CSRF-Hash'] = hash;
  }
  
  return headers;
}

/**
 * Secure fetch wrapper with CSRF protection
 */
export async function secureAPIFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const { headers = {}, ...otherOptions } = options;
  
  const secureHeaders = addCSRFHeaders(headers as Record<string, string>);
  
  return fetch(url, {
    ...otherOptions,
    headers: {
      'Content-Type': 'application/json',
      ...secureHeaders,
    },
  });
}

/**
 * Double Submit Cookie pattern for additional security
 */
export function generateDoubleSubmitToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Verify double submit cookie
 */
export function verifyDoubleSubmitToken(
  cookieToken: string,
  headerToken: string
): boolean {
  return Boolean(cookieToken && headerToken && cookieToken === headerToken);
}

/**
 * Get CSRF stats for monitoring
 */
export function getCSRFStats() {
  const now = Date.now();
  let activeTokens = 0;
  let expiredTokens = 0;
  let usedTokens = 0;

  for (const data of csrfTokens.values()) {
    if (data.used) {
      usedTokens++;
    } else if (now > data.expires) {
      expiredTokens++;
    } else {
      activeTokens++;
    }
  }

  return {
    totalTokens: csrfTokens.size,
    activeTokens,
    expiredTokens,
    usedTokens,
  };
}

const csrf = {
  generateCSRFToken,
  verifyCSRFToken,
  extractCSRFToken,
  createCSRFProtection,
  getCSRFTokens,
  useCSRFToken,
  addCSRFHeaders,
  secureAPIFetch,
  generateDoubleSubmitToken,
  verifyDoubleSubmitToken,
  getCSRFStats,
};

export default csrf;
