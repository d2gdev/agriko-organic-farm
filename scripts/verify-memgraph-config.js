/**
 * Verify all Memgraph connections are using remote instance
 * Checks all files and reports connection URLs
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Configuration
const REMOTE_MEMGRAPH = 'bolt://143.42.189.57:7687';
const LOCAL_MEMGRAPH = 'bolt://localhost:7687';

// Files to check
const patterns = [
  'src/**/*.ts',
  'src/**/*.js',
  'scripts/**/*.js',
  '.env*',
  '*.md',
];

const results = {
  remote: [],
  local: [],
  environment: [],
};

console.warn('🔍 Verifying Memgraph Configuration\n');
console.warn(`Remote URL: ${REMOTE_MEMGRAPH}`);
console.warn(`Local URL: ${LOCAL_MEMGRAPH}\n`);

// Check environment variable
require('dotenv').config();
const envUrl = process.env.MEMGRAPH_URL;
console.warn(`📝 Environment Variable (MEMGRAPH_URL): ${envUrl || 'NOT SET'}`);
if (envUrl === REMOTE_MEMGRAPH) {
  console.warn('  ✅ Using remote instance\n');
} else if (envUrl === LOCAL_MEMGRAPH) {
  console.warn('  ⚠️ Still pointing to localhost\n');
} else if (!envUrl) {
  console.warn('  ⚠️ Not set in environment\n');
}

// Search files
console.warn('📂 Checking files...\n');

patterns.forEach(pattern => {
  const files = glob.sync(pattern, { ignore: ['node_modules/**', 'dist/**', '.next/**'] });

  files.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');

      // Check for Memgraph URLs
      if (content.includes(LOCAL_MEMGRAPH)) {
        results.local.push(file);
      }

      if (content.includes(REMOTE_MEMGRAPH)) {
        results.remote.push(file);
      }

      // Check for environment variable usage
      if (content.includes('process.env.MEMGRAPH_URL') || content.includes('MEMGRAPH_URL')) {
        results.environment.push(file);
      }
    } catch (error) {
      // Skip binary or unreadable files
    }
  });
});

// Report results
console.warn('📊 Results:\n');

if (results.local.length > 0) {
  console.warn(`⚠️ Files still using localhost (${results.local.length}):`);
  results.local.forEach(file => {
    console.warn(`  - ${file}`);
  });
  console.warn();
}

if (results.remote.length > 0) {
  console.warn(`✅ Files using remote instance (${results.remote.length}):`);
  results.remote.forEach(file => {
    console.warn(`  - ${file}`);
  });
  console.warn();
}

if (results.environment.length > 0) {
  console.warn(`📝 Files using environment variable (${results.environment.length}):`);
  results.environment.slice(0, 10).forEach(file => {
    console.warn(`  - ${file}`);
  });
  if (results.environment.length > 10) {
    console.warn(`  ... and ${results.environment.length - 10} more`);
  }
  console.warn();
}

// Summary
console.warn('📋 Summary:');
if (results.local.length === 0) {
  console.warn('  ✅ No files hardcoding localhost');
} else {
  console.warn(`  ⚠️ ${results.local.length} files still reference localhost`);
}

if (envUrl === REMOTE_MEMGRAPH) {
  console.warn('  ✅ Environment configured for remote');
}

const mainConnections = [
  'src/lib/memgraph.ts',
  'src/lib/memgraph-analytics.ts',
  'src/lib/business-intelligence/memgraph/connection.ts'
];

console.warn('\n🔧 Main Connection Files:');
mainConnections.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    const hasRemote = content.includes(REMOTE_MEMGRAPH);
    const hasLocal = content.includes(LOCAL_MEMGRAPH);

    if (hasRemote && !hasLocal) {
      console.warn(`  ✅ ${file} - Remote configured`);
    } else if (hasLocal) {
      console.warn(`  ⚠️ ${file} - Still has localhost`);
    } else {
      console.warn(`  📝 ${file} - Using environment only`);
    }
  }
});

console.warn('\n✨ Verification complete!');