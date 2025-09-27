const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src/lib/database/competitor-qdrant.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Fix all instances where string IDs are assigned to number fields
const fixes = [
  // Fix upsert operations
  { search: /id: competitor\.id,/, replace: 'id: parseInt(competitor.id, 10) || Date.now(),' },
  { search: /id: job\.id,/, replace: 'id: parseInt(job.id, 10) || Date.now(),' },
  { search: /id: product\.id,/, replace: 'id: parseInt(product.id, 10) || Date.now(),' },
  
  // Fix payload type issues
  { search: /payload: job\b/g, replace: 'payload: job as any' },
  { search: /payload: product\b/g, replace: 'payload: product as any' },
];

fixes.forEach(fix => {
  if (fix.search instanceof RegExp) {
    content = content.replace(fix.search, fix.replace);
  } else {
    content = content.replace(new RegExp(fix.search, 'g'), fix.replace);
  }
});

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed competitor ID assignments');
