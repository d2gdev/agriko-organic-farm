#!/usr/bin/env ts-node

/**
 * Fix PHP Currency Types
 * Converts all string price fields to Core.Money (centavos)
 */

import * as fs from 'fs';
import * as path from 'path';
const chalk = require('chalk');

interface CurrencyFix {
  file: string;
  line: number;
  before: string;
  after: string;
  type: 'interface' | 'function' | 'variable';
}

class PhpCurrencyFixer {
  private fixes: CurrencyFix[] = [];

  // Files that handle money and need immediate fixing
  private criticalFiles = [
    'src/lib/woocommerce.ts',
    'src/context/CartContext.tsx',
    'src/components/ProductCard.tsx',
    'src/components/CartDrawer.tsx',
    'src/lib/business-logic-validator.ts',
    'src/types/woocommerce.ts',
    'src/lib/integrations/woocommerce-api.ts',
  ];

  async fixFile(filePath: string): Promise<boolean> {
    let content = await fs.promises.readFile(filePath, 'utf-8');
    let modified = false;
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      let newLine = line;

      // Fix interface/type definitions with price fields
      if (line.match(/^\s*(price|regular_price|sale_price|total|subtotal|amount|cost|fee)\s*[:\?]\s*string/)) {
        const oldLine = line;
        // Convert to Core.Money
        newLine = line.replace(
          /(price|regular_price|sale_price|total|subtotal|amount|cost|fee)\s*([:\?])\s*string/g,
          '$1$2 Core.Money'
        );

        if (newLine !== oldLine) {
          lines[i] = newLine;
          this.fixes.push({
            file: filePath,
            line: i + 1,
            before: oldLine,
            after: newLine,
            type: 'interface'
          });
          modified = true;
        }
      }

      // Fix parseFloat calls on price fields (convert to centavos)
      if (line.includes('parseFloat') && line.match(/price|total|amount/i)) {
        const oldLine = line;
        // Replace parseFloat(price) with price (already in centavos)
        newLine = line.replace(
          /parseFloat\(([^)]*(?:price|total|amount)[^)]*)\)/g,
          '$1'
        );

