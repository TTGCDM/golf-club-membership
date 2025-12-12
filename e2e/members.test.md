# E2E Test: Member Management

## Test ID: E2E-MEMBERS-001
## Priority: Critical
## Last Updated: 2025-12-12

---

## Prerequisites

- [ ] Dev server running at http://localhost:5173
- [ ] Logged in as user with EDIT role or higher
- [ ] Browser connected via chrome-devtools MCP

---

## Setup: Login First

Before running member tests, complete login:
```
mcp__chrome-devtools__navigate_page(type: "url", url: "http://localhost:5173/login")
# Complete login flow from login.test.md
```

---

## Test Case 1: View Members List

### Objective
Verify the members list page loads and displays member data.

### Steps

**Step 1: Navigate to members page**
```
mcp__chrome-devtools__navigate_page(type: "url", url: "http://localhost:5173/members")
```

**Step 2: Wait for page load**
```
mcp__chrome-devtools__wait_for(text: "Members", timeout: 5000)
```

**Step 3: Take snapshot**
```
mcp__chrome-devtools__take_snapshot()
```
Expected: Table with member data or "No members found" message

**Step 4: Check for console errors**
```
mcp__chrome-devtools__list_console_messages(types: ["error"])
```
Expected: No errors

### Pass Criteria
- [x] Members page loads
- [x] Member table or empty state displayed
- [x] No console errors

---

## Test Case 2: Add New Member

### Objective
Verify a new member can be created with all required fields.

### Test Data
```
Name: E2E-Test-Member-[timestamp]
Email: e2e-test-[timestamp]@example.com
Phone: 0400 000 000
Date of Birth: 1990-01-15
```

### Steps

**Step 1: Navigate to add member page**
```
mcp__chrome-devtools__navigate_page(type: "url", url: "http://localhost:5173/members/add")
```

**Step 2: Wait for form load**
```
mcp__chrome-devtools__wait_for(text: "Add New Member", timeout: 5000)
```

**Step 3: Take snapshot to get form field UIDs**
```
mcp__chrome-devtools__take_snapshot()
```

**Step 4: Fill member form**
```
mcp__chrome-devtools__fill_form(elements: [
  { uid: "[fullName-uid]", value: "E2E-Test-Member-001" },
  { uid: "[email-uid]", value: "e2e-test-001@example.com" },
  { uid: "[phone-uid]", value: "0400 000 001" },
  { uid: "[dateOfBirth-uid]", value: "1990-01-15" },
  { uid: "[address-uid]", value: "123 Test Street, Brighton TAS 7030" }
])
```

**Step 5: Submit form**
```
mcp__chrome-devtools__click(uid: "[submit-button-uid]")
```

**Step 6: Wait for success/redirect**
```
mcp__chrome-devtools__wait_for(text: "successfully", timeout: 5000)
```
OR check for redirect to member detail page

**Step 7: Verify no errors**
```
mcp__chrome-devtools__list_console_messages(types: ["error"])
```

### Pass Criteria
- [x] Form accepts all required fields
- [x] Member created successfully
- [x] Redirected to member detail or list
- [x] Success message displayed

---

## Test Case 3: Search Members

### Objective
Verify the member search functionality works correctly.

### Steps

**Step 1: Navigate to members list**
```
mcp__chrome-devtools__navigate_page(type: "url", url: "http://localhost:5173/members")
```

**Step 2: Wait for page and take snapshot**
```
mcp__chrome-devtools__wait_for(text: "Members", timeout: 5000)
mcp__chrome-devtools__take_snapshot()
```

**Step 3: Find and fill search input**
```
mcp__chrome-devtools__fill(uid: "[search-input-uid]", value: "E2E-Test")
```

**Step 4: Wait for search results**
```
# Allow time for client-side filtering
mcp__chrome-devtools__take_snapshot()
```
Expected: Only members matching "E2E-Test" displayed

**Step 5: Clear search**
```
mcp__chrome-devtools__fill(uid: "[search-input-uid]", value: "")
```

**Step 6: Verify all members returned**
```
mcp__chrome-devtools__take_snapshot()
```

### Pass Criteria
- [x] Search filters results correctly
- [x] Clearing search shows all members
- [x] No page reload required (client-side filter)

---

## Test Case 4: View Member Detail

### Objective
Verify member detail page displays all member information.

### Steps

**Step 1: Navigate to members list**
```
mcp__chrome-devtools__navigate_page(type: "url", url: "http://localhost:5173/members")
```

**Step 2: Take snapshot and find a member row**
```
mcp__chrome-devtools__take_snapshot()
```

**Step 3: Click on member name/row**
```
mcp__chrome-devtools__click(uid: "[member-row-uid]")
```

**Step 4: Wait for detail page**
```
mcp__chrome-devtools__wait_for(text: "Member Details", timeout: 5000)
```

**Step 5: Take snapshot of detail page**
```
mcp__chrome-devtools__take_snapshot()
```
Expected: Member info, balance, payment history visible

### Pass Criteria
- [x] Detail page loads
- [x] Member information displayed correctly
- [x] Account balance shown
- [x] Action buttons visible (Edit, Payment, etc.)

---

## Test Case 5: Edit Member

### Objective
Verify member information can be updated.

### Steps

**Step 1: Navigate to a member's edit page**
```
mcp__chrome-devtools__navigate_page(type: "url", url: "http://localhost:5173/members/[member-id]/edit")
```
Note: Replace `[member-id]` with actual member ID

**Step 2: Wait for form load**
```
mcp__chrome-devtools__wait_for(text: "Edit Member", timeout: 5000)
```

**Step 3: Take snapshot**
```
mcp__chrome-devtools__take_snapshot()
```
Expected: Form pre-filled with member data

**Step 4: Update a field (e.g., phone)**
```
mcp__chrome-devtools__fill(uid: "[phone-uid]", value: "0400 000 999")
```

**Step 5: Save changes**
```
mcp__chrome-devtools__click(uid: "[save-button-uid]")
```

**Step 6: Verify success**
```
mcp__chrome-devtools__wait_for(text: "successfully", timeout: 5000)
```

### Pass Criteria
- [x] Edit form loads with existing data
- [x] Changes can be made
- [x] Save updates the member
- [x] Success feedback shown

---

## Test Case 6: Form Validation

### Objective
Verify form validation prevents invalid data submission.

### Steps

**Step 1: Navigate to add member page**
```
mcp__chrome-devtools__navigate_page(type: "url", url: "http://localhost:5173/members/add")
```

**Step 2: Submit empty form**
```
mcp__chrome-devtools__take_snapshot()
mcp__chrome-devtools__click(uid: "[submit-button-uid]")
```

**Step 3: Check for validation errors**
```
mcp__chrome-devtools__take_snapshot()
```
Expected: Validation error messages for required fields

**Step 4: Fill invalid email**
```
mcp__chrome-devtools__fill(uid: "[email-uid]", value: "not-an-email")
mcp__chrome-devtools__click(uid: "[submit-button-uid]")
mcp__chrome-devtools__take_snapshot()
```
Expected: Email validation error

### Pass Criteria
- [x] Empty required fields show errors
- [x] Invalid email format rejected
- [x] Form not submitted with invalid data

---

## Cleanup

After testing, remove test members:

**Option 1: Manual cleanup via UI**
- Navigate to member detail
- Use delete function (if available to your role)

**Option 2: Identify test members**
- Search for "E2E-Test" prefix
- Note IDs for manual database cleanup if needed

---

## Notes

- Test members use "E2E-Test-" prefix for easy identification
- Membership category is auto-determined by date of birth
- Account balance starts at $0 for new members
