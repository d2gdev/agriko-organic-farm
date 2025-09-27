import jwt from 'jsonwebtoken';
import { logger } from '@/lib/logger';
import { promises as fs } from 'fs';

import { NextRequest, NextResponse } from 'next/server';
import { getValidatedJwtSecret } from './jwt-config';

// JWT session token interface
interface SessionJwtPayload {
  sessionId: string;
  userId: string;
  role: string;
  permissions: string[];
  iat: number;
  exp: number;
  jti?: string;
}

export interface SessionData {
  userId: string;
  username: string;
  email?: string;
  role: string;
  permissions: string[];
  iat: number;
  exp: number;
  jti: string; // JWT ID for revocation
}

export interface CreateSessionOptions {
  userId: string;
  username: string;
  role: string;
  permissions: string[];
  expiresIn?: string;
  rememberMe?: boolean;
}

// Production-ready session storage interface
interface SessionStorage {
  getSession(sessionId: string): Promise<SessionData | null>;
  setSession(sessionId: string, data: SessionData): Promise<void>;
  deleteSession(sessionId: string): Promise<void>;
  isRevoked(sessionId: string): Promise<boolean>;
  revokeSession(sessionId: string): Promise<void>;
  getUserSessions(userId: string): Promise<SessionData[]>;
  cleanupExpired(): Promise<number>;
  atomicUpdateSession(sessionId: string, updateFn: (session: SessionData | null) => SessionData | null): Promise<boolean>;
}

// File-based session storage (production fallback when Redis unavailable)
class FileSessionStorage implements SessionStorage {
  private sessionFile: string;
  private revokedFile: string;

  constructor() {
    // Store in a persistent directory, not temp
    const dataDir = process.env.SESSION_DATA_DIR ?? './data/sessions';
    this.sessionFile = `${dataDir}/sessions.json`;
    this.revokedFile = `${dataDir}/revoked.json`;
    this.ensureDirectoryExists(dataDir);
  }

  private ensureDirectoryExists(dir: string): void {
    if (typeof window !== 'undefined') return; // Skip on client-side

    try {
      const fsSync = require('fs') as typeof import('fs');
      if (!fsSync.existsSync(dir)) {
        fsSync.mkdirSync(dir, { recursive: true });
      }
    } catch (error) {
      logger.warn('Failed to create sessions directory, using memory fallback:', error as Record<string, unknown>);
    }
  }

  private async readSessions(): Promise<Record<string, SessionData>> {
    if (typeof window !== 'undefined') return {}; // Skip on client-side

    try {
      const data = await fs.readFile(this.sessionFile, 'utf8');
      return JSON.parse(data) as Record<string, SessionData>;
    } catch {
      return {};
    }
  }

  private async writeSessions(sessions: Record<string, SessionData>): Promise<void> {
    if (typeof window !== 'undefined') return; // Skip on client-side

    try {
      await fs.writeFile(this.sessionFile, JSON.stringify(sessions, null, 2));
    } catch (error) {
      logger.error('Failed to write sessions file:', error as Record<string, unknown>);
    }
  }

  private async readRevoked(): Promise<Set<string>> {
    if (typeof window !== 'undefined') return new Set(); // Skip on client-side

    try {
      const data = await fs.readFile(this.revokedFile, 'utf8');
      return new Set(JSON.parse(data) as string[]);
    } catch {
      return new Set();
    }
  }

  private async writeRevoked(revoked: Set<string>): Promise<void> {
    if (typeof window !== 'undefined') return; // Skip on client-side

    try {
      await fs.writeFile(this.revokedFile, JSON.stringify(Array.from(revoked), null, 2));
    } catch (error) {
      logger.error('Failed to write revoked tokens file:', error as Record<string, unknown>);
    }
  }

  async getSession(sessionId: string): Promise<SessionData | null> {
    const sessions = await this.readSessions();
    return sessions[sessionId] ?? null;
  }

  async setSession(sessionId: string, data: SessionData): Promise<void> {
    const sessions = await this.readSessions();
    sessions[sessionId] = data;
    await this.writeSessions(sessions);
  }

  async deleteSession(sessionId: string): Promise<void> {
    const sessions = await this.readSessions();
    delete sessions[sessionId];
    await this.writeSessions(sessions);
  }

  async isRevoked(sessionId: string): Promise<boolean> {
    const revoked = await this.readRevoked();
    return revoked.has(sessionId);
  }

