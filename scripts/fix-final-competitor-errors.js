const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src/lib/database/competitor-qdrant.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Fix type conversion errors
content = content.replace(/id: Date\.now\(\) as string/g, 'id: String(Date.now())');
content = content.replace(/id: productId as string/g, 'id: String(productId)');

// Fix string to number assignments  
content = content.replace(/id: productId,/g, 'id: parseInt(productId, 10) || Date.now(),');

// Fix undefined access
content = content.replace(/points\[0\]\.payload/g, 'points[0]?.payload');
content = content.replace(/results\[0\]\.payload/g, 'results[0]?.payload');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed final competitor errors');
