---
description: Perform comprehensive security audit with iterative fixes
argument-hint: [optional: specific file/directory to focus on]
allowed-tools: Read, Grep, Glob, Edit, MultiEdit, TodoWrite, Bash
---

Can you perform a comprehensive security audit of our entire project using the following iterative approach:

## 1. Initial Security Analysis
Conduct a thorough security review across all code files, focusing on:
- Authentication and authorization vulnerabilities
- Input validation and sanitization gaps  
- Data exposure and information leakage
- Credential handling and secrets management
- CORS, CSP, and security header configurations
- SQL injection, XSS, and other injection vulnerabilities
- Session management and token security
- API endpoint security and rate limiting
- File upload security and path traversal
- Environment variable exposure

## 2. Fix Implementation
For each security issue identified:
- Implement the fix immediately using appropriate tools
- Mark the corresponding todo as completed
- Verify the fix doesn't introduce new vulnerabilities
- Test the fix if possible

## 3. Iterative Review Process
After completing all fixes from the current iteration:
- Perform another comprehensive security review
- Identify any new issues or issues missed in previous iterations  
- Continue the fix-and-review cycle until no security vulnerabilities remain
- Focus on $ARGUMENTS if specified, otherwise scan entire project

## 4. Final Assessment & Knowledge Storage
Once no more issues are found, provide:
- Summary of all security improvements made
- Risk assessment before vs. after fixes
- Security score improvement metrics
- Recommendations for ongoing security maintenance
- Compliance readiness assessment

## 5. Save Results to Knowledge Base
After completing the security audit, automatically:

### Save to Knowledge Graph (Memgraph):
- Create security audit nodes linked to affected files/components
- Store vulnerability findings and their severity levels
- Connect security fixes to specific threat categories
- Build relationships between security patterns and implementations
- Track security compliance improvements over time

### Save to Semantic Database (Qdrant):
- Store security findings as embedded vectors for similarity search
- Include vulnerability descriptions and remediation steps
- Enable search for similar security patterns across the codebase
- Store security best practices and compliance assessments
- Create searchable security knowledge base for future audits

**Please use your TodoWrite tool to track progress and ensure systematic coverage of all security domains.**

If $ARGUMENTS is provided, focus the security audit on: $ARGUMENTS
Otherwise, perform a full project security audit.