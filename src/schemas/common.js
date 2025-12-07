import { z } from 'zod'

/**
 * Common Zod validators for Australian-specific fields
 * Used across member, application, and other schemas
 */

// Email validation - RFC 5322 simplified pattern
export const emailSchema = z
  .string()
  .min(1, 'Email address is required')
  .email('Please enter a valid email address')

// Optional email - allows empty string or valid email
export const optionalEmailSchema = z
  .string()
  .refine(
    (val) => val === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
    'Please enter a valid email address'
  )

// Australian phone number - 10 digits starting with 0
export const australianPhoneSchema = z
  .string()
  .min(1, 'Phone number is required')
  .refine(
    (val) => {
      const digitsOnly = val.replace(/\D/g, '')
      return digitsOnly.length === 10 && digitsOnly.startsWith('0')
    },
    'Please enter a valid Australian phone number (10 digits starting with 0)'
  )

// Optional Australian phone - allows empty or valid phone
export const optionalAustralianPhoneSchema = z
  .string()
  .refine(
    (val) => {
      if (!val || val.trim() === '') return true
      const digitsOnly = val.replace(/\D/g, '')
      return digitsOnly.length === 10 && digitsOnly.startsWith('0')
    },
    'Please enter a valid Australian phone number (10 digits starting with 0)'
  )

// Australian postcode - 4 digits, range 0200-9999
export const postcodeSchema = z
  .string()
  .min(1, 'Postcode is required')
  .refine(
    (val) => {
      if (!/^\d{4}$/.test(val)) return false
      const num = parseInt(val, 10)
      return num >= 200 && num <= 9999
    },
    'Please enter a valid 4-digit Australian postcode'
  )

// Optional postcode
export const optionalPostcodeSchema = z
  .string()
  .refine(
    (val) => {
      if (!val || val.trim() === '') return true
      if (!/^\d{4}$/.test(val)) return false
      const num = parseInt(val, 10)
      return num >= 200 && num <= 9999
    },
    'Please enter a valid 4-digit Australian postcode'
  )

// Australian states
export const australianStateSchema = z.enum(
  ['TAS', 'NSW', 'VIC', 'QLD', 'SA', 'WA', 'NT', 'ACT'],
  { errorMap: () => ({ message: 'Please select a state' }) }
)

// Calculate age from date string
const calculateAge = (dateOfBirth) => {
  const dob = new Date(dateOfBirth)
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const monthDiff = today.getMonth() - dob.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--
  }
  return age
}

// Date of birth - must be in past, age 5-120
export const dateOfBirthSchema = z
  .string()
  .min(1, 'Date of birth is required')
  .refine(
    (val) => {
      if (!val) return false
      const dob = new Date(val)
      const today = new Date()
      return dob < today
    },
    'Date of birth must be in the past'
  )
  .refine(
    (val) => {
      if (!val) return true
      const age = calculateAge(val)
      return age >= 5
    },
    'Applicant must be at least 5 years old'
  )
  .refine(
    (val) => {
      if (!val) return true
      const age = calculateAge(val)
      return age <= 120
    },
    'Please enter a valid date of birth'
  )

// Optional date of birth
export const optionalDateOfBirthSchema = z
  .string()
  .refine(
    (val) => {
      if (!val || val.trim() === '') return true
      const dob = new Date(val)
      const today = new Date()
      if (dob >= today) return false
      const age = calculateAge(val)
      return age >= 5 && age <= 120
    },
    'Please enter a valid date of birth'
  )

// Date format YYYY-MM-DD
export const dateSchema = z
  .string()
  .min(1, 'Date is required')
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')

// Optional date
export const optionalDateSchema = z
  .string()
  .refine(
    (val) => !val || val.trim() === '' || /^\d{4}-\d{2}-\d{2}$/.test(val),
    'Invalid date format (YYYY-MM-DD)'
  )

// Golf Link number - optional, 7-10 digits if provided
export const golfLinkSchema = z
  .string()
  .refine(
    (val) => {
      if (!val || val.trim() === '') return true
      const digitsOnly = val.replace(/\D/g, '')
      return digitsOnly.length >= 7 && digitsOnly.length <= 10
    },
    'Golf Link number should be 7-10 digits'
  )

// Handicap - optional, -5 to 54 if provided
export const handicapSchema = z
  .string()
  .refine(
    (val) => {
      if (!val || val.trim() === '') return true
      const num = parseFloat(val)
      if (isNaN(num)) return false
      return num >= -5 && num <= 54
    },
    'Handicap must be between -5 and 54'
  )

// Positive number (for amounts)
export const positiveNumberSchema = z
  .number()
  .positive('Amount must be greater than 0')

// Non-negative number (for fees)
export const nonNegativeNumberSchema = z
  .number()
  .min(0, 'Amount cannot be negative')

// String to number transform for form inputs
export const stringToNumberSchema = z
  .string()
  .transform((val) => (val === '' ? undefined : parseFloat(val)))
  .pipe(z.number().optional())

// Required string
export const requiredStringSchema = (fieldName) =>
  z.string().min(1, `${fieldName} is required`)

// Titles
export const titleSchema = z.enum(['Mr', 'Mrs', 'Ms', 'Miss', 'Dr']).optional()

// Member status
export const memberStatusSchema = z.enum(['active', 'inactive'])

// User roles
export const userRoleSchema = z.enum(['view', 'edit', 'admin', 'super_admin'])

// User status
export const userStatusSchema = z.enum(['pending', 'active', 'inactive'])

// Payment methods
export const paymentMethodSchema = z.enum(['bank_transfer', 'cash'])

// Membership types for applications
export const membershipTypeSchema = z.enum(['Full', 'Restricted', 'Junior'], {
  errorMap: () => ({ message: 'Please select a membership type' }),
})

// Application status
export const applicationStatusSchema = z.enum([
  'submitted',
  'email_verified',
  'approved',
  'rejected',
])

// Helper: Calculate age from DOB string
export { calculateAge }

// Helper: Format phone number as user types
export const formatAustralianPhone = (phone) => {
  const digitsOnly = phone.replace(/\D/g, '')
  const limited = digitsOnly.slice(0, 10)

  if (limited.length <= 2) {
    return limited
  } else if (limited.length <= 4) {
    return `${limited.slice(0, 2)} ${limited.slice(2)}`
  } else if (limited.length <= 8) {
    if (limited.startsWith('04')) {
      return `${limited.slice(0, 4)} ${limited.slice(4)}`
    }
    return `${limited.slice(0, 2)} ${limited.slice(2, 6)} ${limited.slice(6)}`
  } else {
    if (limited.startsWith('04')) {
      return `${limited.slice(0, 4)} ${limited.slice(4, 7)} ${limited.slice(7)}`
    }
    return `${limited.slice(0, 2)} ${limited.slice(2, 6)} ${limited.slice(6)}`
  }
}

// Helper: Get suggested membership type based on age
export const getSuggestedMembershipType = (age) => {
  if (age < 18) return 'Junior'
  return 'Full'
}
