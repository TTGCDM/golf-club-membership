# E2E Test: Payment Recording

## Test ID: E2E-PAYMENTS-001
## Priority: Critical
## Last Updated: 2025-12-12

---

## Prerequisites

- [ ] Dev server running at http://localhost:5173
- [ ] Logged in as user with EDIT role or higher
- [ ] At least one member exists in the system
- [ ] Browser connected via chrome-devtools MCP

---

## Test Case 1: Record Payment from Member Detail

### Objective
Verify a payment can be recorded and the member balance updates correctly.

### Pre-Test
Note the member's current balance before starting.

### Steps

**Step 1: Navigate to a member's detail page**
```
mcp__chrome-devtools__navigate_page(type: "url", url: "http://localhost:5173/members/[member-id]")
```

**Step 2: Note current balance**
```
mcp__chrome-devtools__take_snapshot()
```
Record: Current balance = $[X]

**Step 3: Click "Record Payment" button**
```
mcp__chrome-devtools__click(uid: "[record-payment-button-uid]")
```

**Step 4: Wait for payment modal/form**
```
mcp__chrome-devtools__wait_for(text: "Record Payment", timeout: 5000)
mcp__chrome-devtools__take_snapshot()
```

**Step 5: Fill payment form**
```
mcp__chrome-devtools__fill_form(elements: [
  { uid: "[amount-uid]", value: "100.00" },
  { uid: "[paymentDate-uid]", value: "2025-01-15" },
  { uid: "[reference-uid]", value: "E2E-TEST-PAY-001" }
])
```

**Step 6: Select payment method**
```
mcp__chrome-devtools__click(uid: "[paymentMethod-select-uid]")
mcp__chrome-devtools__click(uid: "[bank-transfer-option-uid]")
```

**Step 7: Submit payment**
```
mcp__chrome-devtools__click(uid: "[submit-payment-uid]")
```

**Step 8: Wait for success**
```
mcp__chrome-devtools__wait_for(text: "successfully", timeout: 5000)
```

**Step 9: Verify balance updated**
```
mcp__chrome-devtools__take_snapshot()
```
Expected: New balance = $[X + 100]

### Pass Criteria
- [x] Payment form opens correctly
- [x] Payment is recorded
- [x] Member balance increases by payment amount
- [x] Success message displayed
- [x] Receipt number generated

---

## Test Case 2: View Payments List

### Objective
Verify the payments list page displays all payments correctly.

### Steps

**Step 1: Navigate to payments page**
```
mcp__chrome-devtools__navigate_page(type: "url", url: "http://localhost:5173/payments")
```

**Step 2: Wait for page load**
```
mcp__chrome-devtools__wait_for(text: "Payments", timeout: 5000)
```

**Step 3: Take snapshot**
```
mcp__chrome-devtools__take_snapshot()
```
Expected: Table with payment records

**Step 4: Verify test payment exists**
Look for "E2E-TEST-PAY-001" reference in the list

**Step 5: Check console for errors**
```
mcp__chrome-devtools__list_console_messages(types: ["error"])
```

### Pass Criteria
- [x] Payments list loads
- [x] Payment data displayed correctly
- [x] Columns: Receipt #, Date, Member, Amount, Method, Reference
- [x] No console errors

---

## Test Case 3: Payment Validation

### Objective
Verify payment form validation prevents invalid submissions.

### Steps

**Step 1: Navigate to member detail and open payment form**
```
mcp__chrome-devtools__navigate_page(type: "url", url: "http://localhost:5173/members/[member-id]")
mcp__chrome-devtools__take_snapshot()
mcp__chrome-devtools__click(uid: "[record-payment-button-uid]")
mcp__chrome-devtools__wait_for(text: "Record Payment", timeout: 5000)
```

**Step 2: Submit empty form**
```
mcp__chrome-devtools__click(uid: "[submit-payment-uid]")
mcp__chrome-devtools__take_snapshot()
```
Expected: Validation errors for required fields

