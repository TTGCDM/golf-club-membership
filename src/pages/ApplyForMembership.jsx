import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import ReCAPTCHA from 'react-google-recaptcha'
import { submitApplication, MEMBERSHIP_TYPES, AUSTRALIAN_STATES } from '../services/applicationsService'
import { generateVerificationToken, generateTokenExpiry, sendVerificationEmail } from '../services/emailVerificationService'
import { RECAPTCHA_SITE_KEY } from '../config/recaptcha'
import { applicationFormSchema, transformApplicationFormData } from '../schemas'
import { FormField, FormInput, FormSelect } from '../components/form'
import {
  formatAustralianPhone,
  calculateAge,
  getSuggestedMembershipType
} from '../utils/validation'

const ApplyForMembership = () => {
  const navigate = useNavigate()
  const recaptchaRef = useRef(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(applicationFormSchema),
    defaultValues: {
      title: '',
      fullName: '',
      streetAddress: '',
      suburb: '',
      state: 'TAS',
      postcode: '',
      email: '',
      emailConfirm: '',
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
      membershipType: '',
      agreedToTerms: false
    },
  })

  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [captchaToken, setCaptchaToken] = useState(null)

  /* eslint-disable react-hooks/incompatible-library -- watch() is intentionally reactive */
  const watchDateOfBirth = watch('dateOfBirth')
  const watchMembershipType = watch('membershipType')
  const watchAgreedToTerms = watch('agreedToTerms')
  /* eslint-enable react-hooks/incompatible-library */

  // Handle phone field change with formatting
  const handlePhoneChange = (fieldName, value) => {
    setValue(fieldName, formatAustralianPhone(value))
  }

  // Handle CAPTCHA
  const handleCaptchaChange = (token) => {
    setCaptchaToken(token)
  }

  // Calculate age and suggest membership type when DOB changes
  const getAgeAndSuggestion = () => {
    if (!watchDateOfBirth) return null

    const age = calculateAge(watchDateOfBirth)
    const suggested = getSuggestedMembershipType(age)

    return { age, suggested }
  }

  const ageInfo = getAgeAndSuggestion()

  // Handle form submission
  const onFormSubmit = async (data) => {
    setSubmitError(null)

    // Check CAPTCHA
    if (!captchaToken) {
      setSubmitError('Please complete the CAPTCHA verification')
      return
    }

    setIsSubmitting(true)

    try {
      // Generate verification token
      const verificationToken = generateVerificationToken()
      const tokenExpiry = generateTokenExpiry()

      // Transform and prepare application data
      const transformedData = transformApplicationFormData(data)
      const applicationData = {
        ...transformedData,
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
        data.email,
        data.fullName,
        verificationToken,
        application.id
      )

      // Navigate to confirmation page
      navigate('/application-confirmation', {
        state: {
          applicationId: application.id,
          email: data.email,
          fullName: data.fullName
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

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          {/* Personal Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Title */}
              <FormField
                label="Title"
                name="title"
                error={errors.title?.message}
              >
                <FormSelect
                  id="title"
                  error={errors.title?.message}
                  {...register('title')}
                >
                  <option value="">Select</option>
                  <option value="Mr">Mr</option>
                  <option value="Mrs">Mrs</option>
                  <option value="Ms">Ms</option>
                  <option value="Miss">Miss</option>
                  <option value="Dr">Dr</option>
                </FormSelect>
              </FormField>

              {/* Full Name */}
              <div className="md:col-span-3">
                <FormField
                  label="Full Name"
                  name="fullName"
                  required
                  error={errors.fullName?.message}
                >
                  <FormInput
                    type="text"
                    id="fullName"
                    placeholder="John Smith"
                    error={errors.fullName?.message}
                    {...register('fullName')}
                  />
                </FormField>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Residential Address</h3>

            <div className="grid grid-cols-1 gap-4">
              {/* Street Address */}
              <FormField
                label="Street Address"
                name="streetAddress"
                required
                error={errors.streetAddress?.message}
              >
                <FormInput
                  type="text"
                  id="streetAddress"
                  placeholder="123 Main Street"
                  error={errors.streetAddress?.message}
                  {...register('streetAddress')}
                />
              </FormField>

              {/* Suburb, State, Postcode */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  label="Suburb"
                  name="suburb"
                  required
                  error={errors.suburb?.message}
                >
                  <FormInput
                    type="text"
                    id="suburb"
                    placeholder="Brighton"
                    error={errors.suburb?.message}
                    {...register('suburb')}
                  />
                </FormField>

                <FormField
                  label="State"
                  name="state"
                  required
                  error={errors.state?.message}
                >
                  <FormSelect
                    id="state"
                    error={errors.state?.message}
                    {...register('state')}
                  >
                    {AUSTRALIAN_STATES.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </FormSelect>
                </FormField>

                <FormField
                  label="Postcode"
                  name="postcode"
                  required
                  error={errors.postcode?.message}
                >
                  <FormInput
                    type="text"
                    id="postcode"
                    maxLength="4"
                    placeholder="7030"
                    error={errors.postcode?.message}
                    {...register('postcode')}
                  />
                </FormField>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email */}
              <FormField
                label="Email Address"
                name="email"
                required
                error={errors.email?.message}
                helpText="You will receive a verification email at this address"
              >
                <FormInput
                  type="email"
                  id="email"
                  autoComplete="off"
                  placeholder="john.smith@email.com"
                  error={errors.email?.message}
                  {...register('email')}
                />
              </FormField>

              {/* Email Confirmation */}
              <FormField
                label="Confirm Email Address"
                name="emailConfirm"
                required
                error={errors.emailConfirm?.message}
              >
                <FormInput
                  type="email"
                  id="emailConfirm"
                  autoComplete="off"
                  placeholder="john.smith@email.com"
                  error={errors.emailConfirm?.message}
                  {...register('emailConfirm')}
                />
              </FormField>

              {/* Mobile Phone */}
              <FormField
                label="Mobile Phone"
                name="phoneMobile"
                required
                error={errors.phoneMobile?.message}
              >
                <input
                  type="tel"
                  id="phoneMobile"
                  placeholder="04XX XXX XXX"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ocean-teal mt-1 ${
                    errors.phoneMobile?.message ? 'border-red-500' : 'border-gray-300'
                  }`}
                  {...register('phoneMobile')}
                  onChange={(e) => handlePhoneChange('phoneMobile', e.target.value)}
                />
              </FormField>

              {/* Home Phone */}
              <FormField
                label="Home Phone"
                name="phoneHome"
                error={errors.phoneHome?.message}
              >
                <input
                  type="tel"
                  id="phoneHome"
                  placeholder="03 XXXX XXXX"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ocean-teal mt-1 ${
                    errors.phoneHome?.message ? 'border-red-500' : 'border-gray-300'
                  }`}
                  {...register('phoneHome')}
                  onChange={(e) => handlePhoneChange('phoneHome', e.target.value)}
                />
              </FormField>

              {/* Work Phone */}
              <div className="md:col-span-2">
                <FormField
                  label="Work Phone"
                  name="phoneWork"
                  error={errors.phoneWork?.message}
                >
                  <input
                    type="tel"
                    id="phoneWork"
                    placeholder="03 XXXX XXXX"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ocean-teal mt-1 ${
                      errors.phoneWork?.message ? 'border-red-500' : 'border-gray-300'
                    }`}
                    {...register('phoneWork')}
                    onChange={(e) => handlePhoneChange('phoneWork', e.target.value)}
                  />
                </FormField>
              </div>
            </div>
          </div>

          {/* Personal Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date of Birth */}
              <FormField
                label="Date of Birth"
                name="dateOfBirth"
                required
                error={errors.dateOfBirth?.message}
                helpText={ageInfo && !errors.dateOfBirth?.message ? `Age: ${ageInfo.age} years (Suggested: ${ageInfo.suggested} membership)` : undefined}
              >
                <FormInput
                  type="date"
                  id="dateOfBirth"
                  error={errors.dateOfBirth?.message}
                  {...register('dateOfBirth')}
                />
              </FormField>

              {/* Occupation */}
              <FormField
                label="Occupation"
                name="occupation"
              >
                <FormInput
                  type="text"
                  id="occupation"
                  placeholder="e.g., Accountant, Teacher, Retired"
                  {...register('occupation')}
                />
              </FormField>

              {/* Business Name */}
              <FormField
                label="Business Name"
                name="businessName"
              >
                <FormInput
                  type="text"
                  id="businessName"
                  placeholder="Optional"
                  {...register('businessName')}
                />
              </FormField>

              {/* Business Address */}
              <FormField
                label="Business Address"
                name="businessAddress"
              >
                <FormInput
                  type="text"
                  id="businessAddress"
                  placeholder="Optional"
                  {...register('businessAddress')}
                />
              </FormField>

              {/* Business Postcode */}
              <div className="md:col-span-2">
                <FormField
                  label="Business Postcode"
                  name="businessPostcode"
                  error={errors.businessPostcode?.message}
                >
                  <FormInput
                    type="text"
                    id="businessPostcode"
                    maxLength="4"
                    placeholder="Optional"
                    error={errors.businessPostcode?.message}
                    {...register('businessPostcode')}
                  />
                </FormField>
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
                <FormField
                  label="Previous Golf Clubs"
                  name="previousClubs"
                >
                  <textarea
                    id="previousClubs"
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ocean-teal mt-1"
                    placeholder="List any golf clubs you have previously been a member of"
                    {...register('previousClubs')}
                  />
                </FormField>
              </div>

              {/* Golf Link Number */}
              <FormField
                label="Golf Link Number"
                name="golfLinkNumber"
                error={errors.golfLinkNumber?.message}
              >
                <FormInput
                  type="text"
                  id="golfLinkNumber"
                  placeholder="Optional"
                  error={errors.golfLinkNumber?.message}
                  {...register('golfLinkNumber')}
                />
              </FormField>

              {/* Last Handicap */}
              <FormField
                label="Last Handicap"
                name="lastHandicap"
                error={errors.lastHandicap?.message}
              >
                <FormInput
                  type="text"
                  id="lastHandicap"
                  placeholder="e.g., 12.5"
                  error={errors.lastHandicap?.message}
                  {...register('lastHandicap')}
                />
              </FormField>
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
                      watchMembershipType === type
                        ? 'border-ocean-teal bg-ocean-seafoam bg-opacity-10'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="radio"
                      value={type}
                      {...register('membershipType')}
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
              {errors.membershipType?.message && (
                <p className="text-red-600 text-sm mt-2">{errors.membershipType?.message}</p>
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
                  {...register('agreedToTerms')}
                  className="mt-1 mr-3 h-4 w-4 text-ocean-teal focus:ring-ocean-teal border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">
                  I confirm that the information provided above is true and accurate. I understand that my application
                  will be reviewed by the membership committee and that membership is subject to approval. *
                </span>
              </label>
              {errors.agreedToTerms?.message && (
                <p className="text-red-600 text-sm">{errors.agreedToTerms?.message}</p>
              )}

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
                disabled={isSubmitting || !captchaToken || !watchAgreedToTerms}
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
