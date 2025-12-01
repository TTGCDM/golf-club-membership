# Implement Admin Application Management Interface

<objective>
Create an admin interface for EDIT and ADMIN users to view membership applications, generate printable PDFs matching the paper form layout, approve applications to create member records, and reject applications if needed. The PDF must be clean and accurate (solving the data quality problem) and ready for physical signature collection.

WHY: This completes the application workflow - admins can review verified applications, print professional PDFs for signature collection, and approve applications to automatically create member records.
</objective>

<context>
Building the admin interface for Tea Tree Golf Club's membership application system.

**Prerequisites:**
- Backend implemented (@prompts/002-implement-application-backend.md)
- Public form implemented (@prompts/003-implement-public-application-form.md)
- applicationsService.js exists with getAllApplications(), approveApplication(), rejectApplication()
- Applications collection has data
- EDIT and ADMIN roles can read applications (security rules)

**Current System:**
- Existing members list at @src/pages/Members.jsx can be used as reference for list/table UI
- Existing PDF generation in @src/services/paymentsService.js (jspdf library) for receipts
- Paper form layout at @docs/Nomination-for-membership (1).pdf must be recreated exactly

**User Requirements:**
- EDIT and ADMIN roles can access applications
- Filter by status (all, submitted, email_verified, approved, rejected)
- View application details
- Generate PDF matching paper form layout
- Approve button creates member record automatically
- Reject button with reason field
- Show application history (who approved, when)

Read CLAUDE.md for component patterns, role checking, and PDF generation approach.
</context>

<requirements>
Implement the following components and services:

## 1. Applications List Page

Create @src/pages/Applications.jsx:

**Access Control:**
- Check permission: `checkPermission(ROLES.EDIT)`
- If not authorized, show "Access denied" message

**Page Header:**
- Title: "Membership Applications"
- Description: "Review and manage membership applications"
- Count: "X applications" with filter indicator

**Filters:**
- Status dropdown:
  - All Applications
  - Pending Verification (submitted)
  - Verified (email_verified)
  - Approved
  - Rejected
- Search by name or email (client-side filter)

**Applications Table:**

Columns:
- **Submitted** - Date (format: DD/MM/YYYY)
- **Name** - Full name with title
- **Email** - Email address (with verified badge if email_verified)
- **Phone** - Mobile number
- **Membership Type** - Full/Restricted/Junior
- **Status** - Badge with color:
  - submitted: gray "Pending Verification"
  - email_verified: blue "Verified"
  - approved: green "Approved"
  - rejected: red "Rejected"
- **Actions** - View button

**Status Badges:**
- submitted: `bg-gray-100 text-gray-800`
- email_verified: `bg-blue-100 text-blue-800`
- approved: `bg-green-100 text-green-800`
- rejected: `bg-red-100 text-red-800`

**Sorting:**
- Default: Sort by submittedAt (newest first)
- Add sorting like Members page (click column headers)

**Empty State:**
- "No applications found" when filtered results are empty
- "No applications yet" when no applications exist

**Loading State:**
- "Loading applications..." with spinner

## 2. Application Details Page

Create @src/pages/ApplicationDetails.jsx:

**Route:** `/applications/:id`

**Access Control:**
- Check permission: `checkPermission(ROLES.EDIT)`

**Page Header:**
- Back button to /applications
- Application ID
- Status badge (large)
- Action buttons (if email_verified status):
  - "Generate PDF" button (primary style)
  - "Approve Application" button (green)
  - "Reject Application" button (red, outline)

**Application Information Display:**

**Section 1: Personal Information**
- Title, Full Name
- Residential Address, Post Code
- Occupation (if provided)
- Business Name, Business Address, Business Post Code (if provided)

**Section 2: Contact Information**
- Home Phone (if provided)
- Work Phone (if provided)
- Mobile
- Email with verified badge (if status >= email_verified)

**Section 3: Golf Background**
- Previous Clubs & Dates (if provided)
- Golf Link Number (if provided)
- Last Handicap & Date (if provided)
- Date of Birth (calculate age, show: "DD/MM/YYYY (XX years old)")

**Section 4: Membership Type**
- Display selected type: Full / Restricted / Junior
- Show category suggestion based on age from membershipCategories.js

**Section 5: Application Timeline**
- Submitted: Date and time
- Email Verified: Date and time (if verified)
- Approved: By whom (user email) and when (if approved)
- Rejected: By whom, when, and reason (if rejected)

**Approval Modal:**
- Triggered by "Approve Application" button
- Confirm: "Are you sure you want to approve this application? This will create a member record."
- Explain: "The applicant will be created as an active member with the details provided."
- Option: "Send notification email" (checkbox, for future)
- Buttons: "Cancel" | "Approve and Create Member"
- On success:
  - Show success message: "Application approved! Member record created."
  - Link to member profile: "View member profile →"
  - Update application status badge to "Approved"

