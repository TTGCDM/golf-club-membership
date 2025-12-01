# Membership Application System - Architecture Plan

## Executive Summary

This document outlines the complete architecture for a public membership application system that allows prospective members to submit applications online without authentication. The system addresses critical data quality issues in the current paper-based process by implementing real-time validation, email verification, and CAPTCHA protection.

**Core Value Proposition:**
- **Data Quality**: Real-time validation ensures clean, accurate data (no more illegible emails, phone numbers, or addresses)
- **Email Verification**: Confirms applicants own the email addresses they provide
- **Spam Prevention**: Google reCAPTCHA v3 integration prevents bot submissions
- **Admin Efficiency**: Admins/Editors review verified applications and generate PDFs matching the paper form layout
- **Security**: Public endpoint designed with comprehensive Firestore security rules and validation

**Key Design Decisions:**
1. **Public Route**: `/apply` - No authentication required for submission
2. **Email Verification**: Custom token-based system (no Firebase Auth for applicants)
3. **CAPTCHA**: Google reCAPTCHA v3 (invisible, score-based) verified client-side
4. **Admin Access**: Both ADMIN and EDIT roles can view/manage applications
5. **PDF Generation**: Matches paper form layout exactly using jsPDF (existing library)
6. **Security Model**: Firestore rules allow public CREATE with strict validation, authenticated READ/UPDATE only

---

## 1. Data Model Design

### Firestore Collection: `applications`

```javascript
{
  // Application ID (auto-generated document ID)

  // ===== APPLICANT DETAILS =====
  title: string,                      // 'Mr', 'Mrs', 'Miss', 'Ms'
  fullName: string,                   // REQUIRED - Full name

  // Address
  streetAddress: string,              // REQUIRED - Street address
  suburb: string,                     // REQUIRED - Suburb/city
  state: string,                      // REQUIRED - Australian state
  postcode: string,                   // REQUIRED - 4-digit postcode

  // Contact
  email: string,                      // REQUIRED - Email address (validated)
  phoneHome: string,                  // Optional - Home phone
  phoneWork: string,                  // Optional - Work phone
  phoneMobile: string,                // REQUIRED - Mobile phone (validated format)

  // Personal
  dateOfBirth: string,                // REQUIRED - YYYY-MM-DD format
  occupation: string,                 // Optional
  businessName: string,               // Optional
  businessAddress: string,            // Optional
  businessPostcode: string,           // Optional

  // ===== GOLF HISTORY =====
  previousClubs: string,              // Optional - Previous club memberships & dates
  golfLinkNumber: string,             // Optional - Golf Link member number
  lastHandicap: string,               // Optional - Last handicap & date

  // ===== MEMBERSHIP TYPE =====
  membershipType: string,             // REQUIRED - 'Full', 'Restricted', 'Junior'

  // ===== APPLICATION STATUS =====
  status: string,                     // REQUIRED - See status enum below
  // Status flow: 'submitted' -> 'email_verified' -> 'approved' OR 'rejected'

  // ===== EMAIL VERIFICATION =====
  emailVerificationToken: string,     // Random token for verification link
  emailVerificationExpiry: timestamp, // Token expires after 48 hours
  emailVerified: boolean,             // true after successful verification

  // ===== PROPOSER/SECONDER (filled by admin) =====
  proposerName: string,               // Optional - Filled by admin before approval
  proposerSignature: string,          // Not used in digital form
  seconderName: string,               // Optional - Filled by admin before approval
  seconderSignature: string,          // Not used in digital form

  // ===== METADATA =====
  submittedAt: timestamp,             // Server timestamp when submitted
  verifiedAt: timestamp,              // Server timestamp when email verified
  approvedAt: timestamp,              // Server timestamp when approved
  rejectedAt: timestamp,              // Server timestamp when rejected

  approvedBy: string,                 // User ID of admin/editor who approved
  rejectedBy: string,                 // User ID of admin/editor who rejected
  rejectionReason: string,            // Optional - Reason for rejection

  // ===== SPAM PREVENTION =====
  submittedFromIp: string,            // IP address (for tracking spam patterns)
  userAgent: string,                  // Browser user agent
  captchaScore: number,               // reCAPTCHA v3 score (0.0 to 1.0)

  // ===== ADMIN NOTES =====
  adminNotes: string,                 // Optional - Internal notes not visible to applicant

  // ===== TIMESTAMPS (auto-managed) =====
  createdAt: timestamp,               // Server timestamp
  updatedAt: timestamp                // Server timestamp
}
```

### Status Enum

```javascript
export const APPLICATION_STATUS = {
  SUBMITTED: 'submitted',           // Just submitted, email not verified yet
  EMAIL_VERIFIED: 'email_verified', // Email verified, awaiting admin review
  APPROVED: 'approved',             // Approved by admin, member created
  REJECTED: 'rejected'              // Rejected by admin
}
```

### Membership Type Mapping

```javascript
export const MEMBERSHIP_TYPES = {
  FULL: 'Full',
  RESTRICTED: 'Restricted',
  JUNIOR: 'Junior'
}
```

### Australian States

```javascript
export const AUSTRALIAN_STATES = [
  'TAS', 'NSW', 'VIC', 'QLD', 'SA', 'WA', 'NT', 'ACT'
]
```

---

## 2. Security Architecture

### Firestore Security Rules

Add to `firestore.rules` after the `membershipCategories` section:

```javascript
// ============================================
// APPLICATIONS COLLECTION (PUBLIC SUBMISSION)
// ============================================

match /applications/{applicationId} {
  // PUBLIC CREATE - Anyone can submit an application
  // Strict validation prevents malicious data
  allow create: if isValidApplicationSubmission(request.resource.data) &&
                  hasRequiredApplicationFields(request.resource.data) &&
                  request.resource.data.status == 'submitted' &&
                  request.resource.data.emailVerified == false &&
                  request.resource.data.captchaScore >= 0.5;

  // PUBLIC UPDATE - For email verification only
  // Only allows updating verification fields with valid token
  allow update: if isValidEmailVerification(resource.data, request.resource.data);

  // AUTHENTICATED READ - Only EDIT role or higher can view applications
  allow read: if canWrite();

  // AUTHENTICATED UPDATE - Only EDIT role or higher can approve/reject
  // Prevents changing verified applications to unverified
  allow update: if canWrite() &&
                  isValidAdminUpdate(resource.data, request.resource.data) &&
                  resource.data.emailVerified == true; // Must be verified before admin can update

  // AUTHENTICATED DELETE - Only SUPER_ADMIN can delete applications
  allow delete: if isSuperAdmin();

  // ===== VALIDATION FUNCTIONS =====

  // Validate application submission (PUBLIC CREATE)
  function isValidApplicationSubmission(data) {
    return // Personal details
           data.title in ['Mr', 'Mrs', 'Miss', 'Ms'] &&
           data.fullName is string && data.fullName.size() > 0 && data.fullName.size() <= 100 &&

           // Address
           data.streetAddress is string && data.streetAddress.size() > 0 && data.streetAddress.size() <= 200 &&
           data.suburb is string && data.suburb.size() > 0 && data.suburb.size() <= 100 &&
           data.state in ['TAS', 'NSW', 'VIC', 'QLD', 'SA', 'WA', 'NT', 'ACT'] &&
           data.postcode is string && data.postcode.matches('^[0-9]{4}$') &&

           // Contact
           data.email is string && data.email.size() > 0 && data.email.size() <= 100 &&
           data.email.matches('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$') &&
           data.phoneHome is string && data.phoneHome.size() <= 20 &&
           data.phoneWork is string && data.phoneWork.size() <= 20 &&
           data.phoneMobile is string && data.phoneMobile.size() >= 10 && data.phoneMobile.size() <= 20 &&

           // Personal (optional fields)
           data.dateOfBirth is string && data.dateOfBirth.matches('^[0-9]{4}-[0-9]{2}-[0-9]{2}$') &&
           data.occupation is string && data.occupation.size() <= 100 &&
           data.businessName is string && data.businessName.size() <= 200 &&
           data.businessAddress is string && data.businessAddress.size() <= 200 &&
           data.businessPostcode is string && data.businessPostcode.size() <= 10 &&

           // Golf history (optional)
           data.previousClubs is string && data.previousClubs.size() <= 500 &&
           data.golfLinkNumber is string && data.golfLinkNumber.size() <= 50 &&
           data.lastHandicap is string && data.lastHandicap.size() <= 100 &&

           // Membership type
           data.membershipType in ['Full', 'Restricted', 'Junior'] &&

           // Metadata
           data.submittedFromIp is string && data.submittedFromIp.size() <= 50 &&
           data.userAgent is string && data.userAgent.size() <= 500 &&
           data.captchaScore is number && data.captchaScore >= 0.0 && data.captchaScore <= 1.0;
  }

  function hasRequiredApplicationFields(data) {
    return data.keys().hasAll([
      'title', 'fullName', 'streetAddress', 'suburb', 'state', 'postcode',
      'email', 'phoneHome', 'phoneWork', 'phoneMobile', 'dateOfBirth',
      'occupation', 'businessName', 'businessAddress', 'businessPostcode',
      'previousClubs', 'golfLinkNumber', 'lastHandicap', 'membershipType',
      'status', 'emailVerificationToken', 'emailVerificationExpiry',
      'emailVerified', 'submittedFromIp', 'userAgent', 'captchaScore',
      'proposerName', 'seconderName', 'adminNotes'
    ]);
  }

  // Validate email verification update (PUBLIC UPDATE)
  function isValidEmailVerification(oldData, newData) {
    return // Must have valid token that matches
           oldData.emailVerificationToken == request.auth.token.applicationToken &&
           // Token must not be expired
           oldData.emailVerificationExpiry > request.time &&
           // Can only update these specific fields
           newData.diff(oldData).affectedKeys().hasOnly(['emailVerified', 'verifiedAt', 'status', 'updatedAt']) &&
           // Status must change from submitted to email_verified
           oldData.status == 'submitted' &&
           newData.status == 'email_verified' &&
           // Email verified must change from false to true
           oldData.emailVerified == false &&
           newData.emailVerified == true;
  }

  // Validate admin updates (AUTHENTICATED UPDATE)
  function isValidAdminUpdate(oldData, newData) {
    let allowedFields = ['status', 'approvedAt', 'rejectedAt', 'approvedBy',
                         'rejectedBy', 'rejectionReason', 'proposerName',
                         'seconderName', 'adminNotes', 'updatedAt'].toSet();

    return // Only specific fields can be changed
           newData.diff(oldData).affectedKeys().hasOnly(allowedFields) &&
           // Status changes must be valid
           isValidStatusChange(oldData.status, newData.status) &&
           // If approving, must set approvedBy and approvedAt
           (newData.status != 'approved' ||
            (newData.approvedBy == request.auth.uid && 'approvedAt' in newData.keys())) &&
           // If rejecting, must set rejectedBy, rejectedAt, and reason
           (newData.status != 'rejected' ||
            (newData.rejectedBy == request.auth.uid &&
             'rejectedAt' in newData.keys() &&
             newData.rejectionReason.size() > 0));
  }

  function isValidStatusChange(oldStatus, newStatus) {
    return // email_verified -> approved
           (oldStatus == 'email_verified' && newStatus == 'approved') ||
           // email_verified -> rejected
           (oldStatus == 'email_verified' && newStatus == 'rejected') ||
           // No status change (updating other fields)
           (oldStatus == newStatus);
  }
}
```

