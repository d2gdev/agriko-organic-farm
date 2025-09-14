import { verifyAdminCredentials, isAdminAuthConfigured, ADMIN_CONFIG } from '../admin-auth';
import bcrypt from 'bcryptjs';

describe('Admin Authentication', () => {
  // Mock bcrypt for testing
  beforeAll(async () => {
    // Create a real hash for testing
    const testHash = await bcrypt.hash('testpassword123', 10);
    process.env.ADMIN_PASSWORD_HASH = testHash;
    process.env.ADMIN_USERNAME = 'testadmin';
  });

  describe('verifyAdminCredentials', () => {
    it('should return true for valid credentials', async () => {
      const result = await verifyAdminCredentials('testadmin', 'testpassword123');
      expect(result).toBe(true);
    });

    it('should return false for invalid username', async () => {
      const result = await verifyAdminCredentials('wronguser', 'testpassword123');
      expect(result).toBe(false);
    });

    it('should return false for invalid password', async () => {
      const result = await verifyAdminCredentials('testadmin', 'wrongpassword');
      expect(result).toBe(false);
    });

    it('should return false for both invalid credentials', async () => {
      const result = await verifyAdminCredentials('wronguser', 'wrongpassword');
      expect(result).toBe(false);
    });

    it('should be resistant to timing attacks', async () => {
      const validUserStart = Date.now();
      await verifyAdminCredentials('testadmin', 'wrongpassword');
      const validUserTime = Date.now() - validUserStart;

      const invalidUserStart = Date.now();
      await verifyAdminCredentials('wronguser', 'wrongpassword');
      const invalidUserTime = Date.now() - invalidUserStart;

      // Times should be similar (within 50ms)
      expect(Math.abs(validUserTime - invalidUserTime)).toBeLessThan(50);
    });
  });

  describe('isAdminAuthConfigured', () => {
    it('should return true when both username and hash are configured', () => {
      // Since ADMIN_CONFIG uses values at module load time,
      // we expect it to be configured from the test setup
      const result = isAdminAuthConfigured();
      expect(result).toBe(true);
    });

    // Note: The following tests would require module reloading to work properly
    // due to how the ADMIN_CONFIG is initialized at module load time
    // In a real application, these would be integration tests
  });
});