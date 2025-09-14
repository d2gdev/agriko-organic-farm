---
description: Perform comprehensive code audit across all 9 quality dimensions
argument-hint: [optional: specific file/directory to focus on]
allowed-tools: Read, Grep, Glob, Edit, MultiEdit, TodoWrite, Bash
---

Can you perform a comprehensive code audit of our entire project by systematically executing all 9 quality review categories in priority order:

## Master Audit Process

I will execute each audit phase sequentially, completing all fixes in one category before moving to the next. Each phase follows the iterative fix-and-review cycle until no issues remain.

### Phase 1: Security Audit (CRITICAL)
- Authentication and authorization vulnerabilities
- Input validation and sanitization gaps
- Data exposure and credential handling
- Injection attacks and security headers
- Session management and API security

### Phase 2: Reliability Audit (HIGH)
- Error handling and exception management
- Graceful degradation and retry logic
- Timeout handling and recovery mechanisms
- Logging coverage and monitoring

### Phase 3: Performance Audit (HIGH)
- Memory leaks and resource management
- Algorithm optimization and async patterns
- Bundle size and asset optimization
- Cache management and database queries

### Phase 4: Type Safety Audit (MEDIUM)
- TypeScript type definitions and validation
- Runtime type checking and schema validation
- API type safety and data transformation
- Generic constraints and type guards

### Phase 5: API Integration Audit (MEDIUM)
- Endpoint security and rate limiting
- Request/response validation
- Integration patterns and external services
- CORS configuration and versioning

### Phase 6: Configuration Audit (MEDIUM)
- Environment variable management
- Secrets handling and deployment readiness
- Build configuration and CI/CD setup
- Production vs development settings

### Phase 7: Code Quality Audit (MEDIUM)
- Code duplication and complexity
- SOLID principles and naming conventions
- Documentation and maintainability
- Technical debt reduction

### Phase 8: Accessibility Audit (LOW)
- WCAG 2.1 AA compliance
- Semantic HTML and ARIA implementation
- Keyboard navigation and screen reader support
- Color contrast and mobile responsiveness

### Phase 9: Testing Audit (LOW)
- Test coverage gaps and quality
- Unit, integration, and e2e testing
- Mock usage and test organization
- CI/CD testing pipeline

## Execution Instructions

For each phase, I will:
1. **Analyze**: Scan for issues in that category
2. **Fix**: Implement solutions immediately
3. **Verify**: Ensure fixes don't break functionality
4. **Re-audit**: Check for new issues until phase is complete
5. **Report**: Summarize improvements before moving to next phase

## Focus Area
If $ARGUMENTS is provided, I will focus all 9 audits on: $ARGUMENTS
Otherwise, I will perform comprehensive project-wide audits.

## Final Deliverable
After completing all 9 phases, I will provide:
- **Comprehensive Summary**: All improvements made across all categories
- **Quality Score**: Before/after assessment for each dimension
- **Priority Recommendations**: Critical items for ongoing maintenance
- **Compliance Report**: Security, accessibility, and best practices status
- **Technical Debt Analysis**: Remaining issues and remediation roadmap

## Knowledge Storage Integration
After completing the audit, I will automatically:

### Save to Knowledge Graph (Memgraph):
- Create audit nodes with relationships to affected files/components
- Store quality metrics and improvement scores
- Link security findings to vulnerability categories
- Connect performance improvements to specific optimizations
- Build relationships between issues and their resolutions

### Save to Semantic Database (Qdrant):
- Store audit results as embedded vectors for semantic search
- Include code quality insights and recommendations
- Enable similarity search for related audit findings
- Store compliance assessments and security postures
- Create searchable knowledge base of all improvements made

This ensures all audit results become part of your project's knowledge base for future reference, trend analysis, and continuous improvement tracking.

**I will use TodoWrite to track progress through all 9 phases systematically.**

Beginning comprehensive audit now...