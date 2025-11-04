# Tea Tree Golf Club - Membership Management System

## Project Overview

**Type**: Full-stack web application (SPA - Single Page Application)

**Purpose**: A comprehensive membership management system for Tea Tree Golf Club, enabling staff to manage member records, process payments, handle user access control, and generate reports.

**Domain**: Golf Club Operations Management

---

## Tech Stack

### Frontend
- **React 18**: UI framework with hooks and context API
- **React Router v6**: Client-side routing (no direct page reloads)
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Vite**: Fast build tool and dev server (ES module bundling)
- **PostCSS & Autoprefixer**: CSS processing pipeline

### Backend & Data
- **Firebase**: Backend-as-a-Service platform
  - **Authentication**: Email/password sign-in with Firebase Auth
  - **Database**: Cloud Firestore (NoSQL document store)
  - **Hosting**: Configured for deployment (not yet implemented)

### Build & Development
- **npm**: Package manager
- **ES modules**: Modern JavaScript module system

---

## Architecture Overview

The application follows a layered architecture with clear separation of concerns:

1. **Presentation Layer** (React Components): Pages and reusable UI components
2. **State Management** (Context API): Authentication and user state via AuthContext
3. **Business Logic** (Services): Database operations and data transformations
4. **Backend** (Firebase): Authentication, Firestore database, and hosting infrastructure

### Key Architectural Patterns

1. **Context API for State Management**: AuthContext manages auth state, user roles, and permissions globally, eliminating prop drilling for auth-related data

2. **Service Layer Pattern**: Separation of UI from business logic. Components call services, not Firestore directly. Makes testing and refactoring easier.

3. **Role-Based Access Control (RBAC)**: Four-tier permission hierarchy (VIEW -> EDIT -> ADMIN -> SUPER_ADMIN). Checked at component level via useAuth() hook.

4. **Transaction-Based Operations**: Payment recording atomically updates member balance in single Firestore transaction, ensuring data consistency.

5. **Protected Routes Pattern**: PrivateRoute wrapper enforces authentication before accessing main app. Public routes (login, register) bypass protection.


---

## Directory Structure & Purpose

src/
├── components/          # Reusable UI components (Layout, Forms, Route Protection)
│   ├── Layout.jsx      # Main app shell with navigation bar and route outlet
│   ├── PrivateRoute.jsx # Route protection wrapper (redirects to login if not authenticated)
│   ├── MemberForm.jsx  # Shared form for adding/editing members
│   └── PaymentForm.jsx # Shared form for recording payments
│
├── contexts/           # React Context providers (Global state)
│   └── AuthContext.jsx # Authentication state, user roles, permissions, and auth methods
│
├── pages/              # Full-page components routed via React Router
│   ├── Login.jsx       # Email/password authentication
│   ├── Register.jsx    # New user registration (starts with pending status)
│   ├── Dashboard.jsx   # Summary of system statistics and quick info
│   ├── Members.jsx     # List of all members with search functionality
│   ├── AddMember.jsx   # Create new member form
│   ├── EditMember.jsx  # Update existing member information
│   ├── MemberDetail.jsx# Single member view with payment history
│   ├── Payments.jsx    # Payment transaction ledger and recording
│   ├── Reports.jsx     # Analytics and insights
│   └── Users.jsx       # User management (admin only)
│
├── services/           # Business logic layer (Firebase operations)
│   ├── membersService.js       # CRUD operations for members, search, export
│   ├── paymentsService.js      # Payment recording with transactions, receipt generation
│   ├── usersService.js         # User management, permissions, role hierarchy
│   └── membershipCategories.js # Age-based category determination
│
├── firebase.js         # Firebase initialization with config from env vars
├── App.jsx            # Route definitions and main component tree structure
├── main.jsx           # Entry point for React application
└── index.css          # Global styles


---

## Core Business Entities & Data Model

### Members Collection (members)
Database document representing a golf club member with their profile and financial status.

Fields:
- fullName: string (required)
- email: string
- phone: string
- address: string
- dateOfBirth: string (YYYY-MM-DD format)
- golfAustraliaId: string (optional unique identifier)
- membershipCategory: enum (Junior, Adult, Senior, Life, etc. - auto-determined by age)
- accountBalance: number (positive = credit/paid ahead, negative = owing)
- status: enum (active, inactive)
- dateJoined: string
- emergencyContact: string
- createdAt: Firestore timestamp
- updatedAt: Firestore timestamp

### Payments Collection (payments)
Database document representing a single payment transaction for a member.

