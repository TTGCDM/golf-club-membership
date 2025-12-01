# Implement Public Membership Application Form

<objective>
Create a public-facing membership application form that anyone can access without logging in. The form must have real-time validation to prevent data quality issues (wrong emails, illegible addresses/phone numbers), CAPTCHA to prevent spam, and email verification to confirm the applicant's email address.

WHY: This solves the core problem - replacing error-prone handwritten forms with validated digital input that ensures clean, accurate data for admin processing.
</objective>

<context>
Building the public form for Tea Tree Golf Club's membership application system.

**Prerequisites:**
- Backend implemented (@prompts/002-implement-application-backend.md)
- applicationsService.js exists with submitApplication(), verifyEmail(), resendVerification()
- emailVerificationService.js exists
- recaptcha.js config exists
- Security rules allow public CREATE with validation

**Current System:**
- All existing pages require authentication (wrapped in PrivateRoute)
- Paper form has fields listed in @docs/Nomination-for-membership (1).pdf
- Existing member form at @src/pages/AddMember.jsx can be used as reference

**User Requirements:**
- No login required - anyone can access and submit
- Real-time validation for email, phone, address
- CAPTCHA to prevent spam bots
- Email confirmation after submission
- Clear error messages and help text
- Mobile-friendly responsive design

Read CLAUDE.md for component patterns and styling conventions.
</context>

<requirements>
Implement the following components and pages:

## 1. Public Application Form Page

Create @src/pages/ApplyForMembership.jsx:

**Form Fields** (matching paper form):

**Personal Information Section:**
- Title dropdown: Mr/Mrs/Miss/Ms/Other
- Full Name (required, min 2 characters)
- Residential Address (required, textarea)
- Post Code (required, 4 digits, Australian format)
- Occupation (optional)
- Business Name (optional)
- Business Address (optional, textarea)
- Business Post Code (optional, 4 digits if provided)

**Contact Information Section:**
- Home Phone (optional, Australian format)
- Work Phone (optional, Australian format)
- Mobile (required, Australian format with auto-formatting)
- Email Address (required, email format validation)
- Email Confirmation (required, must match email)

**Golf Background Section:**
- Previous Clubs & Membership Dates (optional, textarea, help text: "List any golf clubs you've been a member of and approximate dates")
- Golf Link Number (optional, help text: "Your Golf Australia member number if you have one")
- Last Handicap (optional, help text: "Your most recent handicap index")
- Handicap Date (optional, date picker)
- Date of Birth (required, date picker, validate age for Junior category)

**Membership Type Section:**
- Radio buttons: Full / Restricted / Junior (required)
- Help text explaining each type (if available from categories service)

**Agreement Section:**
- Checkbox (required): "I consent to this application and agree to abide by the rules of Tea Tree Golf Club if accepted as a member"

**CAPTCHA:**
- Google reCAPTCHA v2 (checkbox) at bottom of form

**Submit Button:**
- Disabled until form is valid and CAPTCHA completed
- Shows loading spinner during submission
- Text: "Submit Application"

**Real-Time Validation Requirements:**

**Email Validation:**
- Format check (RFC 5322 basic pattern)
- Check confirmation field matches
- Show green checkmark when valid
- Show red error when invalid
- Error message: "Please enter a valid email address"

**Phone Validation:**
- Accept formats: 0X XXXX XXXX, (0X) XXXX XXXX, 04XX XXX XXX
- Auto-format as user types: "0412345678" → "0412 345 678"
- Show error for invalid format
- Error message: "Please enter a valid Australian phone number"

**Post Code Validation:**
- Must be 4 digits
- Show error if not numeric or wrong length
- Error message: "Post code must be 4 digits"

**Date of Birth Validation:**
- Must be valid date in past
- Show warning if <18 years (Junior category appropriate)
- Show warning if >18 years and Junior selected
- Error message: "Please select a valid date of birth"

**Required Field Validation:**
- Show error only after field is touched (blur event)
- Display "*" next to required field labels
- Show count of remaining required fields at top

**Form Layout:**
- Use existing Tailwind styling (ocean-teal, ocean-navy colors)
- Mobile-responsive grid (1 column on mobile, 2 columns on desktop)
- Clear section headers
- Help text below inputs in gray
- Error messages in red below inputs
- Success states in green

