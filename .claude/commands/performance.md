---
description: Analyze and fix performance and memory management issues
argument-hint: [optional: specific file/directory to focus on]
allowed-tools: Read, Grep, Glob, Edit, MultiEdit, TodoWrite, Bash
---

Can you perform a comprehensive performance and memory audit of our project using the following iterative approach:

## 1. Performance & Memory Analysis
Conduct a thorough review across all code files, focusing on:
- Memory leaks and excessive memory usage
- Inefficient algorithms and data structures
- Blocking operations and async/await issues
- Database query optimization and N+1 problems
- Bundle size and code splitting opportunities
- Image and asset optimization
- Cache management and invalidation
- Resource cleanup and disposal
- Event listener management
- Large object handling and streaming

## 2. Fix Implementation
For each performance issue identified:
- Implement optimizations immediately using appropriate tools
- Mark the corresponding todo as completed
- Verify improvements don't break functionality
- Measure performance impact where possible

## 3. Iterative Review Process
After completing all fixes from the current iteration:
- Perform another comprehensive performance review
- Identify any new bottlenecks or issues missed
- Continue the fix-and-review cycle until optimal performance achieved
- Focus on $ARGUMENTS if specified, otherwise scan entire project

## 4. Final Assessment & Knowledge Storage
Once no more issues are found, provide:
- Summary of all performance improvements made
- Before/after performance metrics
- Memory usage optimization results
- Bundle size reduction achieved
- Recommendations for ongoing performance monitoring

## 5. Save Results to Knowledge Base
After completing the performance audit, automatically:

### Save to Knowledge Graph (Memgraph):
- Create performance audit nodes linked to optimized components
- Store performance metrics and improvement measurements
- Connect optimization techniques to specific performance gains
- Build relationships between memory usage patterns and fixes
- Track performance trends and bottleneck resolutions

### Save to Semantic Database (Qdrant):
- Store performance findings as embedded vectors for similarity search
- Include optimization strategies and implementation details
- Enable search for similar performance patterns across the codebase
- Store performance benchmarks and monitoring recommendations
- Create searchable performance knowledge base for future optimizations

**Please use your TodoWrite tool to track progress and ensure systematic coverage of all performance domains.**

If $ARGUMENTS is provided, focus the performance audit on: $ARGUMENTS
Otherwise, perform a full project performance audit.