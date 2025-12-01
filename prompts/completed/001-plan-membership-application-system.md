# Plan Membership Application System

<objective>
Design a comprehensive architecture for a public membership application system that addresses data quality issues by allowing anyone to submit applications online, with email verification, data validation, and an admin approval workflow. The system must be secure despite being publicly accessible (no login required for submission).

This will replace the current paper-based process where applicants make errors in handwritten forms (wrong emails, illegible phone numbers, address mistakes). The digital system will validate data in real-time, verify email addresses, prevent spam, and generate clean PDFs for printing and signature collection.
</objective>

<context>
This is for Tea Tree Golf Club's membership management system built with React 18 + Firebase.

**Current State:**
- Existing system has member management with role-based access (VIEW, EDIT, ADMIN, SUPER_ADMIN)
- Paper form (docs/Nomination-for-membership (1).pdf) requires:
  - Applicant details (name, address, phone, email, DOB, occupation, business details)
  - Golf history (previous clubs, Golf Link number, handicap)
  - Membership type selection (Full/Restricted/Junior)
  - Proposer signature (must be member for 12+ months)
  - Seconder signature (must be member for 12+ months)
  - Joining fee payment

**Data Quality Problems:**
- Handwritten emails are illegible or contain typos
- Street addresses are incomplete or incorrect
- Phone numbers are hard to read

**Requirements from User:**
1. Public form (no login required) for applicants to submit their details
2. Email verification - applicant must confirm their email address
3. CAPTCHA to prevent spam
4. Real-time validation for email format, phone numbers, and addresses
5. Admin AND Editor roles can view/manage applications
6. Approve button that creates the member record
7. PDF generation that matches the paper form layout for printing and collecting physical signatures
8. Security: Must remain secure despite being a public endpoint

Read CLAUDE.md for project architecture and patterns.
</context>

<research>
Before planning, thoroughly research the existing codebase:

1. **Review existing patterns:**
   - Read @src/services/membersService.js to understand member creation flow
   - Read @src/services/paymentsService.js to see PDF generation approach (jspdf library)
   - Read @src/contexts/AuthContext.jsx to understand role checking (EDIT and ADMIN levels)
   - Read @firestore.rules to understand current security model

2. **Analyze the paper form:**
   - Review @docs/Nomination-for-membership (1).pdf
   - Note all required fields and their validation needs
   - Understand proposer/seconder requirements (12+ months membership)

3. **Consider technical approaches:**
   - Email verification: Firebase Auth for anonymous users, or custom token system?
   - CAPTCHA: Google reCAPTCHA v2, v3, or hCaptcha?
   - Phone validation: libphonenumber-js or custom regex?
   - Address validation: Basic format checking or API integration?
   - Firestore security: How to allow public writes while preventing abuse?
</research>

<planning_requirements>
Create a comprehensive architectural plan that addresses:

## 1. Data Model Design

Design the Firestore `applications` collection schema:
- All fields from the paper form
- Application status (submitted, email_verified, approved, rejected)
- Email verification token and expiry
- Timestamps (submittedAt, verifiedAt, approvedAt, rejectedAt)
- IP address and user agent (for spam tracking)
- Which admin/editor approved (userId)
- Rate limiting metadata

## 2. Security Architecture

Design Firestore security rules that:
- Allow public CREATE with strict validation (required fields, format checks)
- Prevent spam (rate limiting by IP? Field content validation?)
- Allow only ADMIN and EDIT roles to READ applications
- Allow only ADMIN and EDIT roles to UPDATE status
- Never allow DELETE (audit trail)

WHY this matters: Public write endpoints are vulnerable to abuse. Rules must validate every field to prevent malicious data.

## 3. Email Verification Flow

Design the complete workflow:
- What happens when applicant submits form?
- How is verification email sent? (Firebase Auth email, Cloud Functions, or third-party service?)
- What does the verification link do? (update status, expire after how long?)
- What if they don't verify? (delete after X days?)
- Should there be a resend verification option?

WHY this matters: Email verification proves the applicant owns the email address they provided, solving the data quality problem.

## 4. CAPTCHA Integration

Decide on CAPTCHA approach:
- Google reCAPTCHA v2 (checkbox), v3 (invisible), or hCaptcha?
- Where to verify: Client-side only or server-side validation?
- How to integrate with Firebase? (Cloud Functions?)
- Fallback if CAPTCHA service is down?

WHY this matters: Without CAPTCHA, the public form will be spammed. But too aggressive CAPTCHA hurts legitimate users.

