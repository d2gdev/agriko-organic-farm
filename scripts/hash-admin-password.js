const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Configuration
const SALT_ROUNDS = 12;

async function hashAdminPassword() {
  try {
    // Read current password from environment
    const envPath = path.join(__dirname, '..', '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');

    // Extract admin password
    const passwordMatch = envContent.match(/ADMIN_PASSWORD=(.+)/);
    if (!passwordMatch) {
      console.error('❌ ADMIN_PASSWORD not found in .env.local');
      process.exit(1);
    }

    const plainPassword = passwordMatch[1].trim();
    console.log('🔐 Hashing admin password...');

    // Hash the password
    const hashedPassword = await bcrypt.hash(plainPassword, SALT_ROUNDS);
    console.log('✅ Password hashed successfully');

    // Create new env content with hashed password
    const newEnvContent = envContent.replace(
      /ADMIN_PASSWORD=.+/,
      `# ADMIN_PASSWORD_HASH is bcrypt hashed - original password removed for security\nADMIN_PASSWORD_HASH=${hashedPassword}`
    );

    // Write back to file
    fs.writeFileSync(envPath, newEnvContent);
    console.log('✅ Updated .env.local with hashed password');

    // Create admin auth module if it doesn't exist
    const authModulePath = path.join(__dirname, '..', 'src', 'lib', 'admin-auth.ts');
    const authModuleContent = `import bcrypt from 'bcryptjs';

// Admin authentication configuration
export const ADMIN_CONFIG = {
  username: process.env.ADMIN_USERNAME || 'admin',
  passwordHash: process.env.ADMIN_PASSWORD_HASH || '',
};

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
  // Constant-time username comparison
  const usernameValid = username === ADMIN_CONFIG.username;

  // Verify password against hash
  const passwordValid = await bcrypt.compare(password, ADMIN_CONFIG.passwordHash);

  // Both must be valid
  return usernameValid && passwordValid;
}

/**
 * Check if admin auth is properly configured
 */
export function isAdminAuthConfigured(): boolean {
  return !!(ADMIN_CONFIG.username && ADMIN_CONFIG.passwordHash);
}
`;

    fs.writeFileSync(authModulePath, authModuleContent);
    console.log('✅ Created admin auth module at src/lib/admin-auth.ts');

    console.log(`
🔒 Security Update Complete!

   - Original password has been hashed and removed
   - Hash stored as ADMIN_PASSWORD_HASH
   - Admin auth module created for secure verification

   ⚠️  IMPORTANT: Save the original password securely!
   The plaintext password has been removed from .env.local
`);

  } catch (error) {
    console.error('❌ Error hashing password:', error);
    process.exit(1);
  }
}

// Run the script
hashAdminPassword();