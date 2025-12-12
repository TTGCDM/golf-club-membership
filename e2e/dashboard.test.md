# E2E Test: Dashboard

## Test ID: E2E-DASHBOARD-001
## Priority: High
## Last Updated: 2025-12-12

---

## Prerequisites

- [ ] Dev server running at http://localhost:5173
- [ ] Logged in as any authenticated user
- [ ] Some member and payment data exists
- [ ] Browser connected via chrome-devtools MCP

---

## Test Case 1: Dashboard Load

### Objective
Verify the dashboard loads correctly with all components.

### Steps

**Step 1: Navigate to dashboard**
```
mcp__chrome-devtools__navigate_page(type: "url", url: "http://localhost:5173/dashboard")
```

**Step 2: Wait for dashboard to load**
```
mcp__chrome-devtools__wait_for(text: "Dashboard", timeout: 5000)
```

**Step 3: Take snapshot**
```
mcp__chrome-devtools__take_snapshot()
```
Expected: Dashboard components visible

**Step 4: Check for console errors**
```
mcp__chrome-devtools__list_console_messages(types: ["error"])
```
Expected: No errors

**Step 5: Take screenshot for visual verification**
```
mcp__chrome-devtools__take_screenshot()
```

### Pass Criteria
- [x] Dashboard page loads
- [x] No console errors
- [x] Main content area visible

---

## Test Case 2: Statistics Cards

### Objective
Verify the statistics cards display correct counts.

### Expected Cards
- Total Members
- Active Members
- Outstanding Balance (total)
- Payments This Year

### Steps

**Step 1: Navigate to dashboard**
```
mcp__chrome-devtools__navigate_page(type: "url", url: "http://localhost:5173/dashboard")
mcp__chrome-devtools__wait_for(text: "Dashboard", timeout: 5000)
```

**Step 2: Take snapshot and identify stat cards**
```
mcp__chrome-devtools__take_snapshot()
```

**Step 3: Verify cards are present**
Look for elements containing:
- "Total Members" with a number
- "Active Members" with a number
- Balance/financial figures

### Pass Criteria
- [x] All stat cards visible
- [x] Numbers are displayed (not "undefined" or "NaN")
- [x] Numbers are non-negative

---

## Test Case 3: Payment Status Overview Chart

### Objective
Verify the Payment Status Overview displays correctly with year selector.

### Steps

**Step 1: Navigate to dashboard**
```
mcp__chrome-devtools__navigate_page(type: "url", url: "http://localhost:5173/dashboard")
mcp__chrome-devtools__wait_for(text: "Payment Status", timeout: 5000)
```

**Step 2: Take snapshot**
```
mcp__chrome-devtools__take_snapshot()
```
Expected: Chart or data visualization visible

**Step 3: Find year selector**
```
mcp__chrome-devtools__take_snapshot()
```
Look for year dropdown/select element

**Step 4: Change year selection**
```
mcp__chrome-devtools__click(uid: "[year-selector-uid]")
mcp__chrome-devtools__click(uid: "[previous-year-option-uid]")
```

**Step 5: Verify data updates**
```
mcp__chrome-devtools__take_snapshot()
```
Expected: Chart/data reflects selected year

### Pass Criteria
- [x] Payment status section visible
- [x] Year selector present
- [x] Changing year updates the display
- [x] Shows paid vs outstanding breakdown

---

## Test Case 4: Member Status Chart

### Objective
Verify the Active vs Inactive Members chart displays correctly.

### Steps

**Step 1: Navigate to dashboard**
```
mcp__chrome-devtools__navigate_page(type: "url", url: "http://localhost:5173/dashboard")
```

**Step 2: Look for member status visualization**
```
mcp__chrome-devtools__take_snapshot()
```
Expected: Chart showing active/inactive member breakdown

**Step 3: Verify data labels**
Look for:
- "Active" count
- "Inactive" count
- Visual representation (pie/bar chart)

