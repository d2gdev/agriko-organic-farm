const fs = require('fs');
const path = require('path');

const fixFile = (filePath, fixes) => {
  const fullPath = path.join(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) return;
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let changed = false;
  
  fixes.forEach(fix => {
    if (fix.search instanceof RegExp ? content.match(fix.search) : content.includes(fix.search)) {
      content = content.replace(fix.search, fix.replace);
      changed = true;
    }
  });
  
  if (changed) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Fixed ${filePath}`);
  }
};

// Fix JWT expiresIn string to number
fixFile('src/lib/auth/jwt.ts', [
  { search: "expiresIn: '24h'", replace: 'expiresIn: 24 * 60 * 60' }
]);

// Fix business logic validator comparison
fixFile('src/lib/business-logic-validator.ts', [
  { search: 'if (salePrice && regularPrice) {', replace: 'if (salePrice && regularPrice && typeof salePrice === "number" && typeof regularPrice === "number") {' }
]);

// Fix competitor qdrant type conversion
fixFile('src/lib/database/competitor-qdrant.ts', [
  { search: 'id: scoreData.id as string', replace: 'id: String(scoreData.id)' }
]);

// Fix search keyword API route
fixFile('src/app/api/search/keyword/route.ts', [
  { search: 'formatPrice(product.price)', replace: 'formatPrice(product.price || 0)' }
]);

// Fix AdvancedAnalyticsDashboard string to number
fixFile('src/components/AdvancedAnalyticsDashboard.tsx', [
  { search: 'value={`${Math.round(realTimeData.conversionRate * 100)}%`}', replace: 'value={Math.round(realTimeData.conversionRate * 100)}' }
]);

console.log('Remaining error fixes completed');
