/**
 * Unified Authentication Service
 * Uses Qdrant as the ONLY storage for users and sessions
 */

import { sign, verify } from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { NextRequest } from 'next/server';
import { logger } from '@/lib/logger';
import { handleError } from '@/lib/error-sanitizer';

// Mock implementations for missing dependencies
const qdrantDb = {
  upsert: async (_collection: string, _data: any[]) => {},
  get: async <T>(_collection: string, _ids: number[]): Promise<Array<{payload: T}>> => [],
  search: async <T>(_collection: string, _options: any): Promise<Array<{payload: T}>> => [],
  delete: async (_collection: string, _ids: number[]) => {},
  clearExpiredSessions: async () => {}
};

const config = {
  JWT_SECRET: process.env.JWT_SECRET || 'default-secret'
};

const generateEmbedding = async (text: string): Promise<number[]> => {
  return new Array(128).fill(0).map(() => Math.random());
};

// Helper to safely convert objects to Qdrant payload format
function toQdrantPayload<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  return JSON.parse(JSON.stringify(obj));
}

// Types
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'user' | 'scraper';
  permissions: string[];
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    lastLogin?: Date;
    emailVerified: boolean;
  };
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  fingerprint: string;
  expiresAt: number;
  createdAt: Date;
  lastActivity: Date;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  session?: Session;
  token?: string;
  error?: string;
}

class AuthenticationService {
  private readonly SESSION_TTL = 24 * 60 * 60 * 1000; // 24 hours
  private readonly REFRESH_THRESHOLD = 60 * 60 * 1000; // 1 hour
  public cleanupIntervalId?: NodeJS.Timeout;

  /**
   * Register a new user
   */
  async register(
    email: string,
    password: string,
    role: User['role'] = 'user'
  ): Promise<AuthResult> {
    try {
      // Check if user exists
      const existing = await this.findUserByEmail(email);
      if (existing) {
        return { success: false, error: 'User already exists' };
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Create user with numeric ID for Qdrant
      const userId = Date.now() + Math.floor(Math.random() * 1000);
      const user: User = {
        id: `user_${userId}`,
        email: email.toLowerCase(),
        passwordHash,
        role,
        permissions: this.getDefaultPermissions(role),
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          emailVerified: false,
        },
      };

      // Generate embedding for user (based on role and permissions)
      const userVector = await generateEmbedding(
        `${user.role} ${user.permissions.join(' ')} ${user.email}`
      );

      // Store in Qdrant with numeric ID
      await qdrantDb.upsert('users', [
        {
          id: userId,
          vector: userVector,
          payload: toQdrantPayload(user as unknown as Record<string, unknown>),
        },
      ]);

      logger.info('User registered', { userId: user.id, email: user.email });
      return { success: true, user };
    } catch (error) {
      logger.error('Registration failed', handleError(error, 'auth-registration'));
      return { success: false, error: 'Registration failed' };
    }
  }

