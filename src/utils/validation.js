/**
 * Validation Utilities
 *
 * Helper functions for form validation including email, phone, postcode, and date validation.
 * Provides real-time validation feedback for the public membership application form.
 */

/**
 * Validate email address using RFC 5322 pattern
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid email format
 */
export const isValidEmail = (email) => {
  if (!email) return false

  // RFC 5322 simplified email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

/**
 * Get email validation error message
 * @param {string} email - Email address
 * @returns {string} Error message or empty string if valid
 */
export const getEmailError = (email) => {
  if (!email) return 'Email address is required'
  if (!isValidEmail(email)) return 'Please enter a valid email address'
  return ''
}

/**
 * Validate Australian phone number
 * Accepts formats: 0412345678, 04 1234 5678, (03) 1234 5678, etc.
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid Australian phone format
 */
export const isValidAustralianPhone = (phone) => {
  if (!phone) return false

  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '')

  // Australian phone numbers are 10 digits starting with 0
  // Mobile: 04XX XXX XXX
  // Landline: 0X XXXX XXXX
  return digitsOnly.length === 10 && digitsOnly.startsWith('0')
}

/**
 * Format Australian phone number as user types
 * Auto-formats to: 04XX XXX XXX or 0X XXXX XXXX
 * @param {string} phone - Phone number being entered
 * @returns {string} Formatted phone number
 */
export const formatAustralianPhone = (phone) => {
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '')

  // Limit to 10 digits
  const limited = digitsOnly.slice(0, 10)

  // Format based on length
  if (limited.length <= 2) {
    return limited
  } else if (limited.length <= 4) {
    return `${limited.slice(0, 2)} ${limited.slice(2)}`
  } else if (limited.length <= 8) {
    // Mobile format: 04XX XXX XXX
    if (limited.startsWith('04')) {
      return `${limited.slice(0, 4)} ${limited.slice(4)}`
    }
    // Landline format: 0X XXXX XXXX
    return `${limited.slice(0, 2)} ${limited.slice(2, 6)} ${limited.slice(6)}`
  } else {
    // Complete format
    if (limited.startsWith('04')) {
      return `${limited.slice(0, 4)} ${limited.slice(4, 7)} ${limited.slice(7)}`
    }
    return `${limited.slice(0, 2)} ${limited.slice(2, 6)} ${limited.slice(6)}`
  }
}

/**
 * Get phone validation error message
 * @param {string} phone - Phone number
 * @param {boolean} required - Whether phone is required
 * @returns {string} Error message or empty string if valid
 */
export const getPhoneError = (phone, required = true) => {
  if (!phone) return required ? 'Phone number is required' : ''
  if (!isValidAustralianPhone(phone)) {
    return 'Please enter a valid Australian phone number (10 digits starting with 0)'
  }
  return ''
}

/**
 * Validate Australian postcode
 * Australian postcodes are 4 digits (0200-9999)
 * @param {string} postcode - Postcode to validate
 * @returns {boolean} True if valid postcode
 */
export const isValidPostcode = (postcode) => {
  if (!postcode) return false

  // Must be exactly 4 digits
  const postcodeRegex = /^\d{4}$/
  if (!postcodeRegex.test(postcode)) return false

  // Must be in valid range (0200-9999)
  const num = parseInt(postcode, 10)
  return num >= 200 && num <= 9999
}

/**
 * Get postcode validation error message
 * @param {string} postcode - Postcode
 * @returns {string} Error message or empty string if valid
 */
export const getPostcodeError = (postcode) => {
  if (!postcode) return 'Postcode is required'
  if (!isValidPostcode(postcode)) {
    return 'Please enter a valid 4-digit Australian postcode'
  }
  return ''
}

/**
 * Validate date of birth
 * Must be a past date and result in age between 5 and 120
 * @param {string} dateOfBirth - Date in YYYY-MM-DD format
 * @returns {boolean} True if valid date of birth
 */
export const isValidDateOfBirth = (dateOfBirth) => {
  if (!dateOfBirth) return false

  const dob = new Date(dateOfBirth)
  const today = new Date()

  // Date must be in the past
  if (dob >= today) return false

  // Calculate age
  const age = calculateAge(dateOfBirth)

  // Age must be between 5 and 120
  return age >= 5 && age <= 120
}

/**
 * Calculate age from date of birth
 * @param {string} dateOfBirth - Date in YYYY-MM-DD format
 * @returns {number} Age in years
 */
export const calculateAge = (dateOfBirth) => {
  const dob = new Date(dateOfBirth)
  const today = new Date()

  let age = today.getFullYear() - dob.getFullYear()
  const monthDiff = today.getMonth() - dob.getMonth()

  // Adjust if birthday hasn't occurred this year
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--
  }

  return age
}

/**
 * Get suggested membership type based on age
 * @param {number} age - Age in years
 * @returns {string} Suggested membership type
 */
export const getSuggestedMembershipType = (age) => {
  if (age < 18) return 'Junior'
  if (age >= 18) return 'Full'
  return 'Full'
}

/**
 * Get date of birth validation error message
 * @param {string} dateOfBirth - Date of birth
 * @returns {string} Error message or empty string if valid
 */
export const getDateOfBirthError = (dateOfBirth) => {
  if (!dateOfBirth) return 'Date of birth is required'

  const dob = new Date(dateOfBirth)
  const today = new Date()

  if (dob >= today) return 'Date of birth must be in the past'

  const age = calculateAge(dateOfBirth)

  if (age < 5) return 'Applicant must be at least 5 years old'
  if (age > 120) return 'Please enter a valid date of birth'

  return ''
}