Fields:
- memberId: string (reference to member document)
- memberName: string (cached for quick reference, denormalized)
- amount: number (payment amount in dollars)
- paymentDate: string (YYYY-MM-DD when payment was made)
- paymentMethod: enum (bank_transfer, cash)
- reference: string (check number, transfer ID, etc.)
- notes: string (optional notes about payment)
- receiptNumber: string (unique format: R2025-001)
- recordedBy: string (user ID who recorded the payment)
- createdAt: Firestore timestamp
- updatedAt: Firestore timestamp

### Users Collection (users)
Database document representing an app user with their access permissions.

Fields:
- email: string (from Firebase Auth)
- role: enum (view, edit, admin, super_admin)
- status: enum (pending - awaits approval, active - can login, inactive - disabled)
- createdAt: Firestore timestamp
- updatedAt: Firestore timestamp
- approvedAt: Firestore timestamp (when status changed to active)

Role Hierarchy (each level includes permissions of lower levels):
1. VIEW: Can view dashboard, members list, payments (read-only access)
2. EDIT: Can add/edit members, record payments
3. ADMIN: Can manage users (approve, change roles, deactivate)
4. SUPER_ADMIN: Full access including creating new admins


---

## Key Features & Implementation

### 1. Authentication & Authorization

**How it works:**
- Firebase Auth handles email/password authentication at the backend
- New users register with "pending" status and await Super Admin approval
- Super Admin approves users from Users page and assigns roles
- AuthContext provides useAuth() hook for all components to check auth status and permissions

**Key Components:**
- AuthContext: Manages login, register, logout, password reset, permission checking
- PrivateRoute: Wrapper that redirects unauthenticated users to login
- Layout: Uses checkPermission() to conditionally show "Users" link for ADMIN+ roles

**Files**: src/contexts/AuthContext.jsx, src/services/usersService.js

---

### 2. Member Management (CRUD)

**Create**: addMember.jsx form calls membersService.createMember(). Auto-determines membership category based on date of birth using membershipCategories.js

**Read**: Members.jsx displays all members with search functionality. MemberDetail.jsx shows single member with payment history.

**Update**: EditMember.jsx allows editing all member fields via membersService.updateMember()

**Delete**: Two approaches:
- Soft delete: Status changed to "inactive" (data preserved for history)
- Hard delete: Completely removes from Firestore (use with caution)

**Search**: Implemented client-side (fetches all members, filters locally) because Firestore doesn't support case-insensitive OR queries. For 1000+ members, consider Algolia search service.

**Export**: downloadMembersCSV() in membersService exports member list to CSV file

**Files**: src/services/membersService.js, src/pages/Members.jsx, src/pages/AddMember.jsx, src/pages/EditMember.jsx

---

### 3. Payment Processing

**Record Payment**: 
- PaymentForm component -> paymentsService.recordPayment()
- Generates receipt number automatically (R2025-001 format)
- **Uses Firestore transaction**: Atomically records payment and updates member balance in single operation
- Prevents inconsistency if one operation fails

**Balance Update Logic**:
- Payment amount is added to member's accountBalance
- Positive balance = member has credit/paid ahead
- Negative balance = member owes money

**Edit Payment**:
- Calculates difference between old and new amount
- Adjusts member balance by the difference
- Uses transaction to ensure consistency

**Delete Payment**:
- Removes payment and reverses the balance adjustment
- Transaction ensures both operations succeed or both fail

**Receipt Numbers**: 
- Format: R2025-001, R2025-002, etc.
- Fetches last receipt for year, increments by 1
- Fallback to timestamp if query fails

**Files**: src/services/paymentsService.js, src/pages/Payments.jsx, src/components/PaymentForm.jsx

---

### 4. Role-Based Feature Access

**Permission Hierarchy**: hasPermission() checks role level using numeric hierarchy (VIEW=1, EDIT=2, ADMIN=3, SUPER_ADMIN=4)

**Feature Access**:
- VIEW (hierarchy 1): Read-only dashboard, members, payments
- EDIT (hierarchy 2): Can add/edit members, record payments
- ADMIN (hierarchy 3): Can manage users (approve, assign roles, deactivate)
- SUPER_ADMIN (hierarchy 4): Full access to everything

**Component-Level Checks**:
```javascript
const { checkPermission, ROLES } = useAuth()
if (checkPermission(ROLES.ADMIN)) {
  // Show admin features
}
```

**Conditional Navigation**: Layout.jsx only shows Users link if user has ADMIN+ role

**Files**: src/services/usersService.js (hasPermission, canManageUser functions)

---

### 5. Dashboard & Reports

**Dashboard** (Dashboard.jsx):
- Total member count and breakdown by status
- Recent payments summary
- Members with outstanding balances
- User statistics (pending, active, inactive)

