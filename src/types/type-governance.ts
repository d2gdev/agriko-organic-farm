/**
 * TYPE GOVERNANCE SYSTEM
 *
 * Enforces strict type usage rules:
 * 1. All types must come from TYPE_REGISTRY
 * 2. No local interface/type definitions allowed
 * 3. Automatic validation during build
 * 4. Type addition requires approval workflow
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { REGISTERED_TYPES, TypeRegistration } from './TYPE_REGISTRY';

// ============================================================================
// TYPE USAGE VALIDATOR
// ============================================================================

export class TypeGovernance {
  private static readonly REGISTRY_PATH = path.join(__dirname, 'TYPE_REGISTRY.ts');
  private static readonly FORBIDDEN_PATTERNS = [
    /^interface\s+\w+/gm,           // Local interface definitions
    /^type\s+\w+\s*=/gm,            // Local type aliases
    /^enum\s+\w+/gm,                // Local enum definitions
    /\[\s*key\s*:\s*string\s*\]/g,  // Index signatures
    /:\s*any\b/g,                   // Any type usage
    /Record\s*<\s*string\s*,\s*unknown\s*>/g, // Weak Record types
    /price\s*:\s*string/g,          // String prices

    // NEW RULES TO PREVENT TYPE ASSERTION ABUSE
    /\s+as\s+any(?!\[\])/g,         // 'as any' assertions (except arrays)
    /\s+as\s+unknown\s+as\s+/g,     // 'as unknown as Type' double assertions
    /\|\|\s*\(\w+\s+as\s+[A-Z]/g,   // Fallback type assertions like: || (0 as Core.Money)
    /parseFloat\([^)]+\)\s*as\s+/g, // parseFloat(...) as Type patterns
    /parseInt\([^)]+\)\s*as\s+/g,   // parseInt(...) as Type patterns
    /Number\([^)]+\)\s*as\s+/g,     // Number(...) as Type patterns
    /\s+as\s+Core\.Money/g,         // Specific Core.Money assertions
    /\(\d+\s+as\s+Core\.Money\)/g,  // Literal number as Core.Money

    // MONEY RELATED VIOLATIONS
    /parsePrice\(/g,                // Old parsePrice function usage
    /safePriceMultiply\(/g,         // Old safePriceMultiply function usage
    /calculateDiscountPercentage\(/g, // Old calculateDiscountPercentage usage
    /legacyParseFloat\(/g,          // Old legacyParseFloat function usage
    /price-validation/g,            // Any imports from deleted file

    // UNSAFE PATTERNS
    /as\s+any\[\]/g,                // Array type assertions
    /\s+as\s+\w+\[\]/g,             // Array type assertions
    /Object\.assign\([^)]*as\s+/g,  // Object.assign with type assertions
  ];

  /**
   * Validate that a file only uses types from the registry
   */
  static async validateFile(filePath: string): Promise<ValidationResult> {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    const violations: Violation[] = [];

    // Skip the registry file itself
    if (filePath.includes('TYPE_REGISTRY.ts')) {
      return { valid: true, violations: [] };
    }

    // Check for forbidden patterns
    for (const pattern of this.FORBIDDEN_PATTERNS) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        violations.push({
          file: filePath,
          line: lineNumber,
          pattern: pattern.source,
          message: `Forbidden pattern detected: ${match[0]}`,
          severity: 'error'
        });
      }
    }

    // Check that imports are from TYPE_REGISTRY
    const importPattern = /import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"]/g;
    const imports = [...content.matchAll(importPattern)];

    for (const importMatch of imports) {
      const importPath = importMatch[2];
      if (!importPath) continue;

      // Allow only imports from TYPE_REGISTRY or approved libraries
      if (!this.isApprovedImport(importPath)) {
        const lineNumber = content.substring(0, importMatch.index).split('\n').length;
        violations.push({
          file: filePath,
          line: lineNumber,
          pattern: 'import',
          message: `Types must be imported from TYPE_REGISTRY, not ${importPath}`,
          severity: 'error'
        });
      }
    }

    // Add specific validation for our past crimes
    violations.push(...this.validateTypeAssertions(content, filePath));
    violations.push(...this.validateMoneyUsage(content, filePath));
    violations.push(...this.validateExternalDataHandling(content, filePath));

    return {
      valid: violations.length === 0,
      violations
    };
  }

  /**
   * Check if an import is from an approved source
   */
  private static isApprovedImport(importPath: string): boolean {
    const approved = [
      '@/types/TYPE_REGISTRY',
      './TYPE_REGISTRY',
      '../TYPE_REGISTRY',
      'react',
      'next',
      'zod'
    ];

    return approved.some(path => importPath.includes(path));
  }

  /**
   * Validate type assertions - catch our past crimes
   */
  private static validateTypeAssertions(content: string, filePath: string): Violation[] {
    const violations: Violation[] = [];

    // Type assertion patterns we used to abuse
    const assertionPatterns = [
      {
        pattern: /\s+as\s+any(?!\[\])/g,
        message: 'Type assertion "as any" detected - use proper typing instead'
      },
      {
        pattern: /\s+as\s+unknown\s+as\s+/g,
        message: 'Double type assertion "as unknown as" detected - this is lying to the compiler'
      },
      {
        pattern: /\|\|\s*\([\w.]+\s+as\s+[A-Z]/g,
        message: 'Fallback type assertion detected - use proper default values instead'
      },
      {
        pattern: /parseFloat\([^)]+\)\s*as\s+/g,
        message: 'parseFloat with type assertion - use Money.parse() instead'
      },
      {
        pattern: /parseInt\([^)]+\)\s*as\s+/g,
        message: 'parseInt with type assertion - use proper number validation'
      },
      {
        pattern: /Number\([^)]+\)\s*as\s+/g,
        message: 'Number() with type assertion - use proper conversion methods'
      },
      {
        pattern: /\(\d+\s+as\s+Core\.Money\)/g,
        message: 'Literal number as Core.Money - use Money.pesos() or Money.centavos()'
      },
      {
        pattern: /Object\.assign\([^)]*as\s+/g,
        message: 'Object.assign with type assertion - use proper object construction'
      }
    ];

    for (const { pattern, message } of assertionPatterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        violations.push({
          file: filePath,
          line: lineNumber,
          pattern: pattern.source,
          message: `${message}: ${match[0].trim()}`,
          severity: 'error'
        });
      }
    }

    return violations;
  }

  /**
   * Validate money-related violations
   */
  private static validateMoneyUsage(content: string, filePath: string): Violation[] {
    const violations: Violation[] = [];

    const moneyPatterns = [
      {
        pattern: /parsePrice\(/g,
        message: 'parsePrice function is deleted - use Money.parse() instead'
      },
      {
        pattern: /safePriceMultiply\(/g,
        message: 'safePriceMultiply function is deleted - use Money arithmetic instead'
      },
      {
        pattern: /calculateDiscountPercentage\(/g,
        message: 'calculateDiscountPercentage function is deleted - use Money.multiply() instead'
      },
      {
        pattern: /legacyParseFloat\(/g,
        message: 'legacyParseFloat function is deleted - use Money.parse() instead'
      },
      {
        pattern: /price-validation/g,
        message: 'price-validation file is deleted - import Money class instead'
      },
      {
        pattern: /price\s*:\s*string/g,
        message: 'Price as string detected - use Money type instead'
      },
      {
        pattern: /total\s*:\s*string/g,
        message: 'Total as string detected - use Money type instead'
      },
      {
        pattern: /amount\s*:\s*string/g,
        message: 'Amount as string detected - use Money type instead'
      },
      {
        pattern: /\$\{.*price.*\}/g,
        message: 'String interpolation with price - use Money.format() instead'
      }
    ];

    for (const { pattern, message } of moneyPatterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        violations.push({
          file: filePath,
          line: lineNumber,
          pattern: pattern.source,
          message: `${message}: ${match[0].trim()}`,
          severity: 'error'
        });
      }
    }

    return violations;
  }

  /**
   * Validate external data handling - prevent unsafe type assumptions
   */
  private static validateExternalDataHandling(content: string, filePath: string): Violation[] {
    const violations: Violation[] = [];

    const externalDataPatterns = [
      {
        pattern: /\.price\s*\|\|\s*'0'/g,
        message: 'Price fallback to string detected - use Money.parse() with proper defaults'
      },
      {
        pattern: /\.regular_price\s*\|\|\s*'0'/g,
        message: 'Regular price fallback to string detected - use Money.parse() instead'
      },
      {
        pattern: /\.sale_price\s*\|\|\s*'0'/g,
        message: 'Sale price fallback to string detected - use Money.parse() instead'
      },
      {
        pattern: /product\.\w+\s+as\s+/g,
        message: 'Product property type assertion - validate external data properly'
      },
      {
        pattern: /response\.data\s+as\s+/g,
        message: 'API response type assertion - use runtime validation instead'
      },
      {
        pattern: /JSON\.parse\([^)]+\)\s+as\s+/g,
        message: 'JSON.parse with type assertion - validate parsed data at runtime'
      },
      {
        pattern: /fetch\([^)]+\)[\s\S]*?as\s+/g,
        message: 'Fetch response type assertion - validate API responses properly'
      }
    ];

    for (const { pattern, message } of externalDataPatterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        violations.push({
          file: filePath,
          line: lineNumber,
          pattern: pattern.source,
          message: `${message}: ${match[0].trim()}`,
          severity: 'error'
        });
      }
    }

    return violations;
  }

  /**
   * Validate entire codebase
   */
  static async validateCodebase(srcPath: string): Promise<CodebaseValidationResult> {
    const results: ValidationResult[] = [];
    const files = await this.getAllTypeScriptFiles(srcPath);

    for (const file of files) {
      const result = await this.validateFile(file);
      if (!result.valid) {
        results.push(result);
      }
    }

    return {
      valid: results.length === 0,
      totalFiles: files.length,
      violationCount: results.reduce((sum, r) => sum + r.violations.length, 0),
      results
    };
  }

  /**
   * Get all TypeScript files recursively
   */
  private static async getAllTypeScriptFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory() && !entry.name.includes('node_modules')) {
        files.push(...await this.getAllTypeScriptFiles(fullPath));
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        files.push(fullPath);
      }
    }

    return files;
  }

  /**
   * Generate hash of the type registry for integrity checks
   */
  static async generateRegistryHash(): Promise<string> {
    const content = await fs.promises.readFile(this.REGISTRY_PATH, 'utf-8');
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Verify registry hasn't been tampered with
   */
  static async verifyRegistryIntegrity(expectedHash: string): Promise<boolean> {
    const currentHash = await this.generateRegistryHash();
    return currentHash === expectedHash;
  }
}