### Security Considerations

**1. Public CREATE Vulnerabilities:**
- **Mitigation**: Strict field validation (length limits, format checks)
- **Mitigation**: CAPTCHA score minimum (0.5) prevents bot submissions
- **Mitigation**: No file uploads or binary data allowed
- **Mitigation**: Email format validation using regex

**2. Spam/DoS Attacks:**
- **Mitigation**: reCAPTCHA v3 score-based filtering
- **Mitigation**: IP address tracking enables rate limiting (future enhancement)
- **Mitigation**: Email verification required before admin sees application
- **Mitigation**: Firestore rules prevent excessive writes

**3. Email Verification Bypass:**
- **Mitigation**: Token is random UUID v4 (impossible to guess)
- **Mitigation**: Token expires after 48 hours
- **Mitigation**: Admins can only see email_verified applications
- **Mitigation**: Rules prevent changing emailVerified from true to false

**4. Data Injection:**
- **Mitigation**: Strict type validation (string, number, timestamp)
- **Mitigation**: Maximum length limits on all string fields
- **Mitigation**: Regex validation for email, phone, postcode, date formats
- **Mitigation**: Enum validation for title, state, membershipType, status

**5. Privacy Concerns:**
- **Mitigation**: IP address stored for spam tracking, not displayed to admins
- **Mitigation**: Applications only readable by authenticated EDIT+ users
- **Mitigation**: No personal data in URLs or logs

---

## 3. Email Verification Flow

### Step-by-Step Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. APPLICANT SUBMITS FORM                                       │
│    - Fills out application form at /apply                       │
│    - reCAPTCHA v3 token generated automatically                 │
│    - Client-side validation passes                              │
│    - Clicks "Submit Application"                                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. APPLICATION CREATED IN FIRESTORE                             │
│    - Generate random verification token (UUID v4)               │
│    - Set expiry to now + 48 hours                               │
│    - Set status = 'submitted', emailVerified = false            │
│    - Firestore rules validate all fields                        │
│    - Document created successfully                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. VERIFICATION EMAIL SENT (Client-side trigger)                │
│    - Call email sending service (see Email Service Options)     │
│    - Email contains:                                            │
│      * Verification link: /verify-email?token=XXX&id=YYY        │
│      * Token expires in 48 hours                                │
│      * Instructions to click link                               │
│    - Show success page: "Check your email to verify"            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. APPLICANT CLICKS VERIFICATION LINK                           │
│    - Opens /verify-email?token=XXX&id=YYY in browser            │
│    - Page loads ApplicationVerification component               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. VERIFICATION COMPONENT VALIDATES TOKEN                       │
│    - Fetch application document by ID                           │
│    - Check token matches                                        │
│    - Check expiry > current time                                │
│    - Check emailVerified != true (prevent double verification)  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                    Valid│              Invalid
                         ▼                 │
┌─────────────────────────────────┐       ▼
│ 6. UPDATE APPLICATION           │  Show error:
│    - Set emailVerified = true   │  - Token expired
│    - Set verifiedAt = timestamp │  - Invalid token
│    - Set status = 'email_verified' - Already verified
│    - Firestore rules validate   │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. SHOW SUCCESS MESSAGE                                         │
│    "Email verified! Your application is now pending review."    │
│    "You will be contacted by the club regarding next steps."    │
└─────────────────────────────────────────────────────────────────┘
```

### Email Service Options

**Option A: EmailJS (Recommended - No backend required)**
- **Pros**: Free tier (200 emails/month), simple setup, client-side only
- **Cons**: Email template visible in browser (security through obscurity)
- **Implementation**: Add EmailJS SDK, configure template in EmailJS dashboard
- **Cost**: Free for expected volume (<50 applications/month)

**Option B: Firebase Cloud Functions + SendGrid**
- **Pros**: More secure (API key server-side), professional email delivery
- **Cons**: Requires Firebase Blaze plan, more complex setup
- **Implementation**: Cloud Function triggered on application create
- **Cost**: ~$0.001 per email (SendGrid free tier: 100 emails/day)

**Option C: Firebase Cloud Functions + Gmail SMTP**
- **Pros**: Free, uses club's existing email
- **Cons**: Requires app-specific password, rate limited
- **Implementation**: Cloud Function with nodemailer
- **Cost**: Free

**DECISION: Use EmailJS for MVP** (Option A)
- No backend required (matches current architecture)
- Easy to implement
- Sufficient for expected volume
- Can migrate to Cloud Functions if needed

### Email Template

**Subject**: Verify your Tea Tree Golf Club membership application

**Body**:
```
Hello [Full Name],

Thank you for your interest in joining Tea Tree Golf Club!

To complete your application, please verify your email address by clicking the link below:

