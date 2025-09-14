#!/usr/bin/env node

/**
 * Server Health Check Script
 * Verifies server configuration and deployment readiness
 */

const https = require('https');
const http = require('http');

const HEALTH_CHECKS = [
  {
    name: 'Main Site Accessibility',
    url: 'https://shop.agrikoph.com',
    expectedStatus: 200,
    timeout: 10000
  },
  {
    name: 'WooCommerce API',
    url: 'https://agrikoph.com/wp-json/wc/v3',
    expectedStatus: 401, // 401 is expected without auth
    timeout: 5000
  },
  {
    name: 'WordPress Health',
    url: 'https://agrikoph.com/wp-json/wp/v2',
    expectedStatus: 200,
    timeout: 5000
  }
];

function makeRequest(url, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;

    const req = client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data.substring(0, 500) // Limit data for logging
        });
      });
    });

    req.setTimeout(timeout, () => {
      req.abort();
      reject(new Error(`Request timeout after ${timeout}ms`));
    });

    req.on('error', (err) => {
      reject(err);
    });
  });
}

async function runHealthCheck(check) {
  console.log(`🔍 Checking: ${check.name}`);
  console.log(`   URL: ${check.url}`);

  try {
    const response = await makeRequest(check.url, check.timeout);

    if (response.statusCode === check.expectedStatus) {
      console.log(`   ✅ Status: ${response.statusCode} (Expected: ${check.expectedStatus})`);
      return { success: true, check: check.name, status: response.statusCode };
    } else {
      console.log(`   ⚠️  Status: ${response.statusCode} (Expected: ${check.expectedStatus})`);
      return { success: false, check: check.name, status: response.statusCode, expected: check.expectedStatus };
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return { success: false, check: check.name, error: error.message };
  }
}

async function checkServerRequirements() {
  console.log('🖥️  Server Requirements Check');
  console.log('============================\n');

  const requirements = [
    'SSH access to server (143.42.189.57)',
    'Apache2 web server running',
    'Node.js 22+ installed on server',
    '/var/www/shop directory exists and is writable',
    'www-data user has proper permissions',
    'Apache2 mod_rewrite enabled',
    'Apache2 mod_deflate enabled (recommended)',
    'Apache2 mod_expires enabled (recommended)',
    'Apache2 mod_headers enabled (recommended)'
  ];

  requirements.forEach((req, index) => {
    console.log(`${index + 1}. ${req}`);
  });

  console.log('\n💡 To check these on your server, run:');
  console.log('   ssh root@143.42.189.57 "apache2ctl -M | grep -E \\"rewrite|deflate|expires|headers\\""');
  console.log('   ssh root@143.42.189.57 "node --version"');
  console.log('   ssh root@143.42.189.57 "ls -la /var/www/shop"');
}

async function main() {
  console.log('🏥 Agriko Server Health Check');
  console.log('==============================\n');

  const results = [];

  for (const check of HEALTH_CHECKS) {
    const result = await runHealthCheck(check);
    results.push(result);
    console.log(); // Add spacing
  }

  // Summary
  const successful = results.filter(r => r.success).length;
  const total = results.length;

  console.log('📊 Health Check Summary');
  console.log('=======================\n');

  if (successful === total) {
    console.log(`✅ All checks passed (${successful}/${total})`);
    console.log('🚀 Server is ready for deployment!\n');
  } else {
    console.log(`⚠️  ${successful}/${total} checks passed`);
    console.log('🔧 Some issues need attention:\n');

    results.filter(r => !r.success).forEach(result => {
      console.log(`❌ ${result.check}:`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      } else {
        console.log(`   Got status ${result.status}, expected ${result.expected}`);
      }
    });
    console.log();
  }

  await checkServerRequirements();

  console.log('\n🎯 Next Steps:');
  console.log('==============');
  console.log('1. Fix any failed health checks');
  console.log('2. Ensure all GitHub secrets are configured');
  console.log('3. Test deployment with GitHub Actions');
  console.log('4. Monitor deployment logs for any issues\n');

  process.exit(successful === total ? 0 : 1);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  makeRequest,
  runHealthCheck,
  HEALTH_CHECKS
};