**Submission Flow:**
1. User fills form with real-time validation
2. User completes CAPTCHA
3. User clicks Submit
4. Show loading spinner on button
5. Call applicationsService.submitApplication(data)
6. On success:
   - Call emailVerificationService.sendVerificationEmail(email, token)
   - Navigate to confirmation page with application ID
7. On error:
   - Show error message at top of form
   - Re-enable form
   - Keep user's data (don't clear form)

## 2. Email Verification Page

Create @src/pages/VerifyEmail.jsx:

**Purpose**: Handle email verification links sent to applicants

**URL Pattern**: `/verify-email?token=xxxxx`

**Flow:**
1. Extract token from URL query params (useSearchParams)
2. On mount, call applicationsService.verifyEmail(token)
3. Show loading spinner while verifying
4. On success:
   - Show success message: "Email verified! Your application is now under review."
   - Show next steps: "You'll hear from us within 5 business days. You can close this page."
   - Green checkmark icon
5. On failure (expired/invalid token):
   - Show error message: "This verification link is invalid or has expired."
   - Provide form to resend verification (enter application ID or email)
   - Call applicationsService.resendVerification(applicationId, email)

**Styling:**
- Center card layout
- Large icon (success/error)
- Clear heading and message
- Optional action button (resend verification)

## 3. Application Confirmation Page

Create @src/pages/ApplicationConfirmation.jsx:

**Purpose**: Show success message after form submission

**URL Pattern**: `/application-confirmation?id=xxxxx`

**Content:**
- Success icon (green checkmark)
- Heading: "Application Submitted Successfully!"
- Message: "We've sent a verification email to [email]. Please check your inbox and click the verification link to complete your application."
- Application ID: Display the ID for reference
- Next steps:
  - "1. Check your email and verify your address"
  - "2. We'll review your application within 5 business days"
  - "3. You'll be contacted regarding the next steps"
- Troubleshooting:
  - "Didn't receive the email? Check your spam folder"
  - Button: "Resend Verification Email" → calls resendVerification

**Styling:**
- Center card layout
- Match existing success message patterns
- Mobile-friendly

## 4. Public Route Setup

Update @src/App.jsx:

**Add imports at top:**
```javascript
import ApplyForMembership from './pages/ApplyForMembership'
import VerifyEmail from './pages/VerifyEmail'
import ApplicationConfirmation from './pages/ApplicationConfirmation'
```

**Add public routes at the same level as /login and /register (NOT wrapped in PrivateRoute):**

Current structure (lines 37-38):
```javascript
<Route path="/login" element={<Login />} />
<Route path="/register" element={<Register />} />
```

Add AFTER these, BEFORE the PrivateRoute section:
```javascript
<Route path="/apply" element={<ApplyForMembership />} />
<Route path="/verify-email" element={<VerifyEmail />} />
<Route path="/application-confirmation" element={<ApplicationConfirmation />} />
```

These routes are accessible without authentication, just like /login and /register.

## 5. Navigation Link (Optional)

Consider adding a public link to `/apply` in the layout for authenticated users, or a call-to-action on a public landing page (if one exists).

For now, users can directly access: `http://localhost:5174/apply`

</requirements>

<implementation>
**Component Structure:**

```javascript
// ApplyForMembership.jsx structure
const ApplyForMembership = () => {
  // State for all form fields
  const [formData, setFormData] = useState({...})
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [captchaToken, setCaptchaToken] = useState(null)

  // React Query mutation
  const submitMutation = useSubmitApplication()

  // Real-time validation functions
  const validateEmail = (email) => {...}
  const validatePhone = (phone) => {...}
  const validatePostCode = (postCode) => {...}
  const validateDateOfBirth = (dob) => {...}

  // Format phone number as user types
  const formatPhoneNumber = (value) => {...}

  // Handle field changes with validation
  const handleChange = (field, value) => {...}

  // Handle field blur (mark as touched)
  const handleBlur = (field) => {...}

  // Check if form is valid
  const isFormValid = () => {...}

  // Handle form submission
  const handleSubmit = async (e) => {...}

  return (/* Form JSX */)
}
```

**Validation Helpers:**

