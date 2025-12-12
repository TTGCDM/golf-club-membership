# Reference Documentation

Detailed reference material for the Tea Tree Golf Club Membership Management System. For core rules and quick reference, see `CLAUDE.md`.

---

## Data Model (Firestore Collections)

### members
```javascript
{
  fullName: string,
  email: string,
  phone: string,
  address: string,
  dateOfBirth: string (YYYY-MM-DD),
  golfAustraliaId: string,
  membershipCategory: string, // Auto-determined by age
  accountBalance: number,     // Positive=credit, negative=owing
  status: 'active' | 'inactive',
  dateJoined: string,
  emergencyContact: string,
  comments: [                 // Optional - member notes
    {
      id: string,
      text: string,
      createdAt: string (ISO),
      createdBy: string (userId),
      createdByName: string (email)
    }
  ],
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### payments
```javascript
{
  memberId: string,           // Reference to member
  memberName: string,         // Denormalized for quick display
  amount: number,
  paymentDate: string (YYYY-MM-DD),
  paymentMethod: 'bank_transfer' | 'cash' | 'cheque' | 'card',
  reference: string,          // Check number, transfer ID, etc.
  notes: string,
  receiptNumber: string,      // Format: R2025-001
  recordedBy: string,         // User ID who recorded payment
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### users
```javascript
{
  email: string,
  role: 'view' | 'edit' | 'admin' | 'super_admin',
  status: 'pending' | 'active' | 'inactive',
  createdAt: timestamp,
  updatedAt: timestamp,
  approvedAt?: timestamp
}
```

**Denormalization Note**: `memberName` stored in payments for quick display without joins.

---

## Key Service Functions

### membersService.js
- `createMember(data)` - Auto-determines category from DOB
- `getAllMembers()` - Returns all members array
- `searchMembers(searchTerm)` - Client-side search (name/email/phone/ID)
- `updateMember(id, data)` - Updates member
- `deleteMember(id)` - Soft delete (sets status='inactive')
- `hardDeleteMember(id)` - Permanent removal (use with caution)
- `downloadMembersCSV(members)` - Client-side CSV export
- `addMemberComment(memberId, text, userId, userName)` - Add timestamped note
- `deleteMemberComment(memberId, commentId)` - Remove a comment

### paymentsService.js
- `recordPayment(data, userId)` - **Uses transaction** to record payment + update balance
- `updatePayment(id, oldAmount, newData)` - **Uses transaction** to adjust balance
- `deletePayment(id)` - **Uses transaction** to reverse balance
- `generateReceiptNumber(year)` - Auto-increments (R2025-001 format)
- `getPaymentsByMember(memberId)` - Get member's payment history

### usersService.js
- `hasPermission(userRole, requiredRole)` - Hierarchy check (numeric comparison)
- `canManageUser(managerRole, targetRole)` - Ensures manager outranks target
- `createUserDocument(uid, email, role, status)` - Create user doc in Firestore
- `approveUser(uid)` - Sets status='active', adds approvedAt timestamp
- `updateUserRole(uid, newRole)` - Change user role (respects hierarchy)

---

## Implementation Notes

### Soft vs Hard Delete
**Soft Delete** (recommended): Set `status: 'inactive'`
- Preserves payment history
- Maintains data integrity
- Can be reactivated

**Hard Delete**: Completely removes document
- Only for data entry errors or test data
- Breaks payment history references
- Use `hardDeleteMember()` cautiously

### Receipt Number Generation
Format: `R{YEAR}-{NUMBER}` (e.g., R2025-001)
- Queries last receipt for year, increments by 1
- Not transactional (potential duplicates under high concurrency)
- Fallback to timestamp if query fails

### Firebase Timestamps
Use `serverTimestamp()` instead of `Date.now()` for consistency across timezones.

### CSV Export Performance
Client-side export loads all data into memory. For 5000+ members, consider Cloud Functions.

---

## Common Patterns

### Adding New Features
1. Create service function in `src/services/` for Firestore operations
2. Create page component in `src/pages/` that uses service
3. Add route in `src/App.jsx`
4. Add nav link in `src/components/Layout.jsx` (if needed)
5. Add permission check if feature is role-restricted

### Permission Checking in Components
```javascript
import { useAuth } from '../contexts/AuthContext'

const { checkPermission, ROLES } = useAuth()

if (!checkPermission(ROLES.EDIT)) {
  return <div>Access denied</div>
}
```

### Conditional Navigation
```javascript
// Layout.jsx pattern
{checkPermission(ROLES.ADMIN) && (
  <Link to="/users">Users</Link>
)}
```

---

## MCP Server Integration

| Server | Purpose | Project Use |
|--------|---------|-------------|
| **chrome-devtools** | Browser automation | UI testing, form validation |
| **figma** | Figma design access | Design specs, assets |
| **memory** | Session context | Conversation continuity |
| **sequential-thinking** | Extended reasoning | Complex debugging |
| **context7** | Library docs | Up-to-date documentation |

### Quick Examples

**Test a form submission**:
```
take_snapshot → fill_form → click → wait_for → list_console_messages
```

**Verify page renders correctly**:
```
navigate_page → take_snapshot → take_screenshot
```

**Check for errors**:
```
list_console_messages(types: ["error"]) + list_network_requests
```

See **MCP_WORKFLOWS.md** for detailed workflows.

---

## Troubleshooting

### "Permission denied" errors after deploying rules
- Verify user document exists in Firestore `users` collection
- Check user `status` is `'active'` (not `'pending'` or `'inactive'`)
- Verify user `role` is assigned correctly

### Payment balance mismatch
- All payment operations use transactions
- If mismatch occurs, check for failed transactions in console
- Manual fix: Recalculate balance from payment history

### Search performance degradation
- Client-side search fetches all members
- Monitor performance with 500+ members
- Implement Algolia if >1000 members

### First user cannot access app
- First Firebase Auth user auto-elevated to super_admin (AuthContext.jsx:74-80)
- If fails, manually create user document in Firestore Console:
  - Collection: `users`
  - Document ID: Firebase Auth UID
  - Fields: `{ email, role: 'super_admin', status: 'active', createdAt, updatedAt }`

---

## Version History

### v2.0.0 - Major Platform Upgrade (Current)
**Deployed**: December 2025

**New Features**:
- Member Comments/Notes System
- Payment Method Expansion (cheque, card)
- UI Component Library (shadcn/ui)
- React Query Data Layer
- Zod Schema Validation
- Centralized Error Handling
- New Relic Browser Monitoring

**Bug Fixes**:
- Critical: Firestore Transaction Ordering fix
- Relaxed Firestore member validation rules

**Architecture Improvements**:
- Form components directory (`src/components/form/`)
- Hooks directory with query factories (`src/hooks/`)
- Schemas directory with Zod definitions (`src/schemas/`)

### v1.5.1 - Bulk Payment Reminders & PDF Enhancements
- Bulk Payment Reminder Letter generation
- Record Fee button with modal
- PDF template improvements

### v1.5.0 - Membership Applications & Member Communications
- Public application form with email verification
- SendGrid email integration
- Admin application management
- Welcome letter and payment reminder PDFs

### v1.4.0 - Dashboard Analytics & Report Enhancements
- Payment Status Overview with year selector
- Reports with TOTAL row

### v1.2.0 - Enhanced UX & Reporting
- Payment auto-fill
- Sortable columns
- Report Builder

### v1.1.0 - Advanced Admin Features
- Dynamic membership categories
- Annual fee application system

### v1.0.0 - Initial Production Release
- Core membership management
- Payment recording
- Role-based access control
- CSV import/export
- PDF receipts

---

## Documentation Index

- **CLAUDE.md**: Core rules, architecture, frozen files
- **REFERENCE.md** (this file): Data models, service functions, troubleshooting
- **DEPLOYMENT.md**: Production deployment guide
- **MCP_WORKFLOWS.md**: MCP server workflows
- **firestore.rules**: Security rules with inline comments
