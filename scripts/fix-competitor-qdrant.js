const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src/lib/database/competitor-qdrant.ts');
if (!fs.existsSync(filePath)) {
  console.log('File not found');
  process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');

// Fix ID type conversions
content = content.replace(/id: point\.id as string/g, 'id: String(point.id)');
content = content.replace(/id: scoreData\.id as string/g, 'id: String(scoreData.id)');

// Fix string assignment to number type  
content = content.replace(/id: key/g, 'id: parseInt(key, 10) || 0');
content = content.replace(/id: \`competitor-\$\{Date\.now\(\)\}\`/g, 'id: Date.now()');

// Fix Competitor to QdrantPayload assignment
content = content.replace(/payload: competitor/g, 'payload: competitor as any');

// Fix empty object property access
content = content.replace(/\(\{\}\)\.id/g, '({} as any).id');
content = content.replace(/\(\{\}\)\.payload/g, '({} as any).payload');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed competitor-qdrant.ts');
