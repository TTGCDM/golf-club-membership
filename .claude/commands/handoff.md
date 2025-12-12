---
description: Generate a session handoff document from current state
argument-hint: [session-name]
---

Auto-generate a session handoff document for the Tea Tree Golf Club app.

## Execution Strategy

Use the Task tool with **subagent_type="general-purpose"** and **model="haiku"** to minimize context cost.

Delegate the handoff generation to the agent with the prompt below.

---

## Agent Prompt

```
Generate a session handoff document for the Tea Tree Golf Club membership app.

SESSION NAME: $ARGUMENTS (or use "unnamed-session" if not provided)

## Steps

### 1. Read Current State
Read `claude-progress.json` and extract:
- Current phase and version
- Last session entry from session_log
- Any open backlog items
- Any unresolved known_issues

### 2. Check Git Status
Run `git status --porcelain` to get:
- Modified files (staged and unstaged)
- Untracked files
- Current branch

Run `git diff --stat` to get summary of changes.

### 3. Run Quick Health Check
Run these commands:
- `npm run lint` - pass/fail
- `npm run test` - pass/fail count

### 4. Generate Handoff Document

Output the handoff in this format:

---

# Session Handoff: [SESSION NAME]

**Project**: Tea Tree Golf Club Membership System
**Date**: [today's date]
**Phase**: [from progress.json]
**Version**: [from progress.json]

## What Was Changed This Session

### Files Modified
| File | Status |
|------|--------|
[from git status]

### Git Diff Summary
[from git diff --stat]

## Health Check
- Lint: PASS/FAIL
- Tests: X passing, Y failing

## Open Items

### Backlog (active)
[list from progress.json backlog where status != completed]

### Known Issues (unresolved)
[list from progress.json known_issues where status != resolved]

## Context for Next Session

### Last Recorded Session
- **Name**: [from session_log]
- **Summary**: [from session_log]
- **Next Steps**: [from session_log]

### Recommended First Actions
1. Run `/status` to verify project health
2. Review uncommitted changes above
3. [any specific actions based on current state]

---

## Important
- This is READ-ONLY - do not make any changes
- If there are uncommitted frozen file changes, highlight as WARNING
- Keep output concise - this is a handoff summary, not full documentation
```

---

## After Agent Completes

Display the handoff document to the user. Offer to:
1. Save to `docs/SESSION_HANDOFF.md` (overwrites template with real data)
2. Add a session_log entry to `claude-progress.json`
