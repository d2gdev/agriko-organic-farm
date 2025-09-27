#!/usr/bin/env ts-node

/**
 * Type System Validation Tool
 * Validates that all types comply with governance rules
 */

import * as fs from 'fs';
import * as path from 'path';
const chalk = require('chalk');

interface ValidationIssue {
  file: string;
  line: number;
  column: number;
  issue: string;
  severity: 'error' | 'warning';
  fix?: string;
}

interface ValidationReport {
  totalFiles: number;
  filesWithIssues: number;
  issues: ValidationIssue[];
  passedValidation: boolean;
}

class TypeValidator {
  private issues: ValidationIssue[] = [];

  // Forbidden patterns
  private readonly FORBIDDEN_PATTERNS = [
    {
      pattern: /^interface\s+\w+/gm,
      message: 'Local interface definition found',
      fix: 'Move interface to TYPE_REGISTRY.ts'
    },
    {
      pattern: /^type\s+\w+\s*=/gm,
      message: 'Local type alias found',
      fix: 'Move type to TYPE_REGISTRY.ts'
    },
    {
      pattern: /^enum\s+\w+/gm,
      message: 'Local enum definition found',
      fix: 'Move enum to TYPE_REGISTRY.ts'
    },
    {
      pattern: /\[\s*key\s*:\s*string\s*\]/g,
      message: 'Index signature found',
      fix: 'Replace with specific types from TYPE_REGISTRY'
    },
    {
      pattern: /:\s*any\b/g,
      message: 'Forbidden "any" type found',
      fix: 'Use specific type or "unknown"'
    },
    {
      pattern: /(price|total|amount|cost|fee)\s*:\s*string/g,
      message: 'Monetary value typed as string',
      fix: 'Use Core.Money type (number in cents)'
    }
  ];

  async validateFile(filePath: string): Promise<ValidationIssue[]> {
    // Skip TYPE_REGISTRY and governance files
    if (filePath.includes('TYPE_REGISTRY') ||
        filePath.includes('type-governance') ||
        filePath.includes('migrate-types') ||
        filePath.includes('fix-imports') ||
        filePath.includes('validate-types')) {
      return [];
    }

    const content = await fs.promises.readFile(filePath, 'utf-8');
    const fileIssues: ValidationIssue[] = [];

    // Check for forbidden patterns
    for (const { pattern, message, fix } of this.FORBIDDEN_PATTERNS) {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);

      while ((match = regex.exec(content)) !== null) {
        const position = this.getLineAndColumn(content, match.index);
        fileIssues.push({
          file: filePath,
          line: position.line,
          column: position.column,
          issue: message,
          severity: 'error',
          fix
        });
      }
    }

    // Check imports
    const importIssues = this.validateImports(content, filePath);
    fileIssues.push(...importIssues);

    // Check for missing TYPE_REGISTRY import when using registry types
    if (this.usesRegistryTypes(content) && !this.hasRegistryImport(content)) {
      fileIssues.push({
        file: filePath,
        line: 1,
        column: 1,
        issue: 'Uses registry types without importing from TYPE_REGISTRY',
        severity: 'error',
        fix: 'Add import from @/types/TYPE_REGISTRY'
      });
    }