// ============================================================================
// TYPE ADDITION WORKFLOW
// ============================================================================

export class TypeAdditionRequest {
  constructor(
    public readonly typeName: string,
    public readonly category: 'core' | 'domain' | 'api' | 'ui' | 'infrastructure',
    public readonly definition: string,
    public readonly owner: string,
    public readonly justification: string,
    public readonly similarTypes: string[],
    public readonly whyNotReuse?: string
  ) {}

  /**
   * Validate the type addition request
   */
  async validate(): Promise<TypeValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check name uniqueness
    if (this.typeExists()) {
      errors.push(`Type ${this.typeName} already exists in registry`);
    }

    // Check for forbidden patterns in definition
    if (this.definition.includes('[key: string]')) {
      errors.push('Index signatures are not allowed');
    }

    if (this.definition.includes(': any')) {
      errors.push('Any type is not allowed');
    }

    if (this.definition.includes('price: string') ||
        this.definition.includes('total: string') ||
        this.definition.includes('amount: string')) {
      errors.push('Monetary values must use Core.Money type, not string');
    }

    // Check for similar types
    if (this.similarTypes.length > 0 && !this.whyNotReuse) {
      warnings.push('Similar types exist but no justification provided for not reusing them');
    }

    // Check owner format
    if (!this.owner.startsWith('@')) {
      warnings.push('Owner should be in format @team-name or @username');
    }

