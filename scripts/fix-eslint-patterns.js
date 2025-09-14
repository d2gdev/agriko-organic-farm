#!/usr/bin/env node

/**
 * Script to automatically fix common ESLint patterns
 * Run with: node scripts/fix-eslint-patterns.js
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Patterns to fix
const FIXES = [
  // Fix nullish coalescing
  {
    pattern: /(\w+)\s*\|\|\s*(['"`][\w\s-/]+['"`]|\d+|null|undefined|false|true|\[\]|\{\})/g,
    replacement: '$1 ?? $2',
    description: 'Replace || with ?? for nullish coalescing'
  },
  
  // Fix response.json() type assertions
  {
    pattern: /const\s+(\w+)\s*=\s*await\s+response\.json\(\);/g,
    replacement: 'const $1 = await response.json() as ApiResponse;',
    description: 'Add type assertion to response.json()',
    requiresImport: "import type { ApiResponse } from '@/types/api-responses';"
  },
  
  // Fix any[] to unknown[]
  {
    pattern: /:\s*any\[\]/g,
    replacement: ': unknown[]',
    description: 'Replace any[] with unknown[]'
  },
  
  // Fix Record<string, any> to Record<string, unknown>
  {
    pattern: /Record<string,\s*any>/g,
    replacement: 'Record<string, unknown>',
    description: 'Replace Record<string, any> with Record<string, unknown>'
  }
];

// Files to process
const API_ROUTES = glob.sync('src/app/api/**/*.ts', { 
  ignore: ['**/*.test.ts', '**/*.spec.ts'] 
});

const COMPONENTS = glob.sync('src/components/**/*.tsx', { 
  ignore: ['**/*.test.tsx', '**/*.spec.tsx'] 
});

const LIB_FILES = glob.sync('src/lib/**/*.ts', { 
  ignore: ['**/*.test.ts', '**/*.spec.ts'] 
});

let totalFixes = 0;

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let fixes = 0;
  let requiresImport = false;
  
  FIXES.forEach(fix => {
    const matches = content.match(fix.pattern);
    if (matches) {
      content = content.replace(fix.pattern, fix.replacement);
      fixes += matches.length;
      if (fix.requiresImport) {
        requiresImport = fix.requiresImport;
      }
      console.log(`  ✓ ${fix.description}: ${matches.length} occurrences`);
    }
  });
  
  // Add import if needed and not already present
  if (requiresImport && !content.includes("from '@/types/api-responses'")) {
    content = requiresImport + '\n' + content;
    console.log('  ✓ Added ApiResponse import');
  }
  
  if (fixes > 0) {
    fs.writeFileSync(filePath, content);
    totalFixes += fixes;
    console.log(`  Fixed ${fixes} issues in ${path.basename(filePath)}`);
  }
  
  return fixes;
}

console.log('🔧 ESLint Pattern Fixer\n');
console.log('Processing API routes...');
API_ROUTES.forEach(file => {
  const fixes = fixFile(file);
  if (fixes > 0) {
    console.log(`✅ ${file}: ${fixes} fixes applied`);
  }
});

console.log('\nProcessing components...');
COMPONENTS.forEach(file => {
  const fixes = fixFile(file);
  if (fixes > 0) {
    console.log(`✅ ${file}: ${fixes} fixes applied`);
  }
});

console.log('\nProcessing lib files...');
LIB_FILES.forEach(file => {
  const fixes = fixFile(file);
  if (fixes > 0) {
    console.log(`✅ ${file}: ${fixes} fixes applied`);
  }
});

console.log(`\n✨ Total fixes applied: ${totalFixes}`);
console.log('\nRun "npm run lint" to see remaining issues.');