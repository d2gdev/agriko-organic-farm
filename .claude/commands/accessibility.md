---
description: Review and improve accessibility compliance and user experience
argument-hint: [optional: specific component/page to focus on]
allowed-tools: Read, Grep, Glob, Edit, MultiEdit, TodoWrite, Bash
---

Can you perform a comprehensive accessibility and user experience audit of our project using the following iterative approach:

## 1. Accessibility & UX Analysis
Conduct a thorough review across all UI components and pages, focusing on:
- WCAG 2.1 AA compliance requirements
- Semantic HTML structure and landmarks
- ARIA labels, roles, and properties
- Keyboard navigation and focus management
- Color contrast and visual accessibility
- Screen reader compatibility
- Form accessibility and validation messages
- Image alt text and descriptive content
- Mobile responsiveness and touch targets
- Loading states and user feedback

## 2. Fix Implementation
For each accessibility issue identified:
- Implement proper semantic markup and ARIA attributes
- Improve keyboard navigation and focus indicators
- Mark the corresponding todo as completed
- Test with accessibility tools and screen readers
- Ensure compliance doesn't break existing functionality

## 3. Iterative Review Process
After completing all fixes from the current iteration:
- Perform another comprehensive accessibility review
- Run automated accessibility testing tools
- Continue the fix-and-review cycle until full compliance achieved
- Focus on $ARGUMENTS if specified, otherwise scan entire project

## 4. Final Assessment & Knowledge Storage
Once no more issues are found, provide:
- Summary of all accessibility improvements made
- WCAG compliance level achieved
- Accessibility testing tool results
- Screen reader compatibility status
- User experience enhancement summary

## 5. Save Results to Knowledge Base
After completing the accessibility audit, automatically:

### Save to Knowledge Graph (Memgraph):
- Create accessibility audit nodes linked to UI components
- Store WCAG compliance improvements and ARIA implementations
- Connect accessibility patterns to user experience enhancements
- Build relationships between components and their accessibility features
- Track accessibility compliance and assistive technology compatibility

### Save to Semantic Database (Qdrant):
- Store accessibility findings as embedded vectors for similarity search
- Include accessibility patterns and WCAG compliance strategies
- Enable search for similar accessibility implementations across components
- Store accessibility testing results and screen reader compatibility
- Create searchable accessibility knowledge base for inclusive design

**Please use your TodoWrite tool to track progress and ensure systematic coverage of all accessibility domains.**

If $ARGUMENTS is provided, focus the accessibility audit on: $ARGUMENTS
Otherwise, perform a full project accessibility audit.