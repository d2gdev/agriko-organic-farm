import * as jwt from 'jsonwebtoken';
import { JwtPayload } from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import { query, redis } from '../database';
import { User, UserSession } from '../dao/types';
import { logger } from '../logger';

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const _SESSION_EXPIRES_IN = process.env.SESSION_EXPIRES_IN || '24h';

export interface TokenPayload extends JwtPayload {
  userId: string;
  email: string;
  role: string;
  sessionId: string;
}

export interface AuthResult {
  user: Omit<User, 'password_hash'>;
  token: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface RefreshResult {
  token: string;
  expiresAt: Date;
}

// Authentication service
export class AuthService {
  // Hash password
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  // Verify password
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // Generate JWT token
  static generateToken(payload: Omit<TokenPayload, 'iat' | 'exp' | 'jti'>): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
      issuer: 'agriko-bi',
      audience: 'agriko-bi-app'
    });
  }

  // Generate refresh token
  static generateRefreshToken(): string {
    return jwt.sign(
      { type: 'refresh', jti: generateUniqueId() },
      JWT_SECRET,
      { expiresIn: '30d' }
    );
  }

  // Verify and decode token
  static async verifyToken(token: string): Promise<TokenPayload> {
    try {
      // Check if token is blacklisted
      const isBlacklisted = await redis.get(`blacklist:${token}`);
      if (isBlacklisted) {
        throw new Error('Token has been revoked');
      }

      const decoded = jwt.verify(token, JWT_SECRET, {
        issuer: 'agriko-bi',
        audience: 'agriko-bi-app'
      }) as TokenPayload;

      // Verify session still exists
      const sessionExists = await this.verifySession(decoded.sessionId);
      if (!sessionExists) {
        throw new Error('Session has expired');
      }

      return decoded;
    } catch {
      throw new Error('Invalid or expired token');
    }
  }

  // Authenticate user with email and password
  static async authenticate(email: string, password: string, ipAddress?: string, userAgent?: string): Promise<AuthResult> {
    // Find user by email
    const userResult = await query<User>(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      throw new Error('Invalid email or password');
    }

    const user = userResult.rows[0];
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await this.verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Create session
    const sessionId = generateUniqueId();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await query(
      `INSERT INTO user_sessions (id, user_id, session_token, ip_address, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [sessionId, user.id, sessionId, ipAddress, userAgent, expiresAt]
    );

    // Generate tokens
    const tokenPayload: Omit<TokenPayload, 'iat' | 'exp' | 'jti'> = {
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId
    };

    const token = this.generateToken(tokenPayload);
    const refreshToken = this.generateRefreshToken();

    // Store refresh token
    await redis.setex(`refresh:${user.id}:${sessionId}`, 30 * 24 * 60 * 60, refreshToken);

    // Update last login
    await query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Remove password hash from response
    const { password_hash: _password_hash, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
      refreshToken,
      expiresAt
    };
  }

  // Refresh access token
  static async refreshToken(refreshToken: string, sessionId: string): Promise<RefreshResult> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, JWT_SECRET) as {
        type: string;
        jti: string;
        iat?: number;
        exp?: number;
      };
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid refresh token');
      }

      // Check if refresh token exists in Redis
      const storedRefreshToken = await redis.get(`refresh:*:${sessionId}`);
      if (!storedRefreshToken || storedRefreshToken !== refreshToken) {
        throw new Error('Invalid or expired refresh token');
      }

      // Get session details
      const sessionResult = await query<UserSession & { user_email: string; user_role: string }>(
        `SELECT s.*, u.email as user_email, u.role as user_role
         FROM user_sessions s
         JOIN users u ON s.user_id = u.id
         WHERE s.id = $1 AND s.expires_at > CURRENT_TIMESTAMP`,
        [sessionId]
      );

      if (sessionResult.rows.length === 0) {
        throw new Error('Session not found or expired');
      }

      const session = sessionResult.rows[0];
      if (!session) {
        throw new Error('Session not found or expired');
      }

      // Generate new access token
      const tokenPayload: Omit<TokenPayload, 'iat' | 'exp' | 'jti'> = {
        userId: session.user_id,
        email: session.user_email,
        role: session.user_role,
        sessionId: session.id
      };

      const newToken = this.generateToken(tokenPayload);
      const expiresAt = new Date(Date.now() + parseExpiry(String(JWT_EXPIRES_IN)));

      // Update session activity
      await query(
        'UPDATE user_sessions SET last_activity = CURRENT_TIMESTAMP WHERE id = $1',
        [sessionId]
      );

      return {
        token: newToken,
        expiresAt
      };
    } catch {
      throw new Error('Failed to refresh token');
    }
  }

  // Logout user
  static async logout(token: string, sessionId?: string): Promise<void> {
    try {
      // Add token to blacklist
      const decoded = jwt.decode(token) as TokenPayload;
      if (decoded && decoded.exp) {
        const ttl = decoded.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
          await redis.setex(`blacklist:${token}`, ttl, 'true');
        }
      }

      // Remove session
      if (sessionId) {
        await query('DELETE FROM user_sessions WHERE id = $1', [sessionId]);

        // Remove refresh token
        const pattern = `refresh:*:${sessionId}`;
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(keys);
        }
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Don't throw error for logout operations
    }
  }

  // Logout all sessions for a user
  static async logoutAllSessions(userId: string): Promise<void> {
    try {
      // Get all sessions for user
      const sessionsResult = await query<UserSession>(
        'SELECT id FROM user_sessions WHERE user_id = $1',
        [userId]
      );

      const sessionIds = sessionsResult.rows.map(s => s.id);

      // Delete all sessions
      await query('DELETE FROM user_sessions WHERE user_id = $1', [userId]);

      // Remove all refresh tokens for this user
      for (const sessionId of sessionIds) {
        const pattern = `refresh:${userId}:${sessionId}`;
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(keys);
        }
      }
    } catch (error) {
      console.error('Logout all sessions error:', error);
    }
  }

  // Verify session exists and is valid
  static async verifySession(sessionId: string): Promise<boolean> {
    try {
      const result = await query(
        'SELECT id FROM user_sessions WHERE id = $1 AND expires_at > CURRENT_TIMESTAMP',
        [sessionId]
      );
      return result.rows.length > 0;
    } catch {
      return false;
    }
  }

  // Get user sessions
  static async getUserSessions(userId: string): Promise<UserSession[]> {
    const result = await query<UserSession>(
      `SELECT * FROM user_sessions
       WHERE user_id = $1 AND expires_at > CURRENT_TIMESTAMP
       ORDER BY last_activity DESC`,
      [userId]
    );

    return result.rows;
  }

  // Revoke specific session
  static async revokeSession(sessionId: string): Promise<boolean> {
    try {
      const result = await query('DELETE FROM user_sessions WHERE id = $1', [sessionId]);

      if (result.rowCount > 0) {
        // Remove refresh token
        const pattern = `refresh:*:${sessionId}`;
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(keys);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Revoke session error:', error);
      return false;
    }
  }

  // Clean up expired sessions
  static async cleanupExpiredSessions(): Promise<void> {
    try {
      // Get expired session IDs
      const expiredSessions = await query<{ id: string; user_id: string }>(
        'SELECT id, user_id FROM user_sessions WHERE expires_at <= CURRENT_TIMESTAMP'
      );

      // Delete expired sessions
      await query('DELETE FROM user_sessions WHERE expires_at <= CURRENT_TIMESTAMP');

      // Remove corresponding refresh tokens
      for (const session of expiredSessions.rows) {
        const pattern = `refresh:${session.user_id}:${session.id}`;
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(keys);
        }
      }

      logger.info(`Cleaned up ${expiredSessions.rows.length} expired sessions`);
    } catch (error) {
      console.error('Session cleanup error:', error);
    }
  }

  // Change user password
  static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    // Get current user
    const userResult = await query<User>(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = userResult.rows[0];
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await this.verifyPassword(currentPassword, user.password_hash);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await this.hashPassword(newPassword);

    // Update password
    await query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, userId]
    );

    // Logout all other sessions
    await this.logoutAllSessions(userId);
  }
}

// Utility functions
function generateUniqueId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function parseExpiry(expiry: string): number {
  const units: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000
  };

  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) {
    return 60 * 60 * 1000; // Default to 1 hour
  }

  const [, num, unit] = match;
  if (!num || !unit || !units[unit]) {
    return 60 * 60 * 1000; // Default to 1 hour
  }
  return parseInt(num, 10) * units[unit];
}

// Schedule cleanup job (run every hour)
if (process.env.NODE_ENV !== 'test') {
  setInterval(() => {
    AuthService.cleanupExpiredSessions().catch(console.error);
  }, 60 * 60 * 1000);
}