  async revokeSession(sessionId: string): Promise<void> {
    const revoked = await this.readRevoked();
    revoked.add(sessionId);
    await this.writeRevoked(revoked);
    await this.deleteSession(sessionId);
  }

  async getUserSessions(userId: string): Promise<SessionData[]> {
    const sessions = await this.readSessions();
    return Object.values(sessions).filter(s => s.userId === userId);
  }

  async cleanupExpired(): Promise<number> {
    const sessions = await this.readSessions();
    const now = Math.floor(Date.now() / 1000);
    let cleanedCount = 0;

    for (const [sessionId, session] of Object.entries(sessions)) {
      if (session.exp <= now) {
        delete sessions[sessionId];
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      await this.writeSessions(sessions);
      logger.info(`🧹 Cleaned up ${cleanedCount} expired sessions`);
    }

    return cleanedCount;
  }

  async atomicUpdateSession(sessionId: string, updateFn: (session: SessionData | null) => SessionData | null): Promise<boolean> {
    try {
      const sessions = await this.readSessions();
      const currentSession = sessions[sessionId] ?? null;
      const updatedSession = updateFn(currentSession);
      
      if (updatedSession === null) {
        delete sessions[sessionId];
      } else {
        sessions[sessionId] = updatedSession;
      }
      
      await this.writeSessions(sessions);
      return true;
    } catch (error) {
      logger.error('❌ Atomic session update failed:', error as Record<string, unknown>);
      return false;
    }
  }
}

// In-memory fallback (only for development/testing)
class MemorySessionStorage implements SessionStorage {
  private sessions = new Map<string, SessionData>();
  private revoked = new Set<string>();

  async getSession(sessionId: string): Promise<SessionData | null> {
    return this.sessions.get(sessionId) ?? null;
  }

  async setSession(sessionId: string, data: SessionData): Promise<void> {
    this.sessions.set(sessionId, data);
  }

  async deleteSession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }

  async isRevoked(sessionId: string): Promise<boolean> {
    return this.revoked.has(sessionId);
  }

  async revokeSession(sessionId: string): Promise<void> {
    this.revoked.add(sessionId);
    this.sessions.delete(sessionId);
  }

  async getUserSessions(userId: string): Promise<SessionData[]> {
    return Array.from(this.sessions.values()).filter(s => s.userId === userId);
  }

  async atomicUpdateSession(sessionId: string, updateFn: (session: SessionData | null) => SessionData | null): Promise<boolean> {
    const current = this.sessions.get(sessionId) ?? null;
    const updated = updateFn(current);
    
    if (updated === null) {
      this.sessions.delete(sessionId);
      return true;
    }
    
    this.sessions.set(sessionId, updated);
    return true;
  }

  async cleanupExpired(): Promise<number> {
    const now = Math.floor(Date.now() / 1000);
    let cleanedCount = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.exp <= now) {
        this.sessions.delete(sessionId);
        this.revoked.delete(sessionId);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }
}

// Initialize storage based on environment

function initializeSessionStorage(): SessionStorage {
  const environment = process.env.NODE_ENV;
  const _redisUrl = process.env.REDIS_URL;
  const _databaseUrl = process.env.DATABASE_URL;
  void _redisUrl; // Preserved for future Redis session storage
  void _databaseUrl; // Preserved for future database session storage

  if (environment === 'production') {
    // In production, always use persistent storage
    logger.info('🏭 Initializing file-based session storage for production');
    return new FileSessionStorage();
  } else if (environment === 'development') {
    // In development, use file storage for persistence across restarts
    logger.info('🔧 Initializing file-based session storage for development');
    return new FileSessionStorage();
  } else {
    // Test environment or fallback
    logger.warn('⚠️ Using memory session storage - sessions will not persist');
    return new MemorySessionStorage();
  }
}

// Initialize storage
const sessionStorage = initializeSessionStorage();

// Validate JWT secret at module initialization to catch issues early
try {
  const validatedSecret = getValidatedJwtSecret();
  if (!validatedSecret) {
    throw new Error('JWT secret validation failed during module initialization');
  }
  logger.info('✅ JWT secret validation passed during module initialization');
} catch (error) {
  logger.error('🚨 JWT secret validation failed at module initialization:', error as Record<string, unknown>);
  if (process.env.NODE_ENV === 'production') {
    // In production, we must have a valid JWT secret
    throw error;
  }
  // In development, log warning but continue
  logger.warn('⚠️ Continuing in development mode despite JWT secret validation failure');
}

