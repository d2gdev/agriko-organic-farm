// Unified authentication architecture

// Single source of truth for auth types
export interface AuthUser {
  userId: string;
  username: string;
  email?: string;
  role: 'admin' | 'readonly' | 'api-user' | 'customer';
  permissions: string[];  // NOT optional - empty array if no permissions
}

export interface AuthResult {
  isAuthenticated: boolean;
  user?: AuthUser;
  error?: string;
  expiresAt?: number;
}

export interface AuthToken {
  token: string;
  type: 'Bearer' | 'Basic' | 'ApiKey';
  expiresAt: number;
}

// Permission system with proper types
export enum Permission {
  // Admin permissions
  ADMIN_FULL = 'admin.full',
  ADMIN_READ = 'admin.read',
  ADMIN_WRITE = 'admin.write',
  ADMIN_DELETE = 'admin.delete',

  // API permissions
  API_READ = 'api.read',
  API_WRITE = 'api.write',

  // Analytics permissions
  ANALYTICS_VIEW = 'analytics.view',
  ANALYTICS_EXPORT = 'analytics.export',

  // Order permissions
  ORDERS_VIEW = 'orders.view',
  ORDERS_MANAGE = 'orders.manage',
  ORDERS_REFUND = 'orders.refund',
}

// Role-based permission mappings
export const ROLE_PERMISSIONS: Record<AuthUser['role'], Permission[]> = {
  admin: [
    Permission.ADMIN_FULL,
    Permission.ADMIN_READ,
    Permission.ADMIN_WRITE,
    Permission.ADMIN_DELETE,
    Permission.API_READ,
    Permission.API_WRITE,
    Permission.ANALYTICS_VIEW,
    Permission.ANALYTICS_EXPORT,
    Permission.ORDERS_VIEW,
    Permission.ORDERS_MANAGE,
    Permission.ORDERS_REFUND,
  ],
  readonly: [
    Permission.ADMIN_READ,
    Permission.API_READ,
    Permission.ANALYTICS_VIEW,
    Permission.ORDERS_VIEW,
  ],
  'api-user': [
    Permission.API_READ,
    Permission.API_WRITE,
  ],
  customer: [
    Permission.ORDERS_VIEW, // Only their own orders
  ],
};

// Unified permission check
export function hasPermission(user: AuthUser, permission: Permission | string): boolean {
  // Admin bypass
  if (user.permissions.includes(Permission.ADMIN_FULL)) {
    return true;
  }

  // Check specific permission
  return user.permissions.includes(permission);
}

// Unified auth validation
export async function validateAuth(
  request: Request,
  options: {
    requirePermissions?: Permission[];
    allowAnonymous?: boolean;
  } = {}
): Promise<AuthResult> {
  // Check various auth methods in order of preference

  // 1. Bearer token (JWT)
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const result = await validateJWT(token);
    if (result.isAuthenticated) {
      return checkPermissions(result, options.requirePermissions);
    }
  }

  // 2. API Key
  const apiKey = request.headers.get('X-API-Key');
  if (apiKey) {
    const result = await validateApiKey(apiKey);
    if (result.isAuthenticated) {
      return checkPermissions(result, options.requirePermissions);
    }
  }

  // 3. Session cookie
  const cookies = parseCookies(request.headers.get('Cookie'));
  if (cookies['session-token']) {
    const result = await validateSession(cookies['session-token']);
    if (result.isAuthenticated) {
      return checkPermissions(result, options.requirePermissions);
    }
  }

  // 4. Allow anonymous if specified
  if (options.allowAnonymous) {
    return {
      isAuthenticated: false,
      user: undefined,
    };
  }

  return {
    isAuthenticated: false,
    error: 'Authentication required',
  };
}

// Helper functions
function checkPermissions(result: AuthResult, required?: Permission[]): AuthResult {
  if (!required || required.length === 0) {
    return result;
  }

  if (!result.user) {
    return { ...result, isAuthenticated: false, error: 'No user in auth result' };
  }

  const user = result.user;
  const hasAll = required.every(perm => hasPermission(user, perm));
  if (!hasAll) {
    return {
      ...result,
      isAuthenticated: false,
      error: `Missing required permissions: ${required.join(', ')}`,
    };
  }

  return result;
}

async function validateJWT(_token: string): Promise<AuthResult> {
  // JWT validation logic
  throw new Error('Not implemented - example only');
}

async function validateApiKey(_apiKey: string): Promise<AuthResult> {
  // API key validation logic
  throw new Error('Not implemented - example only');
}

async function validateSession(_sessionToken: string): Promise<AuthResult> {
  // Session validation logic
  throw new Error('Not implemented - example only');
}

function parseCookies(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {};
  return Object.fromEntries(
    cookieHeader.split(';').map(c => c.trim().split('='))
  );
}