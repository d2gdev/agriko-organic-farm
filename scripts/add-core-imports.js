const fs = require('fs');
const path = require('path');

const filesNeedingCoreImport = [
  'src/components/EnhancedProductCard.tsx',
  'src/components/ProductCard.tsx',
  'src/lib/business-logic-validator.ts',
  'src/lib/client-safe-search.ts',
  'src/lib/integrations/woocommerce-api.ts',
  'src/lib/keyword-search.ts',
  'src/lib/memgraph.ts',
  'src/lib/scrapers/competitor-config.ts',
  'src/lib/scrapers/competitor-scraper.ts',
  'src/lib/utils.ts',
  'src/lib/vectorization.ts',
  'src/lib/webhook-config.ts',
  'src/lib/woocommerce.ts',
  'src/types/woocommerce-mappers.ts'
];

filesNeedingCoreImport.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Check if Core import already exists
    if (!content.includes("import { Core } from '@/types/TYPE_REGISTRY'")) {
      // Find the first import statement or 'use client' directive
      const lines = content.split('\n');
      let insertIndex = 0;
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("'use client'") || lines[i].includes('"use client"')) {
          insertIndex = i + 1;
          // Skip empty lines after 'use client'
          while (insertIndex < lines.length && lines[insertIndex].trim() === '') {
            insertIndex++;
          }
          break;
        } else if (lines[i].startsWith('import ')) {
          insertIndex = i;
          break;
        }
      }
      
      // Insert the Core import
      lines.splice(insertIndex, 0, "import { Core } from '@/types/TYPE_REGISTRY';");
      content = lines.join('\n');
      
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`Added Core import to ${filePath}`);
    } else {
      console.log(`Core import already exists in ${filePath}`);
    }
  }
});

console.log('Core import additions completed');
