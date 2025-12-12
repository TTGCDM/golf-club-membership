Generate a quick project status report for the Tea Tree Golf Club membership app.

## Execution Strategy

Use the Task tool with **subagent_type="general-purpose"** and **model="haiku"** to minimize context cost in the main conversation.

Delegate the entire status check to the agent with the prompt below.

---

## Agent Prompt

```
Generate a status report for the Tea Tree Golf Club membership app.

## Steps

### 1. Read Progress State
Read `claude-progress.json` and extract:
- Current phase and version
- Features with status != "done" (needs attention)
- Open known issues (where status != "resolved")
- Last session from session_log (date, summary, next_steps)
- Count of frozen files

### 2. Run Health Checks
Execute these commands and capture results:
- `npm run lint` - must pass with 0 warnings
- `npm run test` - capture pass/fail count
- `npm run build` - must succeed (note any warnings)

### 3. Check for Uncommitted Changes
Run `git status --porcelain` to see if there are:
- Uncommitted changes to frozen files (WARNING)
- Other uncommitted changes (INFO)

### 4. Output Status Report

Format the output as:

```
## Project Status

**Phase**: [phase] | **Version**: [version] | **Frozen Files**: [count]

### Health Checks
- Lint: ✅ Pass / ❌ Fail
- Tests: ✅ X passing / ❌ X failing
- Build: ✅ Success / ❌ Failed

### Needs Attention
[List features where status != "done"]
[List known issues where status != "resolved"]

### Last Session
**[date]** - [session name]
[summary]

**Next steps identified:**
- [next_steps items]

### Working Directory
- [ ] Clean / [X] Has uncommitted changes
- [List any frozen files with changes - this is a WARNING]

### Quick Commands
- `npm run dev` - Start dev server
- `npm run test` - Run 95 tests
- `npm run build` - Production build
- `npm run lint` - Check code quality
```

## Important
- Do NOT make any changes - this is a read-only status check
- If health checks fail, report the failures but don't fix them
- Highlight any frozen file modifications as warnings
```

---

## After Agent Completes

Display the agent's response directly to the user. Do not add additional commentary unless there are blocking issues that need immediate attention.
