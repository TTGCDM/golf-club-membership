import { z } from 'zod'

/**
 * Environment Variable Validation
 * Validates all environment variables at build time using Zod
 * Separates public (VITE_*) from server-only variables
 */

// Public environment variables (exposed to client via VITE_ prefix)
const publicEnvSchema = z.object({
  VITE_FIREBASE_API_KEY: z
    .string()
    .min(1, 'Firebase API key is required')
    .refine(
      (val) => val !== 'your_api_key_here',
      'Firebase API key must be configured (not placeholder value)'
    ),
  VITE_FIREBASE_AUTH_DOMAIN: z
    .string()
    .min(1, 'Firebase auth domain is required')
    .refine(
      (val) => val.endsWith('.firebaseapp.com'),
      'Auth domain must end with .firebaseapp.com'
    ),
  VITE_FIREBASE_PROJECT_ID: z
    .string()
    .min(1, 'Firebase project ID is required')
    .refine(
      (val) => val !== 'your_project_id',
      'Firebase project ID must be configured'
    ),
  VITE_FIREBASE_STORAGE_BUCKET: z
    .string()
    .min(1, 'Firebase storage bucket is required')
    .refine(
      (val) => val.endsWith('.appspot.com'),
      'Storage bucket must end with .appspot.com'
    ),
  VITE_FIREBASE_MESSAGING_SENDER_ID: z
    .string()
    .min(1, 'Firebase messaging sender ID is required')
    .regex(/^\d+$/, 'Messaging sender ID must be numeric'),
  VITE_FIREBASE_APP_ID: z
    .string()
    .min(1, 'Firebase app ID is required')
    .regex(/^[\w:]+$/, 'Invalid Firebase app ID format'),
  VITE_RECAPTCHA_SITE_KEY: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length >= 20,
      'reCAPTCHA site key appears invalid'
    ),
  VITE_USE_EMULATORS: z.enum(['true', 'false']).optional(),
})

// Optional server-only variables (for Cloud Functions)
const serverEnvSchema = z.object({
  SENDGRID_API_KEY: z.string().optional(),
  RECAPTCHA_SECRET_KEY: z.string().optional(),
})

/**
 * Validates public environment variables
 * Call this at application startup
 * @throws {Error} If required variables are missing or invalid
 */
export function validateEnv() {
  const env = {
    VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
    VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    VITE_FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    VITE_FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID,
    VITE_RECAPTCHA_SITE_KEY: import.meta.env.VITE_RECAPTCHA_SITE_KEY,
    VITE_USE_EMULATORS: import.meta.env.VITE_USE_EMULATORS,
  }

  const result = publicEnvSchema.safeParse(env)

  if (!result.success) {
    const errors = result.error.flatten()
    const errorMessages = Object.entries(errors.fieldErrors)
      .map(([field, messages]) => `  ${field}: ${messages.join(', ')}`)
      .join('\n')

    const errorText = `
================================================================================
ENVIRONMENT CONFIGURATION ERROR
================================================================================
Missing or invalid environment variables detected:

${errorMessages}

To fix this:
1. Copy .env.example to .env
2. Fill in all required values from your Firebase Console
3. Restart the development server

For production, ensure all VITE_* variables are set in your deployment platform.
================================================================================
`
    console.error(errorText)

    // In development, throw to prevent app from running with bad config
    if (import.meta.env.DEV) {
      throw new Error('Environment validation failed. Check console for details.')
    }
  }

  return result.success
}

/**
 * Get validated environment variable
 * @param {string} key - Environment variable key
 * @returns {string} The environment variable value
 * @throws {Error} If variable is not defined
 */
export function getEnv(key) {
  const value = import.meta.env[key]
  if (value === undefined || value === '') {
    throw new Error(`Environment variable ${key} is not defined`)
  }
  return value
}

/**
 * Safe check if environment variable exists
 * @param {string} key - Environment variable key
 * @returns {boolean} Whether the variable exists and has a value
 */
export function hasEnv(key) {
  const value = import.meta.env[key]
  return value !== undefined && value !== ''
}

/**
 * Get environment variable with fallback
 * @param {string} key - Environment variable key
 * @param {string} fallback - Fallback value if not defined
 * @returns {string} The environment variable value or fallback
 */
export function getEnvOrDefault(key, fallback) {
  const value = import.meta.env[key]
  return value !== undefined && value !== '' ? value : fallback
}

// Export schemas for testing
export { publicEnvSchema, serverEnvSchema }
