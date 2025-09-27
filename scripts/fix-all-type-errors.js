const fs = require('fs');
const path = require('path');

// Files that need Core namespace import
const filesNeedingCoreImport = [
  'src/app/test-search.bak/page.tsx',
  'src/components/ABTestVariant.tsx',
  'src/components/business-intelligence/CompetitorManager.tsx'
];

// Fix Core namespace imports
filesNeedingCoreImport.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');

    // Check if Core import already exists
    if (!content.includes("import { Core } from '@/types/TYPE_REGISTRY'")) {
      // Find the first import statement
      const importMatch = content.match(/^import .* from/m);
      if (importMatch) {
        const insertPosition = content.indexOf(importMatch[0]);
        content = content.slice(0, insertPosition) +
                  "import { Core } from '@/types/TYPE_REGISTRY';\n" +
                  content.slice(insertPosition);
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Added Core import to ${filePath}`);
      }
    }
  }
});

// Fix EnhancedProductCard price formatting
const enhancedProductCardPath = path.join(process.cwd(), 'src/components/EnhancedProductCard.tsx');
if (fs.existsSync(enhancedProductCardPath)) {
  let content = fs.readFileSync(enhancedProductCardPath, 'utf8');

  // Replace parseFloat with direct usage for Core.Money
  content = content.replace(
    /parseFloat\((product\.price|product\.regular_price|product\.sale_price)\)/g,
    '$1'
  );

  fs.writeFileSync(enhancedProductCardPath, content, 'utf8');
  console.log('Fixed EnhancedProductCard price handling');
}

// Fix admin hooks metric types
const metricsHookPath = path.join(process.cwd(), 'src/components/admin-enhancements/hooks/useMetrics.ts');
if (fs.existsSync(metricsHookPath)) {
  let content = fs.readFileSync(metricsHookPath, 'utf8');

  // Update metric value types to allow strings
  content = content.replace(
    /value: number;/g,
    'value: string | number;'
  );

  fs.writeFileSync(metricsHookPath, content, 'utf8');
  console.log('Fixed useMetrics hook types');
}

console.log('Type error fixes completed');
