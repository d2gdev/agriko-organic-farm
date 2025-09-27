const fs = require('fs');
const path = require('path');

const fixes = [
  {
    file: 'src/app/admin/analytics/users/page.tsx',
    title: 'User Analytics',
    subtitle: 'User behavior and engagement metrics'
  },
  {
    file: 'src/app/admin/analytics/search/page.tsx',
    title: 'Search Analytics',
    subtitle: 'Search queries and performance metrics'
  },
  {
    file: 'src/app/admin/analytics/realtime/page.tsx',
    title: 'Real-Time Analytics',
    subtitle: 'Live activity and monitoring'
  },
  {
    file: 'src/app/admin/reviews/page.tsx',
    title: 'Reviews Management',
    subtitle: 'Customer reviews and ratings'
  },
  {
    file: 'src/app/admin/business-intelligence/page.tsx',
    title: 'Business Intelligence',
    subtitle: 'Advanced analytics and insights'
  },
  {
    file: 'src/app/admin/competitor-scraper/page.tsx',
    title: 'Competitor Analysis',
    subtitle: 'Monitor competitor prices and products'
  },
  {
    file: 'src/app/admin/graph/page.tsx',
    title: 'Graph Database',
    subtitle: 'Entity relationships and connections'
  }
];

fixes.forEach(({ file, title, subtitle }) => {
  const fullPath = path.join(process.cwd(), file);

  if (!fs.existsSync(fullPath)) {
    console.warn(`⚠️  File not found: ${file}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');

  // Add AdminLayout import if not present
  if (!content.includes("import AdminLayout from '@/components/AdminLayout'")) {
    const lastImport = content.match(/^import .+ from .+;$/gm);
    if (lastImport && lastImport.length > 0) {
      const lastImportLine = lastImport[lastImport.length - 1];
      content = content.replace(
        lastImportLine,
        `${lastImportLine}\nimport AdminLayout from '@/components/AdminLayout';`
      );
    }
  }

  // Find return statement with min-h-screen div
  const returnPattern = /return \(\s*<AdminLayout>\s*<div className="px-4[^>]*>\s*<div className="min-h-screen/;
  if (returnPattern.test(content)) {
    // Fix the double wrapper issue
    content = content.replace(
      /return \(\s*<AdminLayout>\s*<div className="px-4[^>]*>\s*<div className="min-h-screen bg-gray-50">/,
      `return (\n    <AdminLayout>\n      <div className="px-4 sm:px-6 lg:px-8 py-8">\n        <div className="mb-6">\n          <h1 className="text-2xl font-bold text-gray-900">${title}</h1>\n          <p className="text-gray-600 mt-1">${subtitle}</p>\n        </div>`
    );

    // Remove duplicate headers
    content = content.replace(/<header[^>]*>[\s\S]*?<\/header>\s*/g, '');

    // Fix closing tags
    content = content.replace(/<\/div>\s*<\/div>\s*<\/AdminLayout>\s*\);\s*}$/, '</div>\n    </AdminLayout>\n  );\n}');
  } else {
    // Check if not wrapped in AdminLayout at all
    const simpleReturn = /return \(\s*<div className="min-h-screen/;
    if (simpleReturn.test(content)) {
      content = content.replace(
        /return \(\s*<div className="min-h-screen bg-gray-50">/,
        `return (\n    <AdminLayout>\n      <div className="px-4 sm:px-6 lg:px-8 py-8">\n        <div className="mb-6">\n          <h1 className="text-2xl font-bold text-gray-900">${title}</h1>\n          <p className="text-gray-600 mt-1">${subtitle}</p>\n        </div>`
      );

      // Remove headers
      content = content.replace(/<header[^>]*>[\s\S]*?<\/header>\s*/g, '');

      // Remove main tags
      content = content.replace(/<main[^>]*>/g, '<div>');
      content = content.replace(/<\/main>/g, '</div>');

      // Fix closing
      const lines = content.split('\n');
      for (let i = lines.length - 1; i >= 0; i--) {
        if (lines[i].includes('</div>') && lines[i + 1] && lines[i + 1].includes(');')) {
          lines[i] = '      </div>';
          lines.splice(i + 1, 0, '    </AdminLayout>');
          break;
        }
      }
      content = lines.join('\n');
    }
  }

  fs.writeFileSync(fullPath, content);
  console.warn(`✅ Fixed: ${file}`);
});

console.warn('\n✨ Admin layouts fixed!');