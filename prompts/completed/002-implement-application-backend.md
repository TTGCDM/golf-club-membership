# Implement Membership Application Backend

<objective>
Implement the backend infrastructure for the membership application system, including Firestore security rules, email verification service, and application management service. This backend must securely handle public form submissions while preventing abuse and spam.

WHY: This establishes the secure foundation that both the public form and admin interface will depend on. Security rules must be in place before any frontend work begins to prevent vulnerabilities.
</objective>

<context>
Building the backend for Tea Tree Golf Club's membership application system based on the architectural plan.

**Prerequisites:**
- Architectural plan completed at @docs/membership-application-architecture.md
- Follow all decisions and data models from the architecture document

**Tech Stack:**
- Firebase Firestore for data storage
- Firebase security rules for access control
- React Query for data fetching (already in use)
- Current role system: VIEW(1), EDIT(2), ADMIN(3), SUPER_ADMIN(4)

Read CLAUDE.md for project patterns, especially:
- Transaction-based operations for data integrity
- Service layer pattern (never call Firestore from components)
- Role-based security model

**User Requirements:**
- Public can CREATE applications (with validation)
- Only ADMIN and EDIT roles can READ/UPDATE applications
- Email verification system to confirm applicant email addresses
- CAPTCHA integration to prevent spam
- Rate limiting to prevent abuse
</context>

<requirements>
**FIRST: Install Required Dependencies**

Before implementing, install the CAPTCHA library:
```bash
npm install react-google-recaptcha
```

Implement the following backend components:

## 1. Firestore Security Rules

Update @firestore.rules to add application collection rules:

**CRITICAL PLACEMENT:** Add the new `applications` collection rules AFTER the `membershipCategories` section (around line 280) but BEFORE the default deny rule at line 288 (`match /{document=**}`). The default deny must remain at the end.

**Allow Public CREATE with strict validation:**
- Verify all required fields are present and non-empty
- Validate field formats (email, phone, postcode)
- Validate field lengths (prevent abuse)
- Set initial status to 'submitted'
- Require emailVerificationToken to be generated
- Record metadata (IP if available, timestamp)

**Allow ADMIN/EDIT to READ:**
- Use existing role checking pattern from members collection
- Verify user is active and has role >= EDIT (role >= 2)

**Allow ADMIN/EDIT to UPDATE:**
- Only allow status changes (submitted → email_verified → approved/rejected)
- Allow approvedBy and approvedAt fields to be set
- Prevent modification of applicant-submitted data
- Prevent deletion (audit trail)

**Example validation checks to include:**
- Email must match regex pattern
- Phone must be valid format (Australian numbers)
- Post codes must be 4 digits
- Date of birth must be valid date format (YYYY-MM-DD)
- Status can only be: submitted, email_verified, approved, rejected

WHY: Security rules are the last line of defense. Frontend validation can be bypassed, so backend validation is critical.

## 2. Applications Service

Create @src/services/applicationsService.js with:

**Core Functions:**
```javascript
// Public - Submit application (called from public form)
async function submitApplication(applicationData)
  - Generate email verification token (crypto random string)
  - Set token expiry (24 hours from now)
  - Create application document with status: 'submitted'
  - Return application ID and verification token
  - Handle errors gracefully

// Public - Verify email token
async function verifyEmail(token)
  - Query applications by emailVerificationToken
  - Check token hasn't expired
  - Update status to 'email_verified'
  - Clear the token (one-time use)
  - Return success/failure

// Public - Resend verification email
async function resendVerification(applicationId, email)
  - Verify application exists and email matches
  - Check if already verified (prevent spam)
  - Generate new token
  - Update application with new token and expiry
  - Return new token

// Admin/Editor - Get all applications
async function getAllApplications()
  - Fetch all application documents
  - Sort by submittedAt (newest first)
  - Return array

// Admin/Editor - Get application by ID
async function getApplicationById(id)
  - Fetch single application
  - Return document with ID

// Admin/Editor - Update application status
async function updateApplicationStatus(id, newStatus, userId)
  - Validate status transition (submitted → email_verified → approved/rejected)
  - If approved, set approvedBy and approvedAt
  - Update status
  - Use transaction if needed for data integrity

// Admin/Editor - Approve and create member
async function approveApplication(applicationId, userId)
  - Use Firestore transaction
  - Get application data
  - Verify status is 'email_verified'
  - Create member record using membersService.createMember()
  - Update application status to 'approved'
  - Set approvedBy and approvedAt
  - Return member ID

// Admin/Editor - Reject application
async function rejectApplication(applicationId, reason, userId)
  - Update status to 'rejected'
  - Store rejection reason
  - Set rejectedBy and rejectedAt
  - Return success
```

