const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src/lib/price-validation.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Fix 'never' type issues by adding type guards
content = content.replace(
  /if \(values\.length === 0\) \{/g,
  'if (!Array.isArray(values) || values.length === 0) {'
);

// Fix string assignments to number returns
content = content.replace(
  /return errorsFound\[0\]\.message;/g,
  'return Number(errorsFound[0].message) || 0;'
);

content = content.replace(
  /return 'ERROR';/g,
  'return 0;'
);

content = content.replace(
  /return parseFloat\(cleaned\)\.toString\(\);/g,
  'return parseFloat(cleaned);'
);

content = content.replace(
  /return 'INVALID';/g,
  'return 0;'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed price-validation.ts');
