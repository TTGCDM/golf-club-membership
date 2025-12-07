# MCP Workflows Guide

This guide documents project-specific workflows using MCP (Model Context Protocol) servers for the Tea Tree Golf Club Membership Management System.

---

## Overview

MCP servers extend Claude Code's capabilities with specialized integrations. This project uses these servers for:

- **Browser Testing**: Verify UI functionality and visual correctness
- **GitHub Integration**: Streamlined PR and issue workflows
- **Design Handoff**: Extract specs and assets from Figma
- **Context Management**: Maintain knowledge across sessions

---

## Browser Testing with chrome-devtools

The chrome-devtools MCP server provides direct browser control for testing the application.

### Taking Screenshots

Capture visual state for verification or documentation:

```
# Screenshot current viewport
mcp__chrome-devtools__take_screenshot

# Screenshot specific element
mcp__chrome-devtools__take_screenshot(uid: "element-uid")

# Full page screenshot
mcp__chrome-devtools__take_screenshot(fullPage: true)
```

**Project uses**:
- Capture dashboard state after data loads
- Document payment receipt rendering
- Verify responsive layout at different sizes

### DOM Inspection with Snapshots

Get a text representation of the page structure:

```
mcp__chrome-devtools__take_snapshot
```

Returns element tree with unique IDs (uids) for interaction. Use for:
- Verifying correct elements render
- Finding elements for click/fill operations
- Checking role-based UI (admin-only elements)

### Form Testing

Fill and submit forms programmatically:

```
# Fill single input
mcp__chrome-devtools__fill(uid: "input-uid", value: "test@example.com")

# Fill multiple form fields at once
mcp__chrome-devtools__fill_form(elements: [
  { uid: "email-input", value: "member@test.com" },
  { uid: "phone-input", value: "0412345678" },
  { uid: "amount-input", value: "150.00" }
])

# Click submit button
mcp__chrome-devtools__click(uid: "submit-btn")
```

**Project form testing scenarios**:

| Form | Key Fields | Validation to Test |
|------|-----------|-------------------|
| Add Member | fullName, email, dateOfBirth | Required fields, email format, DOB format |
| Record Payment | amount, paymentDate, paymentMethod | Amount > 0, valid date |
| Login | email, password | Email format, password required |
| Apply Fees | membershipCategory, amount | Category exists, amount > 0 |

### Console Message Monitoring

Check for JavaScript errors:

```
# List all console messages
mcp__chrome-devtools__list_console_messages

# Filter for errors only
mcp__chrome-devtools__list_console_messages(types: ["error", "warn"])
```

**Common checks**:
- No errors after page load
- No React warnings in console
- Firebase connection successful

### Network Request Monitoring

Verify API calls and responses:

```
# List all network requests
mcp__chrome-devtools__list_network_requests

# Filter for API calls
mcp__chrome-devtools__list_network_requests(resourceTypes: ["fetch", "xhr"])

# Get details of specific request
mcp__chrome-devtools__get_network_request(reqid: 123)
```

**Project-specific checks**:
- Firestore reads on page load
- Auth token present in requests
- No failed API calls (4xx/5xx responses)

### Navigation

```
# Navigate to URL
mcp__chrome-devtools__navigate_page(type: "url", url: "http://localhost:5173/members")

# Browser back/forward
mcp__chrome-devtools__navigate_page(type: "back")
mcp__chrome-devtools__navigate_page(type: "forward")

# Reload page
mcp__chrome-devtools__navigate_page(type: "reload")
```

### Keyboard Input

```
# Press Enter to submit
mcp__chrome-devtools__press_key(key: "Enter")

# Keyboard shortcuts
mcp__chrome-devtools__press_key(key: "Control+A")
mcp__chrome-devtools__press_key(key: "Escape")
```

---

## End-to-End Testing Workflows

### Member Registration Flow

1. Navigate to `/members/add`
2. Fill member form with test data
3. Submit and verify redirect to member list
4. Confirm new member appears in list
5. Check member detail page shows correct data

```
# Example workflow
mcp__chrome-devtools__navigate_page(url: "http://localhost:5173/members/add")
mcp__chrome-devtools__take_snapshot  # Get form element uids
mcp__chrome-devtools__fill_form(elements: [...])
mcp__chrome-devtools__click(uid: "submit-btn")
mcp__chrome-devtools__wait_for(text: "Member added successfully")
```

### Payment Recording Flow

1. Navigate to `/payments/new`
2. Search and select member
3. Fill payment details (amount, date, method)
4. Submit and verify receipt number generated
5. Check member's balance updated correctly

**Critical verification**: Member's `accountBalance` must update atomically with payment record.

### Role-Based Access Testing

| Role | Should See | Should NOT See |
|------|-----------|----------------|
| VIEW | Dashboard, Members list, Payments list | Add/Edit buttons, Users page |
| EDIT | Add Member, Record Payment | Users page, Role management |
| ADMIN | Users page, Approve users | Cannot edit super_admin |
| SUPER_ADMIN | All features | - |

Test workflow:
1. Login as specific role
2. Take snapshot of navigation menu
3. Verify correct links present/absent
4. Attempt to navigate to restricted URL
5. Verify redirect or access denied

### Dashboard Data Verification

1. Navigate to dashboard
2. Take snapshot to get chart/card elements
3. Compare displayed values against known test data
4. Verify year selector filters correctly
5. Check all charts render without errors

---

## GitHub Integration Workflows

The github MCP server enables repository operations directly from Claude Code.

### Creating Pull Requests

After implementing a feature:

```
# Create PR with detailed description
gh pr create --title "Add member search" --body "## Summary\n- Implements client-side search\n- Filters by name, email, phone"
```

