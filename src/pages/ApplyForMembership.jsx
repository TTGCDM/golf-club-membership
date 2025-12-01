import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import ReCAPTCHA from 'react-google-recaptcha'
import { submitApplication, MEMBERSHIP_TYPES, AUSTRALIAN_STATES } from '../services/applicationsService'
import { generateVerificationToken, generateTokenExpiry, sendVerificationEmail } from '../services/emailVerificationService'
import { RECAPTCHA_SITE_KEY } from '../config/recaptcha'
import {
  formatAustralianPhone,
  calculateAge,
  getSuggestedMembershipType,
  validateApplicationForm,
  isFormValid
} from '../utils/validation'

const ApplyForMembership = () => {
  const navigate = useNavigate()
  const recaptchaRef = useRef(null)

  // Form data state
  const [formData, setFormData] = useState({
    // Personal Information
    title: '',
    fullName: '',

    // Address
    streetAddress: '',
    suburb: '',
    state: 'TAS',
    postcode: '',

    // Contact
    email: '',
    emailConfirm: '',
    phoneHome: '',
    phoneWork: '',
    phoneMobile: '',

    // Personal Details
    dateOfBirth: '',
    occupation: '',
    businessName: '',
    businessAddress: '',
    businessPostcode: '',

    // Golf Background
    previousClubs: '',
    golfLinkNumber: '',
    lastHandicap: '',

    // Membership Type
    membershipType: '',

    // Agreement
    agreedToTerms: false
  })

  // Track which fields have been touched (for showing validation errors)
  const [touchedFields, setTouchedFields] = useState({})

  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [captchaToken, setCaptchaToken] = useState(null)

  // Handle field change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target

    // Special handling for phone fields (auto-format)
    if (name.startsWith('phone')) {
      setFormData(prev => ({
        ...prev,
        [name]: formatAustralianPhone(value)
      }))
      return
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  // Handle field blur (mark as touched)
  const handleBlur = (fieldName) => {
    setTouchedFields(prev => ({
      ...prev,
      [fieldName]: true
    }))
  }

  // Handle CAPTCHA
  const handleCaptchaChange = (token) => {
    setCaptchaToken(token)
  }

  // Calculate age and suggest membership type when DOB changes
  const getAgeAndSuggestion = () => {
    if (!formData.dateOfBirth) return null

    const age = calculateAge(formData.dateOfBirth)
    const suggested = getSuggestedMembershipType(age)

    return { age, suggested }
  }

  const ageInfo = getAgeAndSuggestion()

  // Get validation errors
  const errors = validateApplicationForm(formData)

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError(null)

    // Mark all fields as touched
    const allTouched = {}
    Object.keys(formData).forEach(key => {
      allTouched[key] = true
    })
    setTouchedFields(allTouched)

    // Validate form
    if (!isFormValid(errors)) {
      setSubmitError('Please fix the errors above before submitting')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    // Check CAPTCHA
    if (!captchaToken) {
      setSubmitError('Please complete the CAPTCHA verification')
      return
    }

    // Check terms agreement
    if (!formData.agreedToTerms) {
      setSubmitError('You must agree to the terms and conditions')
      return
    }

    setIsSubmitting(true)

    try {
      // Generate verification token
      const verificationToken = generateVerificationToken()
      const tokenExpiry = generateTokenExpiry()

      // Prepare application data with CAPTCHA score
      // For reCAPTCHA v2 (checkbox), we treat it as 1.0 if completed
      const applicationData = {
        ...formData,
        captchaScore: 1.0, // reCAPTCHA v2 checkbox is binary (completed = 1.0)
        submittedFromIp: '' // Not available in browser, leave empty
      }

      // Submit application
      const application = await submitApplication(
        applicationData,
        verificationToken,
        tokenExpiry
      )

      // Send verification email
      await sendVerificationEmail(
        formData.email,
        formData.fullName,
        verificationToken,
        application.id
      )

      // Navigate to confirmation page
      navigate('/application-confirmation', {
        state: {
          applicationId: application.id,
          email: formData.email,
          fullName: formData.fullName
        }
      })
    } catch (error) {
      console.error('Error submitting application:', error)
      setSubmitError('Failed to submit application. Please try again.')
      setIsSubmitting(false)

      // Reset CAPTCHA
      if (recaptchaRef.current) {
        recaptchaRef.current.reset()
        setCaptchaToken(null)
      }
    }
  }

  // Helper to show error for a field
  const showError = (fieldName) => {
    return touchedFields[fieldName] && errors[fieldName]
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ocean-teal to-ocean-navy py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-xl p-8 mb-6">
          <h1 className="text-3xl font-bold text-ocean-navy mb-2">
            Tea Tree Golf Club
          </h1>
          <h2 className="text-xl text-gray-700 mb-4">
            Membership Application
          </h2>
          <p className="text-gray-600">
            Thank you for your interest in joining Tea Tree Golf Club. Please complete the form below to apply for membership.
            All fields marked with * are required.
          </p>
        </div>

        {/* Error Alert */}
        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 font-medium">{submitError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <select
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  onBlur={() => handleBlur('title')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ocean-teal"
                >
                  <option value="">Select</option>
                  <option value="Mr">Mr</option>
                  <option value="Mrs">Mrs</option>
                  <option value="Ms">Ms</option>
                  <option value="Miss">Miss</option>
                  <option value="Dr">Dr</option>
                </select>
              </div>

              {/* Full Name */}
              <div className="md:col-span-3">
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  onBlur={() => handleBlur('fullName')}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ocean-teal ${
                    showError('fullName') ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="John Smith"
                />
                {showError('fullName') && (
                  <p className="text-red-600 text-sm mt-1">{errors.fullName}</p>
                )}
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Residential Address</h3>

            <div className="grid grid-cols-1 gap-4">
              {/* Street Address */}
              <div>
                <label htmlFor="streetAddress" className="block text-sm font-medium text-gray-700 mb-1">
                  Street Address *
                </label>
                <input
                  type="text"
                  id="streetAddress"
                  name="streetAddress"
                  value={formData.streetAddress}
                  onChange={handleChange}
                  onBlur={() => handleBlur('streetAddress')}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ocean-teal ${
                    showError('streetAddress') ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="123 Main Street"
                />
                {showError('streetAddress') && (
                  <p className="text-red-600 text-sm mt-1">{errors.streetAddress}</p>
                )}
              </div>

              {/* Suburb, State, Postcode */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="suburb" className="block text-sm font-medium text-gray-700 mb-1">
                    Suburb *
                  </label>
                  <input
                    type="text"
                    id="suburb"
                    name="suburb"
                    value={formData.suburb}
                    onChange={handleChange}
                    onBlur={() => handleBlur('suburb')}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ocean-teal ${
                      showError('suburb') ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Brighton"
                  />
                  {showError('suburb') && (
                    <p className="text-red-600 text-sm mt-1">{errors.suburb}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                    State *
                  </label>
                  <select
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    onBlur={() => handleBlur('state')}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ocean-teal ${
                      showError('state') ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    {AUSTRALIAN_STATES.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="postcode" className="block text-sm font-medium text-gray-700 mb-1">
                    Postcode *
                  </label>
                  <input
                    type="text"
                    id="postcode"
                    name="postcode"
                    value={formData.postcode}
                    onChange={handleChange}
                    onBlur={() => handleBlur('postcode')}
                    maxLength="4"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ocean-teal ${
                      showError('postcode') ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="7030"
                  />
                  {showError('postcode') && (
                    <p className="text-red-600 text-sm mt-1">{errors.postcode}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={() => handleBlur('email')}
                  autoComplete="off"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ocean-teal ${
                    showError('email') ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="john.smith@email.com"
                />
                {showError('email') && (
                  <p className="text-red-600 text-sm mt-1">{errors.email}</p>
                )}
                <p className="text-gray-500 text-xs mt-1">
                  You will receive a verification email at this address
                </p>
              </div>

              {/* Email Confirmation */}
              <div>
                <label htmlFor="emailConfirm" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Email Address *
                </label>
                <input
                  type="email"
                  id="emailConfirm"
                  name="emailConfirm"
                  value={formData.emailConfirm}
                  onChange={handleChange}
                  onBlur={() => handleBlur('emailConfirm')}
                  autoComplete="off"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ocean-teal ${
                    showError('emailConfirm') ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="john.smith@email.com"
                />
                {showError('emailConfirm') && (
                  <p className="text-red-600 text-sm mt-1">{errors.emailConfirm}</p>
                )}
              </div>

              {/* Mobile Phone */}
              <div>
                <label htmlFor="phoneMobile" className="block text-sm font-medium text-gray-700 mb-1">
                  Mobile Phone *
                </label>
                <input
                  type="tel"
                  id="phoneMobile"
                  name="phoneMobile"
                  value={formData.phoneMobile}
                  onChange={handleChange}
                  onBlur={() => handleBlur('phoneMobile')}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ocean-teal ${
                    showError('phoneMobile') ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="04XX XXX XXX"
                />
                {showError('phoneMobile') && (
                  <p className="text-red-600 text-sm mt-1">{errors.phoneMobile}</p>
                )}
              </div>

              {/* Home Phone */}
              <div>
                <label htmlFor="phoneHome" className="block text-sm font-medium text-gray-700 mb-1">
                  Home Phone
                </label>
                <input
                  type="tel"
                  id="phoneHome"
                  name="phoneHome"
                  value={formData.phoneHome}
                  onChange={handleChange}
                  onBlur={() => handleBlur('phoneHome')}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ocean-teal ${
                    showError('phoneHome') ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="03 XXXX XXXX"
                />
                {showError('phoneHome') && (
                  <p className="text-red-600 text-sm mt-1">{errors.phoneHome}</p>
                )}
              </div>

              {/* Work Phone */}
              <div className="md:col-span-2">
                <label htmlFor="phoneWork" className="block text-sm font-medium text-gray-700 mb-1">
                  Work Phone
                </label>
                <input
                  type="tel"
                  id="phoneWork"
                  name="phoneWork"
                  value={formData.phoneWork}
                  onChange={handleChange}
                  onBlur={() => handleBlur('phoneWork')}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ocean-teal ${
                    showError('phoneWork') ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="03 XXXX XXXX"
                />
                {showError('phoneWork') && (
                  <p className="text-red-600 text-sm mt-1">{errors.phoneWork}</p>
                )}
              </div>
            </div>
          </div>

          {/* Personal Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date of Birth */}
              <div>
                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  onBlur={() => handleBlur('dateOfBirth')}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ocean-teal ${
                    showError('dateOfBirth') ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {showError('dateOfBirth') && (
                  <p className="text-red-600 text-sm mt-1">{errors.dateOfBirth}</p>
                )}
                {ageInfo && !showError('dateOfBirth') && (
                  <p className="text-gray-500 text-sm mt-1">
                    Age: {ageInfo.age} years (Suggested: {ageInfo.suggested} membership)
                  </p>
                )}
              </div>

              {/* Occupation */}
              <div>
                <label htmlFor="occupation" className="block text-sm font-medium text-gray-700 mb-1">
                  Occupation
                </label>
                <input
                  type="text"
                  id="occupation"
                  name="occupation"
                  value={formData.occupation}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ocean-teal"
                  placeholder="e.g., Accountant, Teacher, Retired"
                />
              </div>

              {/* Business Name */}
              <div>
                <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-1">
                  Business Name
                </label>
                <input
                  type="text"
                  id="businessName"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ocean-teal"
                  placeholder="Optional"
                />
              </div>

              {/* Business Address */}
              <div>
                <label htmlFor="businessAddress" className="block text-sm font-medium text-gray-700 mb-1">
                  Business Address
                </label>
                <input
                  type="text"
                  id="businessAddress"
                  name="businessAddress"
                  value={formData.businessAddress}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ocean-teal"
                  placeholder="Optional"
                />
              </div>

              {/* Business Postcode */}
              <div className="md:col-span-2">
                <label htmlFor="businessPostcode" className="block text-sm font-medium text-gray-700 mb-1">
                  Business Postcode
                </label>
                <input
                  type="text"
                  id="businessPostcode"
                  name="businessPostcode"
                  value={formData.businessPostcode}
                  onChange={handleChange}
                  maxLength="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ocean-teal"
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>

          {/* Golf Background */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Golf Background</h3>
            <p className="text-gray-600 text-sm mb-4">
              Please provide your golf background if applicable. All fields in this section are optional.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Previous Clubs */}
              <div className="md:col-span-2">
                <label htmlFor="previousClubs" className="block text-sm font-medium text-gray-700 mb-1">
                  Previous Golf Clubs
                </label>
                <textarea
                  id="previousClubs"
                  name="previousClubs"
                  value={formData.previousClubs}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ocean-teal"
                  placeholder="List any golf clubs you have previously been a member of"
                />
              </div>

              {/* Golf Link Number */}
              <div>
                <label htmlFor="golfLinkNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Golf Link Number
                </label>
                <input
                  type="text"
                  id="golfLinkNumber"
                  name="golfLinkNumber"
                  value={formData.golfLinkNumber}
                  onChange={handleChange}
                  onBlur={() => handleBlur('golfLinkNumber')}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ocean-teal ${
                    showError('golfLinkNumber') ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Optional"
                />
                {showError('golfLinkNumber') && (
                  <p className="text-red-600 text-sm mt-1">{errors.golfLinkNumber}</p>
                )}
              </div>

              {/* Last Handicap */}
              <div>
                <label htmlFor="lastHandicap" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Handicap
                </label>
                <input
                  type="text"
                  id="lastHandicap"
                  name="lastHandicap"
                  value={formData.lastHandicap}
                  onChange={handleChange}
                  onBlur={() => handleBlur('lastHandicap')}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ocean-teal ${
                    showError('lastHandicap') ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 12.5"
                />
                {showError('lastHandicap') && (
                  <p className="text-red-600 text-sm mt-1">{errors.lastHandicap}</p>
                )}
              </div>
            </div>
          </div>

          {/* Membership Type */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Membership Type</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Membership Type *
              </label>
              <div className="space-y-3">
                {Object.values(MEMBERSHIP_TYPES).map(type => (
                  <label
                    key={type}
                    className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      formData.membershipType === type
                        ? 'border-ocean-teal bg-ocean-seafoam bg-opacity-10'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="membershipType"
                      value={type}
                      checked={formData.membershipType === type}
                      onChange={handleChange}
                      onBlur={() => handleBlur('membershipType')}
                      className="mt-1 mr-3 text-ocean-teal focus:ring-ocean-teal"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{type}</div>
                      <div className="text-sm text-gray-600">
                        {type === 'Full' && 'Full playing rights, 7 days per week'}
                        {type === 'Restricted' && 'Limited playing times (check with club)'}
                        {type === 'Junior' && 'For members under 18 years of age'}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              {showError('membershipType') && (
                <p className="text-red-600 text-sm mt-2">{errors.membershipType}</p>
              )}
            </div>
          </div>

          {/* Terms and Agreement */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Agreement</h3>

            <div className="space-y-4">
              <label className="flex items-start">
                <input
                  type="checkbox"
                  name="agreedToTerms"
                  checked={formData.agreedToTerms}
                  onChange={handleChange}
                  className="mt-1 mr-3 h-4 w-4 text-ocean-teal focus:ring-ocean-teal border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">
                  I confirm that the information provided above is true and accurate. I understand that my application
                  will be reviewed by the membership committee and that membership is subject to approval. *
                </span>
              </label>

              {/* CAPTCHA */}
              <div className="flex justify-center">
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey={RECAPTCHA_SITE_KEY}
                  onChange={handleCaptchaChange}
                />
              </div>

              <p className="text-xs text-gray-500">
                This site is protected by reCAPTCHA and the Google{' '}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ocean-teal hover:underline"
                >
                  Privacy Policy
                </a>{' '}
                and{' '}
                <a
                  href="https://policies.google.com/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ocean-teal hover:underline"
                >
                  Terms of Service
                </a>{' '}
                apply.
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-end">
              <button
                type="button"
                onClick={() => navigate('/')}
                disabled={isSubmitting}
                className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !captchaToken || !formData.agreedToTerms}
                className="px-6 py-3 bg-ocean-teal text-white rounded-md hover:bg-ocean-navy focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ocean-teal disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting Application...' : 'Submit Application'}
              </button>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center mt-8 text-white text-sm">
          <p>Tea Tree Golf Club</p>
          <p>10A Volcanic Drive, Brighton, Tasmania, 7030</p>
          <p>Tel: 03 6268 1692 | Email: teatreegolf@bigpond.com</p>
        </div>
      </div>
    </div>
  )
}

export default ApplyForMembership