**Reports** (Reports.jsx):
- Payment statistics for selected year
- Payment breakdown by method (cash vs bank transfer)
- Monthly payment trend
- Outstanding balance report
- Member count by category

**Statistics Functions**:
- getMemberStats(): Total, active, inactive counts, total outstanding, breakdown by category
- getPaymentStats(): Total amount, count by method, monthly breakdown
- getUserStats(): Counts by role and status

**Files**: src/pages/Dashboard.jsx, src/pages/Reports.jsx


---

## Important Implementation Details

### Client-Side Search

Members search is performed on the client side by fetching all members and filtering locally. This was chosen because Firestore has limitations:
- Doesn't support case-insensitive searches natively
- OR queries (search by name OR email OR id) require multiple queries or client-side filtering
- For a golf club (hundreds of members), acceptable performance
- For production at 1000+ members, implement Algolia or similar search service

**Code**: searchMembers() in membersService.js loads all members and filters

---

### Membership Categories

Auto-determined by age based on date of birth using membershipCategories.js logic. Categories typically:
- Junior: Under 18
- Adult: 18-60
- Senior: 60+
- Life: Special/honorary

The system calculates age and assigns category automatically when member created or DOB updated.

---

### Balance & Payment Logic

**Balance Semantics**:
- **Positive balance** (+$500): Member has credit (paid ahead for future fees/charges, or deposit)
- **Negative balance** (-$500): Member owes money
- Zero balance: Paid in full for current obligations

**Why This Design**: Makes it intuitive that you "add" payments to increase credit, mirrors accounting where deposits are positive.

**Outstanding Balance Report**: Filters for active members with balance < 0, sums absolute value of balances

---

### Soft vs. Hard Delete Strategy

**Soft Delete** (status = "inactive"):
- Preserves all historical data (useful for audits, payment history, reports)
- Member removed from active lists but record remains
- Can be reactivated if needed
- Used for normal member departures

**Hard Delete** (completely removed):
- Fully removes document from Firestore
- Breaks historical continuity
- Use only for test data or data entry errors
- hardDeleteMember() function provided but use with caution

---

### Transaction-Based Payment Operations

When recording, editing, or deleting payments, Firestore transactions ensure:
1. Payment document is created/updated/deleted
2. Member balance is updated
3. Both operations succeed together or both fail together

If one operation fails (member not found, permission error), the entire transaction rolls back, preventing orphaned payment records or balance mismatches.

**Example**: recordPayment() uses runTransaction() to atomically add payment and update member balance

---

### Firestore Timestamps

All records use serverTimestamp() instead of client-side Date.now(). Benefits:
- Consistent across timezones and client clock differences
- Handled by Firestore server
- Can be used for sorting across distributed systems

---

## Environment Configuration

Create a .env file in project root with Firebase config from Firebase Console:

```
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=projectid.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=projectid
VITE_FIREBASE_STORAGE_BUCKET=projectid.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123:web:abc123...
```

These are loaded via import.meta.env in src/firebase.js and passed to Firebase initialization.

---

## Development Workflow

```bash
npm install              # Install dependencies
npm run dev             # Start Vite dev server (http://localhost:5173, auto-reload)
npm run build           # Production build to /dist
npm run preview         # Preview production build locally
npm run emulator        # Start Firebase emulators (Firestore + Auth)
```

Vite provides instant hot module replacement (HMR) - saved changes reflect immediately in browser.

## Production Deployment

### Deployment Commands
```bash
npm run deploy              # Full deployment (build + hosting + rules + indexes)
npm run deploy:hosting      # Deploy hosting only (build + upload)
npm run deploy:rules        # Deploy Firestore security rules only
npm run deploy:indexes      # Deploy Firestore indexes only
```

### Security Configuration Files
- `firestore.rules` - Comprehensive Firestore security rules with RBAC
- `firebase.json` - Firebase hosting and Firestore configuration
- `.firebaserc` - Firebase project ID configuration
- `firestore.indexes.json` - Composite indexes for query optimization

**Important**: See `DEPLOYMENT.md` for complete production deployment guide including:
- Firestore security rules deployment
- Firebase Hosting configuration
- Automated backup setup
- Security testing procedures
- Production checklist


---

## Common Development Tasks

### Adding a New Page Feature

1. **Create service function** in src/services/ if it involves database operations
2. **Create page component** in src/pages/YourPage.jsx that uses the service
3. **Add route** in src/App.jsx Routes section
4. **Add navigation link** in src/components/Layout.jsx
5. **Check permissions** in component using useAuth() and checkPermission()