Create @src/utils/validation.js:
```javascript
// Email validation
export function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

// Australian phone number validation
export function isValidAustralianPhone(phone) {
  const cleaned = phone.replace(/\s/g, '')
  // Match: 02/03/07/08 XXXX XXXX or 04XX XXX XXX
  const regex = /^0[2-478]\d{8}$/
  return regex.test(cleaned)
}

// Format phone number for display
export function formatAustralianPhone(phone) {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    if (cleaned.startsWith('04')) {
      return `${cleaned.slice(0,4)} ${cleaned.slice(4,7)} ${cleaned.slice(7)}`
    } else {
      return `${cleaned.slice(0,2)} ${cleaned.slice(2,6)} ${cleaned.slice(6)}`
    }
  }
  return phone
}

// Post code validation
export function isValidPostCode(postCode) {
  return /^\d{4}$/.test(postCode)
}

// Calculate age from date of birth
export function calculateAge(dob) {
  const today = new Date()
  const birthDate = new Date(dob)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}
```

**Styling Guidelines:**
- Use existing Tailwind classes from the project
- Primary color: `bg-ocean-teal`, `text-ocean-teal`
- Hover: `hover:bg-ocean-navy`
- Errors: `text-red-600`, `border-red-300`
- Success: `text-green-600`, `border-green-300`
- Form inputs: `px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ocean-teal`
- Match existing form patterns from AddMember.jsx

**Error Handling:**
- Show field errors below inputs (only after touched)
- Show form-level errors at top in red alert box
- CAPTCHA errors: "Please complete the CAPTCHA verification"
- Network errors: "Unable to submit application. Please check your connection and try again."

**Loading States:**
- Disable form during submission
- Show spinner on submit button
- Disable CAPTCHA during submission

</implementation>

<output>
Create the following files:

- Create: `./src/pages/ApplyForMembership.jsx` - Main application form
- Create: `./src/pages/VerifyEmail.jsx` - Email verification handler
- Create: `./src/pages/ApplicationConfirmation.jsx` - Success page
- Create: `./src/utils/validation.js` - Validation helper functions
- Update: `./src/App.jsx` - Add public routes

Ensure all components:
- Follow React best practices
- Use existing styling patterns
- Are mobile-responsive
- Have clear error messages
- Provide good user experience
</output>

<verification>
Before completing, verify:

1. **Form Functionality:**
   - All fields render correctly
   - Real-time validation works (email, phone, postcode)
   - Phone number auto-formats as user types
   - Email confirmation field must match email
   - Required fields are marked and validated
   - CAPTCHA widget appears and works
   - Submit button enables only when form is valid

2. **Navigation Flow:**
   - Form submission redirects to confirmation page
   - Confirmation page shows correct application ID
   - Verification link navigates to verify page
   - Verify page handles success and error cases
   - Resend verification works from both pages

3. **Validation Edge Cases:**
   - Empty required fields show errors (after touch)
   - Invalid email format shows error
   - Email mismatch shows error
   - Invalid phone format shows error
   - Invalid postcode shows error
   - Junior selection with age >18 shows warning
   - Age <18 suggests Junior category

4. **Mobile Responsiveness:**
   - Form is usable on mobile devices
   - Fields are easy to tap
   - Text is readable
   - CAPTCHA works on mobile

5. **Error Handling:**
   - Network errors show user-friendly messages
   - Expired tokens show resend option
   - Failed CAPTCHA shows error
   - Form preserves data on error (doesn't clear)

Test the form at: `http://localhost:5174/apply`

Test verification flow:
1. Submit form
2. Check console for verification link (until email service is set up)
3. Click link to verify
4. Confirm success message appears
</verification>

<success_criteria>
Public form implementation is complete when:
- ✓ Form is accessible at /apply without authentication
- ✓ All fields from paper form are included
- ✓ Real-time validation works for email, phone, address
- ✓ Phone numbers auto-format as user types
- ✓ Email confirmation field validates match
- ✓ CAPTCHA is integrated and functional
- ✓ Form submission creates application record
- ✓ Email verification link is sent (logged to console)
- ✓ Verification page updates application status
- ✓ Confirmation page shows success message
- ✓ Resend verification works
- ✓ All pages are mobile-responsive
- ✓ Error handling is comprehensive
- ✓ Form follows existing design patterns
</success_criteria>