        if (newLine !== oldLine) {
          lines[i] = newLine;
          this.fixes.push({
            file: filePath,
            line: i + 1,
            before: oldLine,
            after: newLine,
            type: 'function'
          });
          modified = true;
        }
      }

      // Fix string concatenation for prices (PHP formatting)
      if (line.match(/[`"']₱\$?\{.*(?:price|total|amount).*\}[`"']/)) {
        const oldLine = line;
        // Replace with proper formatPrice function
        newLine = line.replace(
          /[`"']₱\$?\{(.*(?:price|total|amount).*)\}[`"']/g,
          'formatPrice($1)'
        );

        if (newLine !== oldLine) {
          lines[i] = newLine;
          this.fixes.push({
            file: filePath,
            line: i + 1,
            before: oldLine,
            after: newLine,
            type: 'function'
          });
          modified = true;
        }
      }
    }

    // Add import for Core types if modified and not already imported
    if (modified) {
      content = lines.join('\n');

      // Check if we need to add Core import
      if (!content.includes('@/types/TYPE_REGISTRY') && !content.includes('from "@/types/TYPE_REGISTRY"')) {
        // Add import at the top (after 'use client' if present)
        if (content.startsWith("'use client'")) {
          content = content.replace(
            "'use client';\n",
            "'use client';\n\nimport { Core } from '@/types/TYPE_REGISTRY';\n"
          );
        } else {
          content = `import { Core } from '@/types/TYPE_REGISTRY';\n\n${content}`;
        }
      }

      // Add formatPrice utility if file uses it
      if (content.includes('formatPrice') && !content.includes('function formatPrice')) {
        const formatPriceUtil = `
// Format PHP currency from centavos
export function formatPrice(centavos: Core.Money): string {
  const pesos = centavos / 100;
  return \`₱\${pesos.toFixed(2).replace(/\\B(?=(\\d{3})+(?!\\d))/g, ',')}\`;
}

// Convert pesos to centavos
export function toCentavos(pesos: number): Core.Money {
  return Math.round(pesos * 100) as Core.Money;
}
`;
        // Add before the first export or at the end
        const exportIndex = content.indexOf('export');
        if (exportIndex > 0) {
          content = content.slice(0, exportIndex) + formatPriceUtil + content.slice(exportIndex);
        } else {
          content += formatPriceUtil;
        }
      }

      await fs.promises.writeFile(filePath, content);
      return true;
    }

    return false;
  }

  async fixCriticalFiles(): Promise<void> {
    console.log(chalk.blue('🔧 Fixing PHP currency types in critical files...\n'));

    for (const file of this.criticalFiles) {
      const fullPath = path.join(process.cwd(), file);

      if (fs.existsSync(fullPath)) {
        const fixed = await this.fixFile(fullPath);
        if (fixed) {
          console.log(chalk.green(`✅ ${file}`));
        } else {
          console.log(chalk.yellow(`⏭️  ${file} (no changes needed)`));
        }
      } else {
        console.log(chalk.red(`❌ ${file} (file not found)`));
      }
    }
  }

  async fixAllFiles(srcPath: string): Promise<void> {
    console.log(chalk.blue('🔧 Fixing PHP currency types in all files...\n'));

    const files = await this.getAllTypeScriptFiles(srcPath);
    let fixedCount = 0;

    for (const file of files) {
      const fixed = await this.fixFile(file);
      if (fixed) {
        fixedCount++;
        console.log(chalk.green(`✅ ${path.relative(process.cwd(), file)}`));
      }
    }

    console.log(chalk.blue(`\n📊 Currency Fix Summary:`));
    console.log(chalk.yellow(`   Files processed: ${files.length}`));
    console.log(chalk.green(`   Files fixed: ${fixedCount}`));
    console.log(chalk.yellow(`   Total fixes: ${this.fixes.length}`));
  }

  private async getAllTypeScriptFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory() &&
          !entry.name.includes('node_modules') &&
          !entry.name.startsWith('.') &&
          !entry.name.includes('__tests__')) {
        files.push(...await this.getAllTypeScriptFiles(fullPath));
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        files.push(fullPath);
      }
    }

    return files;
  }

  generateReport(): string {
    let report = '# PHP Currency Fix Report\n\n';
    report += '## Summary\n\n';
    report += `- Total fixes: ${this.fixes.length}\n`;
    report += `- Files modified: ${new Set(this.fixes.map(f => f.file)).size}\n\n`;

    report += '## Changes\n\n';

    // Group by file
    const byFile = new Map<string, CurrencyFix[]>();
    for (const fix of this.fixes) {
      const fixes = byFile.get(fix.file) || [];
      fixes.push(fix);
      byFile.set(fix.file, fixes);
    }

    for (const [file, fixes] of byFile.entries()) {
      report += `### ${path.relative(process.cwd(), file)}\n\n`;
      for (const fix of fixes) {
        report += `Line ${fix.line} (${fix.type}):\n`;
        report += `- Before: \`${fix.before.trim()}\`\n`;
        report += `- After: \`${fix.after.trim()}\`\n\n`;
      }
    }

    report += '## Next Steps\n\n';
    report += '1. Test cart calculations with centavos\n';
    report += '2. Verify PHP peso formatting (₱1,299.00)\n';
    report += '3. Update API to send/receive centavos\n';
    report += '4. Test checkout with real amounts\n';

    return report;
  }
}

async function main() {
  const fixer = new PhpCurrencyFixer();

  const args = process.argv.slice(2);
  const all = args.includes('--all');

  try {
    if (all) {
      // Fix all files
      const srcPath = path.join(process.cwd(), 'src');
      await fixer.fixAllFiles(srcPath);
    } else {
      // Fix critical files only
      await fixer.fixCriticalFiles();
    }

    // Generate report
    const report = fixer.generateReport();
    await fs.promises.writeFile('PHP_CURRENCY_FIX_REPORT.md', report);
    console.log(chalk.green('\n✅ Report written to PHP_CURRENCY_FIX_REPORT.md'));

    console.log(chalk.green('\n✨ PHP currency fixing complete!'));
    console.log(chalk.yellow('\n⚠️  Important:'));
    console.log(chalk.yellow('   - All prices are now in centavos (integer)'));
    console.log(chalk.yellow('   - Use formatPrice() to display ₱ amounts'));
    console.log(chalk.yellow('   - Use toCentavos() to convert pesos to centavos'));
    console.log(chalk.yellow('   - Test all price calculations thoroughly'));

  } catch (error) {
    console.error(chalk.red('Error during currency fixing:'), error);
    process.exit(1);
  }
}

main().catch(console.error);