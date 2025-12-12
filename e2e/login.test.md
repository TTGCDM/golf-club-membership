# E2E Test: Login Flow

## Test ID: E2E-LOGIN-001
## Priority: Critical
## Last Updated: 2025-12-12

---

## Prerequisites

- [ ] Dev server running at http://localhost:5173
- [ ] Valid test credentials available
- [ ] Browser connected via chrome-devtools MCP

---

## Test Case 1: Successful Login

### Objective
Verify that a user with valid credentials can log in and is redirected to the dashboard.

### Steps

**Step 1: Navigate to login page**
```
mcp__chrome-devtools__navigate_page(type: "url", url: "http://localhost:5173/login")
```
Expected: Login page loads with "Tea Tree Golf Club" heading

**Step 2: Take snapshot to get element UIDs**
```
mcp__chrome-devtools__take_snapshot()
```
Expected: Snapshot shows email input, password input, and Sign In button

**Step 3: Fill email field**
```
mcp__chrome-devtools__fill(uid: "[email-input-uid]", value: "[test-email]")
```
Note: Replace `[email-input-uid]` with actual UID from snapshot

**Step 4: Fill password field**
```
mcp__chrome-devtools__fill(uid: "[password-input-uid]", value: "[test-password]")
```

**Step 5: Click Sign In button**
```
mcp__chrome-devtools__click(uid: "[signin-button-uid]")
```

**Step 6: Wait for redirect**
```
mcp__chrome-devtools__wait_for(text: "Dashboard", timeout: 10000)
```
Expected: Dashboard page loads

**Step 7: Verify no console errors**
```
mcp__chrome-devtools__list_console_messages(types: ["error"])
```
Expected: No error messages

### Pass Criteria
- [x] User redirected to /dashboard
- [x] Dashboard content visible
- [x] No console errors

---

## Test Case 2: Invalid Credentials

### Objective
Verify that invalid credentials show an appropriate error message.

### Steps

**Step 1: Navigate to login page**
```
mcp__chrome-devtools__navigate_page(type: "url", url: "http://localhost:5173/login")
```

**Step 2: Take snapshot**
```
mcp__chrome-devtools__take_snapshot()
```

**Step 3: Fill with invalid credentials**
```
mcp__chrome-devtools__fill(uid: "[email-input-uid]", value: "invalid@example.com")
mcp__chrome-devtools__fill(uid: "[password-input-uid]", value: "wrongpassword")
```

**Step 4: Click Sign In**
```
mcp__chrome-devtools__click(uid: "[signin-button-uid]")
```

**Step 5: Wait for error message**
```
mcp__chrome-devtools__wait_for(text: "Invalid email or password", timeout: 5000)
```
Expected: Error message appears

**Step 6: Verify still on login page**
```
mcp__chrome-devtools__take_snapshot()
```
Expected: Still shows login form, not redirected

### Pass Criteria
- [x] Error message "Invalid email or password" displayed
- [x] User remains on login page
- [x] Form is still accessible for retry

---

## Test Case 3: Empty Form Submission

### Objective
Verify that form validation prevents submission of empty fields.

### Steps

**Step 1: Navigate to login page**
```
mcp__chrome-devtools__navigate_page(type: "url", url: "http://localhost:5173/login")
```

**Step 2: Take snapshot**
```
mcp__chrome-devtools__take_snapshot()
```

**Step 3: Click Sign In without entering credentials**
```
mcp__chrome-devtools__click(uid: "[signin-button-uid]")
```

**Step 4: Check for validation errors**
```
mcp__chrome-devtools__take_snapshot()
```
Expected: Validation error messages appear for required fields

### Pass Criteria
- [x] Email validation error displayed
- [x] Password validation error displayed
- [x] Form not submitted

---

## Test Case 4: Password Reset Flow

### Objective
Verify the password reset link and form work correctly.

### Steps

**Step 1: Navigate to login page**
```
mcp__chrome-devtools__navigate_page(type: "url", url: "http://localhost:5173/login")
```

**Step 2: Take snapshot and find "Forgot password?" link**
```
mcp__chrome-devtools__take_snapshot()
```

**Step 3: Click "Forgot password?" link**
```
mcp__chrome-devtools__click(uid: "[forgot-password-uid]")
```

**Step 4: Verify reset form appears**
```
mcp__chrome-devtools__wait_for(text: "Reset Password", timeout: 3000)
```
Expected: Reset password form displayed

**Step 5: Take snapshot of reset form**
```
mcp__chrome-devtools__take_snapshot()
```
Expected: Email input and "Send Reset Link" button visible

**Step 6: Click "Back to Login"**
```
mcp__chrome-devtools__click(uid: "[back-to-login-uid]")
```

**Step 7: Verify return to login form**
```
mcp__chrome-devtools__wait_for(text: "Sign In", timeout: 3000)
```

### Pass Criteria
- [x] Forgot password link works
- [x] Reset form displays correctly
- [x] Back to Login returns to main form

---

## Cleanup

No cleanup required for login tests (read-only operations).

---

## Notes

- Test credentials should be stored in `.env.test` or provided by user
- Never commit real credentials to this file
- If Firebase Auth is in test mode, use test accounts