**Step 3: Enter zero amount**
```
mcp__chrome-devtools__fill(uid: "[amount-uid]", value: "0")
mcp__chrome-devtools__click(uid: "[submit-payment-uid]")
mcp__chrome-devtools__take_snapshot()
```
Expected: "Amount must be greater than 0" error

**Step 4: Enter negative amount**
```
mcp__chrome-devtools__fill(uid: "[amount-uid]", value: "-50")
mcp__chrome-devtools__click(uid: "[submit-payment-uid]")
mcp__chrome-devtools__take_snapshot()
```
Expected: Validation error

### Pass Criteria
- [x] Empty amount rejected
- [x] Zero amount rejected
- [x] Negative amount rejected
- [x] Missing date rejected
- [x] Missing payment method rejected

---

## Test Case 4: Payment Methods

### Objective
Verify all payment methods can be selected and recorded.

### Payment Methods to Test
- Bank Transfer
- Cash
- Cheque
- Card

### Steps

For each payment method:

**Step 1: Open payment form**
```
mcp__chrome-devtools__navigate_page(type: "url", url: "http://localhost:5173/members/[member-id]")
mcp__chrome-devtools__click(uid: "[record-payment-button-uid]")
mcp__chrome-devtools__wait_for(text: "Record Payment", timeout: 5000)
```

**Step 2: Fill basic details**
```
mcp__chrome-devtools__fill(uid: "[amount-uid]", value: "10.00")
mcp__chrome-devtools__fill(uid: "[paymentDate-uid]", value: "2025-01-15")
```

**Step 3: Select payment method**
```
mcp__chrome-devtools__click(uid: "[paymentMethod-select-uid]")
mcp__chrome-devtools__click(uid: "[method-option-uid]")
```

**Step 4: Submit and verify**
```
mcp__chrome-devtools__click(uid: "[submit-payment-uid]")
mcp__chrome-devtools__wait_for(text: "successfully", timeout: 5000)
```

### Pass Criteria
- [x] Bank Transfer works
- [x] Cash works
- [x] Cheque works
- [x] Card works

---

## Test Case 5: Receipt Generation

### Objective
Verify receipt numbers are generated correctly.

### Steps

**Step 1: Record a payment (use Test Case 1 steps)**

**Step 2: Note the receipt number**
Format should be: R[YEAR]-[NUMBER] (e.g., R2025-001)

**Step 3: Record another payment**

**Step 4: Verify receipt number incremented**
Second receipt should be R[YEAR]-[NUMBER+1]

### Pass Criteria
- [x] Receipt numbers follow R[YEAR]-[XXX] format
- [x] Numbers increment correctly
- [x] Year matches current year

---

## Test Case 6: Balance Transaction Integrity

### Objective
Verify that payment transactions correctly update member balance.

### Steps

**Step 1: Get member's current balance**
```
mcp__chrome-devtools__navigate_page(type: "url", url: "http://localhost:5173/members/[member-id]")
mcp__chrome-devtools__take_snapshot()
```
Record: Starting balance = $[A]

**Step 2: Record payment of $50**
Follow Test Case 1 steps with amount = 50

**Step 3: Verify balance**
Expected: Balance = $[A + 50]

**Step 4: Record another payment of $25**
Expected: Balance = $[A + 75]

**Step 5: Check member's payment history**
Both payments should appear in transaction list

### Pass Criteria
- [x] Balance increases by exact payment amount
- [x] Multiple payments accumulate correctly
- [x] Payment history shows all transactions

---

## Cleanup

Identify and note test payments for potential cleanup:
- Reference prefix: "E2E-TEST-PAY-"
- Small amounts ($10, $25, $50, $100)

Note: Deleting payments requires ADMIN role and will affect balance.

---

## Notes

- Payments add to balance (positive = credit)
- Negative balance means member owes money
- Receipt numbers are auto-generated
- All payment operations use Firestore transactions for atomicity