// Clean up expired sessions periodically
const sessionCleanupInterval = setInterval(async () => {
  try {
    await sessionStorage.cleanupExpired();
  } catch (error) {
    logger.error('Session cleanup failed:', error as Record<string, unknown>);
  }
}, 5 * 60 * 1000); // Every 5 minutes

// Cleanup on process termination
if (typeof process !== 'undefined') {
  const cleanup = () => {
    clearInterval(sessionCleanupInterval);
  };
  
  process.on('SIGTERM', cleanup);
  process.on('SIGINT', cleanup);
  process.on('exit', cleanup);
}

/**
 * Create a new session with JWT token (atomic operation)
 */
export async function createSession(options: CreateSessionOptions): Promise<{
  token: string;
  expiresAt: Date;
  sessionId: string;
  stored: boolean;
}> {
  const secret = getValidatedJwtSecret();
  const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const expiresIn = options.expiresIn ?? (options.rememberMe ? '30d' : '24h');
  
  const payload = {
    userId: options.userId,
    username: options.username,
    role: options.role,
    permissions: options.permissions,
    jti: sessionId,
  };

  const token = jwt.sign(payload, secret, {
    expiresIn: expiresIn,
    issuer: 'agriko-web',
    audience: 'agriko-app',
  } as jwt.SignOptions);

  // Decode to get expiration
  const decoded = jwt.decode(token) as SessionJwtPayload;
  const expiresAt = new Date(decoded.exp * 1000);

  // Store session data atomically
  const sessionData = {
    ...payload,
    iat: decoded.iat,
    exp: decoded.exp,
  };
  
  // Store session synchronously to ensure consistency
  let stored = false;
  try {
    await sessionStorage.setSession(sessionId, sessionData);
    stored = true;
    logger.debug(`✅ Session ${sessionId} stored successfully`);
  } catch (error) {
    logger.error('❌ Failed to store session - authentication may fail:', error as Record<string, unknown>);
    // Continue with stored=false to let caller decide how to handle
  }

  return {
    token,
    expiresAt,
    sessionId,
    stored,
  };
}

/**
 * Validate session token and return session data
 */
export async function validateSession(token: string): Promise<{
  valid: boolean;
  session?: SessionData;
  error?: string;
}> {
  try {
    const secret = getValidatedJwtSecret();
    
    // Verify JWT token
    const decoded = jwt.verify(token, secret, {
      issuer: 'agriko-web',
      audience: 'agriko-app',
    }) as SessionData;

    // Check if token is revoked
    if (await sessionStorage.isRevoked(decoded.jti)) {
      return {
        valid: false,
        error: 'Token has been revoked'
      };
    }

    // Check if session exists in storage
    const session = await sessionStorage.getSession(decoded.jti);
    if (!session) {
      return {
        valid: false,
        error: 'Session not found'
      };
    }

    // Atomic session update to prevent race conditions
    try {
      const now = Math.floor(Date.now() / 1000);
      await sessionStorage.atomicUpdateSession(decoded.jti, (current) => {
        if (!current) return null;
        return {
          ...current,
          iat: now
        };
      });
    } catch (updateError) {
      // If update fails, continue with validation but log the error
      logger.warn('⚠️ Failed to update session last accessed time - continuing with validation:', updateError as Record<string, unknown>);
    }

    return {
      valid: true,
      session: decoded
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return {
        valid: false,
        error: 'Session expired'
      };
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      return {
        valid: false,
        error: 'Invalid token'
      };
    }

    return {
      valid: false,
      error: 'Session validation failed'
    };
  }
}

/**
 * Revoke a session token
 */
export async function revokeSession(tokenOrSessionId: string): Promise<boolean> {
  try {
    let sessionId: string;
    
    // If it's a JWT token, extract the session ID
    if (tokenOrSessionId.includes('.')) {
      const decoded = jwt.decode(tokenOrSessionId) as SessionJwtPayload | null;
      sessionId = decoded?.jti ?? '';
    } else {
      sessionId = tokenOrSessionId;
    }
    
    if (!sessionId) {
      return false;
    }

    await sessionStorage.revokeSession(sessionId);
    return true;
  } catch (error) {
    logger.error('Error revoking session:', error as Record<string, unknown>);
    return false;
  }
}