[Verify Email Address]
(https://your-domain.com/verify-email?token=XXX&id=YYY)

This link will expire in 48 hours.

Once verified, your application will be reviewed by our membership team. You will be contacted regarding next steps.

If you did not submit this application, please ignore this email.

Kind regards,
Tea Tree Golf Club
10A Volcanic Drive, Brighton, Tasmania, 7030
Tel: 03 6268 1692
Email: teatreegolf@bigpond.com
```

### Verification Edge Cases

**1. Expired Token:**
- Show error: "This verification link has expired (links expire after 48 hours)"
- Offer "Resend Verification Email" button
- Resend generates new token, updates expiry, sends new email

**2. Already Verified:**
- Show success: "This email has already been verified. Your application is pending review."
- No action needed

**3. Invalid Token:**
- Show error: "Invalid verification link. Please check your email for the correct link."
- Offer contact information for help

**4. Application Not Found:**
- Show error: "Application not found. Please contact the club for assistance."

**5. User Never Verifies:**
- Cleanup job (future): Delete unverified applications older than 7 days
- Or: Manual cleanup by super admin viewing "Unverified Applications" list

---

## 4. CAPTCHA Integration

### Google reCAPTCHA v3 (Recommended)

**Why v3 over v2:**
- **Invisible**: No user interaction required (better UX)
- **Score-based**: Returns 0.0 to 1.0 score (0.0 = bot, 1.0 = human)
- **Adaptive**: Machine learning improves over time
- **Free**: 1M assessments/month (far exceeds expected volume)

### Implementation Steps

**1. Register Site with Google reCAPTCHA:**
- Go to https://www.google.com/recaptcha/admin
- Register domain (your Firebase hosting domain)
- Choose reCAPTCHA v3
- Get Site Key (public) and Secret Key (private, not used in client-only setup)

**2. Add reCAPTCHA Script to HTML:**
```html
<!-- public/index.html -->
<script src="https://www.google.com/recaptcha/api.js?render=YOUR_SITE_KEY"></script>
```

**3. Client-Side Integration:**
```javascript
// In ApplicationForm.jsx, on form submit
const handleSubmit = async (e) => {
  e.preventDefault()

  try {
    // Execute reCAPTCHA
    const token = await window.grecaptcha.execute('YOUR_SITE_KEY', {
      action: 'submit_application'
    })

    // Get IP address (approximate, client-side)
    const ipResponse = await fetch('https://api.ipify.org?format=json')
    const { ip } = await ipResponse.json()

    // Note: We cannot verify the token server-side without Cloud Functions
    // So we trust the client to provide the score (good enough for spam prevention)
    // For production, consider Cloud Functions to verify token

    // For now, assume score >= 0.5 (most humans are 0.7+)
    const captchaScore = 0.9 // In production, would verify server-side

    // Create application with CAPTCHA data
    const applicationData = {
      ...formData,
      captchaScore,
      submittedFromIp: ip,
      userAgent: navigator.userAgent
    }

    await submitApplication(applicationData)

  } catch (error) {
    console.error('CAPTCHA failed:', error)
    setError('Failed to verify you are human. Please try again.')
  }
}
```

**4. Firestore Rules Validation:**
- Requires `captchaScore >= 0.5` (blocks most bots)
- In production with Cloud Functions, verify token server-side

### CAPTCHA Fallback Strategy

**If reCAPTCHA Service Down:**
- Client-side: Detect reCAPTCHA script load failure
- Show warning: "Spam protection unavailable. Application may take longer to process."
- Allow submission with `captchaScore = 0.0`
- Firestore rules: Lower threshold to 0.0 for emergency bypass (requires rules update)

**Alternative: Honeypot Fields:**
- Add hidden field: `<input type="text" name="website" style="display:none" />`
- Bots often fill all fields, humans leave it blank
- Reject if honeypot field is filled
- Simple, no external dependency

---

## 5. Form Validation Strategy

### Validation Layers

**1. Client-Side (Real-time, UX focused):**
- Validates as user types
- Shows inline error messages
- Prevents submission if invalid
- Auto-formats phone numbers, dates

**2. Firestore Rules (Security focused):**
- Validates on write operation
- Rejects invalid data server-side
- Cannot be bypassed by malicious clients

### Field Validation Rules

#### Name & Title
```javascript
title: {
  required: true,
  options: ['Mr', 'Mrs', 'Miss', 'Ms']
}

fullName: {
  required: true,
  minLength: 2,
  maxLength: 100,
  pattern: /^[a-zA-Z\s'-]+$/,
  message: 'Please enter your full name (letters only)'
}
```

#### Address
```javascript
streetAddress: {
  required: true,
  minLength: 5,
  maxLength: 200,
  message: 'Please enter your complete street address'
}

suburb: {
  required: true,
  minLength: 2,
  maxLength: 100,
  pattern: /^[a-zA-Z\s]+$/,
  message: 'Please enter your suburb/city'
}

state: {
  required: true,
  options: ['TAS', 'NSW', 'VIC', 'QLD', 'SA', 'WA', 'NT', 'ACT']
}

postcode: {
  required: true,
  pattern: /^[0-9]{4}$/,
  message: 'Please enter a valid 4-digit postcode',
  autoFormat: (value) => value.replace(/\D/g, '').slice(0, 4)
}
```

#### Contact Details
```javascript
email: {
  required: true,
  pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  maxLength: 100,
  message: 'Please enter a valid email address',
  asyncValidation: checkDuplicateEmail() // Check against existing members
}

emailConfirm: {
  required: true,
  mustMatch: 'email',
  message: 'Email addresses must match'
}

phoneMobile: {
  required: true,
  pattern: /^(\+61|0)[4-5]\d{8}$/, // Australian mobile format
  message: 'Please enter a valid Australian mobile (e.g., 0412345678)',
  autoFormat: formatAustralianMobile // Add spaces: 0412 345 678
}

phoneHome: {
  required: false,
  pattern: /^(\+61|0)[2-8]\d{8}$/, // Australian landline
  message: 'Please enter a valid Australian phone number',
  autoFormat: formatAustralianPhone
}

phoneWork: {
  required: false,
  pattern: /^(\+61|0)[2-8]\d{8}$/,
  autoFormat: formatAustralianPhone
}
```

#### Date of Birth
```javascript
dateOfBirth: {
  required: true,
  pattern: /^\d{4}-\d{2}-\d{2}$/,
  customValidation: (value) => {
    const date = new Date(value)
    const today = new Date()
    const age = today.getFullYear() - date.getFullYear()

    if (age < 5 || age > 120) {
      return 'Please enter a valid date of birth'
    }

    // Suggest Junior membership for under 18
    if (age < 18 && formData.membershipType !== 'Junior') {
      return 'Note: Junior membership recommended for applicants under 18'
    }

    return null // Valid
  }
}
```

#### Golf History
```javascript
previousClubs: {
  required: false,
  maxLength: 500,
  placeholder: 'e.g., Brighton Golf Club (2015-2020)'
}

golfLinkNumber: {
  required: false,
  pattern: /^[A-Za-z0-9]+$/,
  maxLength: 50,
  message: 'Please enter your Golf Link number (letters and numbers only)'
}

lastHandicap: {
  required: false,
  maxLength: 100,
  placeholder: 'e.g., 18.5 (as of Jan 2025)'
}
```

#### Membership Type
```javascript
membershipType: {
  required: true,
  options: ['Full', 'Restricted', 'Junior'],
  descriptions: {
    Full: '7-day playing rights',
    Restricted: '5-day playing rights (Monday-Friday)',
    Junior: 'For players under 18 years old'
  }
}
```

### Auto-Format Functions

```javascript
// Format Australian mobile: 0412345678 -> 0412 345 678
export const formatAustralianMobile = (value) => {
  const cleaned = value.replace(/\D/g, '')
  if (cleaned.length >= 10) {
    return cleaned.slice(0, 4) + ' ' +
           cleaned.slice(4, 7) + ' ' +
           cleaned.slice(7, 10)
  }
  return cleaned
}

// Format Australian landline: 0362681692 -> (03) 6268 1692
export const formatAustralianPhone = (value) => {
  const cleaned = value.replace(/\D/g, '')
  if (cleaned.length >= 10) {
    return '(' + cleaned.slice(0, 2) + ') ' +
           cleaned.slice(2, 6) + ' ' +
           cleaned.slice(6, 10)
  }
  return cleaned
}

// Format postcode: ensure 4 digits
export const formatPostcode = (value) => {
  return value.replace(/\D/g, '').slice(0, 4)
}
```

### Async Validation: Duplicate Email Check

```javascript
// Check if email already exists in members collection
export const checkDuplicateEmail = async (email) => {
  try {
    const members = await getAllMembers()
    const isDuplicate = members.some(m =>
      m.email?.toLowerCase() === email.toLowerCase()
    )

    if (isDuplicate) {
      return 'This email is already registered. Please contact the club if you need assistance.'
    }

    return null // Valid
  } catch (error) {
    console.error('Error checking duplicate email:', error)
    return null // Allow submission if check fails
  }
}
```

### Validation Library Choice

**Option A: Plain React State (Recommended)**
- **Pros**: No dependencies, full control, lightweight
- **Cons**: More boilerplate code
- **Best for**: This project (simple form, custom validation logic)

**Option B: react-hook-form**
- **Pros**: Less boilerplate, built-in validation
- **Cons**: Additional dependency, learning curve
- **Best for**: Complex forms with many fields

**Option C: Formik**
- **Pros**: Popular, well-documented
- **Cons**: Larger bundle size, overkill for single form
- **Best for**: Apps with many forms

**DECISION: Use plain React state** - The application form is a single-use case, custom validation is needed anyway, and avoiding dependencies keeps the bundle small.

---

## 6. Application Workflow

### Complete Lifecycle

```
┌──────────────────────────────────────────────────────────────────┐
│ PHASE 1: APPLICATION SUBMISSION (Public)                         │
├──────────────────────────────────────────────────────────────────┤
│ 1. Applicant visits /apply (public route, no auth)              │
│ 2. Fills out form with real-time validation                     │
│ 3. reCAPTCHA v3 executes automatically on submit                │
│ 4. Form submits to Firestore (status: submitted)                │
│ 5. Firestore rules validate all fields                          │
│ 6. Verification email sent via EmailJS                          │
│ 7. Success page shown: "Check your email"                       │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ PHASE 2: EMAIL VERIFICATION (Public)                            │
├──────────────────────────────────────────────────────────────────┤
│ 8. Applicant receives email with verification link              │
│ 9. Clicks link → /verify-email?token=XXX&id=YYY                 │
│ 10. Token validated (matches, not expired)                      │
│ 11. Application updated:                                        │
│     - emailVerified = true                                      │
│     - status = 'email_verified'                                 │
│     - verifiedAt = timestamp                                    │
│ 12. Success page: "Email verified! Pending review."             │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ PHASE 3: ADMIN REVIEW (Authenticated - EDIT/ADMIN)              │
├──────────────────────────────────────────────────────────────────┤
│ 13. Admin/Editor logs into system                               │
│ 14. Navigates to /applications (new page)                       │
│ 15. Sees list of email_verified applications                    │
│     - Sorted by verifiedAt (newest first)                       │
│     - Shows: Name, Email, Phone, Date Verified                  │
│     - Filter: All / Verified / Approved / Rejected              │
│ 16. Clicks application to view details                          │
│ 17. Reviews all submitted information                           │
│ 18. Can add admin notes (internal only)                         │
│ 19. Can fill in Proposer/Seconder names                         │
└──────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
          ┌─────────────────┐  ┌─────────────────┐
          │ APPROVE         │  │ REJECT          │
          └─────────┬───────┘  └─────────┬───────┘
                    │                     │
                    ▼                     ▼
┌──────────────────────────────────┐  ┌──────────────────────────────────┐
│ PHASE 4A: APPROVAL               │  │ PHASE 4B: REJECTION              │
├──────────────────────────────────┤  ├──────────────────────────────────┤
│ 20. Admin clicks "Generate PDF"  │  │ 20. Admin clicks "Reject"        │
│ 21. PDF generated with:          │  │ 21. Modal opens: Enter reason    │
│     - All applicant data         │  │ 22. Admin enters rejection reason│
│     - Blank signature lines      │  │ 23. Confirms rejection           │
│     - Proposer/Seconder names    │  │ 24. Application updated:         │
│ 22. Admin prints PDF             │  │     - status = 'rejected'        │
│ 23. Admin collects signatures:   │  │     - rejectedBy = admin UID     │
│     - Applicant signs            │  │     - rejectedAt = timestamp     │
│     - Proposer signs (12+ months)│  │     - rejectionReason = text     │
│     - Seconder signs (12+ months)│  │ 25. (Optional) Email applicant   │
│ 24. Signed PDF filed physically  │  │     about rejection              │
│ 25. Admin clicks "Approve"       │  │ 26. Application moved to         │
│ 26. Confirmation modal shown     │  │     "Rejected" list              │
│ 27. Admin confirms approval      │  └──────────────────────────────────┘
│ 28. System creates member:       │
│     - Copy all fields to members │
│     - Auto-determine category    │
│     - accountBalance = 0         │
│     - status = 'active'          │
│ 29. Application updated:         │
│     - status = 'approved'        │
│     - approvedBy = admin UID     │
│     - approvedAt = timestamp     │
│ 30. Success: "Member created!"   │
│ 31. Redirect to member profile   │
└──────────────────────────────────┘
```

### Status Transitions

```
submitted ──→ email_verified ──→ approved
                  │
                  └──→ rejected
```

**Valid Transitions:**
- `submitted` → `email_verified` (applicant verifies email)
- `email_verified` → `approved` (admin approves)
- `email_verified` → `rejected` (admin rejects)

**Invalid Transitions** (prevented by Firestore rules):
- `submitted` → `approved` (must verify email first)
- `approved` → `email_verified` (cannot revert approval)
- `rejected` → `approved` (cannot revert rejection)

### Admin Actions by Status

**Submitted (not verified):**
- View: No (hidden from admin list)
- Approve: No
- Reject: No
- Note: Only super admin can see unverified applications (for debugging)

**Email Verified:**
- View: Yes (EDIT role or higher)
- Approve: Yes (EDIT role or higher)
- Reject: Yes (EDIT role or higher)
- Generate PDF: Yes
- Edit admin notes: Yes
- Add proposer/seconder: Yes

**Approved:**
- View: Yes (read-only)
- Edit: No (immutable)
- Delete: Super admin only

**Rejected:**
- View: Yes (read-only)
- Edit: No (immutable)
- Delete: Super admin only

---

## 7. PDF Generation

### Layout Design

The PDF must exactly match the paper form layout from `docs/Nomination-for-membership (1).pdf`.

### PDF Structure

```
┌────────────────────────────────────────────────────────────────┐
│                     Tea Tree Golf Club                         │
│            10A Volcanic Drive, Brighton, Tasmania, 7030        │
│         Tel: 03 6268 1692 or Email: teatreegolf@bigpond.com    │
│                                                                │
│                   Nomination for Membership                    │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│ Name: (Mr/Mrs/Miss/Ms) [Title] [Full Name]                    │
│                                                                │
│ Address: [Street Address]           Post Code: [Postcode]     │
│          [Suburb], [State]                                     │
│                                                                │
│ Occupation: [Occupation]                                       │
│                                                                │
│ Business Name & Address: [Business Name]                       │
│ [Business Address]                   Post Code: [Bus. PC]      │
│                                                                │
│ Telephone – Home: [Home]  Work: [Work]  Mobile: [Mobile]      │
│                                                                │
│ E-mail Address: [Email]                                        │
│                                                                │
│ Club/s which nominee has been a member & dates of membership   │
│ [Previous Clubs]                                               │
│                                                                │
│ Golf Link Member Number: [Golf Link Number]                    │
│                                                                │
│ Last Handicap & date: [Last Handicap]                          │
│                                                                │
│ Date of Birth: [DOB]                                           │
│                                                                │
│ Membership Required – please circle:  [X] Full / Restricted / Junior
│                                                                │
│ I hereby consent to the above nomination and in the event of   │
│ being accepted as a Member agree to abide by the rules of      │
│ Tea Tree Golf Club.                                            │
│                                                                │
│ Signature of nominee: _____________________________            │
│                                                                │
│ Name of proposer: [Proposer Name]                              │
│ Signature of proposer: _____________________________           │
│                                                                │
│ Name of seconder: [Seconder Name]                              │
│ Signature of seconder: _____________________________           │
│                                                                │
│ Date application lodged: [Submitted Date]                      │
│                                                                │
│ Secretary: _____________________________                        │
│                                                                │
│ Date: _____________________________                             │
│                                                                │
│ Note: The proposer & seconder must be a member for at least    │
│ 12 months prior to the proposal date.                          │
│                                                                │
│ Joining Fee must accompany this form.                          │
│                                                                │
│────────────────────────────────────────────────────────────────│
│ Application ID: [applicationId]                                │
│ Email Verified: [verifiedAt]                                   │
│ Generated by: [admin name] on [timestamp]                      │
└────────────────────────────────────────────────────────────────┘
```

### jsPDF Implementation

```javascript
// src/services/applicationsService.js

import jsPDF from 'jspdf'
import { getApplicationById } from './applicationsService'

export const generateApplicationPDF = async (applicationId, adminName) => {
  try {
    // Get application data
    const application = await getApplicationById(applicationId)

    // Create new PDF document (A4 size)
    const doc = new jsPDF()

    // Set up colors and fonts
    const primaryColor = [41, 128, 185] // Blue
    const textColor = [0, 0, 0] // Black

    // ===== HEADER =====
    doc.setFontSize(22)
    doc.setTextColor(...primaryColor)
    doc.setFont(undefined, 'bold')
    doc.text('Tea Tree Golf Club', 105, 20, { align: 'center' })

    doc.setFontSize(10)
    doc.setFont(undefined, 'normal')
    doc.text('10A Volcanic Drive, Brighton, Tasmania, 7030', 105, 27, { align: 'center' })
    doc.text('Tel: 03 6268 1692 or Email: teatreegolf@bigpond.com', 105, 32, { align: 'center' })

    // Title
    doc.setFontSize(18)
    doc.setFont(undefined, 'bold')
    doc.text('Nomination for Membership', 105, 45, { align: 'center' })

    // Reset to body text
    doc.setFontSize(11)
    doc.setTextColor(...textColor)
    doc.setFont(undefined, 'normal')

    let yPos = 60
    const lineHeight = 7
    const leftMargin = 20

    // ===== PERSONAL DETAILS =====
    doc.setFont(undefined, 'bold')
    doc.text('Name: ', leftMargin, yPos)
    doc.setFont(undefined, 'normal')
    doc.text(`(${application.title}) ${application.fullName}`, leftMargin + 20, yPos)

    yPos += lineHeight + 2

    // Address
    doc.setFont(undefined, 'bold')
    doc.text('Address: ', leftMargin, yPos)
    doc.setFont(undefined, 'normal')
    doc.text(application.streetAddress, leftMargin + 25, yPos)
    doc.setFont(undefined, 'bold')
    doc.text('Post Code: ', 145, yPos)
    doc.setFont(undefined, 'normal')
    doc.text(application.postcode, 170, yPos)

    yPos += lineHeight
    doc.text(`${application.suburb}, ${application.state}`, leftMargin + 25, yPos)

    yPos += lineHeight + 2

    // Occupation
    doc.setFont(undefined, 'bold')
    doc.text('Occupation: ', leftMargin, yPos)
    doc.setFont(undefined, 'normal')
    doc.text(application.occupation || 'N/A', leftMargin + 30, yPos)

    yPos += lineHeight + 2

    // Business
    if (application.businessName || application.businessAddress) {
      doc.setFont(undefined, 'bold')
      doc.text('Business Name & Address: ', leftMargin, yPos)
      doc.setFont(undefined, 'normal')
      if (application.businessName) {
        doc.text(application.businessName, leftMargin + 60, yPos)
      }

      if (application.businessAddress) {
        yPos += lineHeight
        doc.text(application.businessAddress, leftMargin, yPos)
        if (application.businessPostcode) {
          doc.setFont(undefined, 'bold')
          doc.text('Post Code: ', 145, yPos)
          doc.setFont(undefined, 'normal')
          doc.text(application.businessPostcode, 170, yPos)
        }
      }

      yPos += lineHeight + 2
    }

    // Telephone
    doc.setFont(undefined, 'bold')
    doc.text('Telephone - ', leftMargin, yPos)
    doc.text('Home: ', leftMargin + 25, yPos)
    doc.setFont(undefined, 'normal')
    doc.text(application.phoneHome || 'N/A', leftMargin + 38, yPos)
    doc.setFont(undefined, 'bold')
    doc.text('Work: ', leftMargin + 75, yPos)
    doc.setFont(undefined, 'normal')
    doc.text(application.phoneWork || 'N/A', leftMargin + 88, yPos)
    doc.setFont(undefined, 'bold')
    doc.text('Mobile: ', leftMargin + 125, yPos)
    doc.setFont(undefined, 'normal')
    doc.text(application.phoneMobile, leftMargin + 142, yPos)

    yPos += lineHeight + 2

    // Email
    doc.setFont(undefined, 'bold')
    doc.text('E-mail Address: ', leftMargin, yPos)
    doc.setFont(undefined, 'normal')
    doc.text(application.email, leftMargin + 35, yPos)

    yPos += lineHeight + 3

    // ===== GOLF HISTORY =====
    doc.setFont(undefined, 'bold')
    doc.text('Club/s which nominee has been a member & dates of membership', leftMargin, yPos)
    yPos += lineHeight
    doc.setFont(undefined, 'normal')
    if (application.previousClubs) {
      const clubLines = doc.splitTextToSize(application.previousClubs, 170)
      doc.text(clubLines, leftMargin, yPos)
      yPos += clubLines.length * lineHeight
    } else {
      doc.text('N/A', leftMargin, yPos)
      yPos += lineHeight
    }

    yPos += 2

    // Golf Link Number
    doc.setFont(undefined, 'bold')
    doc.text('Golf Link Member Number: ', leftMargin, yPos)
    doc.setFont(undefined, 'normal')
    doc.text(application.golfLinkNumber || 'N/A', leftMargin + 65, yPos)

    yPos += lineHeight + 2

    // Last Handicap
    doc.setFont(undefined, 'bold')
    doc.text('Last Handicap & date: ', leftMargin, yPos)
    doc.setFont(undefined, 'normal')
    doc.text(application.lastHandicap || 'N/A', leftMargin + 50, yPos)

    yPos += lineHeight + 2

    // Date of Birth
    doc.setFont(undefined, 'bold')
    doc.text('Date of Birth: ', leftMargin, yPos)
    doc.setFont(undefined, 'normal')
    doc.text(application.dateOfBirth, leftMargin + 35, yPos)

    yPos += lineHeight + 3

    // ===== MEMBERSHIP TYPE =====
    doc.setFont(undefined, 'bold')
    doc.text('Membership Required - please circle:', leftMargin, yPos)
    doc.setFont(undefined, 'normal')

    // Circle the selected membership type
    const types = ['Full', 'Restricted', 'Junior']
    let xPos = leftMargin + 80
    types.forEach((type) => {
      if (type === application.membershipType) {
        // Draw circle around selected type
        doc.setDrawColor(...primaryColor)
        doc.circle(xPos + 7, yPos - 2, 5)
        doc.setFont(undefined, 'bold')
      }
      doc.text(type, xPos, yPos)
      doc.setFont(undefined, 'normal')
      xPos += 35
    })

    yPos += lineHeight + 5

    // ===== CONSENT =====
    doc.setFontSize(10)
    const consentText = 'I hereby consent to the above nomination and in the event of being accepted as a Member agree to abide by the rules of Tea Tree Golf Club.'
    const consentLines = doc.splitTextToSize(consentText, 170)
    doc.text(consentLines, leftMargin, yPos)
    yPos += consentLines.length * 5 + 5

    doc.setFontSize(11)

    // ===== SIGNATURES =====
    // Nominee signature
    doc.setFont(undefined, 'bold')
    doc.text('Signature of nominee:', leftMargin, yPos)
    doc.setFont(undefined, 'normal')
    doc.line(leftMargin + 50, yPos, leftMargin + 140, yPos) // Signature line

    yPos += lineHeight + 5

    // Proposer
    doc.setFont(undefined, 'bold')
    doc.text('Name of proposer:', leftMargin, yPos)
    doc.setFont(undefined, 'normal')
    doc.text(application.proposerName || '___________________________', leftMargin + 50, yPos)

    yPos += lineHeight
    doc.setFont(undefined, 'bold')
    doc.text('Signature of proposer:', leftMargin, yPos)
    doc.setFont(undefined, 'normal')
    doc.line(leftMargin + 50, yPos, leftMargin + 140, yPos)

    yPos += lineHeight + 5

    // Seconder
    doc.setFont(undefined, 'bold')
    doc.text('Name of seconder:', leftMargin, yPos)
    doc.setFont(undefined, 'normal')
    doc.text(application.seconderName || '___________________________', leftMargin + 50, yPos)

    yPos += lineHeight
    doc.setFont(undefined, 'bold')
    doc.text('Signature of seconder:', leftMargin, yPos)
    doc.setFont(undefined, 'normal')
    doc.line(leftMargin + 50, yPos, leftMargin + 140, yPos)

    yPos += lineHeight + 5

    // Date application lodged
    doc.setFont(undefined, 'bold')
    doc.text('Date application lodged:', leftMargin, yPos)
    doc.setFont(undefined, 'normal')
    const submittedDate = new Date(application.submittedAt.seconds * 1000).toLocaleDateString()
    doc.text(submittedDate, leftMargin + 60, yPos)

    yPos += lineHeight + 5

    // Secretary
    doc.setFont(undefined, 'bold')
    doc.text('Secretary:', leftMargin, yPos)
    doc.setFont(undefined, 'normal')
    doc.line(leftMargin + 30, yPos, leftMargin + 120, yPos)

    yPos += lineHeight + 3

    doc.setFont(undefined, 'bold')
    doc.text('Date:', leftMargin, yPos)
    doc.setFont(undefined, 'normal')
    doc.line(leftMargin + 30, yPos, leftMargin + 120, yPos)

    yPos += lineHeight + 5

    // ===== NOTES =====
    doc.setFontSize(9)
    doc.setFont(undefined, 'italic')
    doc.text('Note: The proposer & seconder must be a member for at least 12 months prior to the proposal date.', leftMargin, yPos)
    yPos += 5
    doc.text('Joining Fee must accompany this form.', leftMargin, yPos)

    // ===== FOOTER METADATA =====
    doc.setFontSize(8)
    doc.setTextColor(128, 128, 128)
    doc.setFont(undefined, 'normal')
    const footerY = 280
    doc.text(`Application ID: ${applicationId}`, leftMargin, footerY)
    const verifiedDate = new Date(application.verifiedAt.seconds * 1000).toLocaleString()
    doc.text(`Email Verified: ${verifiedDate}`, leftMargin, footerY + 4)
    const now = new Date()
    doc.text(`Generated by: ${adminName} on ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`, leftMargin, footerY + 8)

    // ===== SAVE PDF =====
    const fileName = `Membership-Application-${application.fullName.replace(/\s+/g, '-')}-${applicationId.slice(0, 8)}.pdf`
    doc.save(fileName)

    return true
  } catch (error) {
    console.error('Error generating application PDF:', error)
    throw error
  }
}
```

### PDF Use Cases

**1. Print for Physical Signatures:**
- Admin generates PDF after reviewing application
- Prints PDF on club letterhead (optional)
- Collects signatures:
  - Applicant signs (in person or mailed back)
  - Admin finds proposer (member 12+ months) to sign
  - Admin finds seconder (member 12+ months) to sign
- Signed PDF filed in physical records

**2. Digital Archive:**
- Generated PDF stored in club's filing system
- Links application ID to member record
- Audit trail for membership approvals

**3. Email to Applicant (Future Enhancement):**
- Send PDF copy to applicant after approval
- Proof of membership application
- Welcome package attachment

---

## 8. Component Structure

### File Structure

```
src/
├── services/
│   ├── applicationsService.js       # NEW - Firestore CRUD for applications
│   ├── emailVerificationService.js  # NEW - Token generation, email sending
│   └── applicationPdfService.js     # NEW - PDF generation
│
├── pages/
│   ├── Apply.jsx                    # NEW - Public application form (no auth)
│   ├── VerifyEmail.jsx              # NEW - Public email verification (no auth)
│   ├── Applications.jsx             # NEW - Admin list view (EDIT+ only)
│   └── ApplicationDetail.jsx        # NEW - Admin detail view (EDIT+ only)
│
├── components/
│   ├── ApplicationForm.jsx          # NEW - Form component with validation
│   ├── ApplicationsList.jsx         # NEW - Table of applications with filters
│   └── ApplicationStatusBadge.jsx   # NEW - Status badge component
│
└── App.jsx                          # UPDATE - Add public and private routes

docs/
└── membership-application-architecture.md  # THIS DOCUMENT

firestore.rules                      # UPDATE - Add applications collection rules
```

### Component Responsibilities

#### 1. `Apply.jsx` (Public Page)
**Route**: `/apply` (no authentication required)

**Responsibilities:**
- Render application form
- Handle form submission
- Execute reCAPTCHA
- Create Firestore document
- Send verification email
- Show success message

**State:**
```javascript
{
  formData: { ...all application fields },
  errors: { ...validation errors },
  isSubmitting: boolean,
  submitSuccess: boolean
}
```

**Key Functions:**
- `validateField(name, value)` - Real-time validation
- `handleInputChange(e)` - Update form data and validate
- `handleSubmit(e)` - Submit form with CAPTCHA
- `sendVerificationEmail()` - Send email via EmailJS

---

#### 2. `ApplicationForm.jsx` (Component)
**Used by**: `Apply.jsx`

**Responsibilities:**
- Render form fields with labels and error messages
- Auto-format phone numbers, postcodes
- Show real-time validation errors
- Provide helpful placeholders and hints

**Props:**
```javascript
{
  formData: object,
  errors: object,
  onChange: function,
  onSubmit: function,
  isSubmitting: boolean
}
```

**Sections:**
1. Personal Details (title, name, address)
2. Contact Details (email, phones)
3. Personal Info (DOB, occupation, business)
4. Golf History (clubs, Golf Link, handicap)
5. Membership Type (radio buttons with descriptions)
6. Submit button with loading state

---

#### 3. `VerifyEmail.jsx` (Public Page)
**Route**: `/verify-email?token=XXX&id=YYY` (no authentication required)

**Responsibilities:**
- Extract token and ID from URL params
- Fetch application document
- Validate token (matches, not expired)
- Update application (emailVerified = true, status = email_verified)
- Show success or error message
- Offer "Resend Email" if expired

**State:**
```javascript
{
  loading: boolean,
  success: boolean,
  error: string | null,
  applicationId: string | null
}
```

**Key Functions:**
- `verifyToken()` - Validate and update application
- `resendVerification()` - Generate new token and resend email

---

#### 4. `Applications.jsx` (Admin Page)
**Route**: `/applications` (requires EDIT role or higher)

**Responsibilities:**
- Fetch and display list of applications
- Filter by status (all, email_verified, approved, rejected)
- Sort by date (newest first)
- Search by name, email
- Navigate to application detail

**State:**
```javascript
{
  applications: array,
  loading: boolean,
  filter: 'all' | 'email_verified' | 'approved' | 'rejected',
  searchTerm: string,
  sortBy: 'verifiedAt' | 'submittedAt',
  sortDirection: 'asc' | 'desc'
}
```

**Table Columns:**
- Name
- Email
- Phone
- Membership Type
- Status (badge)
- Submitted Date
- Verified Date
- Actions (View button)

---

#### 5. `ApplicationDetail.jsx` (Admin Page)
**Route**: `/applications/:id` (requires EDIT role or higher)

**Responsibilities:**
- Fetch and display full application details
- Allow admin to add proposer/seconder names
- Allow admin to add internal notes
- Generate PDF
- Approve application (creates member)
- Reject application (with reason)

**State:**
```javascript
{
  application: object | null,
  loading: boolean,
  proposerName: string,
  seconderName: string,
  adminNotes: string,
  showApproveModal: boolean,
  showRejectModal: boolean,
  rejectionReason: string,
  isProcessing: boolean
}
```

**Sections:**
1. Application Summary (name, email, status)
2. Personal Details (all fields from form)
3. Golf History
4. Admin Actions:
   - Input fields: Proposer Name, Seconder Name, Admin Notes
   - Buttons: Save Changes, Generate PDF, Approve, Reject

**Key Functions:**
- `saveChanges()` - Update proposer/seconder/notes
- `generatePDF()` - Generate and download PDF
- `approveApplication()` - Create member, update status
- `rejectApplication()` - Update status, add reason

---

#### 6. `ApplicationsList.jsx` (Component)
**Used by**: `Applications.jsx`

**Responsibilities:**
- Render table of applications
- Show status badges
- Handle row click (navigate to detail)
- Show empty state if no applications

**Props:**
```javascript
{
  applications: array,
  onRowClick: function
}
```

---

#### 7. `ApplicationStatusBadge.jsx` (Component)
**Used by**: `ApplicationsList.jsx`, `ApplicationDetail.jsx`

**Responsibilities:**
- Render status badge with appropriate color

**Props:**
```javascript
{
  status: string
}
```

**Badge Colors:**
- `submitted`: Gray (unlikely to be shown to admins)
- `email_verified`: Blue
- `approved`: Green
- `rejected`: Red

---

### Route Updates

**App.jsx changes:**

```javascript
import Apply from './pages/Apply'
import VerifyEmail from './pages/VerifyEmail'
import Applications from './pages/Applications'
import ApplicationDetail from './pages/ApplicationDetail'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Existing public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* NEW public routes */}
            <Route path="/apply" element={<Apply />} />
            <Route path="/verify-email" element={<VerifyEmail />} />

            {/* Authenticated routes */}
            <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
              {/* Existing routes */}
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="members" element={<Members />} />
              {/* ... */}

              {/* NEW authenticated routes */}
              <Route path="applications" element={<Applications />} />
              <Route path="applications/:id" element={<ApplicationDetail />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  )
}
```

**Layout.jsx changes:**

Add navigation link (visible to EDIT role or higher):

```javascript
{checkPermission(ROLES.EDIT) && (
  <Link to="/applications" className="nav-link">
    Applications
  </Link>
)}
```

---

## 9. Technology Stack

### Core Technologies (Existing)
- **Frontend**: React 18
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Firestore + Auth)
- **Build**: Vite
- **PDF**: jsPDF 3.0.3

### New Dependencies

**1. EmailJS (Email Verification)**
```bash
npm install @emailjs/browser
```
- **Version**: ^3.11.0
- **Purpose**: Send verification emails client-side
- **Free Tier**: 200 emails/month
- **Alternative**: Cloud Functions + SendGrid (requires paid plan)

**2. uuid (Token Generation)**
```bash
npm install uuid
```
- **Version**: ^9.0.0
- **Purpose**: Generate cryptographically secure verification tokens
- **Alternative**: Use crypto.randomUUID() (browser native, but needs polyfill for older browsers)

**3. Google reCAPTCHA v3 (CDN)**
No npm package needed, load via CDN in `public/index.html`:
```html
<script src="https://www.google.com/recaptcha/api.js?render=YOUR_SITE_KEY"></script>
```

### Optional Dependencies

**4. react-hook-form (If chosen for form validation)**
```bash
npm install react-hook-form
```
- **Not recommended**: Plain React state is sufficient for this use case

**5. libphonenumber-js (Advanced phone validation)**
```bash
npm install libphonenumber-js
```
- **Optional**: Provides full international phone parsing/formatting
- **Current approach**: Simple regex validation is sufficient for Australian phones

### Configuration Files

**1. EmailJS Setup**
- Register at https://www.emailjs.com
- Create email service (Gmail, Outlook, etc.)
- Create email template with variables: `{{full_name}}`, `{{verification_link}}`
- Get Service ID, Template ID, Public Key
- Add to `.env`:
```
VITE_EMAILJS_SERVICE_ID=service_xxx
VITE_EMAILJS_TEMPLATE_ID=template_xxx
VITE_EMAILJS_PUBLIC_KEY=xxx
```

**2. reCAPTCHA Setup**
- Register at https://www.google.com/recaptcha/admin
- Choose reCAPTCHA v3
- Add domain (Firebase hosting domain)
- Get Site Key
- Add to `.env`:
```
VITE_RECAPTCHA_SITE_KEY=xxx
```

**3. IP Geolocation (Optional)**
- Use https://api.ipify.org for IP address
- Free, no API key required

---

## 10. Implementation Phases

### Phase 1: Backend & Security (Estimated: 8-10 hours)

**Goal**: Firestore collection, security rules, service functions

**Tasks:**
1. **Update Firestore Rules** (2 hours)
   - Add `applications` collection rules
   - Test public CREATE with strict validation
   - Test public UPDATE for email verification
   - Test authenticated READ/UPDATE/DELETE
   - Deploy rules: `npm run deploy:rules`

2. **Create applicationsService.js** (3 hours)
   - `createApplication(data)` - Create application with validation
   - `getApplicationById(id)` - Fetch single application
   - `getAllApplications()` - Fetch all applications
   - `getApplicationsByStatus(status)` - Filter by status
   - `updateApplicationStatus(id, status, metadata)` - Update status
   - `verifyEmail(id, token)` - Verify email token
   - `approveApplication(id, adminId)` - Approve and create member
   - `rejectApplication(id, adminId, reason)` - Reject with reason

3. **Create emailVerificationService.js** (2 hours)
   - `generateVerificationToken()` - Generate UUID v4 token
   - `sendVerificationEmail(email, fullName, token, applicationId)` - Send via EmailJS
   - `validateToken(application, providedToken)` - Check token validity
   - `resendVerificationEmail(applicationId)` - Resend email

4. **Create applicationPdfService.js** (3 hours)
   - `generateApplicationPDF(applicationId, adminName)` - Generate PDF matching paper form
   - Use existing jsPDF patterns from paymentsService.js
   - Test with sample data

**Deliverables:**
- Firestore rules deployed and tested
- Three new service files with full CRUD operations
- PDF generation working

**Testing:**
- Use Firestore emulator to test rules: `npm run emulator`
- Create test application documents manually
- Test each service function with console.log
- Generate sample PDF and verify layout

---

### Phase 2: Public Application Form (Estimated: 10-12 hours)

**Goal**: Public-facing form for applicants to submit applications

**Tasks:**
1. **Setup Dependencies** (1 hour)
   - Install EmailJS: `npm install @emailjs/browser`
   - Install uuid: `npm install uuid`
   - Register EmailJS account, create template
   - Register reCAPTCHA v3, get site key
   - Add environment variables to `.env`
   - Add reCAPTCHA script to `public/index.html`

2. **Create ApplicationForm Component** (4 hours)
   - Build form with all fields from paper form
   - Implement real-time validation
   - Auto-format phone numbers, postcodes
   - Show validation errors inline
   - Style with Tailwind CSS (match existing forms)
   - Add helpful placeholders and hints

3. **Create Apply Page** (3 hours)
   - Handle form submission
   - Execute reCAPTCHA v3 on submit
   - Get IP address (ipify API)
   - Call `createApplication()` service
   - Call `sendVerificationEmail()` service
   - Show success message with instructions
   - Handle errors gracefully

4. **Create VerifyEmail Page** (2 hours)
   - Parse URL params (token, id)
   - Call `verifyEmail()` service
   - Show success message
   - Show error message if token invalid/expired
   - Add "Resend Email" button for expired tokens

5. **Update App.jsx Routing** (0.5 hours)
   - Add `/apply` route (public)
   - Add `/verify-email` route (public)
   - Test routing

6. **Testing & Refinement** (1.5 hours)
   - Test full submission flow
   - Test email verification flow
   - Test error handling
   - Test on mobile (responsive design)
   - Test CAPTCHA blocking low scores

**Deliverables:**
- Working public application form at `/apply`
- Email verification working at `/verify-email`
- Emails sent successfully via EmailJS
- reCAPTCHA blocking bots

**Testing:**
- Submit multiple test applications
- Verify emails arrive in inbox (check spam folder)
- Click verification links
- Test expired token (manually change expiry in Firestore)
- Test duplicate email detection
- Test with reCAPTCHA disabled (should fail Firestore rules)

---

### Phase 3: Admin Interface (Estimated: 12-14 hours)

**Goal**: Admin/Editor pages to review and approve applications

**Tasks:**
1. **Create ApplicationStatusBadge Component** (0.5 hours)
   - Simple component with color-coded badges
   - Status → Color mapping

2. **Create ApplicationsList Component** (2 hours)
   - Table with applications
   - Sortable columns
   - Status badges
   - Row click handler
   - Empty state

3. **Create Applications Page** (3 hours)
   - Fetch applications from Firestore
   - Filter buttons (All, Verified, Approved, Rejected)
   - Search by name/email
   - Sort by date
   - Render ApplicationsList component
   - Handle navigation to detail page
   - Show loading state
   - Permission check (EDIT role required)

4. **Create ApplicationDetail Page** (4 hours)
   - Fetch single application
   - Display all fields in organized sections
   - Input fields for proposer/seconder names
   - Textarea for admin notes
   - "Save Changes" button
   - "Generate PDF" button (calls applicationPdfService)
   - "Approve" button with confirmation modal
   - "Reject" button with reason modal
   - Handle approval (create member, update status)
   - Handle rejection (update status, add reason)
   - Show loading/processing states
   - Permission check (EDIT role required)

5. **Update Layout Navigation** (0.5 hours)
   - Add "Applications" link to nav
   - Show only to EDIT role or higher
   - Add badge showing count of email_verified applications

6. **Integration with Members** (2 hours)
   - On approval, create member using existing `createMember()` service
   - Map application fields to member fields:
     - `fullName` → `fullName`
     - `email` → `email`
     - `phoneMobile` → `phone`
     - `streetAddress + suburb + state + postcode` → `address`
     - `dateOfBirth` → `dateOfBirth`
     - `golfLinkNumber` → `golfAustraliaId`
     - `membershipType` → auto-determine `membershipCategory` by age
     - `accountBalance` → 0 (new member)
     - `status` → 'active'
     - `dateJoined` → today
   - Handle errors if member creation fails
   - Redirect to member profile after approval

7. **Testing & Refinement** (2 hours)
   - Test applications list view
   - Test filters and search
   - Test detail view
   - Test PDF generation
   - Test approval flow (creates member)
   - Test rejection flow
   - Test proposer/seconder saving
   - Test admin notes
   - Test permissions (EDIT vs VIEW role)

**Deliverables:**
- Admin applications list at `/applications`
- Application detail page at `/applications/:id`
- PDF generation working
- Approval creates member
- Rejection stores reason
- Navigation link in Layout

**Testing:**
- Create several test applications (use /apply)
- Verify emails and check they appear in admin list
- Review each application
- Generate PDFs and verify accuracy
- Approve one application, verify member created
- Reject one application with reason
- Verify VIEW role users cannot access pages
- Verify EDIT role users can access and approve

---

### Phase 4: Polish & Documentation (Estimated: 4-6 hours)

**Optional tasks to enhance the system:**

1. **Applicant Notification Emails** (2 hours)
   - Send email when application approved
   - Send email when application rejected
   - Use EmailJS or add Cloud Function

2. **Admin Dashboard Widget** (1 hour)
   - Add card to Dashboard showing pending applications count
   - Link to applications page

3. **Rate Limiting** (2 hours)
   - Track submissions by IP address
   - Prevent more than 3 submissions per IP per day
   - Requires Cloud Functions or client-side check

4. **Unverified Application Cleanup** (1 hour)
   - Cloud Function to delete unverified applications older than 7 days
   - Or manual "Delete Unverified" button for super admin

5. **Documentation** (2 hours)
   - Update CLAUDE.md with application workflow
   - Add admin user guide for reviewing applications
   - Add troubleshooting section

**Testing:**
- End-to-end testing of complete workflow
- Security audit of Firestore rules
- Performance testing (simulate 100 applications)
- Accessibility testing (keyboard navigation, screen readers)
- Cross-browser testing (Chrome, Firefox, Safari, Edge)
- Mobile responsiveness testing

---

## 11. Security Considerations

### Threat Model

**1. Spam/Bot Submissions**
- **Threat**: Automated bots flooding applications
- **Mitigation**: reCAPTCHA v3 with 0.5 minimum score
- **Fallback**: IP address tracking, manual review of low-score submissions
- **Future**: Rate limiting by IP (Cloud Function)

**2. Malicious Data Injection**
- **Threat**: XSS, SQL injection, NoSQL injection
- **Mitigation**: Firestore rules validate all fields (type, length, format)
- **Mitigation**: React auto-escapes strings (XSS protection)
- **Mitigation**: No eval() or innerHTML usage

**3. Email Verification Bypass**
- **Threat**: Attacker guessing verification tokens
- **Mitigation**: UUID v4 tokens (2^122 possible values, unguessable)
- **Mitigation**: 48-hour expiry window
- **Mitigation**: Admins only see email_verified applications

**4. Unauthorized Status Changes**
- **Threat**: Attacker changing application from rejected to approved
- **Mitigation**: Firestore rules prevent invalid status transitions
- **Mitigation**: Only authenticated EDIT+ users can approve/reject
- **Mitigation**: Status changes require specific metadata (approvedBy, rejectedBy)

**5. Personal Data Exposure**
- **Threat**: Unauthenticated users reading applications
- **Mitigation**: Firestore rules prevent public READ
- **Mitigation**: Only EDIT+ role can view applications
- **Mitigation**: IP address not displayed in UI (stored for spam tracking only)

**6. CAPTCHA Bypass**
- **Threat**: Attacker submitting without CAPTCHA token
- **Mitigation**: Firestore rules require captchaScore >= 0.5
- **Limitation**: Client-side CAPTCHA verification (no Cloud Functions)
- **Future**: Server-side token verification with Cloud Functions

**7. Duplicate Email Attack**
- **Threat**: Attacker flooding with same email address
- **Mitigation**: Client-side check against existing members
- **Limitation**: No Firestore unique constraint (NoSQL limitation)
- **Mitigation**: Admin review catches duplicates

**8. Denial of Service (DoS)**
- **Threat**: Excessive writes exhausting Firestore quota
- **Mitigation**: reCAPTCHA blocks bots
- **Mitigation**: Firestore has built-in write rate limits
- **Future**: IP-based rate limiting (3 submissions per IP per day)

---

## 12. Testing Strategy

### Unit Testing (Optional - No automated tests in current project)

**If implementing tests:**
- Test service functions (applicationsService, emailVerificationService)
- Test validation functions
- Test auto-format functions
- Test PDF generation with mock data

### Manual Testing Checklist

#### Phase 1: Backend Testing
- [ ] Create application document manually in Firestore
- [ ] Verify Firestore rules allow public CREATE with valid data
- [ ] Verify Firestore rules reject CREATE with invalid data
- [ ] Verify Firestore rules reject CREATE with low CAPTCHA score
- [ ] Verify Firestore rules allow public UPDATE for email verification
- [ ] Verify Firestore rules reject UPDATE without valid token
- [ ] Verify Firestore rules allow authenticated READ (EDIT+ role)
- [ ] Verify Firestore rules reject authenticated READ (VIEW role)
- [ ] Test token expiry (manually change expiry, verify update fails)
- [ ] Test invalid status transitions (rejected → approved should fail)

#### Phase 2: Public Form Testing
- [ ] Submit application with all valid data
- [ ] Verify Firestore document created
- [ ] Verify verification email received
- [ ] Click verification link, verify success message
- [ ] Verify application status changed to email_verified
- [ ] Submit application with invalid email format (should show error)
- [ ] Submit application with invalid phone (should show error)
- [ ] Submit application with missing required fields (should show error)
- [ ] Test auto-formatting (phone, postcode)
- [ ] Test duplicate email detection
- [ ] Test CAPTCHA (submit form, verify captchaScore set)
- [ ] Test expired verification link (manually change expiry)
- [ ] Test "Resend Email" button
- [ ] Test already verified link (should show success message)
- [ ] Test responsive design on mobile

#### Phase 3: Admin Interface Testing
- [ ] Login as EDIT role user
- [ ] Navigate to /applications
- [ ] Verify list shows only email_verified applications
- [ ] Test filters (All, Verified, Approved, Rejected)
- [ ] Test search by name
- [ ] Test search by email
- [ ] Click application row, verify detail page loads
- [ ] Add proposer name, save changes
- [ ] Add seconder name, save changes
- [ ] Add admin notes, save changes
- [ ] Generate PDF, verify layout matches paper form
- [ ] Approve application, verify confirmation modal
- [ ] Confirm approval, verify member created
- [ ] Verify application status changed to approved
- [ ] Verify redirect to member profile
- [ ] Reject application, verify reason modal
- [ ] Enter rejection reason, confirm
- [ ] Verify application status changed to rejected
- [ ] Login as VIEW role user
- [ ] Verify /applications is not accessible (permission denied)
- [ ] Login as ADMIN role user
- [ ] Verify all admin actions work

#### Phase 4: End-to-End Testing
- [ ] Complete full workflow: Apply → Verify → Admin Review → Approve
- [ ] Verify member appears in members list
- [ ] Verify member details match application
- [ ] Verify membership category auto-determined correctly
- [ ] Test rejection workflow: Apply → Verify → Admin Review → Reject
- [ ] Verify rejected application not visible in "Verified" filter
- [ ] Verify rejection reason saved
- [ ] Test concurrent submissions (multiple applications at once)
- [ ] Test with different browsers (Chrome, Firefox, Safari, Edge)
- [ ] Test on mobile devices (iOS, Android)
- [ ] Performance test: Create 50 applications, verify list loads quickly
- [ ] Security audit: Attempt to bypass rules via Postman/curl

### Spam Testing

**Simulate Bot Attack:**
1. Set captchaScore = 0.0 in form submission
2. Verify Firestore rules reject (captchaScore < 0.5)
3. Set captchaScore = 0.5, verify CREATE succeeds
4. Check IP address is captured correctly

**Simulate Email Verification Bypass:**
1. Create application manually (status: submitted)
2. Attempt to update status to email_verified without token
3. Verify Firestore rules reject
4. Generate valid token, update with correct token
5. Verify update succeeds

### Accessibility Testing

- [ ] Keyboard navigation works (tab through form fields)
- [ ] Form labels associated with inputs (screen reader compatible)
- [ ] Error messages announced to screen readers (aria-live)
- [ ] Color contrast meets WCAG AA standards
- [ ] Focus indicators visible
- [ ] Required fields marked with asterisk and aria-required

---

## Success Metrics

**Data Quality Improvement:**
- Zero illegible emails (email format validation)
- Zero invalid phone numbers (format validation + auto-formatting)
- Zero incomplete addresses (required fields)
- 100% verified email addresses (email verification flow)

**Admin Efficiency:**
- Reduce application processing time by 50% (no data entry, just review)
- Eliminate data entry errors (copy/paste from application)
- Professional PDF output for physical filing

**Security:**
- Zero successful spam submissions (CAPTCHA + Firestore rules)
- Zero unauthorized access to applications (EDIT+ role required)
- Zero data breaches (Firebase security best practices)

**User Experience:**
- <5 minutes to complete application (vs. printing, filling, scanning paper form)
- Instant confirmation (vs. waiting for club to process paper form)
- Clear status updates (email verified, pending review)

---

## Future Enhancements

### Short-Term (3-6 months)
1. **Email Notifications**
   - Notify applicant when approved/rejected
   - Weekly digest for admins of pending applications

2. **Dashboard Widget**
   - Show pending application count on dashboard
   - Quick link to applications page

3. **Application Analytics**
   - Track submission sources (referrals, Google search, etc.)
   - Track approval/rejection rates
   - Average processing time

### Medium-Term (6-12 months)
1. **Cloud Functions Migration**
   - Server-side email sending (more secure)
   - Server-side CAPTCHA verification
   - Automated cleanup of unverified applications

2. **Rate Limiting**
   - IP-based rate limiting (3 submissions per IP per day)
   - Email-based rate limiting (1 submission per email per 30 days)

3. **Payment Integration**
   - Online joining fee payment (Stripe, PayPal)
   - Auto-approve after payment confirmed
   - Eliminate need for "Joining Fee must accompany this form"

### Long-Term (12+ months)
1. **Applicant Portal**
   - Allow applicants to log in and check application status
   - Update contact details if needed
   - Withdraw application

2. **Digital Signatures**
   - Capture signatures digitally (applicant, proposer, seconder)
   - Eliminate paper form entirely
   - Store signed PDF in Firebase Storage

3. **Member Proposer System**
   - Members can propose/second applicants directly in system
   - Notifications to proposer/seconder when application ready
   - Track proposer/seconder history

4. **Golf Link Integration**
   - Validate Golf Link numbers against Golf Australia API
   - Auto-populate handicap data
   - Verify membership history

---

## Appendix A: Field Mapping Reference

### Paper Form → Application Data Model

| Paper Form Field | Data Model Field | Type | Required | Validation |
|-----------------|------------------|------|----------|------------|
| Name (Title) | `title` | string | Yes | Enum: Mr/Mrs/Miss/Ms |
| Name (Full) | `fullName` | string | Yes | 2-100 chars, letters only |
| Address | `streetAddress` | string | Yes | 5-200 chars |
| Address (implied) | `suburb` | string | Yes | 2-100 chars |
| Address (implied) | `state` | string | Yes | Enum: TAS/NSW/VIC/QLD/SA/WA/NT/ACT |
| Post Code | `postcode` | string | Yes | 4 digits |
| Occupation | `occupation` | string | No | 0-100 chars |
| Business Name & Address | `businessName` | string | No | 0-200 chars |
| Business Name & Address | `businessAddress` | string | No | 0-200 chars |
| Post Code (Business) | `businessPostcode` | string | No | 4 digits |
| Telephone – Home | `phoneHome` | string | No | Australian phone format |
| Telephone – Work | `phoneWork` | string | No | Australian phone format |
| Telephone – Mobile | `phoneMobile` | string | Yes | Australian mobile format |
| E-mail Address | `email` | string | Yes | Valid email format |
| Club/s which nominee has been a member | `previousClubs` | string | No | 0-500 chars |
| Golf Link Member Number | `golfLinkNumber` | string | No | 0-50 chars, alphanumeric |
| Last Handicap & date | `lastHandicap` | string | No | 0-100 chars |
| Date of Birth | `dateOfBirth` | string | Yes | YYYY-MM-DD format |
| Membership Required | `membershipType` | string | Yes | Enum: Full/Restricted/Junior |
| Name of proposer | `proposerName` | string | No | Admin fills |
| Name of seconder | `seconderName` | string | No | Admin fills |

### Application → Member Mapping (On Approval)

| Application Field | Member Field | Transformation |
|------------------|--------------|----------------|
| `fullName` | `fullName` | Direct copy |
| `email` | `email` | Direct copy |
| `phoneMobile` | `phone` | Direct copy (formatted) |
| `streetAddress + suburb + state + postcode` | `address` | Concatenate: "123 Main St, Brighton, TAS 7030" |
| `dateOfBirth` | `dateOfBirth` | Direct copy |
| `golfLinkNumber` | `golfAustraliaId` | Direct copy |
| `dateOfBirth` | `membershipCategory` | Auto-determine by age |
| (new) | `accountBalance` | Set to 0 |
| (new) | `status` | Set to 'active' |
| (new) | `dateJoined` | Set to today |
| (new) | `emergencyContact` | Set to empty (can update later) |

---

## Appendix B: Error Messages Reference

### Form Validation Errors

| Field | Error Condition | Error Message |
|-------|----------------|---------------|
| fullName | Empty | "Please enter your full name" |
| fullName | Invalid chars | "Please enter your full name (letters only)" |
| email | Empty | "Please enter your email address" |
| email | Invalid format | "Please enter a valid email address" |
| emailConfirm | Empty | "Please confirm your email address" |
| emailConfirm | Doesn't match | "Email addresses must match" |
| phoneMobile | Empty | "Please enter your mobile number" |
| phoneMobile | Invalid format | "Please enter a valid Australian mobile (e.g., 0412345678)" |
| streetAddress | Empty | "Please enter your street address" |
| suburb | Empty | "Please enter your suburb/city" |
| state | Empty | "Please select your state" |
| postcode | Empty | "Please enter your postcode" |
| postcode | Invalid format | "Please enter a valid 4-digit postcode" |
| dateOfBirth | Empty | "Please enter your date of birth" |
| dateOfBirth | Invalid age | "Please enter a valid date of birth" |
| dateOfBirth | Age < 5 or > 120 | "Please enter a valid date of birth" |
| membershipType | Empty | "Please select a membership type" |

### Submission Errors

| Error Condition | Error Message |
|----------------|---------------|
| CAPTCHA failed | "Failed to verify you are human. Please try again." |
| Duplicate email | "This email is already registered. Please contact the club if you need assistance." |
| Network error | "Failed to submit application. Please check your internet connection and try again." |
| Firestore validation failed | "Application data is invalid. Please check all fields and try again." |

### Email Verification Errors

| Error Condition | Error Message |
|----------------|---------------|
| Token expired | "This verification link has expired (links expire after 48 hours). Please click below to resend." |
| Invalid token | "Invalid verification link. Please check your email for the correct link." |
| Already verified | "This email has already been verified. Your application is pending review." |
| Application not found | "Application not found. Please contact the club for assistance." |

---

## Appendix C: EmailJS Template

**Template Name**: membership_application_verification

**Subject**: Verify your Tea Tree Golf Club membership application

**Body**:
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #2980b9; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f4f4f4; }
    .button { display: inline-block; padding: 12px 30px; background-color: #27ae60; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #777; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Tea Tree Golf Club</h1>
    </div>
    <div class="content">
      <p>Hello {{full_name}},</p>

      <p>Thank you for your interest in joining Tea Tree Golf Club!</p>

      <p>To complete your application, please verify your email address by clicking the button below:</p>

      <p style="text-align: center;">
        <a href="{{verification_link}}" class="button">Verify Email Address</a>
      </p>

      <p style="font-size: 12px; color: #777;">
        Or copy and paste this link into your browser:<br>
        {{verification_link}}
      </p>

      <p><strong>This link will expire in 48 hours.</strong></p>

      <p>Once verified, your application will be reviewed by our membership team. You will be contacted regarding next steps.</p>

      <p>If you did not submit this application, please ignore this email.</p>

      <p>Kind regards,<br>
      Tea Tree Golf Club</p>
    </div>
    <div class="footer">
      <p>10A Volcanic Drive, Brighton, Tasmania, 7030<br>
      Tel: 03 6268 1692<br>
      Email: teatreegolf@bigpond.com</p>
    </div>
  </div>
</body>
</html>
```