    // Check justification length
    if (this.justification.length < 20) {
      errors.push('Business justification must be at least 20 characters');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      canProceed: errors.length === 0
    };
  }

  /**
   * Check if type already exists
   */
  private typeExists(): boolean {
    return REGISTERED_TYPES.some(type => type.name === this.typeName);
  }

  /**
   * Generate the code to add to TYPE_REGISTRY
   */
  generateCode(): string {
    return `
  /**
   * ${this.typeName}
   * Owner: ${this.owner}
   * Approved: ${new Date().toISOString().split('T')[0]}
   * Justification: ${this.justification}
   */
  ${this.definition}`;
  }

  /**
   * Generate the registration entry
   */
  generateRegistration(): TypeRegistration {
    return {
      name: `${this.category}.${this.typeName}`,
      category: this.category,
      owner: this.owner,
      approved: false, // Requires manual approval
      businessJustification: this.justification,
      duplicateCheck: {
        searched: true,
        similarTypes: this.similarTypes,
        whyNotReused: this.whyNotReuse
      }
    };
  }
}

// ============================================================================
// BUILD-TIME ENFORCEMENT
// ============================================================================

/**
 * ESLint rule to enforce type registry usage
 */
export const eslintRule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce all types come from TYPE_REGISTRY',
      category: 'Type Safety',
      recommended: true
    },
    messages: {
      localType: 'Local type definitions are forbidden. Use TYPE_REGISTRY instead.',
      wrongImport: 'Types must be imported from @/types/TYPE_REGISTRY',
      indexSignature: 'Index signatures are forbidden. Use specific types.',
      anyType: 'Any type is forbidden. Use specific types from TYPE_REGISTRY.',
      stringMoney: 'Monetary values must use Core.Money type, not string.'
    }
  },

  /* eslint-disable @typescript-eslint/no-explicit-any */
  create(context: any) {
    const filename = context.getFilename();
    const sourceCode = context.getSourceCode().getText();

    return {
      TSInterfaceDeclaration(node: any) {
        if (!isInRegistry(filename)) {
          context.report({
            node,
            messageId: 'localType'
          });
        }
      },

      TSTypeAliasDeclaration(node: any) {
        if (!isInRegistry(filename)) {
          context.report({
            node,
            messageId: 'localType'
          });
        }
      },

      TSEnumDeclaration(node: any) {
        if (!isInRegistry(filename)) {
          context.report({
            node,
            messageId: 'localType'
          });
        }
      },

      TSIndexSignature(node: any) {
        context.report({
          node,
          messageId: 'indexSignature'
        });
      },

      TSAnyKeyword(node: any) {
        context.report({
          node,
          messageId: 'anyType'
        });
      },

      TSAsExpression(node: any) {
        // Catch type assertions during ESLint run
        const typeAnnotation = sourceCode.slice(node.typeAnnotation.range[0], node.typeAnnotation.range[1]);
        if (typeAnnotation === 'any' || typeAnnotation.includes('unknown')) {
          context.report({
            node,
            message: `Type assertion to ${typeAnnotation} is forbidden - use proper typing`
          });
        }
      },

      CallExpression(node: any) {
        // Catch deleted function calls
        if (node.callee.name === 'parsePrice' ||
            node.callee.name === 'safePriceMultiply' ||
            node.callee.name === 'calculateDiscountPercentage' ||
            node.callee.name === 'legacyParseFloat') {
          context.report({
            node,
            message: `Function ${node.callee.name} is deleted - use Money class instead`
          });
        }
      }
    };
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */
};

