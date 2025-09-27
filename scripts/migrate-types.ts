#!/usr/bin/env ts-node

/**
 * Automated Type Migration Tool
 * Migrates existing types to TYPE_REGISTRY
 */

import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
const chalk = require('chalk');

interface MigrationCandidate {
  file: string;
  typeName: string;
  definition: string;
  line: number;
  kind: 'interface' | 'type' | 'enum';
  imports: string[];
  duplicates: string[];
}

interface MigrationReport {
  candidates: MigrationCandidate[];
  duplicates: Map<string, string[]>;
  moneyFields: Array<{ file: string; field: string; line: number }>;
  indexSignatures: Array<{ file: string; type: string; line: number }>;
  anyTypes: Array<{ file: string; location: string; line: number }>;
}

class TypeMigrator {
  private candidates: MigrationCandidate[] = [];
  private typeMap = new Map<string, string[]>(); // typeName -> [files]
  private moneyFields: Array<{ file: string; field: string; line: number }> = [];
  private indexSignatures: Array<{ file: string; type: string; line: number }> = [];
  private anyTypes: Array<{ file: string; location: string; line: number }> = [];

  async analyzeCodebase(srcPath: string): Promise<MigrationReport> {
    console.log(chalk.blue('🔍 Analyzing codebase for type migrations...\n'));

    const files = await this.getAllTypeScriptFiles(srcPath);

    for (const file of files) {
      // Skip TYPE_REGISTRY and governance files
      if (file.includes('TYPE_REGISTRY') || file.includes('type-governance')) {
        continue;
      }

      await this.analyzeFile(file);
    }

    // Find duplicates
    const duplicates = new Map<string, string[]>();
    for (const [typeName, files] of this.typeMap.entries()) {
      if (files.length > 1) {
        duplicates.set(typeName, files);
      }
    }

    return {
      candidates: this.candidates,
      duplicates,
      moneyFields: this.moneyFields,
      indexSignatures: this.indexSignatures,
      anyTypes: this.anyTypes
    };
  }

  private async analyzeFile(filePath: string): Promise<void> {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true
    );

