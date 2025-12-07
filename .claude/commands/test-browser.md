---
description: Set up a chrome-devtools browser testing session for the membership app
allowed-tools: Bash(npm run dev:*), Bash(npm run build:*)
argument-hint: [page-or-flow]
---

## Browser Testing Session Setup

Setting up chrome-devtools for testing the Tea Tree Golf Club Membership app.

### Current Dev Server Status
- Package info: @package.json

### Test Target
$ARGUMENTS

### Session Setup Checklist

1. **Verify dev server is running** at http://localhost:5173
   - If not running, start with: `npm run dev`

2. **Navigate to the app**:
   ```
   mcp__chrome-devtools__navigate_page(type: "url", url: "http://localhost:5173")
   ```

3. **Take initial snapshot** to get element UIDs:
   ```
   mcp__chrome-devtools__take_snapshot
   ```

4. **Check for console errors**:
   ```
   mcp__chrome-devtools__list_console_messages(types: ["error", "warn"])
   ```

### Available Test Workflows

Based on target "$1", here are relevant actions:

**For login/auth testing:**
- Navigate to `/login`
- Fill email and password fields
- Click login button
- Verify redirect to dashboard

**For member testing:**
- Navigate to `/members` or `/members/add`
- Test form validation
- Verify list rendering

**For payment testing:**
- Navigate to `/payments` or `/payments/new`
- Test payment recording
- Verify balance updates

**For dashboard testing:**
- Navigate to `/`
- Verify charts render
- Check data accuracy

### Quick Commands Reference

| Action | Command |
|--------|---------|
| Screenshot | `mcp__chrome-devtools__take_screenshot` |
| DOM snapshot | `mcp__chrome-devtools__take_snapshot` |
| Click element | `mcp__chrome-devtools__click(uid: "...")` |
| Fill input | `mcp__chrome-devtools__fill(uid: "...", value: "...")` |
| Check console | `mcp__chrome-devtools__list_console_messages` |
| Check network | `mcp__chrome-devtools__list_network_requests` |
| Press key | `mcp__chrome-devtools__press_key(key: "Enter")` |
| Wait for text | `mcp__chrome-devtools__wait_for(text: "...")` |

### Ready to Test

Please confirm:
1. Is the dev server running? (I can start it if needed)
2. Which specific page or flow should I test?
3. What validations should I perform?
