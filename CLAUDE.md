# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

React 18 + Firebase membership management system for Tea Tree Golf Club. Single-page application (SPA) with role-based access control, payment processing, and member records.

**Tech Stack**: React 18, React Router v6, Tailwind CSS, Firebase (Auth + Firestore), Vite

---

## Development Commands

```bash
# Development
npm install              # Install dependencies
npm run dev             # Vite dev server at localhost:5173 (HMR enabled)

# Build & Preview
npm run build           # Production build to dist/
npm run preview         # Preview production build locally

# Firebase
npm run emulator        # Start Firestore + Auth emulators
firebase login          # Authenticate Firebase CLI

# Deployment (see DEPLOYMENT.md for full guide)
npm run deploy          # Full deploy (build + hosting + rules + indexes)
npm run deploy:hosting  # Deploy hosting only
npm run deploy:rules    # Deploy Firestore rules only
npm run deploy:indexes  # Deploy Firestore indexes only
```

**Environment Setup**: Copy `.env.example` to `.env` and configure Firebase credentials (all vars must have `VITE_` prefix for Vite).

---

## Architecture Patterns

### 1. Layered Architecture

**Presentation → State → Business Logic → Backend**

```
src/
├── pages/          # Full-page route components (fetch data, manage state)
├── components/     # Reusable UI (Layout, PrivateRoute, Forms)
├── contexts/       # Global state (AuthContext only)
├── services/       # Business logic & Firestore operations
└── firebase.js     # Firebase initialization
```

**Critical Rule**: Components never call Firestore directly. Always use service functions.

### 2. Authentication & Authorization

**AuthContext** provides global auth state via React Context:

```javascript
const { currentUser, userRole, checkPermission, ROLES } = useAuth()

// Check permissions
if (!checkPermission(ROLES.EDIT)) {
  return <div>Access denied</div>
}
```

**Role Hierarchy** (each includes permissions of lower levels):
1. `VIEW` - Read-only access (dashboard, members list, payments)
2. `EDIT` - Can add/edit members, record payments
3. `ADMIN` - Can manage users (approve registrations, assign roles)
4. `SUPER_ADMIN` - Full access, cannot be managed by regular admins

**User Lifecycle**:
1. New user registers → `status: 'pending'`, `role: 'view'`
2. Super Admin approves → `status: 'active'`
3. Only ACTIVE users can access the app (checked in AuthContext)

**First User Auto-Elevation**: If Firebase Auth user has no Firestore document, AuthContext auto-creates one with `super_admin` role (see AuthContext.jsx:74-80). This bootstraps the first admin.

### 3. Transaction-Based Payment Operations

**Critical**: Payment operations use Firestore `runTransaction()` to ensure atomicity. Recording, editing, or deleting payments MUST update both:
1. Payment document in `payments` collection
2. Member's `accountBalance` field

**Balance Semantics**:
- **Positive balance (+$500)**: Member has credit (paid ahead)
- **Negative balance (-$500)**: Member owes money
- Payments **add** to balance (increase credit)

**Example** (paymentsService.js:73-98):
```javascript
await runTransaction(db, async (transaction) => {
  const memberDoc = await transaction.get(memberRef)
  const currentBalance = memberDoc.data().accountBalance || 0
  const newBalance = currentBalance + paymentAmount

  transaction.set(paymentRef, newPayment)
  transaction.update(memberRef, { accountBalance: newBalance })
})
```

If transaction fails, both operations rollback, preventing orphaned payments or balance mismatches.

### 4. Client-Side Search Limitation

**Why**: Firestore doesn't support case-insensitive search or OR queries. Current implementation fetches all members and filters client-side (membersService.js `searchMembers()`).

**Acceptable for**: <1000 members
**Scaling**: For 1000+ members, implement Algolia or similar search service.

### 5. Protected Routes Pattern

All authenticated routes wrapped in `<PrivateRoute>`:
- Redirects to `/login` if not authenticated
- Layout component conditionally shows nav links based on `checkPermission()`
- Individual pages can add additional role checks

### 6. Membership Category Auto-Determination

Categories auto-assigned by age (membershipCategories.js):
- Junior: <18
- Adult: 18-60
- Senior: 60+
- Life: Special/honorary

Calculated from `dateOfBirth` on member create/update.

---

## Firestore Security Rules

**Important**: Production security rules are comprehensive (firestore.rules). Key points:

1. **Authentication Required**: All operations require signed-in user
2. **Active Status Required**: User must have `status: 'active'` in users collection
3. **Role-Based Access**: Rules mirror JavaScript role hierarchy (VIEW=1, EDIT=2, ADMIN=3, SUPER_ADMIN=4)
4. **Data Validation**: Rules enforce required fields and data types
5. **Payment Edit Restriction**: Users can only edit/delete payments they recorded (unless ADMIN+)
6. **Admin Hierarchy**: Admins cannot modify super admin accounts