**Rejection Modal:**
- Triggered by "Reject Application" button
- Confirm: "Are you sure you want to reject this application?"
- Reason field: Textarea (required), "Please provide a reason for rejection (this may be shared with the applicant)"
- Buttons: "Cancel" | "Reject Application"
- On success:
  - Show success message: "Application rejected."
  - Update status badge to "Rejected"
  - Show rejection reason in timeline

**Action Restrictions:**
- Only email_verified applications can be approved/rejected
- Approved applications cannot be modified
- Rejected applications cannot be approved (would need new application)
- Show helpful message if wrong status: "This application cannot be approved until the email is verified."

## 3. PDF Generation Service

Create @src/services/applicationPDFService.js:

**Purpose:** Generate PDF matching the paper form layout exactly

**Function:** `generateApplicationPDF(application)`

Use jspdf library (already in project) to recreate the paper form:

**PDF Layout** (A4 portrait):

```
┌─────────────────────────────────────────┐
│   Tea Tree Golf Club Logo/Header        │
│   10A Volcanic Drive, Brighton, TAS 7030│
│   Tel: 03 6268 1692                     │
│   Email: teatreegolf@bigpond.com        │
├─────────────────────────────────────────┤
│                                          │
│   NOMINATION FOR MEMBERSHIP              │
│                                          │
│   Name: Mr John Smith                   │
│   Address: 123 Main St, Hobart, 7000    │
│   Occupation: Teacher                    │
│   Business: Springfield Primary School   │
│   Business Address: 456 School Rd, 7001 │
│   Telephone - Home: 03 1234 5678        │
│              Work: 03 8765 4321         │
│              Mobile: 0412 345 678       │
│   E-mail: john.smith@email.com          │
│                                          │
│   Previous Clubs: Royal Hobart 2010-2020│
│   Golf Link Number: GA12345678           │
│   Last Handicap: 15.2  Date: 01/06/2024 │
│   Date of Birth: 15/03/1985             │
│                                          │
│   Membership Required: [X] Full         │
│                        [ ] Restricted    │
│                        [ ] Junior        │
│                                          │
│   I hereby consent to the above          │
│   nomination and agree to abide by the   │
│   rules of Tea Tree Golf Club.           │
│                                          │
│   Signature of nominee:                  │
│   _________________________________      │
│                                          │
│   Name of proposer:                      │
│   _________________________________      │
│   Signature of proposer:                 │
│   _________________________________      │
│                                          │
│   Name of seconder:                      │
│   _________________________________      │
│   Signature of seconder:                 │
│   _________________________________      │
│                                          │
│   Date application lodged: DD/MM/YYYY    │
│   Secretary: _______________________     │
│   Date: ____________________________     │
│                                          │
│   Note: Proposer & seconder must be      │
│   members for at least 12 months.        │
│   Joining fee must accompany this form.  │
└─────────────────────────────────────────┘
```

**PDF Generation Details:**
- Font: Helvetica (standard PDF font)
- Size: A4 (210mm x 297mm)
- Margins: 20mm all sides
- Font sizes:
  - Header: 16pt bold
  - Subheader: 12pt bold
  - Labels: 10pt
  - Values: 10pt (user data)
  - Notes: 8pt italic
- Layout:
  - Club header at top (centered)
  - Title "NOMINATION FOR MEMBERSHIP" (centered, bold)
  - Form fields with labels and values
  - Checkbox markers for membership type
  - Blank signature lines (underscores)
  - Notes at bottom

**Key Requirements:**
- Pre-fill all applicant data (no blank fields for applicant info)
- Leave signature lines BLANK (to be physically signed)
- Leave proposer/seconder names and signatures BLANK (admin fills these)
- Include submission date (when they applied online)
- Include "Generated from online application on DD/MM/YYYY" footer
- Match paper form layout as closely as possible

**Download Behavior:**
- Filename: `membership-application-[name]-[date].pdf`
- Auto-download to user's device
- Show success message: "PDF generated successfully"

Reference existing PDF generation: @src/services/paymentsService.js generatePDFReceipt()

## 4. Application Service Integration

The approve/reject functions already exist in applicationsService.js. Use them:

```javascript
// In ApplicationDetails component
const approveMutation = useApproveApplication()

const handleApprove = async () => {
  try {
    const result = await approveMutation.mutateAsync({
      applicationId: application.id,
      userId: currentUser.uid
    })

    // Show success
    setSuccess(`Application approved! Member ID: ${result.memberId}`)

    // Optionally navigate to member profile
    // navigate(`/members/${result.memberId}`)
  } catch (error) {
    setError('Failed to approve application')
  }
}

const handleReject = async (reason) => {
  try {
    await rejectMutation.mutateAsync({
      applicationId: application.id,
      reason,
      userId: currentUser.uid
    })

    setSuccess('Application rejected')
  } catch (error) {
    setError('Failed to reject application')
  }
}
```

