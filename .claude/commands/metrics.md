---
description: Show metrics trends from session history
---

Display metrics trends from the Tea Tree Golf Club app's session history.

## Execution Strategy

Use the Task tool with **subagent_type="general-purpose"** and **model="haiku"** to minimize context cost.

---

## Agent Prompt

```
Display metrics trends for the Tea Tree Golf Club membership app.

## Steps

### 1. Read Metrics History
Read `claude-progress.json` and extract the `metrics_history` array.

### 2. Format Trend Report

Output in this format:

## Metrics Trends

### Test Count
| Session | Date | Tests |
|---------|------|-------|
[from metrics_history, newest first]

**Trend**: [increasing/stable/decreasing]

### Bundle Size (main chunk)
| Session | Date | Size (KB) |
|---------|------|-----------|
[from metrics_history, newest first]

**Trend**: [increasing/stable/decreasing] - Target: <500KB

### Build Time
| Session | Date | Time (s) |
|---------|------|----------|
[from metrics_history, newest first]

**Trend**: [increasing/stable/decreasing]

### Lint Warnings
| Session | Date | Warnings |
|---------|------|----------|
[from metrics_history, newest first]

**Status**: [CLEAN if all 0, otherwise WARNING]

## Summary

- Total sessions tracked: [count]
- Test coverage trend: [summary]
- Bundle size: [current] KB ([comparison to first entry])
- Build performance: [stable/improving/degrading]

## Recommendations
[If any metrics are trending poorly, suggest actions]
```

---

## Important
- This is READ-ONLY - just displays metrics
- If metrics_history is empty, inform user to run `/status` after making changes to populate history
- Keep output concise and scannable
