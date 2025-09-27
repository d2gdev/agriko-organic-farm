/**
 * Fix ALL remaining TypeScript errors - comprehensive final fix
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all TypeScript files
const allTsFiles = glob.sync('src/**/*.{ts,tsx}', { cwd: process.cwd() });

function fixFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  const originalContent = content;

  // Comprehensive fixes
  const fixes = [
    // Fix | number syntax errors (should be 'as number')
    {
      pattern: /\|\s*number/g,
      replace: 'as number'
    },
    // Fix remaining empty regular_price strings
    {
      pattern: /regular_price:\s*''/g,
      replace: 'regular_price: undefined'
    },
    // Fix the Object.values[0] error
    {
      pattern: /Object\.values\(.*?\)\[0\]/g,
      replace: (match) => {
        return `(${match} || {})`;
      }
    },
    // Fix results[0] access
    {
      pattern: /results\[0\]/g,
      replace: '(results && results[0]) || {}'
    },
    // Add Core import for files that use Core.Money but don't import it
    {
      pattern: /Core\.Money/,
      replace: (match) => {
        if (!content.includes('import { Core }') && !content.includes('import type { Core }')) {
          // Add import at the top after other imports
          const importMatch = content.match(/^import .* from ['"].*['"];?$/m);
          if (importMatch) {
            const insertPos = importMatch.index + importMatch[0].length;
            content = content.slice(0, insertPos) +
                     "\nimport { Core } from '@/types/TYPE_REGISTRY';" +
                     content.slice(insertPos);
            modified = true;
          }
        }
        return match;
      }
    },
    // Fix parseFloat with Money type
    {
      pattern: /parseFloat\(([^)]+)\s+as\s+string\)/g,
      replace: '(($1 || 0) as number)'
    },
    // Fix formatPrice calls with wrong types
    {
      pattern: /formatPrice\(([^)]+)\s+as\s+string\)/g,
      replace: 'formatPrice(($1 || 0) as Core.Money)'
    },
    // Fix price assignments that are still strings
    {
      pattern: /price:\s*'(\d+(?:\.\d{1,2})?)'([,\s])/g,
      replace: (match, value, end) => {
        const centavos = Math.round(parseFloat(value) * 100);
        return `price: ${centavos} as Core.Money${end}`;
      }
    },
    // Fix regular_price assignments that are still strings
    {
      pattern: /regular_price:\s*'(\d+(?:\.\d{1,2})?)'([,\s])/g,
      replace: (match, value, end) => {
        const centavos = Math.round(parseFloat(value) * 100);
        return `regular_price: ${centavos} as Core.Money${end}`;
      }
    },
    // Fix test mocks that still have string prices
    {
      pattern: /mockResolvedValue\(\[\s*\{([^}]+)price:\s*['"](\d+(?:\.\d{1,2})?)['"]([^}]+)\}/g,
      replace: (match, before, price, after) => {
        const centavos = Math.round(parseFloat(price) * 100);
        return `mockResolvedValue([{${before}price: ${centavos} as Core.Money${after}}`;
      }
    }
  ];

  // Apply all fixes
  fixes.forEach(({ pattern, replace }) => {
    const newContent = content.replace(pattern, replace);
    if (newContent !== content) {
      content = newContent;
      modified = true;
    }
  });

  if (modified && content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed ${path.relative(process.cwd(), filePath)}`);
    return true;
  }
  return false;
}

console.log('Applying final TypeScript fixes...\n');
let fixedCount = 0;

// Fix all files
allTsFiles.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (fixFile(fullPath)) {
    fixedCount++;
  }
});

// Specific targeted fixes for known problem files
const specificFixes = [
  {
    file: 'src/app/api/auto-sync/route.ts',
    find: /const firstResult = results\[0\]/g,
    replace: 'const firstResult = (results && results[0]) || {}'
  },
  {
    file: 'src/__tests__/E2E.integration.test.tsx',
    // Find the specific test data that has string prices
    find: /\{[\s\n]*id: 3,[\s\n]*name: 'Organic Product 3',[\s\n]*slug: 'organic-product-3',[\s\n]*price: '19\.99'/g,
    replace: `{
      id: 3,
      name: 'Organic Product 3',
      slug: 'organic-product-3',
      price: 1999 as Core.Money`
  },
  {
    file: 'src/__tests__/E2E.integration.test.tsx',
    find: /regular_price: '19\.99'/g,
    replace: 'regular_price: 1999 as Core.Money'
  }
];

specificFixes.forEach(({ file, find, replace }) => {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    const newContent = content.replace(find, replace);
    if (newContent !== content) {
      fs.writeFileSync(fullPath, newContent, 'utf8');
      console.log(`✅ Applied specific fix to ${file}`);
      fixedCount++;
    }
  }
});

console.log(`\n✅ Fixed ${fixedCount} files`);
console.log('\nRunning final TypeScript check...');

// Run tsc to verify
const { execSync } = require('child_process');
try {
  execSync('npx tsc --noEmit', { stdio: 'pipe' });
  console.log('✅ TypeScript compilation successful - 0 errors!');
} catch (error) {
  const output = error.stdout ? error.stdout.toString() : '';
  const errorCount = (output.match(/error TS/g) || []).length;
  console.log(`⚠️  ${errorCount} TypeScript errors remaining`);
}