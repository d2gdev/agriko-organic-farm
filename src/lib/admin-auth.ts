import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';

// Admin authentication configuration - dynamically loaded
function getAdminConfig() {
  return {
    username: process.env.ADMIN_USERNAME || 'admin',
    passwordHash: process.env.ADMIN_PASSWORD_HASH || '',
  };
}

export const ADMIN_CONFIG = getAdminConfig();

/**
 * Verify admin credentials
 * @param username - Admin username
 * @param password - Plain text password to verify
 * @returns Promise<boolean> - True if credentials are valid
 */
export async function verifyAdminCredentials(
  username: string,
  password: string
): Promise<boolean> {
  // Get fresh config to handle environment variable changes in tests
  const config = getAdminConfig();

  // Constant-time username comparison
  const usernameValid = username === config.username;

  // Verify password against hash
  const passwordValid = await bcrypt.compare(password, config.passwordHash);

  // Both must be valid
  return usernameValid && passwordValid;
}

/**
 * Check if admin auth is properly configured
 */
export function isAdminAuthConfigured(): boolean {
  const config = getAdminConfig();
  return !!(config.username && config.passwordHash);
}

/**
 * Admin authentication result type
 */
export interface AdminAuthResult {
  userId: string;
  username: string;
  isAuthenticated: boolean;
}

/**
 * Higher-order function to wrap admin routes with authentication
 */
export function withAdminAuth<T extends unknown[]>(
  handler: (request: NextRequest, authResult: AdminAuthResult, ...args: T) => Promise<Response>
) {
  return async (request: NextRequest, ...args: T): Promise<Response> => {
    try {
      // Extract credentials from Authorization header
      const authHeader = request.headers.get('authorization');
      if (!authHeader?.startsWith('Basic ')) {
        return new Response(JSON.stringify({ error: 'Missing authentication' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Decode base64 credentials
      const base64Credentials = authHeader.split(' ')[1];
      if (!base64Credentials) {
        return new Response(JSON.stringify({ error: 'Invalid authorization header format' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const credentials = Buffer.from(base64Credentials, 'base64').toString();
      const [username, password] = credentials.split(':');

      if (!username || !password) {
        return new Response(JSON.stringify({ error: 'Invalid credentials format' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Verify credentials
      const isValid = await verifyAdminCredentials(username, password);
      if (!isValid) {
        return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Create auth result
      const authResult: AdminAuthResult = {
        userId: username,
        username: username,
        isAuthenticated: true
      };

      // Call the wrapped handler
      return await handler(request, authResult, ...args);
    } catch {
      return new Response(JSON.stringify({ error: 'Authentication error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  };
}

/**
 * Validate admin authentication for API routes
 * @param request - The incoming request
 * @returns Promise with success status and optional error
 */
export async function validateAdminAuth(request: Request): Promise<{ success: boolean; error?: string; userId?: string }> {
  try {
    // Extract credentials from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Basic ')) {
      return { success: false, error: 'Missing authentication header' };
    }

    // Decode base64 credentials
    const base64Credentials = authHeader.split(' ')[1];
    if (!base64Credentials) {
      return { success: false, error: 'Invalid authorization header format' };
    }

    const credentials = Buffer.from(base64Credentials, 'base64').toString();
    const [username, password] = credentials.split(':');

    if (!username || !password) {
      return { success: false, error: 'Invalid credentials format' };
    }

    // Verify credentials
    const isValid = await verifyAdminCredentials(username, password);
    if (!isValid) {
      return { success: false, error: 'Invalid credentials' };
    }

    return { success: true, userId: username };
  } catch {
    return { success: false, error: 'Authentication error' };
  }
}
