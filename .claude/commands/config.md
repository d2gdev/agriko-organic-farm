---
description: Review and improve configuration management and deployment readiness
argument-hint: [optional: specific config file/directory to focus on]
allowed-tools: Read, Grep, Glob, Edit, MultiEdit, TodoWrite, Bash
---

Can you perform a comprehensive configuration and deployment audit of our project using the following iterative approach:

## 1. Configuration Analysis
Conduct a thorough review across all configuration files, focusing on:
- Environment variable management and validation
- Secrets handling and credential security
- Configuration file organization and structure
- Default values and fallback mechanisms
- Development vs production configuration differences
- Build and deployment configuration
- Docker and containerization setup
- CI/CD pipeline configuration
- Monitoring and logging configuration
- Feature flag and environment-specific settings

## 2. Fix Implementation
For each configuration issue identified:
- Implement proper environment variable validation
- Secure sensitive configuration data
- Mark the corresponding todo as completed
- Test configuration in different environments
- Ensure production readiness and security

## 3. Iterative Review Process
After completing all fixes from the current iteration:
- Perform another comprehensive configuration review
- Validate deployment readiness across environments
- Continue the fix-and-review cycle until robust configuration achieved
- Focus on $ARGUMENTS if specified, otherwise scan entire project

## 4. Final Assessment & Knowledge Storage
Once no more issues are found, provide:
- Summary of all configuration improvements made
- Production readiness assessment
- Security configuration review
- Deployment pipeline optimization
- Environment consistency validation

## 5. Save Results to Knowledge Base
After completing the configuration audit, automatically:

### Save to Knowledge Graph (Memgraph):
- Create configuration audit nodes linked to deployment environments
- Store configuration patterns and environment variable management
- Connect security configurations to deployment readiness measures
- Build relationships between configuration files and their purposes
- Track production readiness and deployment pipeline improvements

### Save to Semantic Database (Qdrant):
- Store configuration findings as embedded vectors for similarity search
- Include configuration best practices and deployment strategies
- Enable search for similar configuration patterns across environments
- Store production readiness assessments and security configurations
- Create searchable configuration knowledge base for deployment optimization

**Please use your TodoWrite tool to track progress and ensure systematic coverage of all configuration domains.**

If $ARGUMENTS is provided, focus the configuration audit on: $ARGUMENTS
Otherwise, perform a full project configuration audit.