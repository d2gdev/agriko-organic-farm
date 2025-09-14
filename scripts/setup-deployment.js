#!/usr/bin/env node

/**
 * Deployment Setup Script
 * Helps configure GitHub Actions deployment for the Agriko project
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🚀 Agriko Deployment Setup');
console.log('==========================\n');

const GITHUB_SECRETS_REQUIRED = [
  {
    name: 'SSH_PRIVATE_KEY',
    description: 'SSH private key for server access',
    example: 'Generate with: ssh-keygen -t ed25519 -f ~/.ssh/agriko_deploy'
  },
  {
    name: 'WC_CONSUMER_KEY',
    description: 'WooCommerce REST API consumer key',
    example: 'ck_1234567890abcdef'
  },
  {
    name: 'WC_CONSUMER_SECRET',
    description: 'WooCommerce REST API consumer secret',
    example: 'cs_1234567890abcdef'
  },
  {
    name: 'ADMIN_PASSWORD_HASH',
    description: 'Bcrypt hash of admin password',
    example: 'Generate with: node scripts/hash-admin-password.js'
  },
  {
    name: 'JWT_SECRET',
    description: 'JWT secret for token signing (32+ chars)',
    example: 'Generate with this script or use: openssl rand -base64 32'
  }
];

const OPTIONAL_SECRETS = [
  {
    name: 'CODECOV_TOKEN',
    description: 'Codecov token for test coverage reporting',
    example: 'Get from: https://codecov.io'
  }
];

function generateSecureSecret(length = 32) {
  return crypto.randomBytes(length).toString('base64').slice(0, length);
}

function generateJWTSecret() {
  return crypto.randomBytes(32).toString('base64');
}

function checkEnvironmentFiles() {
  const envFiles = [
    '.env.local',
    '.env.production',
    '.env.example'
  ];

  console.log('📁 Checking environment files...\n');

  envFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${file} exists`);
    } else {
      console.log(`❌ ${file} missing`);

      if (file === '.env.example') {
        createEnvExample();
      }
    }
  });
}

function createEnvExample() {
  const envExample = `# Environment Configuration Template
# Copy this to .env.local and fill in your actual values

NODE_ENV=development

# WooCommerce API Configuration
NEXT_PUBLIC_WC_API_URL=https://agrikoph.com/wp-json/wc/v3
WC_CONSUMER_KEY=your_consumer_key_here
WC_CONSUMER_SECRET=your_consumer_secret_here

# Authentication & Security
ADMIN_PASSWORD_HASH=your_bcrypt_hashed_password_here
JWT_SECRET=${generateJWTSecret()}

# Development Settings
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_SERVICE_WORKER=false

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api
`;

  fs.writeFileSync('.env.example', envExample);
  console.log('✅ Created .env.example');
}

function checkGitHubWorkflows() {
  const workflowsDir = path.join(process.cwd(), '.github', 'workflows');

  if (!fs.existsSync(workflowsDir)) {
    console.log('❌ .github/workflows directory missing');
    return;
  }

  const workflows = [
    'deploy-production.yml',
    'deploy-staging.yml',
    'ci.yml'
  ];

  console.log('\n🔧 Checking GitHub workflows...\n');

  workflows.forEach(workflow => {
    const workflowPath = path.join(workflowsDir, workflow);
    if (fs.existsSync(workflowPath)) {
      console.log(`✅ ${workflow} configured`);
    } else {
      console.log(`❌ ${workflow} missing`);
    }
  });
}

function printSecretsInstructions() {
  console.log('\n🔐 GitHub Repository Secrets Setup');
  console.log('===================================\n');

  console.log('Go to your GitHub repository → Settings → Secrets and variables → Actions\n');
  console.log('Add these REQUIRED secrets:\n');

  GITHUB_SECRETS_REQUIRED.forEach((secret, index) => {
    console.log(`${index + 1}. ${secret.name}`);
    console.log(`   Description: ${secret.description}`);
    console.log(`   Example: ${secret.example}\n`);
  });

  console.log('Optional secrets for enhanced features:\n');

  OPTIONAL_SECRETS.forEach((secret, index) => {
    console.log(`${index + 1}. ${secret.name}`);
    console.log(`   Description: ${secret.description}`);
    console.log(`   Example: ${secret.example}\n`);
  });
}

function printDeploymentInstructions() {
  console.log('\n🚀 Deployment Instructions');
  console.log('===========================\n');

  console.log('PRODUCTION DEPLOYMENT:');
  console.log('1. Push to main branch, or');
  console.log('2. Go to Actions → "Deploy to Production" → "Run workflow"\n');

  console.log('STAGING/TESTING:');
  console.log('1. Push to develop branch or feature branches, or');
  console.log('2. Create pull request to main branch\n');

  console.log('SERVER REQUIREMENTS:');
  console.log('- SSH access to 143.42.189.57');
  console.log('- Apache2 web server running');
  console.log('- Node.js 22+ installed');
  console.log('- /var/www/shop directory writable\n');
}

function generateSSHKeyInstructions() {
  console.log('\n🔑 SSH Key Setup Instructions');
  console.log('=============================\n');

  console.log('1. Generate SSH key pair:');
  console.log('   ssh-keygen -t ed25519 -f ~/.ssh/agriko_deploy -N ""\n');

  console.log('2. Copy public key to server:');
  console.log('   ssh-copy-id -i ~/.ssh/agriko_deploy.pub root@143.42.189.57\n');

  console.log('3. Add private key to GitHub secrets:');
  console.log('   cat ~/.ssh/agriko_deploy');
  console.log('   # Copy the entire output to SSH_PRIVATE_KEY secret\n');

  console.log('4. Test SSH connection:');
  console.log('   ssh -i ~/.ssh/agriko_deploy root@143.42.189.57\n');
}

function main() {
  checkEnvironmentFiles();
  checkGitHubWorkflows();
  printSecretsInstructions();
  generateSSHKeyInstructions();
  printDeploymentInstructions();

  console.log('🎯 Quick Start Checklist:');
  console.log('========================\n');
  console.log('□ Generate SSH key and add to server');
  console.log('□ Add SSH_PRIVATE_KEY to GitHub secrets');
  console.log('□ Add WooCommerce API keys to GitHub secrets');
  console.log('□ Generate and add ADMIN_PASSWORD_HASH to GitHub secrets');
  console.log('□ Generate and add JWT_SECRET to GitHub secrets');
  console.log('□ Test deployment with "Deploy to Production" workflow\n');

  console.log('🔧 Generated Values for Testing:');
  console.log(`JWT_SECRET: ${generateJWTSecret()}`);
  console.log(`Random Secret: ${generateSecureSecret()}\n`);

  console.log('✅ Setup complete! Your deployment system is ready to use.');
}

if (require.main === module) {
  main();
}

module.exports = {
  generateSecureSecret,
  generateJWTSecret,
  GITHUB_SECRETS_REQUIRED,
  OPTIONAL_SECRETS
};