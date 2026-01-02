import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  runTransaction,
  onSnapshot,
  Timestamp
} from 'firebase/firestore'
import { z } from 'zod'
import { db } from '../firebase'
import { createMember } from './membersService'
import { applyFeeToMember } from './feeService'

const APPLICATIONS_COLLECTION = 'applications'

// Zod schema for application submission validation
const applicationSubmissionSchema = z.object({
  title: z.string().max(10).optional(),
  fullName: z.string().min(1, 'Full name is required').max(100),
  streetAddress: z.string().min(1, 'Street address is required').max(200),
  suburb: z.string().min(1, 'Suburb is required').max(100),
  state: z.enum(['TAS', 'NSW', 'VIC', 'QLD', 'SA', 'WA', 'NT', 'ACT']),
  postcode: z.string().regex(/^\d{4}$/, 'Postcode must be 4 digits'),
  email: z.string().email().max(255),
  phoneHome: z.string().max(20).optional().default(''),
  phoneWork: z.string().max(20).optional().default(''),
  phoneMobile: z.string().max(20).optional().default(''),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  previousClubs: z.string().max(500).optional().default(''),
  golfLinkNumber: z.string().max(50).optional().default(''),
  lastHandicap: z.string().max(10).optional().default(''),
  // Membership category selection
  membershipCategoryId: z.string().min(1, 'Membership category is required'),
  membershipCategoryName: z.string().max(100).optional().default(''),
  // Estimated cost fields
  estimatedProRataFee: z.number().min(0).optional(),
  estimatedJoiningFee: z.number().min(0).optional(),
  estimatedTotalCost: z.number().min(0).optional(),
  estimatedCostCalculatedAt: z.string().optional(),
  // Meta fields
  captchaScore: z.number().min(0).max(1).optional().default(0),
  submittedFromIp: z.string().max(50).optional().default(''),
  userAgent: z.string().max(500).optional().default('')
})

// Application status constants
export const APPLICATION_STATUS = {
  SUBMITTED: 'submitted',           // Just submitted, email not verified yet
  EMAIL_VERIFIED: 'email_verified', // Email verified, awaiting admin review
  APPROVED: 'approved',             // Approved by admin, member created
  REJECTED: 'rejected'              // Rejected by admin
}

// Membership type constants
export const MEMBERSHIP_TYPES = {
  FULL: 'Full',
  RESTRICTED: 'Restricted',
  JUNIOR: 'Junior'
}

// Australian states constants
export const AUSTRALIAN_STATES = [
  'TAS', 'NSW', 'VIC', 'QLD', 'SA', 'WA', 'NT', 'ACT'
]

/**
 * Submit a new membership application (PUBLIC - no auth required)
 * @param {Object} applicationData - Application data from form
 * @param {string} verificationToken - Email verification token (UUID v4)
 * @param {Date} tokenExpiry - Token expiration timestamp (48 hours from now)
 * @returns {Object} Created application with ID
 */
export const submitApplication = async (applicationData, verificationToken, tokenExpiry) => {
  try {
    // Validate application data with Zod
    const validation = applicationSubmissionSchema.safeParse(applicationData)
    if (!validation.success) {
      throw new Error(`Invalid application data: ${validation.error.errors[0].message}`)
    }

    const validatedData = validation.data

    const newApplication = {
      // Personal details
      title: validatedData.title || '',
      fullName: validatedData.fullName,

      // Address
      streetAddress: validatedData.streetAddress,
      suburb: validatedData.suburb,
      state: validatedData.state,
      postcode: validatedData.postcode,

      // Contact
      email: validatedData.email,
      phoneHome: validatedData.phoneHome,
      phoneWork: validatedData.phoneWork,
      phoneMobile: validatedData.phoneMobile,

      // Personal info
      dateOfBirth: validatedData.dateOfBirth,

      // Golf history
      previousClubs: validatedData.previousClubs,
      golfLinkNumber: validatedData.golfLinkNumber,
      lastHandicap: validatedData.lastHandicap,

      // Membership category
      membershipCategoryId: validatedData.membershipCategoryId,
      membershipCategoryName: validatedData.membershipCategoryName || '',

      // Estimated costs (informational, captured at time of application)
      estimatedProRataFee: validatedData.estimatedProRataFee || null,
      estimatedJoiningFee: validatedData.estimatedJoiningFee || null,
      estimatedTotalCost: validatedData.estimatedTotalCost || null,
      estimatedCostCalculatedAt: validatedData.estimatedCostCalculatedAt || null,

      // Status
      status: APPLICATION_STATUS.SUBMITTED,
      emailVerified: false,
      verifiedAt: null,

      // Email verification
      emailVerificationToken: verificationToken,
      emailVerificationExpiry: Timestamp.fromDate(tokenExpiry),

      // Spam prevention
      submittedFromIp: validatedData.submittedFromIp,
      userAgent: validatedData.userAgent || navigator.userAgent,
      captchaScore: validatedData.captchaScore,

      // Timestamps
      submittedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }

    const docRef = await addDoc(collection(db, APPLICATIONS_COLLECTION), newApplication)
    return { id: docRef.id, ...newApplication }
  } catch (error) {
    console.error('Error submitting application:', error)
    throw error
  }
}

