/**
 * Single source of truth for authentication types
 * All auth-related modules should import from here
 */

// ============================================
// Core Auth Types
// ============================================

export interface AuthUser {
  userId: string;
  username: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  apiKey?: string;
  sessionToken?: string;
  expiresAt?: number;
}

export interface AuthResult {
  isAuthenticated: boolean;
  user?: AuthUser;
  error?: string;
  expiresAt?: number;
  token?: string;
}

export interface AuthToken {
  token: string;
  type: 'Bearer' | 'Basic' | 'ApiKey';
  expiresAt: number;
  refreshToken?: string;
}

export interface AuthSession {
  sessionId: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
  lastActivity: number;
  ipAddress?: string;
  userAgent?: string;
}

// ============================================
// Role & Permission Types
// ============================================

export enum UserRole {
  ADMIN = 'admin',
  READONLY = 'readonly',
  API_USER = 'api-user',
  CUSTOMER = 'customer',
  SHOP_MANAGER = 'shop_manager',
}

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

  // Product permissions
  PRODUCTS_VIEW = 'products.view',
  PRODUCTS_MANAGE = 'products.manage',

  // Customer permissions
  CUSTOMERS_VIEW = 'customers.view',
  CUSTOMERS_MANAGE = 'customers.manage',
}

// Role-based permission mappings
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
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
    Permission.PRODUCTS_VIEW,
    Permission.PRODUCTS_MANAGE,
    Permission.CUSTOMERS_VIEW,
    Permission.CUSTOMERS_MANAGE,
  ],
  [UserRole.READONLY]: [
    Permission.ADMIN_READ,
    Permission.API_READ,
    Permission.ANALYTICS_VIEW,
    Permission.ORDERS_VIEW,
    Permission.PRODUCTS_VIEW,
    Permission.CUSTOMERS_VIEW,
  ],
  [UserRole.API_USER]: [
    Permission.API_READ,
    Permission.API_WRITE,
  ],
  [UserRole.CUSTOMER]: [
    Permission.ORDERS_VIEW, // Only their own orders
  ],
  [UserRole.SHOP_MANAGER]: [
    Permission.ORDERS_VIEW,
    Permission.ORDERS_MANAGE,
    Permission.PRODUCTS_VIEW,
    Permission.PRODUCTS_MANAGE,
    Permission.CUSTOMERS_VIEW,
    Permission.ANALYTICS_VIEW,
  ],
};

// ============================================
// Auth Context Types
// ============================================

export interface AuthContext {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<AuthResult>;
  logout: () => Promise<void>;
  refresh: () => Promise<AuthResult>;
  hasPermission: (permission: Permission) => boolean;
  hasRole: (role: UserRole) => boolean;
}

export interface LoginCredentials {
  username?: string;
  email?: string;
  password: string;
  rememberMe?: boolean;
}

// ============================================
// JWT Types
// ============================================

export interface JWTPayload {
  sub: string; // Subject (userId)
  iat: number; // Issued at
  exp: number; // Expiration
  role: UserRole;
  permissions: Permission[];
  sessionId?: string;
}

export interface JWTConfig {
  secret: string;
  expiresIn: number;
  issuer?: string;
  audience?: string;
}

// ============================================
// API Key Types
// ============================================

export interface ApiKey {
  id: string;
  key: string;
  name: string;
  userId: string;
  permissions: Permission[];
  createdAt: Date;
  lastUsedAt?: Date;
  expiresAt?: Date;
  isActive: boolean;
}

// ============================================
// OAuth Types
// ============================================

export interface OAuthProvider {
  id: string;
  name: string;
  clientId: string;
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scope: string[];
}

export interface OAuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  tokenType: string;
  scope?: string[];
}

// ============================================
// Type Guards
// ============================================

export function isAuthUser(value: unknown): value is AuthUser {
  return (
    typeof value === 'object' &&
    value !== null &&
    'userId' in value &&
    'username' in value &&
    'email' in value &&
    'role' in value &&
    'permissions' in value
  );
}

export function isAuthResult(value: unknown): value is AuthResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    'isAuthenticated' in value &&
    typeof (value as { isAuthenticated: unknown }).isAuthenticated === 'boolean'
  );
}

export function hasPermission(user: AuthUser, permission: Permission): boolean {
  // Admin bypass
  if (user.permissions.includes(Permission.ADMIN_FULL)) {
    return true;
  }
  // Check specific permission
  return user.permissions.includes(permission);
}

export function hasRole(user: AuthUser, role: UserRole): boolean {
  return user.role === role;
}

// ============================================
// Validation Types
// ============================================

export interface AuthValidationOptions {
  requirePermissions?: Permission[];
  requireRole?: UserRole;
  allowAnonymous?: boolean;
  validateSession?: boolean;
  validateApiKey?: boolean;
}

export interface AuthValidationResult extends AuthResult {
  method?: 'jwt' | 'session' | 'apikey' | 'basic';
  validatedAt: number;
}