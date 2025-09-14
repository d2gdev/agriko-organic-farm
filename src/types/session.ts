/**
 * Session data interface for authentication sessions
 */
export interface SessionData {
  userId: string;
  username: string;
  role: string;
  permissions: string[];
  iat: number; // Issued at timestamp
  exp: number; // Expiration timestamp
  jti: string; // JWT ID for revocation
  createdAt?: number; // Session creation timestamp
  lastActivity?: number; // Last activity timestamp
}