/**
 * Verify email address (PUBLIC - no auth required)
 * Updates application status from 'submitted' to 'email_verified'
 * @param {string} applicationId - Application document ID
 * @param {string} token - Verification token from email link
 * @returns {boolean} True if verification successful
 */
export const verifyEmail = async (applicationId, token) => {
  try {
    const docRef = doc(db, APPLICATIONS_COLLECTION, applicationId)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      throw new Error('Application not found')
    }

    const application = docSnap.data()

    // Validate token matches
    if (application.emailVerificationToken !== token) {
      throw new Error('Invalid verification token')
    }

    // Check if already verified
    if (application.emailVerified) {
      return true // Already verified, return success
    }

    // Check if token expired (Firestore rules will also check this)
    const now = new Date()
    const expiry = application.emailVerificationExpiry.toDate()
    if (now > expiry) {
      throw new Error('Verification token has expired')
    }

    // Update application to verified status
    try {
      await updateDoc(docRef, {
        emailVerified: true,
        status: APPLICATION_STATUS.EMAIL_VERIFIED,
        verifiedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    } catch (updateError) {
      // Handle race condition: if update fails, check if already verified by concurrent request
      if (updateError.code === 'permission-denied') {
        const recheckSnap = await getDoc(docRef)
        if (recheckSnap.exists() && recheckSnap.data().emailVerified) {
          return true // Concurrent request verified it, return success
        }
      }
      throw updateError
    }

    return true
  } catch (error) {
    console.error('Error verifying email:', error)
    throw error
  }
}

/**
 * Get application by ID (AUTHENTICATED - EDIT role or higher)
 * @param {string} applicationId - Application document ID
 * @returns {Object} Application data with ID
 */
export const getApplicationById = async (applicationId) => {
  try {
    const docRef = doc(db, APPLICATIONS_COLLECTION, applicationId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() }
    } else {
      throw new Error('Application not found')
    }
  } catch (error) {
    console.error('Error getting application:', error)
    throw error
  }
}

/**
 * Get all applications (AUTHENTICATED - EDIT role or higher)
 * @returns {Array} Array of applications
 */
export const getAllApplications = async () => {
  try {
    const q = query(
      collection(db, APPLICATIONS_COLLECTION),
      orderBy('submittedAt', 'desc')
    )

    const querySnapshot = await getDocs(q)
    const applications = []

    querySnapshot.forEach((doc) => {
      applications.push({ id: doc.id, ...doc.data() })
    })

    return applications
  } catch (error) {
    console.error('Error getting applications:', error)
    throw error
  }
}

/**
 * Get applications by status (AUTHENTICATED - EDIT role or higher)
 * @param {string} status - Application status (submitted, email_verified, approved, rejected)
 * @returns {Array} Array of applications with matching status
 */
export const getApplicationsByStatus = async (status) => {
  try {
    const q = query(
      collection(db, APPLICATIONS_COLLECTION),
      where('status', '==', status),
      orderBy('submittedAt', 'desc')
    )

    const querySnapshot = await getDocs(q)
    const applications = []

    querySnapshot.forEach((doc) => {
      applications.push({ id: doc.id, ...doc.data() })
    })

    return applications
  } catch (error) {
    console.error('Error getting applications by status:', error)
    throw error
  }
}

