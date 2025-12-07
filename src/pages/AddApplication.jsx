import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../contexts/AuthContext'
import { submitApplication, APPLICATION_STATUS } from '../services/applicationsService'
import { generateVerificationToken, generateTokenExpiry } from '../services/emailVerificationService'
import { adminApplicationFormSchema } from '../schemas'
import { FormField, FormInput, FormSelect } from '../components/form'

const AddApplication = () => {
  const navigate = useNavigate()
  const { checkPermission, ROLES } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(adminApplicationFormSchema),
    defaultValues: {
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
    }
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

  const onFormSubmit = async (data) => {
    setSubmitError(null)
    setIsSubmitting(true)

    try {
      // Generate token (not used but required by schema)
      const verificationToken = generateVerificationToken()
      const tokenExpiry = generateTokenExpiry()

      // Prepare application data - bypass email verification
      const applicationData = {
        ...data,
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

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Personal Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Title"
              name="title"
              required
              error={errors.title?.message}
            >
              <FormSelect
                id="title"
                error={errors.title?.message}
                {...register('title')}
              >
                <option value="Mr">Mr</option>
                <option value="Mrs">Mrs</option>
                <option value="Miss">Miss</option>
                <option value="Ms">Ms</option>
              </FormSelect>
            </FormField>

            <FormField
              label="Full Name"
              name="fullName"
              required
              error={errors.fullName?.message}
            >
              <FormInput
                type="text"
                id="fullName"
                error={errors.fullName?.message}
                {...register('fullName')}
              />
            </FormField>

            <div className="md:col-span-2">
              <FormField
                label="Street Address"
                name="streetAddress"
                required
                error={errors.streetAddress?.message}
              >
                <FormInput
                  type="text"
                  id="streetAddress"
                  error={errors.streetAddress?.message}
                  {...register('streetAddress')}
                />
              </FormField>
            </div>

            <FormField
              label="Suburb"
              name="suburb"
              required
              error={errors.suburb?.message}
            >
              <FormInput
                type="text"
                id="suburb"
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
                <option value="TAS">TAS</option>
                <option value="NSW">NSW</option>
                <option value="VIC">VIC</option>
                <option value="QLD">QLD</option>
                <option value="SA">SA</option>
                <option value="WA">WA</option>
                <option value="NT">NT</option>
                <option value="ACT">ACT</option>
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
                error={errors.postcode?.message}
                {...register('postcode')}
              />
            </FormField>

            <FormField
              label="Email"
              name="email"
              required
              error={errors.email?.message}
            >
              <FormInput
                type="email"
                id="email"
                error={errors.email?.message}
                {...register('email')}
              />
            </FormField>

            <FormField
              label="Phone (Home)"
              name="phoneHome"
              error={errors.phoneHome?.message}
            >
              <FormInput
                type="tel"
                id="phoneHome"
                error={errors.phoneHome?.message}
                {...register('phoneHome')}
              />
            </FormField>

            <FormField
              label="Phone (Work)"
              name="phoneWork"
              error={errors.phoneWork?.message}
            >
              <FormInput
                type="tel"
                id="phoneWork"
                error={errors.phoneWork?.message}
                {...register('phoneWork')}
              />
            </FormField>

            <FormField
              label="Phone (Mobile)"
              name="phoneMobile"
              required
              error={errors.phoneMobile?.message}
            >
              <FormInput
                type="tel"
                id="phoneMobile"
                error={errors.phoneMobile?.message}
                {...register('phoneMobile')}
              />
            </FormField>

            <FormField
              label="Date of Birth"
              name="dateOfBirth"
              required
              error={errors.dateOfBirth?.message}
            >
              <FormInput
                type="date"
                id="dateOfBirth"
                error={errors.dateOfBirth?.message}
                {...register('dateOfBirth')}
              />
            </FormField>

            <FormField
              label="Membership Type"
              name="membershipType"
              required
              error={errors.membershipType?.message}
            >
              <FormSelect
                id="membershipType"
                error={errors.membershipType?.message}
                {...register('membershipType')}
              >
                <option value="Full">Full</option>
                <option value="Restricted">Restricted</option>
                <option value="Junior">Junior</option>
              </FormSelect>
            </FormField>
          </div>
        </div>

        {/* Optional Fields */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information (Optional)</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Occupation"
              name="occupation"
            >
              <FormInput
                type="text"
                id="occupation"
                {...register('occupation')}
              />
            </FormField>

            <FormField
              label="Golf Link Number"
              name="golfLinkNumber"
              error={errors.golfLinkNumber?.message}
            >
              <FormInput
                type="text"
                id="golfLinkNumber"
                error={errors.golfLinkNumber?.message}
                {...register('golfLinkNumber')}
              />
            </FormField>

            <FormField
              label="Last Handicap"
              name="lastHandicap"
              error={errors.lastHandicap?.message}
            >
              <FormInput
                type="text"
                id="lastHandicap"
                error={errors.lastHandicap?.message}
                {...register('lastHandicap')}
              />
            </FormField>

            <div className="md:col-span-2">
              <FormField
                label="Previous Clubs"
                name="previousClubs"
              >
                <textarea
                  id="previousClubs"
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ocean-teal mt-1"
                  {...register('previousClubs')}
                />
              </FormField>
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