Example:
```javascript
// In page component
const { checkPermission, ROLES } = useAuth()
if (!checkPermission(ROLES.EDIT)) {
  return <div>You don't have permission</div>
}
```

### Modifying the Database Schema

1. **Update service functions** to add/remove fields in create/update operations
2. **Update form components** to include new fields
3. **Test with Firestore** (currently in test mode - allow all access)
4. **For production**: Add Firestore security rules to validate schema

### Adding New Roles or Permissions

1. **Add role constant** to ROLES in usersService.js
2. **Update hierarchy** in hasPermission() function (add numeric tier)
3. **Add role name** to ROLE_NAMES for display
4. **Update role assignment logic** in Users.jsx if needed
5. **Add conditional UI** in components using checkPermission()

### Working with Firestore Data

**Common patterns**:
```javascript
// Get all documents
const allMembers = await getAllMembers()

// Get filtered documents
const activeMembers = await getMembersByStatus('active')

// Search (client-side)
const results = await searchMembers('john')

// Transaction for consistency
const payment = await recordPayment(paymentData, userId)

// Error handling
try {
  await updateMember(id, data)
} catch (error) {
  console.error('Update failed:', error)
}
```


---

## Known Limitations & Future Improvements

### Current Limitations

1. **Search Performance**: Client-side search loads all members into memory. Acceptable for 200-500 members; consider Algolia for 1000+.

2. **Firestore Constraints**:
   - Max 500 operations per transaction
   - No case-insensitive search built-in
   - OR queries not well-supported (workaround: client-side filtering)
   - Indexes required for complex queries

3. **Firebase Auth**: Email must be unique globally within project; no username-based auth.

4. **CSV Export**: Client-side only; large exports (5000+ rows) may cause browser lag.

5. **Current App Status**:
   - ✓ Firebase Hosting configuration ready (firebase.json created)
   - ✓ Firestore security rules implemented (comprehensive RBAC rules in firestore.rules)
   - ✓ Deployment scripts configured in package.json
   - ⚠️ Automated backups need manual configuration in Firebase Console (see DEPLOYMENT.md)
   - ⚠️ No email notifications yet
   - ⚠️ Security rules not yet deployed to production (still in test mode until first deployment)

6. **UI/UX**: Tailwind CSS only, no charting library for graphs in reports.

### Planned Enhancements (from README.md)

1. ✓ Production Firestore security rules (COMPLETED - see firestore.rules and DEPLOYMENT.md)
2. Annual fee application system
3. Payment verification workflow
4. Charts and graphs in reports
5. Email notifications for approvals
6. ✓ Firebase Hosting deployment configuration (COMPLETED - ready to deploy with npm run deploy)
7. Data backup and recovery procedures (documentation ready in DEPLOYMENT.md, needs manual setup)
8. Role-specific custom dashboards

### Scalability Considerations

- For 5000+ members: Implement Algolia search service
- For high transaction volume: Implement caching layer (Redis)
- For large reports: Implement background jobs (Cloud Functions)
- For backup: Enable Firestore automated backups in Firebase Console


---

## Code Quality & Best Practices

### Error Handling

All service functions use try/catch blocks:
```javascript
export const getMemberById = async (memberId) => {
  try {
    // operation
    return result
  } catch (error) {
    console.error('Error message:', error)
    throw error  // Let component handle it
  }
}
```

### Data Consistency

- Firestore transactions ensure payment + balance updates are atomic
- serverTimestamp() ensures consistent timestamps
- Denormalized fields (memberName in payments) make queries faster

### Function Organization

- **Service files**: Database operations only (CRUD, queries, transactions)
- **Page components**: Data fetching, state management, page-level logic
- **Reusable components**: Stateless or minimal state, accept props
- **Context**: Global auth state only

### React Patterns

- **Hooks**: useState for local state, useEffect for side effects, useContext for auth
- **Async operations**: useEffect cleanup, proper loading states
- **Error boundaries**: Consider adding for error recovery
- **Keys in lists**: Ensure unique keys when rendering arrays

### CSS Approach

- Tailwind CSS for all styling (utility classes)
- No custom CSS files needed (except index.css for global resets)
- Green color scheme (bg-green-600, hover:bg-green-700) for branding
- Responsive design using Tailwind breakpoints (sm:, md:, lg:)

### Comments & Documentation

- Code is generally self-documenting (clear function/variable names)
- Complex logic has comments (e.g., balance logic, transactions)
- Service functions have docstring comments explaining parameters


---

## Troubleshooting Common Issues

### Authentication Issues

