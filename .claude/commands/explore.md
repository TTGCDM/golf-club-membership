---
description: Explore the codebase using a dedicated agent to reduce context bloat
argument-hint: <search query or question>
---

Use the Task tool to explore the Tea Tree Golf Club codebase.

## Instructions

Spawn an Explore agent with the following configuration:

- **subagent_type**: Explore
- **description**: Explore codebase
- **prompt**: The user wants to explore/search the codebase for: $ARGUMENTS

Include in the prompt:
- This is a React 18 + Firebase membership management app
- Key directories: src/pages/, src/services/, src/components/, src/contexts/
- Frozen files (don't suggest modifications): firestore.rules, AuthContext.jsx, paymentsService.js, firebase.js, schemas/*

## When to Use This Command

- Open-ended questions about codebase structure
- Finding implementations across multiple files
- Understanding how a feature works end-to-end
- Searching when you're not sure what you're looking for
- Any exploration that might require reading 3+ files

## Examples

```
/explore where is error handling implemented
/explore how does the payment flow work
/explore find all uses of useAuth hook
/explore what components use React Query
/explore how are PDF reports generated
```

## Why Use This Instead of Direct Search

1. **Reduces context bloat** - Agent handles file reads internally
2. **Smarter exploration** - Agent can follow chains of imports/references
3. **Summarized results** - Returns focused answer, not raw file contents
4. **Thoroughness control** - Can specify quick/medium/very thorough in your query
