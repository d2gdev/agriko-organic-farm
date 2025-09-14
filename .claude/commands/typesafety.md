---
description: Review and improve TypeScript usage and data validation
argument-hint: [optional: specific file/directory to focus on]
allowed-tools: Read, Grep, Glob, Edit, MultiEdit, TodoWrite, Bash
---

Perform a comprehensive type safety and validation audit of our project using the following iterative approach:

## 1. Type Safety & Validation Analysis
Conduct a thorough review across all code files, focusing on:
- Missing or weak TypeScript type definitions
- Use of `any` types and type assertions
- Input validation and schema validation
- API request/response type safety
- Form validation and user input handling
- Runtime type checking and validation
- Generic type constraints and bounds
- Discriminated unions and type guards
- Optional vs required properties
- Data transformation type safety

## 2. Fix Implementation
For each type safety issue identified:
- Add proper TypeScript types and interfaces
- Implement runtime validation where needed
- Mark the corresponding todo as completed
- Ensure type safety doesn't break functionality
- Add validation schemas for external data

## 3. Iterative Review Process
After completing all fixes from the current iteration:
- Perform another comprehensive type safety review
- Run TypeScript compiler with strict mode
- Continue the fix-and-review cycle until full type safety achieved
- Focus on $ARGUMENTS if specified, otherwise scan entire project

## 4. Final Assessment & Knowledge Storage
Once no more issues are found, provide:
- Summary of all type safety improvements made
- TypeScript strict mode compliance status
- Validation coverage analysis
- Runtime safety recommendations
- Type safety score improvement

## 5. Save Results to Knowledge Base
After completing the type safety audit, automatically:

### Save to Knowledge Graph (Memgraph):
- Create type safety audit nodes linked to typed components
- Store type definition improvements and validation additions
- Connect TypeScript patterns to runtime safety measures
- Build relationships between type safety and data validation
- Track type coverage improvements and strict mode compliance

### Save to Semantic Database (Qdrant):
- Store type safety findings as embedded vectors for similarity search
- Include type patterns and validation strategies
- Enable search for similar typing patterns across the codebase
- Store type safety best practices and compliance assessments
- Create searchable type safety knowledge base for future development

**Please use your TodoWrite tool to track progress and ensure systematic coverage of all type safety domains.**

If $ARGUMENTS is provided, focus the type safety audit on: $ARGUMENTS
Otherwise, perform a full project type safety audit.