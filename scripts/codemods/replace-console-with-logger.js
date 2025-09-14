/*
 Codemod: Replace console.* with logger.* across src
 - Maps: console.error -> logger.error, console.warn -> logger.warn, console.info -> logger.info, console.log -> logger.info
 - Injects import { logger } from '@/lib/logger' if missing
 - Skips src/lib/logger.ts
*/

const fs = require('fs');
const path = require('path');
const glob = require('glob');

function processFile(file) {
  if (file.endsWith('src/lib/logger.ts')) return false;
  let code = fs.readFileSync(file, 'utf8');
  if (!code.includes('console.')) return false;

  const original = code;
  // Replace console methods
  code = code.replace(/console\.error\(/g, 'logger.error(');
  code = code.replace(/console\.warn\(/g, 'logger.warn(');
  code = code.replace(/console\.info\(/g, 'logger.info(');
  code = code.replace(/console\.log\(/g, 'logger.info(');

  // Ensure import exists
  if (!code.includes("from '@/lib/logger'")) {
    const importLine = `import { logger } from '@/lib/logger';\n`;
    const importMatch = code.match(/^import[\s\S]*?;\s*$/m);
    if (importMatch) {
      const idx = importMatch.index + importMatch[0].length;
      code = code.slice(0, idx) + '\n' + importLine + code.slice(idx);
    } else {
      code = importLine + code;
    }
  }

  if (code !== original) {
    fs.writeFileSync(file, code, 'utf8');
    return true;
  }
  return false;
}

function run() {
  const files = glob.sync('src/**/*.{ts,tsx,js,jsx}', { nodir: true });
  let changed = 0;
  for (const file of files) {
    try {
      if (processFile(file)) {
        changed++;
        process.stdout.write(`Updated: ${file}\n`);
      }
    } catch (e) {
      process.stderr.write(`Failed ${file}: ${e.message}\n`);
    }
  }
  console.log(`Done. Updated ${changed} files.`);
}

run();

