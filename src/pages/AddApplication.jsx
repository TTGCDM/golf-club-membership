import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { submitApplication, APPLICATION_STATUS } from '../services/applicationsService'
import { generateVerificationToken, generateTokenExpiry } from '../services/emailVerificationService'

const AddApplication = () => {
  const navigate = useNavigate()
  const { checkPermission, ROLES } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [formData, setFormData] = useState({
    title: 'Mr',
    fullName: '',
    streetAddress: '',
    suburb: '',
    state: 'TAS',
    postcode: '',
    email: '',
    phoneHome: '',
    phoneWork: '',
    phoneMobile: '',
    dateOfBirth: '',
    occupation: '',
    businessName: '',
    businessAddress: '',
    businessPostcode: '',
    previousClubs: '',
    golfLinkNumber: '',
    lastHandicap: '',
    membershipType: 'Full'
  })

  // Check permission - only EDIT or higher
  if (!checkPermission(ROLES.EDIT)) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Access Denied</h1>
        <p className="text-gray-600">You do not have permission to add applications.</p>
      </div>
    )
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError(null)
    setIsSubmitting(true)

    try {
      // Generate token (not used but required by schema)
      const verificationToken = generateVerificationToken()
      const tokenExpiry = generateTokenExpiry()

      // Prepare application data - bypass email verification
      const applicationData = {
        ...formData,
        captchaScore: 1.0, // Admin entry, no captcha needed
        submittedFromIp: 'admin-entry',
        userAgent: 'Admin Manual Entry'
      }

      // Submit application
      const application = await submitApplication(
        applicationData,
        verificationToken,
        tokenExpiry
      )

      // Immediately verify the application (admin bypass)
      const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore')
      const { db } = await import('../firebase')

      const docRef = doc(db, 'applications', application.id)
      await updateDoc(docRef, {
        emailVerified: true,
        status: APPLICATION_STATUS.EMAIL_VERIFIED,
        verifiedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      // Navigate to applications list
      navigate('/applications')
    } catch (error) {
      console.error('Error adding application:', error)
      setSubmitError('Failed to add application. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Add Application (Admin)</h1>
        <p className="text-gray-600">
          Manually enter an application. Email verification will be bypassed.
        </p>
      </div>

      {submitError && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{submitError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <select
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="Mr">Mr</option>
                <option value="Mrs">Mrs</option>
                <option value="Miss">Miss</option>
                <option value="Ms">Ms</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Street Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="streetAddress"
                value={formData.streetAddress}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Suburb <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="suburb"
                value={formData.suburb}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State <span className="text-red-500">*</span>
              </label>
              <select
                name="state"
                value={formData.state}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="TAS">TAS</option>
                <option value="NSW">NSW</option>
                <option value="VIC">VIC</option>
                <option value="QLD">QLD</option>
                <option value="SA">SA</option>
                <option value="WA">WA</option>
                <option value="NT">NT</option>
                <option value="ACT">ACT</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Postcode <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="postcode"
                value={formData.postcode}
                onChange={handleChange}
                required
                maxLength="4"
                pattern="[0-9]{4}"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone (Home)
              </label>
              <input
                type="tel"
                name="phoneHome"
                value={formData.phoneHome}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone (Work)
              </label>
              <input
                type="tel"
                name="phoneWork"
                value={formData.phoneWork}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone (Mobile) <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phoneMobile"
                value={formData.phoneMobile}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Membership Type <span className="text-red-500">*</span>
              </label>
              <select
                name="membershipType"
                value={formData.membershipType}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="Full">Full</option>
                <option value="Restricted">Restricted</option>
                <option value="Junior">Junior</option>
              </select>
            </div>
          </div>
        </div>

        {/* Optional Fields */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information (Optional)</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Occupation
              </label>
              <input
                type="text"
                name="occupation"
                value={formData.occupation}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Golf Link Number
              </label>
              <input
                type="text"
                name="golfLinkNumber"
                value={formData.golfLinkNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Handicap
              </label>
              <input
                type="text"
                name="lastHandicap"
                value={formData.lastHandicap}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Previous Clubs
              </label>
              <textarea
                name="previousClubs"
                value={formData.previousClubs}
                onChange={handleChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-ocean-teal text-white rounded-md hover:bg-ocean-navy disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Adding...' : 'Add Application'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/applications')}
            className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

export default AddApplication
