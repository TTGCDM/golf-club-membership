---
description: Plan a feature implementation using a dedicated planning agent
argument-hint: <feature description>
---

Use the Task tool to plan the implementation of a feature for the Tea Tree Golf Club app.

## Instructions

Spawn a Plan agent with the following configuration:

- **subagent_type**: Plan
- **description**: Plan feature implementation
- **prompt**: Plan the implementation for: $ARGUMENTS

Include in the prompt:
- This is a React 18 + Firebase membership management app (Tea Tree Golf Club)
- Tech stack: React 18, React Router v6, Tailwind CSS, Firebase (Auth + Firestore), Vite
- Architecture: pages/ → services/ → Firestore (components never call Firestore directly)
- Existing patterns: React Query hooks, Zod validation, shadcn/ui components
- Frozen files that require approval to modify: firestore.rules, AuthContext.jsx, paymentsService.js, firebase.js, schemas/*

Request the agent to:
1. Explore relevant existing code first
2. Identify files that need to be created or modified
3. Consider if any frozen files need changes (flag for approval)
4. Propose step-by-step implementation plan
5. Note any architectural decisions or trade-offs

## When to Use This Command

- Before implementing features with 3+ steps
- When multiple valid approaches exist
- For architectural decisions with trade-offs
- When requirements need clarification before coding
- Any significant new functionality

## Examples

```
/plan-feature add bulk email sending to members
/plan-feature implement member photo uploads
/plan-feature add export to Excel for reports
/plan-feature create a member self-service portal
/plan-feature add payment reminders via SMS
```

## Output

The Plan agent will return:
- Analysis of existing relevant code
- Recommended approach with rationale
- Step-by-step implementation plan
- Files to create/modify (flagging any frozen files)
- Questions or decisions needing user input