## 5. Navigation Integration

Update @src/components/Layout.jsx:

Add navigation link for EDIT+ users:
```javascript
{checkPermission(ROLES.EDIT) && (
  <Link to="/applications" className="...">
    Applications
  </Link>
)}
```

Position: After "Payments", before "Users" (if ADMIN)

Update @src/App.jsx:

Add protected route:
```javascript
<Route
  path="/applications"
  element={
    <PrivateRoute>
      <Applications />
    </PrivateRoute>
  }
/>
<Route
  path="/applications/:id"
  element={
    <PrivateRoute>
      <ApplicationDetails />
    </PrivateRoute>
  }
/>
```

</requirements>

<implementation>
**Component Structure:**

```javascript
// Applications.jsx
const Applications = () => {
  const { checkPermission, ROLES } = useAuth()
  const { data: applications = [], isLoading } = useApplications()
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Filter logic
  const filteredApplications = applications.filter(...)

  // Render table with filters
}

// ApplicationDetails.jsx
const ApplicationDetails = () => {
  const { id } = useParams()
  const { currentUser, checkPermission, ROLES } = useAuth()
  const { data: application, isLoading } = useApplication(id)
  const approveMutation = useApproveApplication()
  const rejectMutation = useRejectApplication()

  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)

  const handleGeneratePDF = () => {
    generateApplicationPDF(application)
  }

  const handleApprove = async () => {...}
  const handleReject = async (reason) => {...}

  // Render application details with action buttons
}
```

**PDF Generation Reference:**
Study @src/services/paymentsService.js for jspdf patterns:
- Creating document: `new jsPDF()`
- Adding text: `doc.text(text, x, y)`
- Setting fonts: `doc.setFontSize(size)`
- Drawing lines: `doc.line(x1, y1, x2, y2)`
- Saving: `doc.save(filename)`

**Styling:**
- Follow existing admin page patterns (Members, Payments, Users)
- Use consistent table styling
- Match existing modal patterns
- Use ocean-teal/ocean-navy color scheme
- Mobile-responsive layout

</implementation>

<output>
Create/modify the following files:

- Create: `./src/pages/Applications.jsx` - List all applications
- Create: `./src/pages/ApplicationDetails.jsx` - View single application with actions
- Create: `./src/services/applicationPDFService.js` - Generate PDF matching paper form
- Update: `./src/components/Layout.jsx` - Add "Applications" nav link
- Update: `./src/App.jsx` - Add protected routes

Ensure all components:
- Check permissions appropriately
- Handle loading/error states
- Follow existing design patterns
- Are mobile-responsive
- Have clear user feedback
</output>

<verification>
Before completing, verify:

1. **Applications List:**
   - Only EDIT+ users can access
   - All applications display correctly
   - Filters work (status, search)
   - Sorting works (newest first by default)
   - Status badges show correct colors
   - View button navigates to details page

2. **Application Details:**
   - All fields display correctly
   - Timeline shows accurate history
   - Action buttons only show for email_verified status
   - Approve button is disabled for wrong status

3. **PDF Generation:**
   - PDF matches paper form layout
   - All applicant data is pre-filled
   - Signature lines are blank
   - PDF downloads with correct filename
   - Layout is professional and printable

4. **Approval Flow:**
   - Approve modal confirms action
   - Approve creates member record
   - Success message shows member ID
   - Application status updates to approved
   - Can navigate to member profile

5. **Rejection Flow:**
   - Reject modal requires reason
   - Rejection stores reason
   - Status updates to rejected
   - Cannot re-approve rejected application

6. **Navigation:**
   - "Applications" link appears for EDIT+ users
   - Link navigates to /applications
   - Protected routes work correctly

7. **Integration:**
   - React Query cache updates on approve/reject
   - Members list shows new member immediately
   - No console errors
   - Mobile responsive

Test workflow:
1. Submit application via public form
2. Verify email (check console for link)
3. Login as EDIT user
4. View application in Applications page
5. Open application details
6. Generate PDF and verify layout
7. Approve application
8. Verify member was created
9. Check member appears in Members page
</verification>

<success_criteria>
Admin interface is complete when:
- ✓ Applications list shows all applications for EDIT+ users
- ✓ Filters and search work correctly
- ✓ Application details show all information
- ✓ PDF generation recreates paper form exactly
- ✓ PDF pre-fills applicant data accurately
- ✓ Approve button creates member record atomically
- ✓ Rejection flow works with reason tracking
- ✓ Timeline shows application history
- ✓ Navigation link appears for authorized users
- ✓ All routes are properly protected
- ✓ Mobile responsive design
- ✓ Error handling is comprehensive
- ✓ Success/error feedback is clear
- ✓ Complete workflow tested end-to-end
</success_criteria>
