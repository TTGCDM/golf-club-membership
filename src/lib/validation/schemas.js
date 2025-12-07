import { z } from 'zod'

/**
 * Security-focused Zod schemas
 * Base schemas for common patterns with security considerations
 */

// Maximum string lengths for various field types
export const MAX_LENGTHS = {
  SHORT: 100,      // Names, titles
  MEDIUM: 255,     // Emails, addresses
  LONG: 1000,      // Notes, descriptions
  TEXT: 5000,      // Large text fields
  MAX: 10000,      // Maximum allowed
}

/**
 * Dangerous HTML/script patterns to detect
 * Used for XSS prevention
 */
const DANGEROUS_PATTERNS = [
  /<script\b/i,
  /javascript:/i,
  /on\w+\s*=/i,      // onclick=, onerror=, etc.
  /data:\s*text\/html/i,
  /<iframe\b/i,
  /<object\b/i,
  /<embed\b/i,
  /<form\b/i,
  /expression\s*\(/i, // CSS expression()
  /url\s*\(\s*["']?\s*data:/i, // data: URLs in CSS
]

/**
 * Check if string contains dangerous patterns
 * @param {string} value - String to check
 * @returns {boolean} True if dangerous patterns found
 */
function containsDangerousPatterns(value) {
  if (!value || typeof value !== 'string') return false
  return DANGEROUS_PATTERNS.some((pattern) => pattern.test(value))
}

/**
 * Strip HTML tags from string (basic sanitization)
 * @param {string} value - String to sanitize
 * @returns {string} Sanitized string
 */
function stripHtmlTags(value) {
  if (!value || typeof value !== 'string') return value
  return value.replace(/<[^>]*>/g, '')
}

/**
 * Escape HTML entities
 * @param {string} value - String to escape
 * @returns {string} Escaped string
 */
export function escapeHtml(value) {
  if (!value || typeof value !== 'string') return value
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Safe string schema with XSS protection
 * Strips HTML and limits length
 */
export const safeString = (maxLength = MAX_LENGTHS.MEDIUM) =>
  z
    .string()
    .max(maxLength, `Maximum ${maxLength} characters allowed`)
    .transform(stripHtmlTags)
    .refine(
      (val) => !containsDangerousPatterns(val),
      'Input contains potentially dangerous content'
    )

/**
 * Safe string schema that's required (non-empty)
 */
export const safeRequiredString = (fieldName, maxLength = MAX_LENGTHS.MEDIUM) =>
  z
    .string()
    .min(1, `${fieldName} is required`)
    .max(maxLength, `Maximum ${maxLength} characters allowed`)
    .transform(stripHtmlTags)
    .refine(
      (val) => !containsDangerousPatterns(val),
      'Input contains potentially dangerous content'
    )

/**
 * Safe optional string - allows empty string or undefined
 */
export const safeOptionalString = (maxLength = MAX_LENGTHS.MEDIUM) =>
  z
    .string()
    .max(maxLength, `Maximum ${maxLength} characters allowed`)
    .transform((val) => (val ? stripHtmlTags(val) : val))
    .optional()
    .or(z.literal(''))

/**
 * Safe email schema
 */
export const safeEmail = z
  .string()
  .min(1, 'Email is required')
  .max(MAX_LENGTHS.MEDIUM)
  .email('Invalid email address')
  .transform((val) => val.toLowerCase().trim())
  .refine(
    (val) => !containsDangerousPatterns(val),
    'Invalid email format'
  )

/**
 * Safe UUID schema
 */
export const safeUuid = z
  .string()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    'Invalid UUID format'
  )

/**
 * Firestore document ID schema
 * Firestore IDs are 20 alphanumeric characters
 */
export const firestoreId = z
  .string()
  .min(1, 'Document ID is required')
  .max(128, 'Document ID too long')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid document ID format')

/**
 * Safe number schema with bounds
 */
export const safeNumber = (min = -1000000, max = 1000000) =>
  z
    .number()
    .min(min, `Minimum value is ${min}`)
    .max(max, `Maximum value is ${max}`)
    .finite('Must be a finite number')

/**
 * Safe positive number
 */
export const safePositiveNumber = (max = 1000000) =>
  z
    .number()
    .positive('Must be a positive number')
    .max(max, `Maximum value is ${max}`)
    .finite('Must be a finite number')

/**
 * Safe date string (YYYY-MM-DD format)
 */
export const safeDateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .refine(
    (val) => {
      const date = new Date(val)
      return !isNaN(date.getTime())
    },
    'Invalid date'
  )

/**
 * Safe timestamp (Unix milliseconds or Date)
 */
export const safeTimestamp = z.union([
  z.date(),
  z.number().int().positive().max(Date.now() + 86400000 * 365 * 100), // Max 100 years in future
])

/**
 * Safe URL schema
 */
export const safeUrl = z
  .string()
  .url('Invalid URL')
  .max(2000, 'URL too long')
  .refine(
    (val) => val.startsWith('https://') || val.startsWith('http://'),
    'URL must use http or https protocol'
  )

/**
 * Safe phone number (Australian format)
 */
export const safePhone = z
  .string()
  .transform((val) => val.replace(/\D/g, '')) // Strip non-digits
  .refine(
    (val) => val === '' || (val.length === 10 && val.startsWith('0')),
    'Phone must be 10 digits starting with 0'
  )

/**
 * Safe JSON object with depth limit
 * Prevents deeply nested objects that could cause issues
 */
export const safeJsonObject = (maxDepth = 5) => {
  const checkDepth = (obj, depth = 0) => {
    if (depth > maxDepth) return false
    if (typeof obj !== 'object' || obj === null) return true
    return Object.values(obj).every((val) => checkDepth(val, depth + 1))
  }

  return z.record(z.unknown()).refine(
    (val) => checkDepth(val),
    `Object nesting exceeds maximum depth of ${maxDepth}`
  )
}

/**
 * Validate and sanitize user input for Firestore
 * @param {Object} data - Raw user input
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @returns {Object} { success: boolean, data?: validatedData, error?: string }
 */
export function validateUserInput(data, schema) {
  try {
    const result = schema.safeParse(data)

    if (!result.success) {
      const firstError = result.error.errors[0]
      const field = firstError.path.join('.')
      return {
        success: false,
        error: field ? `${field}: ${firstError.message}` : firstError.message,
        errors: result.error.flatten(),
      }
    }

    return {
      success: true,
      data: result.data,
    }
  } catch (err) {
    return {
      success: false,
      error: 'Validation error: ' + err.message,
    }
  }
}

// Export all schemas
export default {
  MAX_LENGTHS,
  safeString,
  safeRequiredString,
  safeOptionalString,
  safeEmail,
  safeUuid,
  firestoreId,
  safeNumber,
  safePositiveNumber,
  safeDateString,
  safeTimestamp,
  safeUrl,
  safePhone,
  safeJsonObject,
  validateUserInput,
  escapeHtml,
}
