Perform a comprehensive agent harness validation using parallel agents for efficiency.

This is a deeper check than `/status` - use it when starting a new task or after pulling changes.

## Execution Strategy

Spawn **3 parallel agents** to minimize context bloat and execution time. Use a single message with multiple Task tool calls.

---

## Agent 1: File Structure & Progress Validation

Use Task tool with subagent_type="general-purpose" and this prompt:

```
Validate the Tea Tree Golf Club harness file structure and progress state.

STEPS:
1. Check these files exist:
   - claude-progress.json (project root)
   - docs/SESSION_HANDOFF.md
   - CLAUDE.md (check it contains "Fine-Tuning Rules")

2. Check for plans in ~/.claude/plans directory (user home):
   - List all .md files in ~/.claude/plans (if directory exists)
   - For each plan found, note its filename and check for a "Status:" line

3. Read and parse claude-progress.json, verify it has:
   - phase field (should be "fine-tuning")
   - version field
   - features array
   - frozen_files array
   - known_issues array
   - session_log array (at least one entry)

4. From known_issues: list any where status != "resolved", group by severity

5. From backlog: list open items by priority

6. Check last session_log entry - what were the next_steps?

RETURN THIS FORMAT:
FILES_VALID: true/false
FILES_ISSUES: [list if any]
PLANS_FOUND: [count] plans in ~/.claude/plans
PLANS_LIST: [filename: status] for each plan
PHASE: [value]
VERSION: [value]
OPEN_ISSUES: [count] - [severity: description]
BACKLOG_OPEN: [count] - [id: title]
LAST_SESSION: [name] on [date]
PENDING_NEXT_STEPS: [list from last session]
```

---

## Agent 2: Quality Gate

Use Task tool with subagent_type="general-purpose" and this prompt:

```
Run quality gate checks for Tea Tree Golf Club membership app.

STEPS:
1. Run: npm run lint
   - Capture pass/fail and warning count

2. Run: npm run test
   - Capture total passing and failing counts

3. Run: npm run build
   - Capture success/fail
   - Note the largest chunk size from output

RETURN THIS FORMAT:
LINT: PASS/FAIL - X warnings
TESTS: PASS/FAIL - X passing, Y failing
BUILD: PASS/FAIL - largest chunk: XXX KB
OVERALL: PASS/FAIL
```

---

## Agent 3: Frozen Files Git Check

Use Task tool with subagent_type="general-purpose" and this prompt:

```
Check git status for frozen files in Tea Tree Golf Club project.

FROZEN FILES TO CHECK:
- firestore.rules
- src/contexts/AuthContext.jsx
- src/services/paymentsService.js
- functions/index.js
- src/firebase.js
- src/schemas/* (all files in schemas directory)

STEPS:
1. Verify each frozen file exists

2. Run: git diff --name-only
   Check if any frozen files have uncommitted changes

3. Run: git diff HEAD~5 --name-only
   Check if any frozen files were modified in recent commits

RETURN THIS FORMAT:
| File | Exists | Uncommitted | Recent Commits |
|------|--------|-------------|----------------|
| firestore.rules | YES/NO | YES/NO | YES/NO |
[continue for all files]

STATUS: CLEAN or WARNING
WARNINGS: [list any files with issues]
```

---

## After Agents Complete

Aggregate the 3 agent results into this final report:

```
## Harness Validation Report

### File Structure
- claude-progress.json: [from Agent 1]
- SESSION_HANDOFF.md: [from Agent 1]
- CLAUDE.md Fine-Tuning Rules: [from Agent 1]

### Plans (~/.claude/plans)
[from Agent 1 - list each plan with its status, or "No plans found"]

### Quality Gate
| Check | Status | Details |
|-------|--------|---------|
| Lint | [Agent 2] | |
| Tests | [Agent 2] | |
| Build | [Agent 2] | |

### Frozen Files Check
[table from Agent 3]

### Open Issues ([count])
[from Agent 1, grouped by severity]

### Backlog ([count] open items)
[from Agent 1, by priority]

### Last Session Continuity
- Session: [from Agent 1]
- Pending next steps: [from Agent 1]

## Readiness

READY TO PROCEED - if all checks pass
or
BLOCKED - [list blocking issues]
```

---

## Important Notes

- This is READ-ONLY validation - do not fix issues, only report them
- If BLOCKED, ask user how to proceed before making changes
- All 3 agents run in parallel - wait for all to complete before aggregating
- Use run_in_background=true if you want to continue other work while waiting
