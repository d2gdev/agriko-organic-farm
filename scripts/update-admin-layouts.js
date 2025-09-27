const fs = require('fs');
const path = require('path');

const pagesToUpdate = [
  'src/app/admin/analytics/ecommerce/page.tsx',
  'src/app/admin/analytics/users/page.tsx',
  'src/app/admin/analytics/search/page.tsx',
  'src/app/admin/analytics/realtime/page.tsx',
  'src/app/admin/reviews/page.tsx',
  'src/app/admin/business-intelligence/page.tsx',
  'src/app/admin/competitor-scraper/page.tsx',
  'src/app/admin/graph/page.tsx'
];

pagesToUpdate.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);

  if (!fs.existsSync(fullPath)) {
    console.warn(`⚠️  File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;

  // Add AdminLayout import if not present
  if (!content.includes("import AdminLayout from '@/components/AdminLayout'")) {
    // Find where to add the import (after other imports)
    const importRegex = /^import .+ from .+;$/m;
    const lastImport = content.match(/^import .+ from .+;$/gm);
    if (lastImport && lastImport.length > 0) {
      const lastImportLine = lastImport[lastImport.length - 1];
      content = content.replace(
        lastImportLine,
        `${lastImportLine}\nimport AdminLayout from '@/components/AdminLayout';`
      );
    }
  }

  // Find the return statement and wrap with AdminLayout
  // First, check if already wrapped
  if (content.includes('<AdminLayout>')) {
    console.warn(`✅ Already updated: ${filePath}`);
    return;
  }

  // Pattern 1: return ( <div className="min-h-screen
  const pattern1 = /return \(\s*<div className="min-h-screen[^>]*>/;
  if (pattern1.test(content)) {
    content = content.replace(pattern1, 'return (\n    <AdminLayout>\n      <div className="px-4 sm:px-6 lg:px-8 py-8">');

    // Find the corresponding closing </div> and replace with </div></AdminLayout>
    // Count opening divs after return to find the right closing
    const returnIndex = content.indexOf('return (');
    const afterReturn = content.substring(returnIndex);

    // Simple approach: replace last </div>\n  ); with </div>\n    </AdminLayout>\n  );
    content = content.replace(/(\s*)<\/div>\s*\);?\s*}\s*$/, '$1</div>\n    </AdminLayout>\n  );\n}');
  }

  // Pattern 2: Some pages might have different structure
  const pattern2 = /return \(\s*<>\s*<div className="min-h-screen/;
  if (pattern2.test(content)) {
    content = content.replace(/<>\s*<div className="min-h-screen[^>]*>/, '<AdminLayout>\n      <div className="px-4 sm:px-6 lg:px-8 py-8">');
    content = content.replace(/<\/div>\s*<\/>\s*\);/, '</div>\n    </AdminLayout>\n  );');
  }

  // Remove headers that duplicate AdminLayout functionality
  content = content.replace(/<header[^>]*>[\s\S]*?<\/header>\s*/g, '');

  // Remove "Back to Admin" buttons
  content = content.replace(/<Button[^>]*onClick=\{[^}]*router\.push\(['"`]\/admin[^}]*\}[\s\S]*?<\/Button>/g, '');

  // Clean up any duplicate main wrappers
  content = content.replace(/<main className="[^"]*">\s*/g, '');
  content = content.replace(/\s*<\/main>/g, '');

  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content);
    console.warn(`✅ Updated: ${filePath}`);
  } else {
    console.warn(`⚠️  Could not update: ${filePath} - may need manual review`);
  }
});

console.warn('\n✨ Admin layout update complete!');