### Pass Criteria
- [x] Member status section visible
- [x] Active count displayed
- [x] Inactive count displayed
- [x] Numbers match reality (active + inactive = total)

---

## Test Case 5: Outstanding Balances List

### Objective
Verify members with outstanding balances are listed correctly.

### Steps

**Step 1: Navigate to dashboard**
```
mcp__chrome-devtools__navigate_page(type: "url", url: "http://localhost:5173/dashboard")
```

**Step 2: Take snapshot and look for outstanding balances section**
```
mcp__chrome-devtools__take_snapshot()
```

**Step 3: Verify list content**
Expected:
- Member names listed
- Outstanding amounts shown (negative balances)
- Sorted by amount (highest first)

### Pass Criteria
- [x] Outstanding balances section visible
- [x] Shows all members with negative balance (not just top 5)
- [x] Amounts displayed correctly
- [x] Can identify which members owe money

---

## Test Case 6: Navigation from Dashboard

### Objective
Verify quick links and navigation work from dashboard.

### Steps

**Step 1: Navigate to dashboard**
```
mcp__chrome-devtools__navigate_page(type: "url", url: "http://localhost:5173/dashboard")
mcp__chrome-devtools__wait_for(text: "Dashboard", timeout: 5000)
```

**Step 2: Take snapshot**
```
mcp__chrome-devtools__take_snapshot()
```

**Step 3: Click on a member link (if present)**
```
mcp__chrome-devtools__click(uid: "[member-link-uid]")
mcp__chrome-devtools__wait_for(text: "Member Details", timeout: 5000)
```
Expected: Navigates to member detail page

**Step 4: Return to dashboard**
```
mcp__chrome-devtools__navigate_page(type: "url", url: "http://localhost:5173/dashboard")
```

### Pass Criteria
- [x] Member links navigate to detail pages
- [x] Quick actions work (if present)
- [x] No dead links

---

## Test Case 7: Responsive Layout

### Objective
Verify dashboard displays correctly at different screen sizes.

### Steps

**Step 1: Load dashboard**
```
mcp__chrome-devtools__navigate_page(type: "url", url: "http://localhost:5173/dashboard")
```

**Step 2: Resize to mobile width**
```
mcp__chrome-devtools__resize_page(width: 375, height: 667)
```

**Step 3: Take screenshot**
```
mcp__chrome-devtools__take_screenshot()
```
Expected: Content stacks vertically, no horizontal overflow

**Step 4: Resize to tablet**
```
mcp__chrome-devtools__resize_page(width: 768, height: 1024)
mcp__chrome-devtools__take_screenshot()
```

**Step 5: Resize to desktop**
```
mcp__chrome-devtools__resize_page(width: 1920, height: 1080)
mcp__chrome-devtools__take_screenshot()
```

### Pass Criteria
- [x] Mobile: Content readable, no horizontal scroll
- [x] Tablet: Reasonable layout
- [x] Desktop: Full layout with side-by-side elements

---

## Test Case 8: Loading States

### Objective
Verify loading states display while data is being fetched.

### Steps

**Step 1: Clear browser cache/reload**
```
mcp__chrome-devtools__navigate_page(type: "reload", ignoreCache: true)
```

**Step 2: Observe loading state**
```
mcp__chrome-devtools__take_snapshot()
```
Expected: Loading spinner or skeleton visible briefly

**Step 3: Wait for data**
```
mcp__chrome-devtools__wait_for(text: "Dashboard", timeout: 10000)
```

### Pass Criteria
- [x] Loading state shown during fetch
- [x] Transitions smoothly to loaded state
- [x] No flash of empty content

---

## Cleanup

No cleanup required for dashboard tests (read-only operations).

---

## Notes

- Dashboard uses React Query for data fetching
- Data is cached and may not reflect immediate changes
- Year selector affects Payment Status Overview only
- Outstanding balances shows ALL members (not limited to top 5)
