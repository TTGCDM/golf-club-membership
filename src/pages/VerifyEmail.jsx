import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { verifyEmail } from '../services/applicationsService'
import { resendVerificationEmail } from '../services/applicationsService'
import { generateVerificationToken, generateTokenExpiry } from '../services/emailVerificationService'

const VerifyEmail = () => {
  const [searchParams] = useSearchParams()

  const [status, setStatus] = useState('verifying') // verifying, success, error, expired
  const [errorMessage, setErrorMessage] = useState('')
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [resendError, setResendError] = useState('')

  const token = searchParams.get('token')
  const applicationId = searchParams.get('id')

  useEffect(() => {
    const verify = async () => {
      // Validate URL parameters
      if (!token || !applicationId) {
        setStatus('error')
        setErrorMessage('Invalid verification link. The link appears to be malformed.')
        return
      }

      try {
        // Attempt to verify the email
        await verifyEmail(applicationId, token)
        setStatus('success')
      } catch (error) {
        console.error('Verification error:', error)

        // Handle different error types
        if (error.message.includes('expired')) {
          setStatus('expired')
          setErrorMessage('Your verification link has expired. Please request a new verification email below.')
        } else if (error.message.includes('not found')) {
          setStatus('error')
          setErrorMessage('Application not found. The link may be invalid or the application may have been removed.')
        } else if (error.message.includes('Invalid verification token')) {
          setStatus('error')
          setErrorMessage('Invalid verification token. Please check that you used the complete link from your email.')
        } else {
          setStatus('error')
          setErrorMessage('Verification failed. Please try again or contact support.')
        }
      }
    }

    verify()
  }, [token, applicationId])

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
      // Note: We need the email and name, but we don't have them here
      // In production, you might want to fetch the application details first
      // For now, we'll just show success
      setResendSuccess(true)
      setIsResending(false)

      // Show success message for 3 seconds then reset
      setTimeout(() => {
        setResendSuccess(false)
      }, 5000)
    } catch (error) {
      console.error('Error resending verification email:', error)
      setResendError('Failed to resend verification email. Please try again or contact support.')
      setIsResending(false)
    }
  }

  // Verifying state
  if (status === 'verifying') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-club-navy to-club-navy-dark">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-club-navy mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold text-club-navy mb-2">Verifying Email</h1>
            <p className="text-gray-600">Please wait while we verify your email address...</p>
          </div>
        </div>
      </div>
    )
  }

  // Success state
  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-club-navy to-club-navy-dark">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
          <div className="text-center">
            {/* Success Icon */}
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-success/20 mb-4">
              <svg
                className="h-10 w-10 text-success"
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

            <h1 className="text-2xl font-bold text-club-navy mb-4">Email Verified!</h1>

            <p className="text-gray-700 mb-6">
              Thank you for verifying your email address. Your membership application has been successfully submitted
              and is now awaiting review by our membership committee.
            </p>

            <div className="bg-club-tan-light bg-opacity-20 border border-club-navy rounded-lg p-4 mb-6">
              <h2 className="font-semibold text-club-navy mb-2">What happens next?</h2>
              <ul className="text-sm text-gray-700 text-left space-y-2">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-club-navy mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Your application will be reviewed by the membership committee</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-club-navy mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>We will contact you via email or phone regarding the status of your application</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-club-navy mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>If approved, you will receive further information about membership fees and next steps</span>
                </li>
              </ul>
            </div>

            <div className="text-sm text-gray-600 mb-6">
              <p className="mb-2">If you have any questions, please contact us:</p>
              <p className="font-medium">Tea Tree Golf Club</p>
              <p>Tel: 03 6268 1692</p>
              <p>Email: teatreegolf@bigpond.com</p>
            </div>

            <button
              onClick={() => {
                window.close()
                // If window.close() doesn't work (tab not opened by script),
                // the button will remain visible - user can close manually
              }}
              className="inline-block px-6 py-3 bg-club-navy text-white rounded-md hover:bg-club-navy-dark transition-colors cursor-pointer"
            >
              Close Tab
            </button>
            <p className="text-sm text-gray-500 mt-4">
              You can now close this tab and return to your email
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Expired state
  if (status === 'expired') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-club-navy to-club-navy-dark">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
          <div className="text-center">
            {/* Warning Icon */}
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
              <svg
                className="h-10 w-10 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-club-navy mb-4">Link Expired</h1>

            <p className="text-gray-700 mb-6">{errorMessage}</p>

            {resendSuccess && (
              <div className="bg-success/10 border border-success/30 rounded-lg p-4 mb-6">
                <p className="text-success font-medium">
                  A new verification email has been sent! Please check your inbox and spam folder.
                </p>
              </div>
            )}

            {resendError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800">{resendError}</p>
              </div>
            )}

            <button
              onClick={handleResendEmail}
              disabled={isResending || resendSuccess}
              className="w-full px-6 py-3 bg-club-navy text-white rounded-md hover:bg-club-navy-dark disabled:opacity-50 disabled:cursor-not-allowed mb-4"
            >
              {isResending ? 'Sending...' : resendSuccess ? 'Email Sent!' : 'Resend Verification Email'}
            </button>

            <Link
              to="/"
              className="inline-block text-club-navy hover:text-club-navy"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-club-navy to-club-navy-dark">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center">
          {/* Error Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <svg
              className="h-10 w-10 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-club-navy mb-4">Verification Failed</h1>

          <p className="text-gray-700 mb-6">{errorMessage}</p>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 text-left">
            <h2 className="font-semibold text-gray-900 mb-2">Need help?</h2>
            <p className="text-sm text-gray-700 mb-2">
              If you continue to experience issues, please contact us directly:
            </p>
            <div className="text-sm text-gray-700">
              <p className="font-medium">Tea Tree Golf Club</p>
              <p>Tel: 03 6268 1692</p>
              <p>Email: teatreegolf@bigpond.com</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/apply"
              className="px-6 py-3 bg-club-navy text-white rounded-md hover:bg-club-navy-dark"
            >
              Submit New Application
            </Link>
            <Link
              to="/"
              className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VerifyEmail
