---
description: Review and improve error handling and system reliability
argument-hint: [optional: specific file/directory to focus on]
allowed-tools: Read, Grep, Glob, Edit, MultiEdit, TodoWrite, Bash
---

Can you perform a comprehensive reliability and error handling audit of our project using the following iterative approach:

## 1. Error Handling & Reliability Analysis
Conduct a thorough review across all code files, focusing on:
- Unhandled exceptions and promise rejections
- Missing try-catch blocks and error boundaries
- Graceful degradation under failure conditions
- Retry logic and circuit breaker patterns
- Timeout handling and resource limits
- Logging and error reporting coverage
- Recovery mechanisms and fallback strategies
- Input validation and boundary checking
- Network failure handling
- Database connection and transaction handling

## 2. Fix Implementation
For each reliability issue identified:
- Implement proper error handling immediately
- Add appropriate logging and monitoring
- Mark the corresponding todo as completed
- Test failure scenarios where possible
- Verify fixes don't mask important errors

## 3. Iterative Review Process
After completing all fixes from the current iteration:
- Perform another comprehensive reliability review
- Identify any new failure modes or gaps
- Continue the fix-and-review cycle until robust error handling achieved
- Focus on $ARGUMENTS if specified, otherwise scan entire project

## 4. Final Assessment & Knowledge Storage
Once no more issues are found, provide:
- Summary of all reliability improvements made
- Error handling coverage analysis
- Failure scenario testing recommendations
- Monitoring and alerting setup guidance
- System resilience assessment

## 5. Save Results to Knowledge Base
After completing the reliability audit, automatically:

### Save to Knowledge Graph (Memgraph):
- Create reliability audit nodes linked to error-prone components
- Store error patterns and their resolution strategies
- Connect failure scenarios to implemented safeguards
- Build relationships between reliability patterns and system resilience
- Track error handling improvements and monitoring coverage

### Save to Semantic Database (Qdrant):
- Store reliability findings as embedded vectors for similarity search
- Include error handling strategies and recovery mechanisms
- Enable search for similar reliability patterns across the codebase
- Store resilience assessments and monitoring recommendations
- Create searchable reliability knowledge base for future hardening

**Please use your TodoWrite tool to track progress and ensure systematic coverage of all reliability domains.**

If $ARGUMENTS is provided, focus the reliability audit on: $ARGUMENTS
Otherwise, perform a full project reliability audit.