/**
 * Validate that two fields match (e.g., email confirmation)
 * @param {string} value1 - First value
 * @param {string} value2 - Second value
 * @param {string} fieldName - Name of field for error message
 * @returns {string} Error message or empty string if valid
 */
export const getConfirmationError = (value1, value2, fieldName = 'field') => {
  if (!value2) return `Please confirm your ${fieldName}`
  if (value1 !== value2) return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}s do not match`
  return ''
}

/**
 * Validate required field
 * @param {string} value - Field value
 * @param {string} fieldName - Name of field for error message
 * @returns {string} Error message or empty string if valid
 */
export const getRequiredError = (value, fieldName) => {
  if (!value || value.trim() === '') {
    return `${fieldName} is required`
  }
  return ''
}

/**
 * Validate minimum length
 * @param {string} value - Field value
 * @param {number} minLength - Minimum length
 * @param {string} fieldName - Name of field for error message
 * @returns {string} Error message or empty string if valid
 */
export const getMinLengthError = (value, minLength, fieldName) => {
  if (!value) return ''
  if (value.trim().length < minLength) {
    return `${fieldName} must be at least ${minLength} characters`
  }
  return ''
}

/**
 * Validate Golf Link number format (optional field)
 * Golf Link numbers are typically 7-10 digits
 * @param {string} golfLinkNumber - Golf Link number
 * @returns {string} Error message or empty string if valid
 */
export const getGolfLinkError = (golfLinkNumber) => {
  if (!golfLinkNumber || golfLinkNumber.trim() === '') return '' // Optional field

  const digitsOnly = golfLinkNumber.replace(/\D/g, '')

  if (digitsOnly.length < 7 || digitsOnly.length > 10) {
    return 'Golf Link number should be 7-10 digits'
  }

  return ''
}

/**
 * Validate handicap (optional field)
 * Handicap is typically -5 to 54 for golf
 * @param {string} handicap - Handicap value
 * @returns {string} Error message or empty string if valid
 */
export const getHandicapError = (handicap) => {
  if (!handicap || handicap.trim() === '') return '' // Optional field

  const handicapNum = parseFloat(handicap)

  if (isNaN(handicapNum)) {
    return 'Please enter a valid handicap number'
  }

  if (handicapNum < -5 || handicapNum > 54) {
    return 'Handicap must be between -5 and 54'
  }

  return ''
}

/**
 * Check if field has been touched (for showing validation errors)
 * @param {Object} touchedFields - Object tracking which fields have been touched
 * @param {string} fieldName - Name of field to check
 * @returns {boolean} True if field has been touched
 */
export const isFieldTouched = (touchedFields, fieldName) => {
  return touchedFields[fieldName] === true
}

/**
 * Validate entire application form
 * @param {Object} formData - Form data object
 * @returns {Object} Object with field names as keys and error messages as values
 */
export const validateApplicationForm = (formData) => {
  const errors = {}

  // Personal Information
  if (getRequiredError(formData.fullName, 'Full name')) {
    errors.fullName = getRequiredError(formData.fullName, 'Full name')
  }

  if (getEmailError(formData.email)) {
    errors.email = getEmailError(formData.email)
  }

  if (getConfirmationError(formData.email, formData.emailConfirm, 'email')) {
    errors.emailConfirm = getConfirmationError(formData.email, formData.emailConfirm, 'email')
  }

  // Address
  if (getRequiredError(formData.streetAddress, 'Street address')) {
    errors.streetAddress = getRequiredError(formData.streetAddress, 'Street address')
  }

  if (getRequiredError(formData.suburb, 'Suburb')) {
    errors.suburb = getRequiredError(formData.suburb, 'Suburb')
  }

  if (getRequiredError(formData.state, 'State')) {
    errors.state = getRequiredError(formData.state, 'State')
  }

  if (getPostcodeError(formData.postcode)) {
    errors.postcode = getPostcodeError(formData.postcode)
  }

  // Contact
  if (getPhoneError(formData.phoneMobile, true)) {
    errors.phoneMobile = getPhoneError(formData.phoneMobile, true)
  }

  if (formData.phoneHome && getPhoneError(formData.phoneHome, false)) {
    errors.phoneHome = getPhoneError(formData.phoneHome, false)
  }

  if (formData.phoneWork && getPhoneError(formData.phoneWork, false)) {
    errors.phoneWork = getPhoneError(formData.phoneWork, false)
  }

  // Date of Birth
  if (getDateOfBirthError(formData.dateOfBirth)) {
    errors.dateOfBirth = getDateOfBirthError(formData.dateOfBirth)
  }

  // Membership Type
  if (getRequiredError(formData.membershipType, 'Membership type')) {
    errors.membershipType = getRequiredError(formData.membershipType, 'Membership type')
  }

  // Golf details (optional but validate if provided)
  if (formData.golfLinkNumber && getGolfLinkError(formData.golfLinkNumber)) {
    errors.golfLinkNumber = getGolfLinkError(formData.golfLinkNumber)
  }

  if (formData.lastHandicap && getHandicapError(formData.lastHandicap)) {
    errors.lastHandicap = getHandicapError(formData.lastHandicap)
  }

  return errors
}

/**
 * Check if form has any validation errors
 * @param {Object} errors - Errors object from validateApplicationForm
 * @returns {boolean} True if form is valid (no errors)
 */
export const isFormValid = (errors) => {
  return Object.keys(errors).length === 0
}
