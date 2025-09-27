import { AuthService } from '../jwt';
import { query, redis } from '../../database';
import * as bcrypt from 'bcryptjs';

// Mock dependencies
jest.mock('../../database');
jest.mock('bcryptjs');

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRedis = {
  get: jest.fn(),
  setex: jest.fn(),
  del: jest.fn(),
  keys: jest.fn(),
  quit: jest.fn()
} as any;

// Mock the redis instance using jest.mocked()
const mockedRedis = jest.mocked(redis);
Object.assign(mockedRedis, mockRedis);

const mockBcrypt = jest.mocked(bcrypt);

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret-key';
  });

  describe('hashPassword', () => {
    it('should hash password with bcrypt', async () => {
      const password = 'testpassword123';
      const hashedPassword = 'hashed_password';

      (mockBcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const result = await AuthService.hashPassword(password);

      expect(mockBcrypt.hash).toHaveBeenCalledWith(password, 12);
      expect(result).toBe(hashedPassword);
    });
  });

  describe('verifyPassword', () => {
    it('should verify password correctly', async () => {
      const password = 'testpassword123';
      const hash = 'hashed_password';

      (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await AuthService.verifyPassword(password, hash);

      expect(mockBcrypt.compare).toHaveBeenCalledWith(password, hash);
      expect(result).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const password = 'wrongpassword';
      const hash = 'hashed_password';

      (mockBcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await AuthService.verifyPassword(password, hash);

      expect(result).toBe(false);
    });
  });

  describe('authenticate', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      password_hash: 'hashed_password',
      role: 'user',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    };

    it('should authenticate user successfully', async () => {
      const email = 'test@example.com';
      const password = 'testpassword123';

      // Mock database queries
      mockQuery
        .mockResolvedValueOnce({ rows: [mockUser], rowCount: 1 }) // Find user
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // Insert session
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }); // Update last login

      // Mock password verification
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Mock Redis operations
      mockRedis.setex.mockResolvedValue('OK');

      const result = await AuthService.authenticate(email, password);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('expiresAt');
      expect(result.user).not.toHaveProperty('password_hash');
      expect(result.user.email).toBe(email);
    });

    it('should throw error for non-existent user', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      await expect(
        AuthService.authenticate('nonexistent@example.com', 'password')
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw error for inactive user', async () => {
      const inactiveUser = { ...mockUser, is_active: false };
      mockQuery.mockResolvedValueOnce({ rows: [inactiveUser], rowCount: 1 });

      await expect(
        AuthService.authenticate('test@example.com', 'password')
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw error for incorrect password', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockUser], rowCount: 1 });
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        AuthService.authenticate('test@example.com', 'wrongpassword')
      ).rejects.toThrow('Invalid email or password');
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', async () => {
      const token = AuthService.generateToken({
        userId: 'user-123',
        email: 'test@example.com',
        role: 'user',
        sessionId: 'session-123'
      });

      // Mock Redis - token not blacklisted
      mockRedis.get.mockResolvedValue(null);

      // Mock session verification
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'session-123' }], rowCount: 1 });

      const result = await AuthService.verifyToken(token);

      expect(result).toHaveProperty('userId', 'user-123');
      expect(result).toHaveProperty('email', 'test@example.com');
      expect(result).toHaveProperty('role', 'user');
      expect(result).toHaveProperty('sessionId', 'session-123');
    });

    it('should reject blacklisted token', async () => {
      const token = 'some.jwt.token';

      // Mock Redis - token is blacklisted
      mockRedis.get.mockResolvedValue('true');

      await expect(AuthService.verifyToken(token)).rejects.toThrow('Invalid or expired token');
    });

    it('should reject token with expired session', async () => {
      const token = AuthService.generateToken({
        userId: 'user-123',
        email: 'test@example.com',
        role: 'user',
        sessionId: 'session-123'
      });

      // Mock Redis - token not blacklisted
      mockRedis.get.mockResolvedValue(null);

      // Mock session verification - session not found
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      await expect(AuthService.verifyToken(token)).rejects.toThrow('Invalid or expired token');
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      const token = AuthService.generateToken({
        userId: 'user-123',
        email: 'test@example.com',
        role: 'user',
        sessionId: 'session-123'
      });
      const sessionId = 'session-123';

      // Mock Redis operations
      mockRedis.setex.mockResolvedValue('OK');
      mockRedis.keys.mockResolvedValue(['refresh:user-123:session-123']);
      mockRedis.del.mockResolvedValue(1);

      // Mock database operations
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });

      await expect(AuthService.logout(token, sessionId)).resolves.not.toThrow();

      expect(mockQuery).toHaveBeenCalledWith(
        'DELETE FROM user_sessions WHERE id = $1',
        [sessionId]
      );
    });
  });

  describe('changePassword', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      password_hash: 'old_hashed_password',
      role: 'user',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    };

    it('should change password successfully', async () => {
      const userId = 'user-123';
      const currentPassword = 'oldpassword';
      const newPassword = 'newpassword123';
      const newHashedPassword = 'new_hashed_password';

      // Mock user lookup
      mockQuery.mockResolvedValueOnce({ rows: [mockUser], rowCount: 1 });

      // Mock password verification
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Mock password hashing
      (mockBcrypt.hash as jest.Mock).mockResolvedValue(newHashedPassword);

      // Mock password update
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });

      // Mock logout all sessions
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });

      await expect(
        AuthService.changePassword(userId, currentPassword, newPassword)
      ).resolves.not.toThrow();

      expect(mockQuery).toHaveBeenCalledWith(
        'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [newHashedPassword, userId]
      );
    });

    it('should throw error for incorrect current password', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockUser], rowCount: 1 });
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        AuthService.changePassword('user-123', 'wrongpassword', 'newpassword')
      ).rejects.toThrow('Current password is incorrect');
    });

    it('should throw error for non-existent user', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      await expect(
        AuthService.changePassword('nonexistent', 'password', 'newpassword')
      ).rejects.toThrow('User not found');
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('should cleanup expired sessions successfully', async () => {
      const expiredSessions = [
        { id: 'session-1', user_id: 'user-1' },
        { id: 'session-2', user_id: 'user-2' }
      ];

      // Mock finding expired sessions
      mockQuery
        .mockResolvedValueOnce({ rows: expiredSessions, rowCount: 2 })
        .mockResolvedValueOnce({ rows: [], rowCount: 2 });

      // Mock Redis operations
      mockRedis.keys
        .mockResolvedValueOnce(['refresh:user-1:session-1'])
        .mockResolvedValueOnce(['refresh:user-2:session-2']);
      mockRedis.del.mockResolvedValue(1);

      // Spy on console.log to verify cleanup message
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await AuthService.cleanupExpiredSessions();

      expect(consoleSpy).toHaveBeenCalledWith('Cleaned up 2 expired sessions');

      consoleSpy.mockRestore();
    });
  });
});