---
description: Review and improve code quality and maintainability
argument-hint: [optional: specific file/directory to focus on]
allowed-tools: Read, Grep, Glob, Edit, MultiEdit, TodoWrite, Bash
---

Can you perform a comprehensive code quality and maintainability audit of our project using the following iterative approach:

## 1. Code Quality & Maintainability Analysis
Conduct a thorough review across all code files, focusing on:
- Code duplication and DRY principle violations
- Complex functions and cyclomatic complexity
- Poor naming conventions and unclear variables
- SOLID principle violations
- Long parameter lists and god objects
- Dead code and unused imports/variables
- Inconsistent formatting and style
- Missing or inadequate documentation
- Coupling and cohesion issues
- Magic numbers and hardcoded values

## 2. Fix Implementation
For each code quality issue identified:
- Refactor code to improve readability and maintainability
- Extract reusable functions and components
- Mark the corresponding todo as completed
- Ensure refactoring doesn't break functionality
- Add proper documentation and comments

## 3. Iterative Review Process
After completing all fixes from the current iteration:
- Perform another comprehensive code quality review
- Run linting tools and code analysis
- Continue the fix-and-review cycle until high quality achieved
- Focus on $ARGUMENTS if specified, otherwise scan entire project

## 4. Final Assessment & Knowledge Storage
Once no more issues are found, provide:
- Summary of all code quality improvements made
- Maintainability index improvements
- Code complexity reduction metrics
- Documentation coverage analysis
- Technical debt reduction assessment

## 5. Save Results to Knowledge Base
After completing the code quality audit, automatically:

### Save to Knowledge Graph (Memgraph):
- Create code quality audit nodes linked to refactored components
- Store refactoring patterns and complexity reduction techniques
- Connect code quality improvements to maintainability metrics
- Build relationships between design patterns and code organization
- Track technical debt reduction and documentation improvements

### Save to Semantic Database (Qdrant):
- Store code quality findings as embedded vectors for similarity search
- Include refactoring strategies and best practices
- Enable search for similar code quality patterns across the codebase
- Store maintainability assessments and technical debt analysis
- Create searchable code quality knowledge base for continuous improvement

**Please use your TodoWrite tool to track progress and ensure systematic coverage of all code quality domains.**

If $ARGUMENTS is provided, focus the code quality audit on: $ARGUMENTS
Otherwise, perform a full project code quality audit.