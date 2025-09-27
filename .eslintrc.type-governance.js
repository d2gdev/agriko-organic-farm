/**
 * ESLint Configuration for Type Governance
 * Enforces that all types come from TYPE_REGISTRY
 */

module.exports = {
  extends: ['./.eslintrc.json'],
  rules: {
    // Prevent local type definitions
    'no-restricted-syntax': [
      'error',
      {
        selector: 'TSInterfaceDeclaration',
        message: '❌ Local interface definitions are forbidden. All types must be defined in src/types/TYPE_REGISTRY.ts and imported from there.'
      },
      {
        selector: 'TSTypeAliasDeclaration',
        message: '❌ Local type aliases are forbidden. All types must be defined in src/types/TYPE_REGISTRY.ts and imported from there.'
      },
      {
        selector: 'TSEnumDeclaration',
        message: '❌ Local enum definitions are forbidden. All enums must be defined in src/types/TYPE_REGISTRY.ts and imported from there.'
      },
      {
        selector: 'TSIndexSignature',
        message: '❌ Index signatures ([key: string]: any) are forbidden. Use specific types from TYPE_REGISTRY.'
      },
      {
        selector: 'TSAnyKeyword',
        message: '❌ The "any" type is forbidden. Use specific types from TYPE_REGISTRY or "unknown" if type is truly unknown.'
      },
      {
        selector: 'TSTypeLiteral:has(TSPropertySignature[key.name=/price|total|amount|cost|fee/][typeAnnotation.typeAnnotation.type="TSStringKeyword"])',
        message: '❌ Monetary values must use Core.Money type (number), not string. Import from TYPE_REGISTRY.'
      }
    ],

    // Ensure imports are from TYPE_REGISTRY
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['*/types/*', '!*/types/TYPE_REGISTRY'],
            message: '❌ Import types only from @/types/TYPE_REGISTRY'
          },
          {
            group: ['*/lib/auth-types', '*/lib/cache-manager', '*/lib/business-logic-validator'],
            message: '❌ These type files are deprecated. Import from @/types/TYPE_REGISTRY instead'
          }
        ],
        paths: [
          {
            name: '@/types/woocommerce',
            message: '❌ Use Domain.Product from @/types/TYPE_REGISTRY instead'
          },
          {
            name: '@/types/auth',
            message: '❌ Use Domain.User and Infrastructure.AuthResult from @/types/TYPE_REGISTRY instead'
          },
          {
            name: '@/types/common',
            message: '❌ Use appropriate namespace from @/types/TYPE_REGISTRY instead'
          },
          {
            name: '@/types/events',
            message: '❌ Use Infrastructure.Event and Infrastructure.EventType from @/types/TYPE_REGISTRY instead'
          },
          {
            name: '@/types/analytics',
            message: '❌ Use appropriate types from @/types/TYPE_REGISTRY instead'
          }
        ]
      }
    ],

    // TypeScript specific rules
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
    '@typescript-eslint/no-duplicate-type-constituents': 'error',
    '@typescript-eslint/no-redundant-type-constituents': 'error',

    // Naming conventions
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'interface',
        format: ['PascalCase'],
        custom: {
          regex: '^I[A-Z]',
          match: false
        },
        leadingUnderscore: 'forbid',
        trailingUnderscore: 'forbid'
      },
      {
        selector: 'typeAlias',
        format: ['PascalCase']
      },
      {
        selector: 'enum',
        format: ['PascalCase']
      }
    ]
  },
  overrides: [
    {
      // Allow local types only in TYPE_REGISTRY and type governance files
      files: [
        'src/types/TYPE_REGISTRY.ts',
        'src/types/type-governance.ts',
        'scripts/migrate-types.ts',
        'scripts/fix-imports.ts'
      ],
      rules: {
        'no-restricted-syntax': 'off',
        '@typescript-eslint/no-explicit-any': 'off'
      }
    },
    {
      // Test files can have more relaxed rules
      files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
      rules: {
        'no-restricted-syntax': 'warn',
        '@typescript-eslint/no-explicit-any': 'warn'
      }
    }
  ]
};