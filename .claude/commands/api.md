---
description: Review and improve API implementations and integrations
argument-hint: [optional: specific file/directory to focus on]
allowed-tools: Read, Grep, Glob, Edit, MultiEdit, TodoWrite, Bash
---

Can you perform a comprehensive API and integration audit of our project using the following iterative approach:

## 1. API & Integration Analysis
Conduct a thorough review across all code files, focusing on:
- API endpoint security and authentication
- Rate limiting and throttling mechanisms
- Request/response validation and serialization
- Error handling and status code usage
- API versioning and backward compatibility
- Integration patterns and external service calls
- Database query optimization and connection pooling
- Caching strategies for API responses
- CORS configuration and cross-origin handling
- API documentation and OpenAPI compliance

## 2. Fix Implementation
For each API/integration issue identified:
- Implement proper security and validation
- Add rate limiting and error handling
- Mark the corresponding todo as completed
- Test API endpoints and integrations
- Ensure backward compatibility is maintained

## 3. Iterative Review Process
After completing all fixes from the current iteration:
- Perform another comprehensive API review
- Test integration points and external dependencies
- Continue the fix-and-review cycle until robust APIs achieved
- Focus on $ARGUMENTS if specified, otherwise scan entire project

## 4. Final Assessment & Knowledge Storage
Once no more issues are found, provide:
- Summary of all API improvements made
- Security posture assessment
- Performance optimization results
- Integration reliability analysis
- API documentation completeness review

## 5. Save Results to Knowledge Base
After completing the API audit, automatically:

### Save to Knowledge Graph (Memgraph):
- Create API audit nodes linked to endpoints and integrations
- Store API security improvements and rate limiting configurations
- Connect API patterns to performance and reliability measures
- Build relationships between endpoints and their security profiles
- Track API documentation and integration reliability improvements

### Save to Semantic Database (Qdrant):
- Store API findings as embedded vectors for similarity search
- Include API security patterns and integration strategies
- Enable search for similar API patterns across the codebase
- Store API documentation and performance benchmarks
- Create searchable API knowledge base for future development

**Please use your TodoWrite tool to track progress and ensure systematic coverage of all API domains.**

If $ARGUMENTS is provided, focus the API audit on: $ARGUMENTS
Otherwise, perform a full project API and integration audit.