**"User not found" error on first login**
- Symptom: Super admin user in Firebase Auth but app can't find user document
- Solution: Create user manually in Firebase Console, or app auto-creates on first login if user document doesn't exist (see AuthContext.jsx lines 73-80)

**"Permission denied" errors**
- Check user status is ACTIVE (not PENDING or INACTIVE)
- Check user role and hasPermission() hierarchy
- Verify Firestore is in test mode or rules allow the operation

**Can't register new user**
- Verify email/password requirements in Firebase Auth
- Check Firebase Auth is enabled in project
- New users get PENDING status; need SUPER_ADMIN approval to activate

### Data Consistency Issues

**Payment balance mismatch**
- Payments and balances can become mismatched if app crashes during transaction
- Solution: Use transactions consistently (all recordPayment, updatePayment, deletePayment use runTransaction)
- Check that both payment and member balance updates succeeded

**Duplicate receipt numbers**
- Firestore concurrent transactions may generate same receipt number
- Solution: Receipt number generation is non-transactional; for high-volume, implement counter in Firestore

### Performance Issues

**Search is slow with many members**
- Client-side filtering loads all members into memory
- Solution: Limit list size, implement pagination, or use Algolia search service

**Large CSV export hangs browser**
- Client-side CSV generation is memory-intensive
- Solution: Implement server-side CSV generation via Cloud Functions, or limit export size

### Firebase Connection Issues

**"Error: Firebase initialization failed"**
- Check .env file has valid Firebase credentials
- Verify VITE_ prefix on all env var names (required by Vite)
- Check Firebase project exists and APIs are enabled

**Firestore rules errors in production**
- Currently in test mode (allow all)
- Production requires explicit security rules
- Error symptoms: reads/writes fail after deploying security rules

---

## Key Files Quick Reference

| File | Purpose | Key Functions/Exports |
|------|---------|----------------------|
| src/contexts/AuthContext.jsx | Global auth state | useAuth, login, register, logout, checkPermission |
| src/services/membersService.js | Member CRUD & search | createMember, getMemberById, getAllMembers, searchMembers, updateMember, deleteMember, downloadMembersCSV |
| src/services/paymentsService.js | Payment operations | recordPayment, getPaymentById, getPaymentsByMember, updatePayment, deletePayment, generateReceiptNumber |
| src/services/usersService.js | User management | createUserDocument, getAllUsers, getPendingUsers, updateUserRole, updateUserStatus, approveUser, hasPermission, canManageUser |
| src/App.jsx | Route structure | Routes to all pages with PrivateRoute wrapper |
| src/components/Layout.jsx | Main navigation | Navigation bar, logout, permission-based link visibility |
| src/pages/Dashboard.jsx | System overview | Member stats, payment summary, outstanding balances |
| src/pages/Members.jsx | Member list | Display, search, links to detail/edit/add |
| src/pages/Payments.jsx | Payment ledger | Record, view, edit, delete payments |
| src/pages/Users.jsx | User management | Approve pending users, assign roles, manage statuses |


---

## Development Checklist for New Features

When adding a new feature, use this checklist:

- [ ] Decide if it involves database operations (if yes, create service functions)
- [ ] Create/modify page component in src/pages/
- [ ] Add route to App.jsx
- [ ] Add navigation link in Layout.jsx (if needed)
- [ ] Implement permission checks if feature is restricted
- [ ] Add error handling for async operations
- [ ] Test with different user roles (if permission-restricted)
- [ ] Update this CLAUDE.md if architecture pattern changes

---

## Repository Status

**Current Stage**: Beta / Pre-Production
- Core CRUD operations complete
- Authentication & authorization working
- Payment processing with transactions implemented
- Tailwind styling applied throughout
- Not yet deployed to Firebase Hosting
- Firestore in test mode (not production-secure)

**Ready for**: Testing with real data, staff training, minor feature additions

**Not Ready for**: Public production deployment without security rules and backups

---

## Getting Help

**Code Understanding**:
1. Check service files for database operation details
2. Check pages for UI patterns and hooks usage
3. Look at AuthContext for auth/permission patterns

**Issues**:
1. Check browser console for error messages
2. Check Firestore console for data issues
3. Check Firebase Auth console for user status
4. Run npm run build to check for TypeScript/compilation errors

**Extending**:
1. Follow existing service patterns for new operations
2. Use useAuth() hook in components that need auth
3. Check permission before sensitive UI with checkPermission()
4. Use transactions for multi-document updates

---

**Last Updated**: November 2025
**Project**: Tea Tree Golf Club Membership Management
**Stack**: React 18 + Firebase + Vite + Tailwind CSS