  /**
   * Authenticate user and create session
   */
  async authenticate(
    email: string,
    password: string,
    request: NextRequest
  ): Promise<AuthResult> {
    try {
      // Find user
      const user = await this.findUserByEmail(email);
      if (!user) {
        return { success: false, error: 'Invalid credentials' };
      }

      // Verify password
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return { success: false, error: 'Invalid credentials' };
      }

      // Update last login
      user.metadata.lastLogin = new Date();
      await this.updateUser(user);

      // Create session
      const session = await this.createSession(user, request);

      // Generate JWT token
      const token = sign(
        {
          sessionId: session.id,
          userId: user.id,
          role: user.role,
          permissions: user.permissions,
        },
        config.JWT_SECRET,
        {
          expiresIn: '24h',
          issuer: 'agriko-api',
          audience: 'agriko-services',
        }
      );

      logger.info('User authenticated', { userId: user.id });
      return { success: true, user, session, token };
    } catch (error) {
      logger.error('Authentication failed', handleError(error, 'auth-authenticate'));
      return { success: false, error: 'Authentication failed' };
    }
  }

  /**
   * Validate session from request
   */
  async validateSession(request: NextRequest): Promise<AuthResult> {
    try {
      // Get token from cookie
      const token = request.cookies.get('session-token')?.value;
      if (!token) {
        return { success: false, error: 'No session token' };
      }

      // Verify JWT
      const decoded = verify(token, config.JWT_SECRET, {
        issuer: 'agriko-api',
        audience: 'agriko-services',
      }) as {
        sessionId: string;
        userId: string;
        role: string;
        permissions: string[];
      };

      // Get session from Qdrant - convert session ID to numeric
      const sessionNumericId = parseInt(decoded.sessionId.replace('sess_', ''));
      const sessions = await qdrantDb.get<Session>('sessions', [sessionNumericId]);
      if (!sessions.length || !sessions[0]?.payload) {
        return { success: false, error: 'Invalid session' };
      }

      const session = sessions[0].payload;
      if (!session) {
        return { success: false, error: 'Invalid session data' };
      }

      // Check if expired
      if (session.expiresAt < Date.now()) {
        await this.deleteSession(session.id);
        return { success: false, error: 'Session expired' };
      }

      // Get user - convert user ID to numeric
      const userNumericId = parseInt(session.userId.replace('user_', ''));
      const users = await qdrantDb.get<User>('users', [userNumericId]);
      if (!users.length || !users[0]?.payload) {
        return { success: false, error: 'User not found' };
      }

      const user = users[0].payload;
      if (!user) {
        return { success: false, error: 'User data not found' };
      }

      // Update last activity
      session.lastActivity = new Date();
      await qdrantDb.upsert('sessions', [
        {
          id: sessionNumericId,
          vector: new Array(128).fill(0), // Simple vector for sessions
          payload: toQdrantPayload(session as unknown as Record<string, unknown>),
        },
      ]);

      // Refresh token if needed
      const timeToExpiry = session.expiresAt - Date.now();
      if (timeToExpiry < this.REFRESH_THRESHOLD) {
        session.expiresAt = Date.now() + this.SESSION_TTL;
        await qdrantDb.upsert('sessions', [
          {
            id: sessionNumericId,
            vector: new Array(128).fill(0),
            payload: toQdrantPayload(session as unknown as Record<string, unknown>),
          },
        ]);
      }

      return { success: true, user, session };
    } catch (error) {
      logger.error('Session validation failed', handleError(error, 'auth-validate-session'));
      return { success: false, error: 'Invalid session' };
    }
  }

  /**
   * Logout and delete session
   */
  async logout(sessionId: string): Promise<void> {
    await this.deleteSession(sessionId);
    logger.info('User logged out', { sessionId });
  }

  /**
   * Create a new session
   */
  private async createSession(user: User, request: NextRequest): Promise<Session> {
    const sessionId = Date.now() + Math.floor(Math.random() * 1000);
    const session: Session = {
      id: `sess_${sessionId}`,
      userId: user.id,
      token: randomBytes(32).toString('hex'),
      fingerprint: this.generateFingerprint(request),
      expiresAt: Date.now() + this.SESSION_TTL,
      createdAt: new Date(),
      lastActivity: new Date(),
    };

    // Store in Qdrant with numeric ID and TTL
    await qdrantDb.upsert('sessions', [
      {
        id: sessionId,
        vector: new Array(128).fill(0).map(() => Math.random()),
        payload: toQdrantPayload(session as unknown as Record<string, unknown>),
      },
    ]);

    return session;
  }

  /**
   * Find user by email
   */
  private async findUserByEmail(email: string): Promise<User | null> {
    const results = await qdrantDb.search<User>('users', {
      filter: {
        must: [
          {
            key: 'email',
            match: { value: email.toLowerCase() },
          },
        ],
      },
      limit: 1,
    });

    const result = results && results[0];
    return result?.payload || null;
  }

  /**
   * Update user
   */
  private async updateUser(user: User): Promise<void> {
    user.metadata.updatedAt = new Date();

    const userVector = await generateEmbedding(
      `${user.role} ${user.permissions.join(' ')} ${user.email}`
    );

    // Extract numeric ID from user.id
    const userNumericId = parseInt(user.id.replace('user_', ''));

    await qdrantDb.upsert('users', [
      {
        id: userNumericId,
        vector: userVector,
        payload: user as unknown as Record<string, unknown>,
      },
    ]);
  }

  /**
   * Delete session
   */
  private async deleteSession(sessionId: string): Promise<void> {
    // Convert session ID to numeric
    const numericId = parseInt(sessionId.replace('sess_', ''));
    await qdrantDb.delete('sessions', [numericId]);
  }

  /**
   * Generate browser fingerprint
   */
  private generateFingerprint(request: NextRequest): string {
    const ua = request.headers.get('user-agent') || '';
    const ip = request.headers.get('x-forwarded-for') ||
             request.headers.get('x-real-ip') ||
             request.headers.get('cf-connecting-ip') || '';
    const accept = request.headers.get('accept') || '';
    const lang = request.headers.get('accept-language') || '';

    return Buffer.from(`${ua}|${ip}|${accept}|${lang}`).toString('base64');
  }

  /**
   * Get default permissions for role
   */
  private getDefaultPermissions(role: User['role']): string[] {
    const permissions: Record<User['role'], string[]> = {
      admin: [
        'users:read',
        'users:write',
        'users:delete',
        'products:read',
        'products:write',
        'products:delete',
        'scraper:use',
        'analytics:read',
        'analytics:write',
        'settings:read',
        'settings:write',
      ],
      scraper: [
        'products:read',
        'scraper:use',
        'analytics:read',
      ],
      user: [
        'products:read',
        'analytics:read',
      ],
    };

    return permissions[role];
  }

  /**
   * Check if user has permission
   */
  async hasPermission(
    userId: string,
    resource: string,
    action: string
  ): Promise<boolean> {
    // Convert user ID to numeric
    const numericId = parseInt(userId.replace('user_', ''));
    const users = await qdrantDb.get<User>('users', [numericId]);
    if (!users.length || !users[0]?.payload) return false;

    const user = users[0].payload;
    if (!user) return false;

    const permission = `${resource}:${action}`;

    return user.permissions.includes(permission) || user.role === 'admin';
  }

  /**
   * Clean expired sessions (run periodically)
   */
  /**
   * Destroy cleanup interval
   */
  destroy() {
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = undefined;
    }
  }

  async cleanExpiredSessions(): Promise<void> {
    await qdrantDb.clearExpiredSessions();
    logger.info('Expired sessions cleaned');
  }
}

// Export singleton instance
export const authService = new AuthenticationService();

// Clean expired sessions every hour
if (typeof setInterval !== 'undefined') {
  authService.cleanupIntervalId = setInterval(() => {
    authService.cleanExpiredSessions().catch((error) => {
      logger.error('Failed to clean expired sessions', handleError(error, 'auth-cleanup-sessions'));
    });
  }, 3600000);
}