# Product Intelligence Engine - Modular Architecture

This directory contains the refactored Product Intelligence Engine, broken down into focused, single-responsibility modules.

## Module Structure

### Core Engine
- **`engine.ts`** - Main orchestration layer and public API (449 lines)
- **`index.ts`** - Clean exports and backward compatibility (28 lines)

### Analysis Modules
- **`similarity-analyzer.ts`** - Product similarity analysis logic (230 lines)
- **`competitive-analyzer.ts`** - Competitive landscape analysis (219 lines)
- **`feature-analyzer.ts`** - Feature comparison and gap analysis (293 lines)
- **`pricing-analyzer.ts`** - Pricing analysis and optimization (355 lines)
- **`strategic-analyzer.ts`** - Strategic insights and recommendations (471 lines)
- **`clustering-analyzer.ts`** - Product clustering and grouping (541 lines)

### Support Modules
- **`types.ts`** - All TypeScript type definitions (181 lines)
- **`data-access.ts`** - Database operations and persistence (354 lines)
- **`utils.ts`** - Shared utility functions and helpers (195 lines)

## Usage

```typescript
// Use the main engine (recommended)
import { productIntelligenceEngine } from './product-intelligence';

// Or import specific analyzers for advanced use cases
import { similarityAnalyzer, featureAnalyzer } from './product-intelligence';

// Generate comprehensive report
const report = await productIntelligenceEngine.generateProductIntelligenceReport(productId);

// Analyze product similarity
const analysis = await productIntelligenceEngine.analyzeProductSimilarity(
  sourceId,
  targetId,
  'comprehensive'
);

// Perform clustering analysis
const clusters = await productIntelligenceEngine.performProductClustering(
  productIds,
  'feature_based'
);
```

## Key Improvements

1. **Modularity**: Each module has a single responsibility
2. **Maintainability**: Smaller, focused files are easier to understand and modify
3. **Testability**: Individual modules can be tested independently
4. **Type Safety**: Centralized type definitions with proper exports
5. **Performance**: Modular imports reduce bundle size
6. **Extensibility**: Easy to add new analysis types without touching core logic

## Backward Compatibility

The public API remains unchanged. All existing code using the `productIntelligenceEngine` will continue to work without modifications.

## Architecture Benefits

- **Single Responsibility Principle**: Each module handles one specific aspect
- **Dependency Injection**: Clear dependencies between modules
- **Separation of Concerns**: Data access, business logic, and orchestration are separated
- **Error Isolation**: Issues in one module don't affect others
- **Parallel Development**: Different team members can work on different modules

## Module Dependencies

```
engine.ts (orchestrator)
├── similarity-analyzer.ts
├── competitive-analyzer.ts
├── feature-analyzer.ts
├── pricing-analyzer.ts
├── strategic-analyzer.ts
├── clustering-analyzer.ts
└── data-access.ts

data-access.ts
├── memgraph connection
└── database operations

All analyzers depend on:
├── types.ts
├── logger
└── external services (semantic search, AI)
```

## File Size Comparison

- **Before**: 1 file, 1,352 lines
- **After**: 11 files, average 301 lines per file
- **Largest module**: clustering-analyzer.ts (541 lines)
- **Smallest module**: index.ts (28 lines)

Most modules are under the 400-line target. The two largest modules (clustering-analyzer and strategic-analyzer) could be further subdivided if needed, but they represent cohesive functionality domains.