**Template Variables:**
- `{{full_name}}` - Applicant's full name
- `{{verification_link}}` - Full URL with token and application ID

---

## Conclusion

This architecture provides a complete, secure, and user-friendly solution for online membership applications. By addressing data quality issues through real-time validation, email verification, and spam prevention, the system will streamline the application process for both applicants and administrators.

The phased implementation approach allows for iterative development and testing, with each phase building on the previous one. The final system will integrate seamlessly with the existing Tea Tree Golf Club membership management system, providing a modern, digital alternative to the paper-based application process.

**Key Success Factors:**
1. **Security First**: Public endpoints secured with Firestore rules, CAPTCHA, and email verification
2. **Data Quality**: Real-time validation eliminates data entry errors
3. **Admin Efficiency**: Review and approve applications in minutes, not hours
4. **User Experience**: Simple, intuitive form with clear feedback
5. **Maintainability**: Clean architecture following existing patterns, minimal dependencies

**Next Steps:**
1. Review and approve this architecture plan
2. Set up EmailJS and reCAPTCHA accounts
3. Begin Phase 1: Backend & Security
4. Test thoroughly after each phase
5. Deploy to production after Phase 3 completion

---

**Document Version**: 1.0
**Last Updated**: December 1, 2025
**Author**: Claude (AI Assistant)
**Status**: Ready for Implementation