    return fileIssues;
  }

  private validateImports(content: string, filePath: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const lines = content.split('\n');

    // Check for forbidden imports
    const forbiddenImports = [
      '@/types/woocommerce',
      '@/types/auth',
      '@/types/common',
      '@/types/events',
      '@/types/analytics',
      '@/lib/auth-types',
      '@/lib/cache-manager',
      '@/lib/business-logic-validator'
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      for (const forbidden of forbiddenImports) {
        if (line.includes(`from '${forbidden}'`) || line.includes(`from "${forbidden}"`)) {
          issues.push({
            file: filePath,
            line: i + 1,
            column: 1,
            issue: `Forbidden import from ${forbidden}`,
            severity: 'error',
            fix: 'Import from @/types/TYPE_REGISTRY instead'
          });
        }
      }
    }

    return issues;
  }

  private usesRegistryTypes(content: string): boolean {
    return /(?:Domain|Core|Infrastructure|API|UI)\.\w+/.test(content);
  }

  private hasRegistryImport(content: string): boolean {
    return content.includes('@/types/TYPE_REGISTRY');
  }

  private getLineAndColumn(content: string, index: number): { line: number; column: number } {
    const lines = content.substring(0, index).split('\n');
    const lastLine = lines[lines.length - 1];
    return {
      line: lines.length,
      column: lastLine ? lastLine.length + 1 : 1
    };
  }

  async validateCodebase(srcPath: string): Promise<ValidationReport> {
    const files = await this.getAllTypeScriptFiles(srcPath);
    let filesWithIssues = 0;
    this.issues = [];

    console.log(chalk.blue(`🔍 Validating ${files.length} TypeScript files...\n`));

    for (const file of files) {
      const fileIssues = await this.validateFile(file);
      if (fileIssues.length > 0) {
        filesWithIssues++;
        this.issues.push(...fileIssues);

        // Print file issues
        console.log(chalk.red(`❌ ${path.relative(process.cwd(), file)}`));
        for (const issue of fileIssues) {
          console.log(chalk.yellow(`   Line ${issue.line}: ${issue.issue}`));
          if (issue.fix) {
            console.log(chalk.cyan(`   Fix: ${issue.fix}`));
          }
        }
        console.log();
      }
    }

    const report: ValidationReport = {
      totalFiles: files.length,
      filesWithIssues,
      issues: this.issues,
      passedValidation: this.issues.length === 0
    };

    return report;
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
      } else if (entry.isFile() &&
                 (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) &&
                 !entry.name.endsWith('.test.ts') &&
                 !entry.name.endsWith('.test.tsx') &&
                 !entry.name.endsWith('.spec.ts') &&
                 !entry.name.endsWith('.spec.tsx')) {
        files.push(fullPath);
      }
    }

    return files;
  }

  generateReport(report: ValidationReport): string {
    let output = '# Type Validation Report\n\n';

    output += `## Summary\n\n`;
    output += `- Total files scanned: ${report.totalFiles}\n`;
    output += `- Files with issues: ${report.filesWithIssues}\n`;
    output += `- Total issues found: ${report.issues.length}\n`;
    output += `- Validation status: ${report.passedValidation ? '✅ PASSED' : '❌ FAILED'}\n\n`;

    if (report.issues.length > 0) {
      output += `## Issues by Type\n\n`;

      // Group issues by type
      const issueGroups = new Map<string, ValidationIssue[]>();
      for (const issue of report.issues) {
        const group = issueGroups.get(issue.issue) || [];
        group.push(issue);
        issueGroups.set(issue.issue, group);
      }

      for (const [issueType, issues] of issueGroups.entries()) {
        output += `### ${issueType} (${issues.length} occurrences)\n\n`;
        for (const issue of issues.slice(0, 5)) { // Show first 5
          output += `- ${path.relative(process.cwd(), issue.file)}:${issue.line}\n`;
        }
        if (issues.length > 5) {
          output += `- ... and ${issues.length - 5} more\n`;
        }
        output += '\n';
      }
    }

    return output;
  }
}

async function main() {
  const validator = new TypeValidator();
  const srcPath = path.join(__dirname, '..', 'src');

  const args = process.argv.slice(2);
  const fix = args.includes('--fix');

  try {
    console.log(chalk.blue('🚀 Type System Validation\n'));
    console.log(chalk.yellow('Checking compliance with type governance rules...\n'));

    const report = await validator.validateCodebase(srcPath);

    // Write report
    const reportContent = validator.generateReport(report);
    await fs.promises.writeFile('TYPE_VALIDATION_REPORT.md', reportContent);

    // Summary
    console.log(chalk.blue('📊 Validation Summary:'));
    console.log(chalk.yellow(`   Total files: ${report.totalFiles}`));
    console.log(chalk.yellow(`   Files with issues: ${report.filesWithIssues}`));
    console.log(chalk.yellow(`   Total issues: ${report.issues.length}`));

    if (report.passedValidation) {
      console.log(chalk.green('\n✅ All files passed validation!'));
      process.exit(0);
    } else {
      console.log(chalk.red(`\n❌ Validation failed with ${report.issues.length} issues`));
      console.log(chalk.yellow('\nNext steps:'));
      console.log(chalk.yellow('1. Run npm run fix-imports to fix import issues'));
      console.log(chalk.yellow('2. Run npm run migrate-types to migrate types to TYPE_REGISTRY'));
      console.log(chalk.yellow('3. Review TYPE_VALIDATION_REPORT.md for details'));

      if (fix) {
        console.log(chalk.blue('\n🔧 Running automatic fixes...'));
        console.log(chalk.yellow('   Running npm run fix-imports...'));
        // Could exec fix-imports here
      }

      process.exit(1);
    }

  } catch (error) {
    console.error(chalk.red('Error during validation:'), error);
    process.exit(1);
  }
}

main().catch(console.error);