## 5. Form Validation Strategy

Design real-time validation for:
- **Email:** Format validation + confirmation field + verification
- **Phone:** Format (Australian mobile/landline), auto-formatting as user types
- **Address:** Required fields (street, suburb, postcode), format checking
- **Date of Birth:** Age validation for Junior category (<18 years)
- **Required fields:** Which fields are mandatory vs optional?

WHY this matters: Real-time validation catches errors before submission, solving the data quality problem.

## 6. Application Workflow

Map out the complete lifecycle:
1. Applicant fills form → submits with CAPTCHA
2. System creates application record (status: submitted)
3. System sends verification email
4. Applicant clicks link → status: email_verified
5. Admin/Editor views application in admin panel
6. Admin/Editor generates PDF → prints → collects physical signatures
7. Admin/Editor clicks "Approve" → creates member record → status: approved
8. What about rejection? Notification to applicant?

## 7. PDF Generation

Design the PDF output:
- Must match the paper form layout exactly
- Include all applicant data (validated and correct)
- Include blank signature lines for:
  - Nominee (applicant)
  - Proposer (to be filled by admin after finding a member)
  - Seconder (to be filled by admin after finding a member)
- Include notes about proposer/seconder requirements
- Include submission date and verification date

WHY this matters: The PDF is the source of truth for the physical signed form. It must be printable and match the existing form layout.

## 8. Component Structure

Plan the frontend architecture:
- **Public route:** `/apply` (no auth required)
- **Components:**
  - `ApplicationForm.jsx` (public form with validation)
  - `ApplicationVerification.jsx` (email verification handler)
  - `ApplicationsList.jsx` (admin page to view applications)
  - `ApplicationDetails.jsx` (view single application, approve/reject)
- **Services:**
  - `applicationsService.js` (Firestore operations)
  - `emailVerificationService.js` (token generation, verification)
- **Routes:** Update App.jsx with public route and protected admin route

## 9. Technology Decisions

Recommend specific libraries/services:
- CAPTCHA provider and integration approach
- Email verification approach (Firebase Auth custom email? Third-party?)
- Phone number validation library
- Form validation library (react-hook-form? formik? plain React state?)
- PDF generation approach (extend existing jspdf usage)

## 10. Migration Considerations

Address how this integrates with existing system:
- Does this replace the "Add Member" form or complement it?
- Can admins still manually create members?
- Should approved applications auto-populate member fields?
- How to handle Golf Link numbers (lookup against existing members for proposer/seconder)?
</planning_requirements>

<output>
Create a comprehensive architectural plan document:

Save to: `./docs/membership-application-architecture.md`

Structure the document with:
- **Executive Summary**: High-level overview of the solution
- **Data Model**: Firestore schema with field descriptions and validation rules
- **Security Design**: Firestore rules approach with examples
- **Email Verification Flow**: Step-by-step workflow diagram (text-based)
- **CAPTCHA Integration**: Recommended approach and implementation plan
- **Form Validation**: Validation rules for each field
- **Application Workflow**: Complete lifecycle from submission to approval
- **PDF Generation**: Layout plan and field mapping
- **Component Architecture**: File structure and component responsibilities
- **Technology Stack**: Specific libraries and services to use
- **Implementation Phases**: Break work into 3 logical phases (Backend, Public Form, Admin Interface)
- **Security Considerations**: Potential vulnerabilities and mitigations
- **Testing Strategy**: How to test public endpoints, email verification, spam prevention

Be thorough and consider edge cases, security implications, and user experience at each step.
</output>

<success_criteria>
The architectural plan should:
- ✓ Address all user requirements (email verification, CAPTCHA, validation, approval workflow, PDF)
- ✓ Provide specific, actionable decisions (not "consider options" but "use X because Y")
- ✓ Include complete Firestore schema
- ✓ Include example security rules
- ✓ Map all fields from paper form to digital form
- ✓ Address spam prevention and abuse scenarios
- ✓ Provide clear implementation phases for subsequent prompts
- ✓ Be detailed enough that developers can implement without further architectural decisions
</success_criteria>

<verification>
Before completing, verify:
- All fields from the paper form are accounted for in the data model
- Security rules prevent common attacks (injection, spam, unauthorized access)
- Email verification flow handles edge cases (expired tokens, already verified, resend)
- CAPTCHA approach is practical for current tech stack (no backend? need Cloud Functions?)
- PDF generation approach can recreate the paper form layout
- Admin/Editor permissions are correctly scoped
- Public route is truly public (no auth required) but still secure
</verification>