    this.visitNode(sourceFile, filePath, content);
  }

  private visitNode(node: ts.Node, filePath: string, content: string): void {
    // Check for interfaces
    if (ts.isInterfaceDeclaration(node)) {
      this.extractInterface(node, filePath, content);
    }

    // Check for type aliases
    if (ts.isTypeAliasDeclaration(node)) {
      this.extractTypeAlias(node, filePath, content);
    }

    // Check for enums
    if (ts.isEnumDeclaration(node)) {
      this.extractEnum(node, filePath, content);
    }

    // Check for money fields (string prices)
    if (ts.isPropertySignature(node) || ts.isPropertyDeclaration(node)) {
      this.checkMoneyField(node, filePath);
    }

    // Check for index signatures
    if (ts.isIndexSignatureDeclaration(node)) {
      const line = this.getLineNumber(node, filePath);
      this.indexSignatures.push({
        file: filePath,
        type: node.parent && ts.isInterfaceDeclaration(node.parent)
          ? node.parent.name?.text || 'unknown'
          : 'unknown',
        line
      });
    }

    // Check for 'any' type
    if (node.kind === ts.SyntaxKind.AnyKeyword) {
      const line = this.getLineNumber(node, filePath);
      this.anyTypes.push({
        file: filePath,
        location: this.getParentContext(node),
        line
      });
    }

    // Recurse through children
    ts.forEachChild(node, child => this.visitNode(child, filePath, content));
  }

  private extractInterface(node: ts.InterfaceDeclaration, filePath: string, content: string): void {
    const typeName = node.name?.text || 'Unknown';
    const definition = node.getText();
    const line = this.getLineNumber(node, filePath);

    this.candidates.push({
      file: filePath,
      typeName,
      definition,
      line,
      kind: 'interface',
      imports: this.extractImports(node),
      duplicates: []
    });

    // Track for duplicate detection
    const files = this.typeMap.get(typeName) || [];
    files.push(filePath);
    this.typeMap.set(typeName, files);
  }

  private extractTypeAlias(node: ts.TypeAliasDeclaration, filePath: string, content: string): void {
    const typeName = node.name?.text || 'Unknown';
    const definition = node.getText();
    const line = this.getLineNumber(node, filePath);

    this.candidates.push({
      file: filePath,
      typeName,
      definition,
      line,
      kind: 'type',
      imports: this.extractImports(node),
      duplicates: []
    });

    // Track for duplicate detection
    const files = this.typeMap.get(typeName) || [];
    files.push(filePath);
    this.typeMap.set(typeName, files);
  }

  private extractEnum(node: ts.EnumDeclaration, filePath: string, content: string): void {
    const typeName = node.name?.text || 'Unknown';
    const definition = node.getText();
    const line = this.getLineNumber(node, filePath);

    this.candidates.push({
      file: filePath,
      typeName,
      definition,
      line,
      kind: 'enum',
      imports: [],
      duplicates: []
    });

    // Track for duplicate detection
    const files = this.typeMap.get(typeName) || [];
    files.push(filePath);
    this.typeMap.set(typeName, files);
  }

  private checkMoneyField(node: ts.PropertySignature | ts.PropertyDeclaration, filePath: string): void {
    const name = node.name?.getText() || '';
    const type = node.type?.getText() || '';

    // Check if this looks like a money field with string type
    const moneyKeywords = ['price', 'total', 'amount', 'cost', 'fee', 'payment', 'balance', 'credit', 'debit'];
    const isMoneyField = moneyKeywords.some(keyword => name.toLowerCase().includes(keyword));
    const isStringType = type.includes('string');

    if (isMoneyField && isStringType) {
      const line = this.getLineNumber(node, filePath);
      this.moneyFields.push({
        file: filePath,
        field: `${name}: ${type}`,
        line
      });
    }
  }

  private getLineNumber(node: ts.Node, filePath: string): number {
    const sourceFile = node.getSourceFile();
    if (sourceFile) {
      const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
      return line + 1;
    }
    return 0;
  }

  private getParentContext(node: ts.Node): string {
    let parent = node.parent;
    while (parent) {
      if (ts.isInterfaceDeclaration(parent) ||
          ts.isTypeAliasDeclaration(parent) ||
          ts.isFunctionDeclaration(parent) ||
          ts.isMethodDeclaration(parent)) {
        return parent.name?.getText() || 'unknown';
      }
      parent = parent.parent;
    }
    return 'unknown';
  }

  private extractImports(node: ts.Node): string[] {
    const imports: string[] = [];
    // Simplified - would need more complex analysis for real imports
    return imports;
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

  async generateMigrationPlan(report: MigrationReport): Promise<string> {
    let plan = '# Type Migration Plan\n\n';

    // Duplicates section
    if (report.duplicates.size > 0) {
      plan += '## Duplicate Types to Consolidate\n\n';
      for (const [typeName, files] of report.duplicates.entries()) {
        plan += `### ${typeName} (${files.length} copies)\n`;
        files.forEach(file => {
          plan += `- ${path.relative(process.cwd(), file)}\n`;
        });
        plan += '\n';
      }
    }

    // Money fields to fix
    if (report.moneyFields.length > 0) {
      plan += '## String Money Fields to Convert\n\n';
      plan += '| File | Field | Line |\n';
      plan += '|------|-------|------|\n';
      report.moneyFields.forEach(({ file, field, line }) => {
        plan += `| ${path.relative(process.cwd(), file)} | ${field} | ${line} |\n`;
      });
      plan += '\n';
    }

    // Index signatures to remove
    if (report.indexSignatures.length > 0) {
      plan += '## Index Signatures to Remove\n\n';
      plan += '| File | Type | Line |\n';
      plan += '|------|------|------|\n';
      report.indexSignatures.forEach(({ file, type, line }) => {
        plan += `| ${path.relative(process.cwd(), file)} | ${type} | ${line} |\n`;
      });
      plan += '\n';
    }

    // Any types to fix
    if (report.anyTypes.length > 0) {
      plan += '## Any Types to Replace\n\n';
      plan += '| File | Location | Line |\n';
      plan += '|------|----------|------|\n';
      report.anyTypes.forEach(({ file, location, line }) => {
        plan += `| ${path.relative(process.cwd(), file)} | ${location} | ${line} |\n`;
      });
      plan += '\n';
    }

    // Migration priority
    plan += '## Migration Priority\n\n';
    plan += '1. **Critical** - Types with 10+ duplicates\n';
    plan += '2. **High** - Money fields and financial types\n';
    plan += '3. **Medium** - Types with 2-9 duplicates\n';
    plan += '4. **Low** - Single-use types\n\n';

    // Statistics
    plan += '## Statistics\n\n';
    plan += `- Total types found: ${report.candidates.length}\n`;
    plan += `- Duplicate type names: ${report.duplicates.size}\n`;
    plan += `- String money fields: ${report.moneyFields.length}\n`;
    plan += `- Index signatures: ${report.indexSignatures.length}\n`;
    plan += `- Any types: ${report.anyTypes.length}\n`;

    return plan;
  }

  async generateRegistryAdditions(report: MigrationReport): Promise<string> {
    let code = '// Generated TYPE_REGISTRY additions\n\n';

    // Group by suspected category
    const categorized = {
      domain: [] as MigrationCandidate[],
      api: [] as MigrationCandidate[],
      ui: [] as MigrationCandidate[],
      infrastructure: [] as MigrationCandidate[]
    };

    for (const candidate of report.candidates) {
      if (candidate.file.includes('/api/') || candidate.typeName.includes('Response') || candidate.typeName.includes('Request')) {
        categorized.api.push(candidate);
      } else if (candidate.file.includes('/components/') || candidate.typeName.includes('Props')) {
        categorized.ui.push(candidate);
      } else if (candidate.typeName.includes('Cache') || candidate.typeName.includes('Config') || candidate.typeName.includes('Session')) {
        categorized.infrastructure.push(candidate);
      } else {
        categorized.domain.push(candidate);
      }
    }

    // Generate code for each category
    for (const [category, candidates] of Object.entries(categorized)) {
      if (candidates.length === 0) continue;

      code += `// ============================================================================\n`;
      code += `// ${category.toUpperCase()} TYPES\n`;
      code += `// ============================================================================\n\n`;
      code += `export namespace ${category.charAt(0).toUpperCase() + category.slice(1)} {\n`;

      for (const candidate of candidates.slice(0, 10)) { // Limit to first 10 for example
        code += `  /**\n`;
        code += `   * ${candidate.typeName}\n`;
        code += `   * Migrated from: ${path.relative(process.cwd(), candidate.file)}\n`;
        code += `   * TODO: Add owner and justification\n`;
        code += `   */\n`;
        code += this.convertDefinition(candidate.definition);
        code += '\n\n';
      }

      code += '}\n\n';
    }

    return code;
  }

  private convertDefinition(definition: string): string {
    let converted = definition;

    // Fix money fields
    converted = converted.replace(/price:\s*string/g, 'price: Core.Money');
    converted = converted.replace(/total:\s*string/g, 'total: Core.Money');
    converted = converted.replace(/amount:\s*string/g, 'amount: Core.Money');

    // Fix ID fields
    converted = converted.replace(/id:\s*string/g, 'id: Core.ID');
    converted = converted.replace(/userId:\s*string/g, 'userId: Core.ID');
    converted = converted.replace(/productId:\s*string/g, 'productId: Core.ID');

    // Fix date fields
    converted = converted.replace(/createdAt:\s*string/g, 'createdAt: Core.ISODate');
    converted = converted.replace(/updatedAt:\s*string/g, 'updatedAt: Core.ISODate');

    // Fix email fields
    converted = converted.replace(/email:\s*string/g, 'email: Core.Email');

    // Remove any types
    converted = converted.replace(/:\s*any\b/g, ': unknown /* TODO: Fix type */');

    // Indent
    return converted.split('\n').map(line => '  ' + line).join('\n');
  }
}

