import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { getAllCategories, determineCategoryByAge, calculateAge } from '../services/membershipCategories'
import { memberFormSchema } from '../schemas'
import { FormField, FormInput, FormSelect } from './form'

const MemberForm = ({ member, onSubmit, onCancel, isLoading }) => {
  const [suggestedCategory, setSuggestedCategory] = useState(null)
  const [currentAge, setCurrentAge] = useState(null)
  const [categories, setCategories] = useState([])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(memberFormSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phoneMobile: '',
      phoneHome: '',
      phoneWork: '',
      streetAddress: '',
      suburb: '',
      state: '',
      postcode: '',
      dateOfBirth: '',
      dateJoined: new Date().toISOString().split('T')[0],
      golfAustraliaId: '',
      membershipCategory: '',
      status: 'active',
    },
  })

  /* eslint-disable react-hooks/incompatible-library -- watch() is intentionally reactive */
  const watchDateOfBirth = watch('dateOfBirth')
  const watchMembershipCategory = watch('membershipCategory')
  /* eslint-enable react-hooks/incompatible-library */

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await getAllCategories()
        setCategories(cats)
      } catch (error) {
        console.error('Error loading categories:', error)
      }
    }
    loadCategories()
  }, [])

  // Load existing member data if editing
  useEffect(() => {
    if (member) {
      setValue('fullName', member.fullName || '')
      setValue('email', member.email || '')
      setValue('phoneMobile', member.phoneMobile || '')
      setValue('phoneHome', member.phoneHome || '')
      setValue('phoneWork', member.phoneWork || '')
      setValue('streetAddress', member.streetAddress || '')
      setValue('suburb', member.suburb || '')
      setValue('state', member.state || '')
      setValue('postcode', member.postcode || '')
      setValue('dateOfBirth', member.dateOfBirth || '')
      setValue('dateJoined', member.dateJoined || '')
      setValue('golfAustraliaId', member.golfAustraliaId || '')
      setValue('membershipCategory', member.membershipCategory || '')
      setValue('status', member.status || 'active')
    }
  }, [member, setValue])

  // Auto-suggest category based on date of birth
  useEffect(() => {
    const suggestCategory = async () => {
      if (watchDateOfBirth) {
        const age = calculateAge(watchDateOfBirth)
        setCurrentAge(age)

        const suggested = await determineCategoryByAge(watchDateOfBirth)
        setSuggestedCategory(suggested)

        // Auto-fill category if not already set (only for new members)
        if (!watchMembershipCategory && !member) {
          setValue('membershipCategory', suggested)
        }
      }
    }
    suggestCategory()
  }, [watchDateOfBirth, member, watchMembershipCategory, setValue])

  const onFormSubmit = (data) => {
    // Include accountBalance for editing
    const submitData = member
      ? { ...data, accountBalance: member.accountBalance || 0 }
      : data
    onSubmit(submitData)
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Personal Information */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
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
          </div>

          <FormField
            label="Email"
            name="email"
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
            label="Mobile Phone"
            name="phoneMobile"
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
            label="Home Phone"
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
            label="Work Phone"
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
            label="Date of Birth"
            name="dateOfBirth"
            helpText={currentAge !== null ? `Current age: ${currentAge} years` : undefined}
          >
            <FormInput
              type="date"
              id="dateOfBirth"
              {...register('dateOfBirth')}
            />
          </FormField>

          <div className="md:col-span-2">
            <FormField
              label="Street Address"
              name="streetAddress"
            >
              <FormInput
                type="text"
                id="streetAddress"
                {...register('streetAddress')}
              />
            </FormField>
          </div>

          <FormField
            label="Suburb"
            name="suburb"
          >
            <FormInput
              type="text"
              id="suburb"
              {...register('suburb')}
            />
          </FormField>

          <FormField
            label="State"
            name="state"
          >
            <FormSelect
              id="state"
              {...register('state')}
            >
              <option value="">Select state</option>
              <option value="TAS">Tasmania</option>
              <option value="NSW">New South Wales</option>
              <option value="VIC">Victoria</option>
              <option value="QLD">Queensland</option>
              <option value="SA">South Australia</option>
              <option value="WA">Western Australia</option>
              <option value="NT">Northern Territory</option>
              <option value="ACT">Australian Capital Territory</option>
            </FormSelect>
          </FormField>

          <FormField
            label="Postcode"
            name="postcode"
          >
            <FormInput
              type="text"
              id="postcode"
              maxLength={4}
              {...register('postcode')}
            />
          </FormField>
        </div>
      </div>

      {/* Membership Information */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Membership Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Golf Australia ID"
            name="golfAustraliaId"
            error={errors.golfAustraliaId?.message}
          >
            <FormInput
              type="text"
              id="golfAustraliaId"
              placeholder="Optional for social members"
              error={errors.golfAustraliaId?.message}
              {...register('golfAustraliaId')}
            />
          </FormField>

          <FormField
            label="Date Joined"
            name="dateJoined"
            required
            error={errors.dateJoined?.message}
          >
            <FormInput
              type="date"
              id="dateJoined"
              error={errors.dateJoined?.message}
              {...register('dateJoined')}
            />
          </FormField>

          <FormField
            label="Membership Category"
            name="membershipCategory"
            required
            error={errors.membershipCategory?.message}
            helpText={
              suggestedCategory && watchMembershipCategory !== suggestedCategory
                ? `Suggested based on age: ${categories.find(c => c.id === suggestedCategory)?.name}`
                : undefined
            }
          >
            <FormSelect
              id="membershipCategory"
              error={errors.membershipCategory?.message}
              {...register('membershipCategory')}
            >
              <option value="">Select category</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name} - ${category.annualFee}/year
                </option>
              ))}
            </FormSelect>
          </FormField>

          <FormField
            label="Status"
            name="status"
            required
            error={errors.status?.message}
          >
            <FormSelect
              id="status"
              error={errors.status?.message}
              {...register('status')}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </FormSelect>
          </FormField>

          {member && (
            <div>
              <label htmlFor="accountBalance" className="block text-sm font-medium text-gray-700 mb-1">
                Account Balance
              </label>
              <input
                type="number"
                id="accountBalance"
                value={member.accountBalance || 0}
                step="0.01"
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Balance is managed through payments and fees
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : member ? 'Update Member' : 'Add Member'}
        </button>
      </div>
    </form>
  )
}

export default MemberForm
