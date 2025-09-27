#!/usr/bin/env ts-node

/**
 * Automatically fix imports to use TYPE_REGISTRY
 */

import * as fs from 'fs';
import * as path from 'path';
const chalk = require('chalk');

interface ImportFix {
  file: string;
  oldImport: string;
  newImport: string;
  line: number;
}

class ImportFixer {
  private fixes: ImportFix[] = [];

  // Map of old imports to new registry imports
  private importMap = new Map<string, string>([
    // Product types
    ['@/types/woocommerce', '@/types/TYPE_REGISTRY'],
    ['@/lib/business-logic-validator', '@/types/TYPE_REGISTRY'],
    ['@/types/domain', '@/types/TYPE_REGISTRY'],

    // Auth types
    ['@/types/auth', '@/types/TYPE_REGISTRY'],
    ['@/lib/auth-types', '@/types/TYPE_REGISTRY'],
    ['@/lib/auth-refactor', '@/types/TYPE_REGISTRY'],

    // Cache types
    ['@/lib/cache-manager', '@/types/TYPE_REGISTRY'],
    ['@/lib/thread-safe-cache', '@/types/TYPE_REGISTRY'],

    // Event types
    ['@/types/events', '@/types/TYPE_REGISTRY'],
    ['@/types/events-refactor', '@/types/TYPE_REGISTRY'],

    // Common types
    ['@/types/common', '@/types/TYPE_REGISTRY'],
    ['@/types/analytics', '@/types/TYPE_REGISTRY'],
    ['@/types/ab-testing', '@/types/TYPE_REGISTRY'],
  ]);

  // Map of old type names to new namespaced names
  private typeNameMap = new Map<string, string>([
    // Domain types
    ['Product', 'Domain.Product'],
    ['WCProduct', 'Domain.Product'],
    ['WooCommerceProduct', 'Domain.Product'],
    ['DomainProduct', 'Domain.Product'],
    ['Order', 'Domain.Order'],
    ['WooCommerceOrder', 'Domain.Order'],
    ['User', 'Domain.User'],
    ['AuthUser', 'Domain.User'],
    ['Cart', 'Domain.Cart'],
    ['CartItem', 'Domain.CartItem'],

    // Core types
    ['ID', 'Core.ID'],
    ['Money', 'Core.Money'],
    ['Email', 'Core.Email'],
    ['ISODate', 'Core.ISODate'],

    // Infrastructure types
    ['CacheEntry', 'Infrastructure.CacheEntry'],
    ['AuthResult', 'Infrastructure.AuthResult'],
    ['Session', 'Infrastructure.Session'],
    ['Event', 'Infrastructure.Event'],
    ['EventType', 'Infrastructure.EventType'],

    // API types
    ['Response', 'API.Response'],
    ['ApiResponse', 'API.Response'],
    ['PaginatedResponse', 'API.PaginatedResponse'],
    ['SearchParams', 'API.SearchParams'],
    ['SearchResult', 'API.SearchResult'],
  ]);

