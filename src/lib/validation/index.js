/**
 * Validation Utilities Index
 * Re-exports all validation functions and schemas
 */

// Environment validation
export {
  validateEnv,
  getEnv,
  hasEnv,
  getEnvOrDefault,
  publicEnvSchema,
  serverEnvSchema,
} from './env'

// Security-focused schemas
export {
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
} from './schemas'