### Reviewing PRs

```
# List open PRs
gh pr list

# View PR details and diff
gh pr view 123
gh pr diff 123

# Check CI status
gh pr checks 123
```

### Issue Management

```
# Create issue for bug
gh issue create --title "Balance mismatch on payment delete" --body "..."

# List open issues
gh issue list

# Close issue
gh issue close 123
```

### Code Review Workflow

1. Check out PR branch
2. Run `npm run build` to verify build succeeds
3. Run `npm run lint` to check code quality
4. Use chrome-devtools to manually test changes
5. Add review comments via `gh pr review`

---

## Figma Design Integration

The figma MCP server accesses design files for implementation reference.

### Fetching Design Specs

```
# Get full design file data
mcp__figma__get_figma_data(fileKey: "abc123xyz")

# Get specific component
mcp__figma__get_figma_data(fileKey: "abc123xyz", nodeId: "1234:5678")
```

**Returns**: Layout info, colors, typography, spacing values.

### Downloading Assets

```
# Download icons/images
mcp__figma__download_figma_images(
  fileKey: "abc123xyz",
  localPath: "C:\\Users\\user\\testproject\\src\\assets",
  nodes: [
    { nodeId: "1234:5678", fileName: "logo.svg" },
    { nodeId: "1234:5679", fileName: "icon-member.png" }
  ]
)
```

### Design-to-Code Workflow

1. Get design specs for component
2. Note color values, spacing, typography
3. Map to Tailwind classes (see DESIGN_GUIDE.md)
4. Implement component
5. Compare screenshot against design

**Color mapping** (from DESIGN_GUIDE.md):
| Design Color | Tailwind Class |
|--------------|----------------|
| Primary blue | `bg-blue-600` |
| Success green | `bg-green-500` |
| Error red | `bg-red-500` |
| Text primary | `text-gray-900` |

---

## Memory & Context Servers

### Session Memory

The memory server maintains context within a session:

- Remembers discussed files and changes
- Tracks implementation decisions
- Maintains conversation flow

**Automatic** - no manual invocation needed.

### Long-Term Context (context7)

Stores information across sessions:

- Project-specific knowledge
- Past implementation patterns
- Known issues and solutions

### Sequential Thinking

For complex problem solving:

- Multi-step debugging
- Architecture decisions
- Complex refactoring plans

**Triggered automatically** for complex reasoning tasks.

---

## Project-Specific Test Scenarios

### Quick Smoke Tests

Run these after any significant change:

| Test | Steps | Expected Result |
|------|-------|-----------------|
| App loads | Navigate to `/` | Dashboard renders, no console errors |
| Auth works | Login with test user | Redirects to dashboard |
| Members list | Navigate to `/members` | Shows member table |
| Payment record | Record $50 payment | Balance updates, receipt generated |
| PDF export | Generate member report | PDF downloads successfully |

### Critical Path Tests

For production readiness:

1. **New member lifecycle**
   - Add member → Edit member → Apply fee → Record payment → Soft delete

2. **Payment integrity**
   - Record payment → Verify balance → Edit payment → Verify balance adjusted → Delete payment → Verify balance reversed

3. **Role enforcement**
   - Login as VIEW → Attempt to access `/members/add` → Verify blocked
   - Login as EDIT → Access add member → Success
   - Login as ADMIN → Manage users → Success (except super_admin)

4. **Data consistency**
   - Create member → Immediate read → Data matches
   - Record payment → Immediate balance check → Correct

### Visual Regression Testing

Compare screenshots before/after changes:

```
# Capture baseline
mcp__chrome-devtools__take_screenshot(filePath: "baseline-dashboard.png")

# After changes, capture comparison
mcp__chrome-devtools__take_screenshot(filePath: "current-dashboard.png")
```

Compare files visually for unintended changes.

---

## Performance Monitoring

### Page Load Performance

```
# Start trace with auto-reload
mcp__chrome-devtools__performance_start_trace(reload: true, autoStop: true)

# Analyze results
mcp__chrome-devtools__performance_analyze_insight(insightSetId: "...", insightName: "LCPBreakdown")
```

**Key metrics for this project**:
- Dashboard initial load < 2s
- Member list with 500+ records < 3s
- Payment recording < 1s

### Network Performance

```
# Enable network throttling for testing
mcp__chrome-devtools__emulate(networkConditions: "Slow 3G")

# Test app behavior
# ...

# Disable throttling
mcp__chrome-devtools__emulate(networkConditions: "No emulation")
```

---

## Troubleshooting with MCP

### Debugging React Errors

1. Check console: `mcp__chrome-devtools__list_console_messages(types: ["error"])`
2. Take snapshot to see current DOM state
3. Check network for failed API calls
4. Screenshot error state for documentation

### Debugging Auth Issues

1. Check network for auth requests
2. Verify token in requests
3. Check console for Firebase auth errors
4. Verify user document exists in Firestore

### Debugging Payment Balance Issues

1. Navigate to member detail page
2. Take snapshot to see displayed balance
3. Check payment history via network requests
4. Calculate expected balance from payment records
5. Compare with displayed value

---

## Quick Reference

### Common Tool Combinations

| Task | Tools |
|------|-------|
| Test form submission | `take_snapshot` → `fill_form` → `click` → `wait_for` |
| Verify page content | `navigate_page` → `take_snapshot` |
| Check for errors | `list_console_messages` + `list_network_requests` |
| Visual test | `navigate_page` → `take_screenshot` |
| Performance check | `performance_start_trace` → `performance_analyze_insight` |

### MCP Tool Prefixes

All chrome-devtools tools: `mcp__chrome-devtools__*`
All figma tools: `mcp__figma__*`

---

**Last Updated**: December 2025