  async fixFile(filePath: string): Promise<boolean> {
    // Skip TYPE_REGISTRY and related files
    if (filePath.includes('TYPE_REGISTRY') ||
        filePath.includes('type-governance') ||
        filePath.includes('migrate-types') ||
        filePath.includes('fix-imports')) {
      return false;
    }

    let content = await fs.promises.readFile(filePath, 'utf-8');
    let modified = false;
    const lines = content.split('\n');

    // Step 1: Fix import statements
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for imports to replace
      for (const [oldPath, newPath] of this.importMap.entries()) {
        if (line && (line.includes(`from '${oldPath}'`) || line.includes(`from "${oldPath}"`))) {
          const oldLine = line;

          // Extract what's being imported
          const importMatch = line.match(/import\s+{([^}]+)}\s+from/);
          if (importMatch && importMatch[1]) {
            const imports = importMatch[1].split(',').map(s => s.trim());
            const newImports = this.transformImports(imports);

            // Build new import statement
            lines[i] = `import { ${newImports.join(', ')} } from '${newPath}';`;

            this.fixes.push({
              file: filePath,
              oldImport: oldLine,
              newImport: lines[i] || '',
              line: i + 1
            });

            modified = true;
          }
        }
      }
    }

    // Step 2: Fix type usage in the code
    content = lines.join('\n');

    // Replace type names with namespaced versions
    for (const [oldName, newName] of this.typeNameMap.entries()) {
      // Match type usage patterns
      const patterns = [
        // Type annotations
        new RegExp(`:\\s*${oldName}\\b`, 'g'),
        // Generic parameters
        new RegExp(`<${oldName}\\b`, 'g'),
        // Type assertions
        new RegExp(`as\\s+${oldName}\\b`, 'g'),
        // Extends clauses
        new RegExp(`extends\\s+${oldName}\\b`, 'g'),
        // Implements clauses
        new RegExp(`implements\\s+${oldName}\\b`, 'g'),
      ];

      for (const pattern of patterns) {
        const newContent = content.replace(pattern, (match) => {
          return match.replace(oldName, newName);
        });

        if (newContent !== content) {
          content = newContent;
          modified = true;
        }
      }
    }

    // Step 3: Fix money fields
    content = this.fixMoneyFields(content);

    // Step 4: Add missing imports if types are used but not imported
    content = this.addMissingImports(content, filePath);

    // Write back if modified
    if (modified) {
      await fs.promises.writeFile(filePath, content);
      return true;
    }

    return false;
  }

  private transformImports(imports: string[]): string[] {
    const registryImports = new Set<string>();

    for (const imp of imports) {
      const cleanImport = imp.replace(/\s+as\s+.*/, '').trim();

      // Check if this type should be namespaced
      if (this.typeNameMap.has(cleanImport)) {
        const newName = this.typeNameMap.get(cleanImport);
        if (newName) {
          const namespaceParts = newName.split('.');
          if (namespaceParts[0]) {
            registryImports.add(namespaceParts[0]);
          }
        }
      } else {
        // Keep as-is if not in map
        registryImports.add(cleanImport);
      }
    }

    // Always include Core for branded types
    registryImports.add('Core');

    return Array.from(registryImports).sort();
  }

  private fixMoneyFields(content: string): string {
    // Fix common money field patterns
    const moneyPatterns = [
      // Interface/type fields
      { pattern: /(\w+):\s*string;(\s*\/\/.*money.*)?/gi, replacement: '$1: Core.Money;$2' },
      // Price-specific fields
      { pattern: /price:\s*string/g, replacement: 'price: Core.Money' },
      { pattern: /total:\s*string/g, replacement: 'total: Core.Money' },
      { pattern: /amount:\s*string/g, replacement: 'amount: Core.Money' },
      { pattern: /cost:\s*string/g, replacement: 'cost: Core.Money' },
      { pattern: /fee:\s*string/g, replacement: 'fee: Core.Money' },
      // parseFloat patterns for money
      { pattern: /parseFloat\(([^)]+\.(?:price|total|amount|cost|fee))\)/g, replacement: '$1' },
    ];

    let modified = content;
    for (const { pattern, replacement } of moneyPatterns) {
      modified = modified.replace(pattern, replacement);
    }

    return modified;
  }

  private addMissingImports(content: string, filePath: string): string {
    // Check if file uses registry types without importing
    const usesRegistryTypes = /(?:Domain|Core|Infrastructure|API|UI)\.\w+/.test(content);
    const hasRegistryImport = content.includes('@/types/TYPE_REGISTRY');

    if (usesRegistryTypes && !hasRegistryImport) {
      // Find which namespaces are used
      const namespaces = new Set<string>();
      const namespacePattern = /\b(Domain|Core|Infrastructure|API|UI)\.\w+/g;
      let match;

      while ((match = namespacePattern.exec(content)) !== null) {
        if (match[1]) {
          namespaces.add(match[1]);
        }
      }

      if (namespaces.size > 0) {
        // Add import at the top of the file (after 'use client' if present)
        const importStatement = `import { ${Array.from(namespaces).sort().join(', ')} } from '@/types/TYPE_REGISTRY';\n`;

        if (content.startsWith("'use client'")) {
          content = content.replace("'use client';\n", `'use client';\n\n${importStatement}`);
        } else {
          content = importStatement + content;
        }
      }
    }

    return content;
  }

  async fixAllFiles(srcPath: string): Promise<void> {
    const files = await this.getAllTypeScriptFiles(srcPath);
    let fixedCount = 0;

    console.log(chalk.blue(`🔧 Fixing imports in ${files.length} files...\n`));

    for (const file of files) {
      const fixed = await this.fixFile(file);
      if (fixed) {
        fixedCount++;
        console.log(chalk.green(`✅ ${path.relative(process.cwd(), file)}`));
      }
    }

    console.log(chalk.blue(`\n📊 Import Fix Summary:`));
    console.log(chalk.yellow(`   Files processed: ${files.length}`));
    console.log(chalk.green(`   Files fixed: ${fixedCount}`));
    console.log(chalk.yellow(`   Total fixes: ${this.fixes.length}`));
  }

  private async getAllTypeScriptFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory() && !entry.name.includes('node_modules') && !entry.name.startsWith('.')) {
        files.push(...await this.getAllTypeScriptFiles(fullPath));
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        files.push(fullPath);
      }
    }

    return files;
  }

  generateReport(): string {
    let report = '# Import Fix Report\n\n';

    if (this.fixes.length === 0) {
      report += 'No imports needed fixing.\n';
      return report;
    }

    report += `## Fixed ${this.fixes.length} imports\n\n`;

    // Group by file
    const byFile = new Map<string, ImportFix[]>();
    for (const fix of this.fixes) {
      const fixes = byFile.get(fix.file) || [];
      fixes.push(fix);
      byFile.set(fix.file, fixes);
    }

    for (const [file, fixes] of byFile.entries()) {
      report += `### ${path.relative(process.cwd(), file)}\n\n`;
      for (const fix of fixes) {
        report += `Line ${fix.line}:\n`;
        report += `- Old: \`${fix.oldImport}\`\n`;
        report += `- New: \`${fix.newImport}\`\n\n`;
      }
    }

    return report;
  }
}