**Testing Rules**: Use `npm run emulator` to test locally before deploying with `npm run deploy:rules`.

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
  paymentMethod: 'bank_transfer' | 'cash',
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

**Denormalization Note**: `memberName` stored in payments for quick display without joins. Acceptable trade-off given Firestore's NoSQL nature.

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

## Important Implementation Notes

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
- For high-volume production, implement Firestore counter

### Firebase Timestamps
Use `serverTimestamp()` instead of `Date.now()` for consistency across timezones and client clock skew.

### CSV Export Performance
Client-side export loads all data into memory. For 5000+ members, may cause browser lag. Consider Cloud Functions for server-side export.

---

## Production Deployment

**Status**: v1.0.0 - Production-ready but not yet deployed

**Deployment Checklist** (see DEPLOYMENT.md for full guide):
1. Update `.firebaserc` with Firebase project ID
2. Deploy security rules: `npm run deploy:rules`
3. Deploy indexes: `npm run deploy:indexes`
4. Build and deploy hosting: `npm run deploy:hosting`
5. Configure automated backups in Firebase Console
6. Test restore procedure

**Critical**: Deploying security rules replaces test mode. Only authenticated, active users can access data afterward.

**Monitoring**: Firebase Console → Firestore Database → Usage (monitor reads/writes/storage)

---

## Testing

**No automated tests yet.** Manual testing approach:

1. **Role Testing**: Create users with each role, verify permissions
2. **Payment Testing**: Record payments, verify balance updates correctly
3. **Search Testing**: Test with 100+ members for performance
4. **Transaction Testing**: Verify failed payments don't corrupt balances

**Emulator Usage**:
```bash
npm run emulator  # Firestore + Auth on localhost:8080
# Use in development to avoid affecting production data
```

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

## Troubleshooting

### "Permission denied" errors after deploying rules
- Verify user document exists in Firestore `users` collection
- Check user `status` is `'active'` (not `'pending'` or `'inactive'`)
- Verify user `role` is assigned correctly

### Payment balance mismatch
- All payment operations (record/update/delete) use transactions
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

## Documentation

- **README.md**: Quick start guide, setup instructions
- **DEPLOYMENT.md**: Complete production deployment guide, security rules, backup configuration
- **firestore.rules**: Security rules with inline comments explaining each check

---

**Project**: Tea Tree Golf Club Membership Management System
**Version**: 1.4.0 (Production - Ready)
**Last Updated**: December 2025

---

## Version History

### v1.4.0 - Dashboard Analytics & Report Enhancements (Current)
**Status**: Ready for deployment

**New Features**:
- **Dashboard - Payment Status Overview**:
  - Added year selector dropdown to filter payment data by year
  - Shows current balance status (Paid Up vs Outstanding members)
  - Displays year-specific payment totals
  - Fixed member count calculations (now correctly shows all members with outstanding balances)

- **Reports - Outstanding Payments**:
  - Added TOTAL row showing sum of all amounts owed
  - Total row appears in both CSV and PDF exports
  - PDF total row includes separator line and bold formatting

**Bug Fixes**:
- Fixed Dashboard calculation showing only top 5 members instead of all members with outstanding balances
- Fixed Payments page hooks dependency order issue
- Removed unused variables causing ESLint errors
- All code passes linting with zero warnings

**Code Quality**:
- Full ESLint compliance
- Production build verified and optimized
- All unused variables removed

### v1.2.0 - Enhanced UX & Reporting
**Deployed**: November 2025

**New Features**:
- **Payment Form Enhancements**:
  - Auto-fills payment amount with member's outstanding balance
  - Disabled browser autocomplete for member search field

- **Dashboard Improvements**:
  - Replaced "Top Outstanding Balances" list with Payment Status Overview chart
  - Added Active vs Inactive Members chart with visual distribution
  - Added total dollar amounts to payment status cards
  - Shows total amount paid and total amount owed

- **Payments Page**:
  - Added sortable columns (click headers to sort by any column)
  - Sort by: Receipt #, Date, Member, Amount, Method, Reference, Recorded By
  - Visual indicators for ascending/descending sort

- **Reports Page - Report Builder**:
  - Replaced single Outstanding Payments report with flexible Report Builder
  - **Report Types**: Outstanding Payments, All Members, Active Members, Payment History
  - **Export Formats**: CSV (Excel-compatible) or PDF with professional formatting
  - Smart descriptions showing record counts and totals
  - Field previews before generating
  - Multi-page PDF support with headers and footers

**Bug Fixes**:
- Fixed FeeApplication component using incorrect auth context variable (user vs currentUser)
- Corrected Payment Status Overview labels (paid/unpaid were reversed)

### v1.1.0 - Advanced Admin Features
**Deployed**: November 2025
- Dynamic membership categories
- Annual fee application system
- Fee management and preview
- Category-based fee calculation

### v1.0.0 - Initial Production Release
**Deployed**: November 2025
- Core membership management
- Payment recording and tracking
- Role-based access control
- CSV import/export
- PDF receipt generation
