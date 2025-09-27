/**
 * Fix remaining Money type errors in test files
 * More comprehensive pattern matching
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Helper to convert price string to centavos
function convertPriceToCentavos(priceStr) {
  const cleaned = priceStr.replace(/['"]/g, '');
  const value = parseFloat(cleaned);
  if (isNaN(value)) return '0 as Core.Money';
  return `${Math.round(value * 100)} as Core.Money`;
}

// Find all test files
const testFiles = glob.sync('src/**/*.test.tsx', { cwd: process.cwd() })
  .concat(glob.sync('src/**/*.integration.test.tsx', { cwd: process.cwd() }));

function fixFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // More comprehensive patterns
  const patterns = [
    // Standalone price fields with quotes
    {
      pattern: /(\s+)(price|regular_price|sale_price):\s*['"](\d+(?:\.\d{1,2})?)['"]([,\s\n])/g,
      replace: (match, ws, field, price, end) =>
        `${ws}${field}: ${convertPriceToCentavos(price)}${end}`
    },
    // Price fields in objects that haven't been fixed yet
    {
      pattern: /(\s+)(price|regular_price|sale_price):\s*(\d+(?:\.\d{1,2})?)\s*([,\s\n])/g,
      replace: (match, ws, field, price, end) => {
        // Don't modify if already has 'as Core.Money'
        if (match.includes('as Core.Money')) return match;
        return `${ws}${field}: ${price} as Core.Money${end}`;
      }
    },
    // Arrays of prices
    {
      pattern: /prices:\s*\[([^\]]+)\]/g,
      replace: (match, prices) => {
        const converted = prices.split(',').map(p => {
          const trimmed = p.trim().replace(/['"]/g, '');
          if (!isNaN(parseFloat(trimmed))) {
            return convertPriceToCentavos(trimmed);
          }
          return p;
        }).join(', ');
        return `prices: [${converted}]`;
      }
    }
  ];

  // Apply each pattern
  patterns.forEach(({ pattern, replace }) => {
    const newContent = content.replace(pattern, replace);
    if (newContent !== content) {
      content = newContent;
      modified = true;
    }
  });

  // Add Core import if needed
  if (modified && !content.includes("import { Core }") && !content.includes("import type { Core }")) {
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
    console.log(`✅ Fixed ${path.relative(process.cwd(), filePath)}`);
    return true;
  }
  return false;
}

// Process all test files
console.log('Fixing remaining Money type errors in test files...\n');
let fixedCount = 0;

testFiles.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (fixFile(fullPath)) {
    fixedCount++;
  }
});

console.log(`\n✅ Fixed ${fixedCount} files`);
console.log('\nNext: Run npx tsc --noEmit to verify');