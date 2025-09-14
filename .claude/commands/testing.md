---
description: Review and improve testing coverage and quality assurance
argument-hint: [optional: specific file/directory to focus on]
allowed-tools: Read, Grep, Glob, Edit, MultiEdit, TodoWrite, Bash
---

Can you perform a comprehensive testing and quality assurance audit of our project using the following iterative approach:

## 1. Testing & QA Analysis
Conduct a thorough review across all code files, focusing on:
- Test coverage gaps and missing test cases
- Unit test quality and effectiveness
- Integration test completeness
- End-to-end test scenarios
- Mock usage and test isolation
- Test data management and fixtures
- Performance and load testing
- Error case and edge case coverage
- Test maintainability and organization
- CI/CD testing pipeline configuration

## 2. Fix Implementation
For each testing issue identified:
- Write missing tests for uncovered functionality
- Improve existing test quality and assertions
- Mark the corresponding todo as completed
- Ensure tests are reliable and fast
- Add proper test documentation and organization

## 3. Iterative Review Process
After completing all fixes from the current iteration:
- Perform another comprehensive testing review
- Run test coverage analysis tools
- Continue the fix-and-review cycle until comprehensive testing achieved
- Focus on $ARGUMENTS if specified, otherwise scan entire project

## 4. Final Assessment & Knowledge Storage
Once no more issues are found, provide:
- Summary of all testing improvements made
- Test coverage percentage achieved
- Test quality and maintainability assessment
- CI/CD pipeline testing recommendations
- QA process optimization suggestions

## 5. Save Results to Knowledge Base
After completing the testing audit, automatically:

### Save to Knowledge Graph (Memgraph):
- Create testing audit nodes linked to test suites and components
- Store test coverage improvements and quality metrics
- Connect testing patterns to quality assurance measures
- Build relationships between tests and the code they validate
- Track testing pipeline improvements and CI/CD optimization

### Save to Semantic Database (Qdrant):
- Store testing findings as embedded vectors for similarity search
- Include testing strategies and quality assurance patterns
- Enable search for similar testing approaches across the codebase
- Store test coverage analysis and quality assessments
- Create searchable testing knowledge base for continuous QA improvement

**Please use your TodoWrite tool to track progress and ensure systematic coverage of all testing domains.**

If $ARGUMENTS is provided, focus the testing audit on: $ARGUMENTS
Otherwise, perform a full project testing audit.