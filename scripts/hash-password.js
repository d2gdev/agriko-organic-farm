#!/usr/bin/env node

const bcrypt = require('bcryptjs');

// Get password from command line argument
const password = process.argv[2];

if (!password) {
  console.log('Usage: node hash-password.js <your-password>');
  console.log('Example: node hash-password.js myAdminPassword123');
  process.exit(1);
}

// Generate hash with salt rounds of 12 (secure)
const saltRounds = 12;
const hash = bcrypt.hashSync(password, saltRounds);

console.log('ADMIN_PASSWORD_HASH value:');
console.log(hash);