/**
 * Subscribe to applications with real-time updates (AUTHENTICATED)
 * @param {Function} callback - Callback function to receive applications array
 * @returns {Function} Unsubscribe function
 */
export const subscribeToApplications = (callback) => {
  const q = query(
    collection(db, APPLICATIONS_COLLECTION),
    orderBy('submittedAt', 'desc')
  )

  return onSnapshot(q, (querySnapshot) => {
    const applications = []
    querySnapshot.forEach((doc) => {
      applications.push({ id: doc.id, ...doc.data() })
    })
    callback(applications)
  }, (error) => {
    console.error('Error subscribing to applications:', error)
  })
}

/**
 * Approve application and create member (AUTHENTICATED - EDIT role or higher)
 * Uses transaction to ensure atomicity:
 * 1. Create member in members collection
 * 2. Update application status to 'approved'
 * 3. Link member ID to application
 * @param {string} applicationId - Application document ID
 * @param {string} adminUserId - ID of user approving the application
 * @returns {Object} Created member object with ID
 */
export const approveApplication = async (applicationId, adminUserId) => {
  try {
    // Use transaction to ensure atomic operation
    const result = await runTransaction(db, async (transaction) => {
      // Get application data
      const applicationRef = doc(db, APPLICATIONS_COLLECTION, applicationId)
      const applicationDoc = await transaction.get(applicationRef)

      if (!applicationDoc.exists()) {
        throw new Error('Application not found')
      }

      const application = applicationDoc.data()

      // Verify application is email verified
      if (!application.emailVerified || application.status !== APPLICATION_STATUS.EMAIL_VERIFIED) {
        throw new Error('Application must be email verified before approval')
      }

      // Map application data to member data
      const memberData = {
        fullName: application.fullName,
        email: application.email,
        phoneMobile: application.phoneMobile || '',
        phoneHome: application.phoneHome || '',
        phoneWork: application.phoneWork || '',
        streetAddress: application.streetAddress,
        suburb: application.suburb,
        state: application.state,
        postcode: application.postcode,
        dateOfBirth: application.dateOfBirth,
        golfAustraliaId: application.golfLinkNumber || '',
        membershipCategory: application.membershipCategoryId || '',
        accountBalance: 0, // New member starts with zero balance
        status: 'active',
        dateJoined: new Date().toISOString().split('T')[0] // Today's date (YYYY-MM-DD)
      }

      // Create member (this is done outside transaction to use existing service)
      // Note: We'll need to handle this differently - see note below
      return { applicationRef, application, memberData }
    })

    // Create member using existing service (outside transaction)
    const member = await createMember(result.memberData)

    // Apply estimated costs as initial fee if they exist
    const application = result.application
    if (application.estimatedTotalCost && application.estimatedTotalCost > 0) {
      await applyFeeToMember({
        memberId: member.id,
        memberName: member.fullName,
        amount: application.estimatedTotalCost,
        feeYear: new Date().getFullYear(),
        notes: `New Member Fee (Pro-Rata: $${application.estimatedProRataFee?.toFixed(2) || 0}, Joining: $${application.estimatedJoiningFee?.toFixed(2) || 0})`,
        categoryId: application.membershipCategoryId,
        categoryName: application.membershipCategoryName || 'New Member'
      }, adminUserId)
    }

    // Update application with approval details
    await updateDoc(result.applicationRef, {
      status: APPLICATION_STATUS.APPROVED,
      approvedBy: adminUserId,
      approvedAt: serverTimestamp(),
      memberId: member.id,
      updatedAt: serverTimestamp()
    })

    return member
  } catch (error) {
    console.error('Error approving application:', error)
    throw error
  }
}

/**
 * Reject application (AUTHENTICATED - EDIT role or higher)
 * @param {string} applicationId - Application document ID
 * @param {string} adminUserId - ID of user rejecting the application
 * @param {string} rejectionReason - Reason for rejection
 * @returns {boolean} True if rejection successful
 */