async function main() {
  const fixer = new ImportFixer();
  const srcPath = path.join(__dirname, '..', 'src');

  // Parse arguments
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const singleFile = args.find(arg => arg.endsWith('.ts') || arg.endsWith('.tsx'));

  try {
    if (singleFile) {
      // Fix single file
      console.log(chalk.blue(`🔧 Fixing imports in ${singleFile}...\n`));
      const fixed = await fixer.fixFile(singleFile);

      if (fixed) {
        console.log(chalk.green(`✅ Fixed imports in ${singleFile}`));
      } else {
        console.log(chalk.yellow(`No changes needed in ${singleFile}`));
      }
    } else {
      // Fix all files
      await fixer.fixAllFiles(srcPath);
    }

    // Generate report
    const report = fixer.generateReport();
    await fs.promises.writeFile('IMPORT_FIX_REPORT.md', report);
    console.log(chalk.green('\n✅ Report written to IMPORT_FIX_REPORT.md'));

    console.log(chalk.green('\n✨ Import fixing complete!'));
    console.log(chalk.yellow('   Next steps:'));
    console.log(chalk.yellow('   1. Review changes with git diff'));
    console.log(chalk.yellow('   2. Run npm run type-check'));
    console.log(chalk.yellow('   3. Run npm run validate-types'));

  } catch (error) {
    console.error(chalk.red('Error during import fixing:'), error);
    process.exit(1);
  }
}

main().catch(console.error);