/* global require, process, console */
const fs = require('fs');
const path = require('path');

// Fix no-case-declarations by adding block scopes
function fixCaseDeclarations(content) {

  let fixed = content;
  let hasChanges = true;

  // Keep applying fixes until no more changes
  while (hasChanges) {
    const beforeFix = fixed;

    // Add block scope to cases with declarations
    fixed = fixed.replace(/(\s*case\s+[^:]+:)\s*\n(\s*)((?:const|let|function)[^}]*?)(\n\s*(?:return|break|case|default|})|$)/gm, (match, caseStatement, indent, body, ending) => {
      // Check if already has block scope
      if (body.trim().startsWith('{')) {
        return match;
      }

      // Check if body contains const/let/function declarations
      if (/(const|let|function)\s+/.test(body)) {
        return `${caseStatement} {\n${indent}  ${body.trim()}\n${indent}}${ending}`;
      }

      return match;
    });

    hasChanges = beforeFix !== fixed;
  }

  return fixed;
}

// Fix no-useless-escape in regex
function fixUselessEscape(content) {

  let fixed = content;

  // Fix specific known patterns
  fixed = fixed.replace(/emailRegex\s*=\s*\/[^/]+\//g, (match) => {
    return match.replace(/\\\+/g, '\\+').replace(/\\\./g, '.');
  });

  return fixed;
}

// Fix @typescript-eslint/no-require-imports
function fixRequireImports(content, filePath) {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) {
    return content;
  }

  // Convert require() to import
  let fixed = content;

  // Match require statements
  fixed = fixed.replace(/const\s+(\w+)\s*=\s*require\(['"]([^'"]+)['"]\);?/g,
    "import $1 from '$2';");

  fixed = fixed.replace(/const\s+\{\s*([^}]+)\s*\}\s*=\s*require\(['"]([^'"]+)['"]\);?/g,
    "import { $1 } from '$2';");

  return fixed;
}

// Fix @typescript-eslint/no-unsafe-function-type
function fixUnsafeFunctionType(content) {
  // Replace Function type with more specific types
  return content.replace(/:\s*Function\b/g, ': (...args: any[]) => any');
}

// Fix @typescript-eslint/no-empty-object-type
function fixEmptyObjectType(content) {
  // Replace empty interfaces that extend other types
  return content.replace(/interface\s+(\w+)\s+extends\s+(\w+)\s*\{\s*\}/g,
    'type $1 = $2;');
}

// Process a file
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Apply fixes
    content = fixCaseDeclarations(content);
    content = fixUselessEscape(content);
    content = fixRequireImports(content, filePath);
    content = fixUnsafeFunctionType(content);
    content = fixEmptyObjectType(content);

    // Write back if changed
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.warn(`Fixed: ${filePath}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Get list of files with errors from ESLint output
const errorFiles = [
  'src/app/api/ab-testing/route.ts',
  'src/app/api/analytics/search-console/route.ts',
  'src/app/api/analytics/track/route.ts',
  'src/app/api/auto-sync/route.ts',
  'src/app/api/cache/status/route.ts',
  'src/app/api/data/woocommerce/route.ts',
  'src/app/api/graph/entities/route.ts',
  'src/app/api/graph/relationships/route.ts',
  'src/app/api/health/route.ts',
  'src/app/api/monitoring/route.ts',
  'src/app/api/qdrant/backup/route.ts',
  'src/app/api/qdrant/check/route.ts',
  'src/app/api/qdrant/migrate/route.ts',
  'src/app/api/recommendations/route.ts',
  'src/app/api/scrapers/alibaba/route.ts',
  'src/app/api/scrapers/analyze/route.ts',
  'src/app/api/scrapers/comparison/route.ts',
  'src/app/api/scrapers/scrape/route.ts',
  'src/app/api/scrapers/status/route.ts',
  'src/app/api/type-safety/route.ts',
  'src/__tests__/E2E.integration.test.tsx',
  'src/lib/validation.ts',
  'src/lib/type-validators.ts',
  'src/types/domain.ts',
  'src/types/type-safety.ts'
];

// Process all files
let fixedCount = 0;
errorFiles.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    if (processFile(fullPath)) {
      fixedCount++;
    }
  }
});

console.warn(`\nFixed ${fixedCount} files`);