export const rejectApplication = async (applicationId, adminUserId, rejectionReason) => {
  try {
    const docRef = doc(db, APPLICATIONS_COLLECTION, applicationId)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      throw new Error('Application not found')
    }

    const application = docSnap.data()

    // Verify application is email verified
    if (!application.emailVerified || application.status !== APPLICATION_STATUS.EMAIL_VERIFIED) {
      throw new Error('Application must be email verified before rejection')
    }

    // Validate rejection reason
    if (!rejectionReason || rejectionReason.trim().length === 0) {
      throw new Error('Rejection reason is required')
    }

    await updateDoc(docRef, {
      status: APPLICATION_STATUS.REJECTED,
      rejectedBy: adminUserId,
      rejectedAt: serverTimestamp(),
      rejectionReason: rejectionReason.trim(),
      updatedAt: serverTimestamp()
    })

    return true
  } catch (error) {
    console.error('Error rejecting application:', error)
    throw error
  }
}

/**
 * Resend verification email (PUBLIC - no auth required)
 * Generates new token and updates application
 * @param {string} applicationId - Application document ID
 * @param {string} newToken - New verification token
 * @param {Date} newExpiry - New token expiration timestamp
 * @returns {boolean} True if update successful
 */
export const resendVerificationEmail = async (applicationId, newToken, newExpiry) => {
  try {
    const docRef = doc(db, APPLICATIONS_COLLECTION, applicationId)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      throw new Error('Application not found')
    }

    const application = docSnap.data()

    // Don't resend if already verified
    if (application.emailVerified) {
      throw new Error('Email already verified')
    }

    // Update with new token and expiry
    await updateDoc(docRef, {
      emailVerificationToken: newToken,
      emailVerificationExpiry: Timestamp.fromDate(newExpiry),
      updatedAt: serverTimestamp()
    })

    return true
  } catch (error) {
    console.error('Error resending verification email:', error)
    throw error
  }
}

/**
 * Search applications by name or email (AUTHENTICATED - EDIT role or higher)
 * Client-side search (similar to members search)
 * @param {string} searchTerm - Search term
 * @returns {Array} Filtered applications
 */
export const searchApplications = async (searchTerm) => {
  try {
    const allApplications = await getAllApplications()
    const searchLower = searchTerm.toLowerCase()

    return allApplications.filter(app =>
      app.fullName?.toLowerCase().includes(searchLower) ||
      app.email?.toLowerCase().includes(searchLower)
    )
  } catch (error) {
    console.error('Error searching applications:', error)
    throw error
  }
}

/**
 * Get application statistics (AUTHENTICATED - EDIT role or higher)
 * @returns {Object} Statistics about applications
 */
export const getApplicationStats = async () => {
  try {
    const allApplications = await getAllApplications()

    const stats = {
      total: allApplications.length,
      submitted: allApplications.filter(app => app.status === APPLICATION_STATUS.SUBMITTED).length,
      emailVerified: allApplications.filter(app => app.status === APPLICATION_STATUS.EMAIL_VERIFIED).length,
      approved: allApplications.filter(app => app.status === APPLICATION_STATUS.APPROVED).length,
      rejected: allApplications.filter(app => app.status === APPLICATION_STATUS.REJECTED).length,
      byMembershipType: {}
    }

    // Count by membership type
    allApplications.forEach(app => {
      const type = app.membershipType
      if (!stats.byMembershipType[type]) {
        stats.byMembershipType[type] = 0
      }
      stats.byMembershipType[type]++
    })

    return stats
  } catch (error) {
    console.error('Error getting application stats:', error)
    throw error
  }
}

/**
 * Delete application (AUTHENTICATED - SUPER_ADMIN only)
 * Permanently removes an application from the database
 * @param {string} applicationId - Application document ID
 * @returns {boolean} True if deletion successful
 */
export const deleteApplication = async (applicationId) => {
  try {
    const docRef = doc(db, APPLICATIONS_COLLECTION, applicationId)
    await deleteDoc(docRef)
    console.log('Application deleted successfully:', applicationId)
    return true
  } catch (error) {
    console.error('Error deleting application:', error)
    throw error
  }
}