**Data Model** (based on architecture doc):
```javascript
{
  // Applicant Information
  title: string, // Mr/Mrs/Miss/Ms
  fullName: string,
  address: string,
  postCode: string,
  occupation: string,
  businessName: string,
  businessAddress: string,
  businessPostCode: string,
  homePhone: string,
  workPhone: string,
  mobile: string,
  email: string,

  // Golf Information
  previousClubs: string, // Clubs and membership dates
  golfLinkNumber: string,
  lastHandicap: string,
  handicapDate: string,
  dateOfBirth: string, // YYYY-MM-DD

  // Membership Type
  membershipType: string, // 'full', 'restricted', or 'junior'

  // Application Status
  status: string, // 'submitted', 'email_verified', 'approved', 'rejected'

  // Email Verification
  emailVerificationToken: string,
  emailVerificationExpiry: timestamp,

  // Approval Tracking
  approvedBy: string, // userId
  approvedAt: timestamp,
  rejectedBy: string,
  rejectedAt: timestamp,
  rejectionReason: string,

  // Audit Trail
  submittedAt: timestamp,
  verifiedAt: timestamp,
  ipAddress: string, // If available
  userAgent: string, // If available

  // Created Member Link
  memberId: string, // Reference to created member (if approved)
}
```

WHY: The service layer encapsulates all Firestore operations and business logic, keeping components clean and testable.

## 3. Email Verification Service

Create @src/services/emailVerificationService.js with:

**Token Generation:**
```javascript
// Generate secure random token
function generateVerificationToken()
  - Use crypto.randomBytes() or similar
  - Return URL-safe string (32+ characters)

// Calculate expiry timestamp
function getTokenExpiry(hoursFromNow = 24)
  - Return Firebase timestamp for N hours from now
```

**Verification Link Building:**
```javascript
// Build verification URL
function buildVerificationLink(token)
  - Get app base URL from environment variable
  - Return: `${baseURL}/verify-email?token=${token}`
```

**Email Sending** (Simple approach for now):
```javascript
// Log verification link (for development)
function sendVerificationEmail(email, token)
  - Build verification link
  - For now: console.log() the link
  - TODO comment: "Replace with email service (SendGrid, Firebase Email Extension, etc.)"
  - Return success
```

WHY: Email verification proves the applicant owns the email address. Starting with console.log allows testing without setting up email infrastructure.

## 4. CAPTCHA Integration Setup

Add CAPTCHA to the project:

**Install reCAPTCHA:**
```bash
npm install react-google-recaptcha
```

**Create CAPTCHA configuration:**
Create @src/config/recaptcha.js:
```javascript
export const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || 'test-key'

// Verify CAPTCHA token (client-side only for now)
export async function verifyCaptcha(token) {
  if (!token) return false
  // For production: verify with backend
  // For now: accept any non-empty token in development
  return true
}
```

**Update .env.example:**
Add:
```
VITE_RECAPTCHA_SITE_KEY=your_recaptcha_site_key_here
```

WHY: CAPTCHA prevents automated spam submissions. Using environment variables keeps keys secure.

## 5. Query Hooks for Applications

Create @src/hooks/useApplications.js (React Query patterns):

