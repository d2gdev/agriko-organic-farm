/**
 * Fix TypeScript Money type errors
 * Converts string prices to Core.Money (centavos) in test files
 */

const fs = require('fs');
const path = require('path');

// Helper to convert price string to centavos
function convertPriceToCentavos(priceStr) {
  // Remove quotes and parse
  const cleaned = priceStr.replace(/['"]/g, '');
  const value = parseFloat(cleaned);
  if (isNaN(value)) return '0 as Core.Money';
  return `${Math.round(value * 100)} as Core.Money`;
}

// Files to fix based on TypeScript errors
const filesToFix = [
  'src/__tests__/e2e-real-world.test.tsx',
  'src/__tests__/E2E.integration.test.tsx',
  'src/__tests__/error-resilience.test.tsx',
  'src/components/__tests__/CheckoutFlow.integration.test.tsx',
  'src/components/__tests__/ProductCard.test.tsx',
  'src/components/__tests__/ProductListing.integration.test.tsx',
  'src/components/__tests__/SearchModal.integration.test.tsx',
];

// Common price field patterns to replace
const pricePatterns = [
  // Direct price assignments like price: '100'
  {
    pattern: /price:\s*['"](\d+(?:\.\d{1,2})?)['"],?/g,
    replace: (match, price) => `price: ${convertPriceToCentavos(price)},`
  },
  // regular_price assignments
  {
    pattern: /regular_price:\s*['"](\d+(?:\.\d{1,2})?)['"],?/g,
    replace: (match, price) => `regular_price: ${convertPriceToCentavos(price)},`
  },
  // sale_price assignments
  {
    pattern: /sale_price:\s*['"](\d+(?:\.\d{1,2})?)['"],?/g,
    replace: (match, price) => `sale_price: ${convertPriceToCentavos(price)},`
  },
];

function fixFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Apply each pattern
  pricePatterns.forEach(({ pattern, replace }) => {
    const newContent = content.replace(pattern, replace);
    if (newContent !== content) {
      content = newContent;
      modified = true;
    }
  });

  // Add Core import if needed and not present
  if (modified && !content.includes("import { Core }") && !content.includes("import type { Core }")) {
    // Find the first import statement
    const importMatch = content.match(/^import .* from ['"].*/m);
    if (importMatch) {
      const insertPos = importMatch.index + importMatch[0].length;
      content = content.slice(0, insertPos) +
                "\nimport { Core } from '@/types/TYPE_REGISTRY';" +
                content.slice(insertPos);
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed ${filePath}`);
  } else {
    console.log(`⏭️  No changes needed for ${filePath}`);
  }
}

// Fix all test files
console.log('Fixing Money type errors in test files...\n');
filesToFix.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  fixFile(fullPath);
});

console.log('\n✅ Money type error fixes complete!');
console.log('\nNext steps:');
console.log('1. Run: npx tsc --noEmit');
console.log('2. Fix any remaining type errors manually');
console.log('3. Update API routes to use woocommerce-adapter for conversions');