async function main() {
  const migrator = new TypeMigrator();
  const srcPath = path.join(__dirname, '..', 'src');

  try {
    // Analyze codebase
    const report = await migrator.analyzeCodebase(srcPath);

    // Generate migration plan
    const plan = await migrator.generateMigrationPlan(report);
    await fs.promises.writeFile('MIGRATION_PLAN.md', plan);
    console.log(chalk.green('✅ Migration plan written to MIGRATION_PLAN.md'));

    // Generate registry additions
    const additions = await migrator.generateRegistryAdditions(report);
    await fs.promises.writeFile('TYPE_REGISTRY_ADDITIONS.ts', additions);
    console.log(chalk.green('✅ Registry additions written to TYPE_REGISTRY_ADDITIONS.ts'));

    // Display summary
    console.log(chalk.blue('\n📊 Migration Summary:'));
    console.log(chalk.yellow(`   Total types to migrate: ${report.candidates.length}`));
    console.log(chalk.red(`   Duplicate type names: ${report.duplicates.size}`));
    console.log(chalk.red(`   String money fields: ${report.moneyFields.length}`));
    console.log(chalk.red(`   Index signatures: ${report.indexSignatures.length}`));
    console.log(chalk.red(`   Any types: ${report.anyTypes.length}`));

    // Show top duplicates
    if (report.duplicates.size > 0) {
      console.log(chalk.blue('\n🔥 Top Duplicate Types:'));
      const sorted = Array.from(report.duplicates.entries())
        .sort(([, a], [, b]) => b.length - a.length)
        .slice(0, 5);

      for (const [typeName, files] of sorted) {
        console.log(chalk.yellow(`   ${typeName}: ${files.length} copies`));
      }
    }

    // Show critical money fields
    if (report.moneyFields.length > 0) {
      console.log(chalk.blue('\n💰 Critical Money Fields (first 5):'));
      report.moneyFields.slice(0, 5).forEach(({ file, field, line }) => {
        console.log(chalk.red(`   ${path.basename(file)}:${line} - ${field}`));
      });
    }

    console.log(chalk.green('\n✨ Migration analysis complete!'));
    console.log(chalk.yellow('   Next steps:'));
    console.log(chalk.yellow('   1. Review MIGRATION_PLAN.md'));
    console.log(chalk.yellow('   2. Review TYPE_REGISTRY_ADDITIONS.ts'));
    console.log(chalk.yellow('   3. Run npm run validate-types to check compliance'));

  } catch (error) {
    console.error(chalk.red('Error during migration analysis:'), error);
    process.exit(1);
  }
}

main().catch(console.error);