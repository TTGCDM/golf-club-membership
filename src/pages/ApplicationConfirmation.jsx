import { useState } from 'react'
import { useLocation, Link, Navigate } from 'react-router-dom'
import { resendVerificationEmail } from '../services/applicationsService'
import { generateVerificationToken, generateTokenExpiry, sendVerificationEmail } from '../services/emailVerificationService'

const ApplicationConfirmation = () => {
  const location = useLocation()
  const { applicationId, email, fullName } = location.state || {}

  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [resendError, setResendError] = useState('')

  // Redirect to apply page if accessed directly without state
  if (!applicationId || !email) {
    return <Navigate to="/apply" replace />
  }

  const handleResendEmail = async () => {
    setIsResending(true)
    setResendError('')
    setResendSuccess(false)

    try {
      // Generate new token and expiry
      const newToken = generateVerificationToken()
      const newExpiry = generateTokenExpiry()

      // Update application with new token
      await resendVerificationEmail(applicationId, newToken, newExpiry)

      // Send new verification email
      await sendVerificationEmail(email, fullName, newToken, applicationId)

      setResendSuccess(true)
      setIsResending(false)

      // Show success message for 5 seconds then reset
      setTimeout(() => {
        setResendSuccess(false)
      }, 5000)
    } catch (error) {
      console.error('Error resending verification email:', error)

      if (error.message.includes('already verified')) {
        setResendError('Your email has already been verified. No need to resend.')
      } else {
        setResendError('Failed to resend verification email. Please try again or contact support.')
      }

      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-club-navy-dark py-8 px-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          {/* Success Icon */}
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-success/20 mb-4">
            <svg
              className="h-12 w-12 text-success"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-primary mb-2">
            Application Submitted!
          </h1>
          <p className="text-gray-600">
            Thank you for applying to Tea Tree Golf Club
          </p>
        </div>

        {/* Application Details */}
        <div className="bg-secondary/20 border border-primary rounded-lg p-6 mb-6">
          <h2 className="font-semibold text-primary mb-3">Application Details</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Application ID:</span>
              <span className="font-mono text-gray-900">{applicationId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Email:</span>
              <span className="text-gray-900">{email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="text-yellow-600 font-medium">Pending Email Verification</span>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="h-5 w-5 text-primary mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Next Steps
          </h2>
          <ol className="space-y-3 text-gray-700">
            <li className="flex items-start">
              <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium mr-3">
                1
              </span>
              <div>
                <p className="font-medium">Check your email</p>
                <p className="text-sm text-gray-600">
                  We have sent a verification email to <strong>{email}</strong>. Please check your inbox and spam folder.
                </p>
              </div>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium mr-3">
                2
              </span>
              <div>
                <p className="font-medium">Click the verification link</p>
                <p className="text-sm text-gray-600">
                  The email contains a verification link. Click it to confirm your email address. The link will expire in 48 hours.
                </p>
              </div>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium mr-3">
                3
              </span>
              <div>
                <p className="font-medium">Wait for review</p>
                <p className="text-sm text-gray-600">
                  Once your email is verified, your application will be reviewed by our membership committee. We will contact you with the outcome.
                </p>
              </div>
            </li>
          </ol>
        </div>

        {/* Resend Email Section */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">Did not receive the email?</h3>
          <p className="text-sm text-gray-600 mb-4">
            Check your spam folder first. If you still cannot find it, you can request a new verification email.
          </p>

          {resendSuccess && (
            <div className="bg-success/10 border border-success/30 rounded-lg p-4 mb-4">
              <p className="text-success font-medium text-sm">
                Verification email sent successfully! Please check your inbox.
              </p>
            </div>
          )}

          {resendError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800 text-sm">{resendError}</p>
            </div>
          )}

          <button
            onClick={handleResendEmail}
            disabled={isResending || resendSuccess}
            className="w-full sm:w-auto px-6 py-2 bg-white border border-primary text-primary rounded-md hover:bg-secondary/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isResending ? 'Sending...' : resendSuccess ? 'Email Sent!' : 'Resend Verification Email'}
          </button>
        </div>

        {/* Important Information */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-yellow-900 mb-2 flex items-center">
            <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Important
          </h3>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>The verification link expires in 48 hours</li>
            <li>You must verify your email before your application can be reviewed</li>
            <li>Keep this application ID for your records: <span className="font-mono">{applicationId}</span></li>
          </ul>
        </div>

        {/* Contact Information */}
        <div className="text-center text-sm text-gray-600 mb-6">
          <p className="mb-2">Questions about your application?</p>
          <div className="font-medium text-gray-900">
            <p>Tea Tree Golf Club</p>
            <p>10A Volcanic Drive, Brighton, Tasmania, 7030</p>
            <p>Tel: 03 6268 1692 | Email: teatreegolf@bigpond.com</p>
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-center">
          <Link
            to="/"
            className="px-8 py-3 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
          >
            Close
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ApplicationConfirmation