```javascript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as applicationsService from '../services/applicationsService'

// Fetch all applications (Admin/Editor)
export function useApplications() {
  return useQuery({
    queryKey: ['applications'],
    queryFn: applicationsService.getAllApplications,
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000,
  })
}

// Fetch single application
export function useApplication(id) {
  return useQuery({
    queryKey: ['applications', id],
    queryFn: () => applicationsService.getApplicationById(id),
    enabled: !!id,
  })
}

// Submit application mutation (public)
export function useSubmitApplication() {
  return useMutation({
    mutationFn: applicationsService.submitApplication,
  })
}

// Verify email mutation (public)
export function useVerifyEmail() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: applicationsService.verifyEmail,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
    },
  })
}

// Approve application mutation (Admin/Editor)
export function useApproveApplication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ applicationId, userId }) =>
      applicationsService.approveApplication(applicationId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      queryClient.invalidateQueries({ queryKey: ['members'] })
    },
  })
}

// Reject application mutation (Admin/Editor)
export function useRejectApplication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ applicationId, reason, userId }) =>
      applicationsService.rejectApplication(applicationId, reason, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
    },
  })
}
```

WHY: React Query hooks provide caching, loading states, and automatic refetching, following the existing pattern in the codebase.

</requirements>

<implementation>
Follow these patterns from CLAUDE.md:

1. **Service Layer Pattern**: All Firestore operations in service files, never in components
2. **Transaction-Based Operations**: Use `runTransaction()` for approve operation (update application + create member)
3. **Firebase Timestamps**: Use `serverTimestamp()` for consistency
4. **Error Handling**: Catch and log errors, return meaningful messages
5. **React Query Integration**: Use query hooks for data fetching

**File Creation Order:**
1. Update firestore.rules first (security foundation)
2. Create applicationsService.js (core business logic)
3. Create emailVerificationService.js (verification logic)
4. Add CAPTCHA config files
5. Create React Query hooks

**Testing Approach:**
- Use Firebase emulator to test security rules locally
- Test rule validation with invalid data (should fail)
- Test role permissions (public can't read, EDIT can read)
- Test email verification flow (token expiry, already verified)
</implementation>

<output>
Create/modify the following files:

- Update: `./firestore.rules` - Add applications collection rules
- Create: `./src/services/applicationsService.js` - Core application operations
- Create: `./src/services/emailVerificationService.js` - Email verification logic
- Create: `./src/config/recaptcha.js` - CAPTCHA configuration
- Create: `./src/hooks/useApplications.js` - React Query hooks
- Update: `./.env.example` - Add RECAPTCHA_SITE_KEY

Ensure all files follow existing code style and patterns from the project.
</output>

<verification>
Before completing, verify:

1. **Security Rules Testing:**
   - Public CREATE works with valid data
   - Public CREATE fails with invalid/missing fields
   - Public cannot READ applications
   - Unauthenticated users cannot UPDATE applications
   - EDIT role can READ and UPDATE
   - Status transitions are enforced

2. **Service Functions Testing:**
   - submitApplication() creates document with correct initial state
   - verifyEmail() updates status and clears token
   - Expired tokens are rejected
   - approveApplication() uses transaction and creates member
   - All functions handle errors gracefully

3. **Code Quality:**
   - All functions have clear comments
   - Error messages are helpful
   - Functions follow existing service patterns
   - React Query hooks follow existing patterns

4. **Integration Check:**
   - Service functions import from firebase.js correctly
   - Hooks import from applicationsService correctly
   - CAPTCHA config reads from environment variables
   - No compilation errors

Run: `npm run build` to verify no TypeScript/ESLint errors
</verification>

<success_criteria>
Backend implementation is complete when:
- ✓ Security rules allow public submissions with validation
- ✓ Security rules restrict reading to ADMIN/EDIT only
- ✓ All service functions implemented and documented
- ✓ Email verification generates tokens and validates expiry
- ✓ CAPTCHA configuration is set up (even if basic)
- ✓ React Query hooks follow existing patterns
- ✓ Transaction-based approval creates member atomically
- ✓ Code compiles without errors
- ✓ All files follow project conventions from CLAUDE.md
</success_criteria>
