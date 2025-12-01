/**
 * Email Verification Service
 *
 * Handles email verification token generation and email sending for membership applications.
 * Uses Firebase Cloud Functions with SendGrid for email delivery.
 */

import { getFunctions, httpsCallable } from 'firebase/functions'
import app from '../firebase'

// Initialize Firebase Functions
const functions = getFunctions(app)

/**
 * Generate a random verification token (UUID v4 format)
 * Uses crypto.randomUUID() for cryptographically secure random values
 * @returns {string} Random UUID v4 token
 */
export const generateVerificationToken = () => {
  // Use browser's crypto.randomUUID() for secure random tokens
  // Fallback to custom implementation for older browsers
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  // Fallback implementation (UUID v4)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
 * Generate token expiry timestamp (48 hours from now)
 * @returns {Date} Expiry timestamp
 */
export const generateTokenExpiry = () => {
  const now = new Date()
  const expiry = new Date(now.getTime() + (48 * 60 * 60 * 1000)) // 48 hours
  return expiry
}

/**
 * Send verification email to applicant using Firebase Cloud Function
 *
 * @param {string} email - Applicant's email address
 * @param {string} fullName - Applicant's full name
 * @param {string} token - Verification token
 * @param {string} applicationId - Application document ID
 * @returns {Promise<boolean>} True if email sent successfully
 */
export const sendVerificationEmail = async (email, fullName, token, applicationId) => {
  try {
    // Call Cloud Function to send email
    const sendEmail = httpsCallable(functions, 'sendVerificationEmail')
    const result = await sendEmail({
      email,
      fullName,
      token,
      applicationId
    })

    console.log('Verification email sent successfully:', result.data)
    return true
  } catch (error) {
    console.error('Error sending verification email:', error)
    throw error
  }
}

/**
 * Validate verification token format
 * @param {string} token - Token to validate
 * @returns {boolean} True if token format is valid
 */
export const isValidTokenFormat = (token) => {
  // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(token)
}

/**
 * Check if token has expired
 * @param {Date} expiryDate - Token expiry timestamp
 * @returns {boolean} True if token has expired
 */
export const isTokenExpired = (expiryDate) => {
  const now = new Date()
  return now > expiryDate
}

/**
 * Format time remaining until token expiry
 * @param {Date} expiryDate - Token expiry timestamp
 * @returns {string} Formatted time remaining (e.g., "23 hours 45 minutes")
 */
export const getTimeUntilExpiry = (expiryDate) => {
  const now = new Date()
  const diff = expiryDate - now

  if (diff <= 0) {
    return 'Expired'
  }

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (hours > 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`
  } else {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`
  }
}

/**
 * Send rejection notification email to applicant using Firebase Cloud Function
 * @param {string} email - Applicant's email address
 * @param {string} fullName - Applicant's full name
 * @param {string} rejectionReason - Reason for rejection
 * @returns {Promise<boolean>} True if email sent successfully
 */
export const sendRejectionEmail = async (email, fullName, rejectionReason) => {
  try {
    const sendEmail = httpsCallable(functions, 'sendRejectionEmail')
    const result = await sendEmail({
      email,
      fullName,
      rejectionReason
    })

    console.log('Rejection email sent successfully:', result.data)
    return true
  } catch (error) {
    console.error('Error sending rejection email:', error)
    throw error
  }
}

/**
 * Send approval notification email to applicant using Firebase Cloud Function
 * @param {string} email - Applicant's email address
 * @param {string} fullName - Applicant's full name
 * @returns {Promise<boolean>} True if email sent successfully
 */
export const sendApprovalEmail = async (email, fullName) => {
  try {
    const sendEmail = httpsCallable(functions, 'sendApprovalEmail')
    const result = await sendEmail({
      email,
      fullName
    })

    console.log('Approval email sent successfully:', result.data)
    return true
  } catch (error) {
    console.error('Error sending approval email:', error)
    throw error
  }
}