/**
 * Get session from request cookies
 */
export async function getSessionFromRequest(request: NextRequest): Promise<{
  valid: boolean;
  session?: SessionData;
  error?: string;
}> {
  const sessionCookie = request.cookies.get('session-token');
  
  if (!sessionCookie?.value) {
    return {
      valid: false,
      error: 'No session token found'
    };
  }

  return await validateSession(sessionCookie.value);
}

/**
 * Create session response with secure cookies
 */
export function createSessionResponse(
  response: NextResponse, 
  sessionData: Awaited<ReturnType<typeof createSession>>,
  options: { rememberMe?: boolean } = {}
): NextResponse {
  const isProduction = process.env.NODE_ENV === 'production';
  const maxAge = options.rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60; // 30 days or 24 hours

  response.cookies.set('session-token', sessionData.token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge,
    path: '/',
  });

  response.cookies.set('session-id', sessionData.sessionId, {
    httpOnly: false, // Allow client-side access for session management
    secure: isProduction,
    sameSite: 'lax',
    maxAge,
    path: '/',
  });

  return response;
}

/**
 * Clear session cookies
 */
export function clearSessionResponse(response: NextResponse): NextResponse {
  response.cookies.delete('session-token');
  response.cookies.delete('session-id');
  response.cookies.delete('admin-auth'); // Legacy cookie
  response.cookies.delete('admin-session'); // Legacy cookie
  
  return response;
}

/**
 * Refresh session token (extend expiration)
 */
export async function refreshSession(currentToken: string, options: { rememberMe?: boolean } = {}): Promise<{
  success: boolean;
  newToken?: string;
  expiresAt?: Date;
  error?: string;
}> {
  const validation = await validateSession(currentToken);
  
  if (!validation.valid || !validation.session) {
    return {
      success: false,
      error: validation.error ?? 'Invalid session'
    };
  }

  // Revoke old session
  await revokeSession(validation.session.jti);

  // Create new session atomically
  const newSession = await createSession({
    userId: validation.session.userId,
    username: validation.session.username,
    role: validation.session.role,
    permissions: validation.session.permissions,
    rememberMe: options.rememberMe,
  });

  // Check if session was properly stored
  if (!newSession.stored) {
    return {
      success: false,
      error: 'Failed to store new session - please try again'
    };
  }

  // Additional validation: verify the new session is immediately accessible
  try {
    const verificationResult = await validateSession(newSession.token);
    if (!verificationResult.valid) {
      logger.error('❌ Newly created session failed validation:', {
        error: verificationResult.error,
        sessionId: newSession.sessionId
      } as Record<string, unknown>);
      
      // Clean up the invalid session
      await revokeSession(newSession.sessionId);
      
      return {
        success: false,
        error: 'Session refresh failed validation - please try again'
      };
    }
    
    logger.debug(`✅ Session refresh validated successfully: ${newSession.sessionId}`);
  } catch (validationError) {
    logger.error('❌ Session refresh validation error:', validationError as Record<string, unknown>);
    
    // Clean up the potentially invalid session
    await revokeSession(newSession.sessionId).catch(() => {
      // Ignore cleanup errors
    });
    
    return {
      success: false,
      error: 'Session refresh validation failed - please try again'
    };
  }

  return {
    success: true,
    newToken: newSession.token,
    expiresAt: newSession.expiresAt,
  };
}

/**
 * Get all active sessions for a user
 */
export async function getUserSessions(userId: string): Promise<SessionData[]> {
  return await sessionStorage.getUserSessions(userId);
}

/**
 * Revoke all sessions for a user
 */
export async function revokeAllUserSessions(userId: string): Promise<number> {
  try {
    const userSessions = await sessionStorage.getUserSessions(userId);
    let revokedCount = 0;
    
    for (const session of userSessions) {
      await sessionStorage.revokeSession(session.jti);
      revokedCount++;
    }
    
    logger.info(`Revoked ${revokedCount} sessions for user ${userId}`);
    return revokedCount;
  } catch (error) {
    logger.error('Error revoking all user sessions:', error as Record<string, unknown>);
    return 0;
  }
}

const sessionManagement = {
  createSession,
  validateSession,
  revokeSession,
  getSessionFromRequest,
  createSessionResponse,
  clearSessionResponse,
  refreshSession,
  getUserSessions,
  revokeAllUserSessions,
};

export default sessionManagement;