function isInRegistry(filename: string): boolean {
  return filename.includes('TYPE_REGISTRY.ts');
}

// ============================================================================
// TYPE USAGE ANALYTICS
// ============================================================================

export class TypeUsageAnalytics {
  private static usageMap = new Map<string, number>();

  /**
   * Track type usage
   */
  static trackUsage(typeName: string): void {
    const count = this.usageMap.get(typeName) || 0;
    this.usageMap.set(typeName, count + 1);
  }

  /**
   * Get most used types
   */
  static getMostUsedTypes(limit: number = 10): Array<[string, number]> {
    return Array.from(this.usageMap.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit);
  }

  /**
   * Get unused types
   */
  static getUnusedTypes(): string[] {
    const usedTypes = new Set(this.usageMap.keys());
    return REGISTERED_TYPES
      .map(t => t.name)
      .filter(name => !usedTypes.has(name));
  }

  /**
   * Generate usage report
   */
  static generateReport(): UsageReport {
    return {
      totalTypes: REGISTERED_TYPES.length,
      usedTypes: this.usageMap.size,
      unusedTypes: this.getUnusedTypes().length,
      mostUsed: this.getMostUsedTypes(),
      unused: this.getUnusedTypes(),
      duplicateRisk: this.findDuplicateRisk()
    };
  }

  /**
   * Find types with similar names (potential duplicates)
   */
  private static findDuplicateRisk(): string[] {
    const names = REGISTERED_TYPES.map(t => t.name);
    const similar: string[] = [];

    for (let i = 0; i < names.length; i++) {
      for (let j = i + 1; j < names.length; j++) {
        const nameI = names[i];
        const nameJ = names[j];
        if (nameI && nameJ && this.areSimilar(nameI, nameJ)) {
          similar.push(`${nameI} <-> ${nameJ}`);
        }
      }
    }

    return similar;
  }

  private static areSimilar(a: string, b: string): boolean {
    // Simple similarity check - can be improved
    const aLower = a.toLowerCase();
    const bLower = b.toLowerCase();
    return aLower.includes(bLower) || bLower.includes(aLower);
  }
}

// ============================================================================
// TYPES
// ============================================================================

interface Violation {
  file: string;
  line: number;
  pattern: string;
  message: string;
  severity: 'error' | 'warning';
}

interface ValidationResult {
  valid: boolean;
  violations: Violation[];
}

interface CodebaseValidationResult {
  valid: boolean;
  totalFiles: number;
  violationCount: number;
  results: ValidationResult[];
}

interface TypeValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  canProceed: boolean;
}

interface UsageReport {
  totalTypes: number;
  usedTypes: number;
  unusedTypes: number;
  mostUsed: Array<[string, number]>;
  unused: string[];
  duplicateRisk: string[];
}

// Classes already exported individually above