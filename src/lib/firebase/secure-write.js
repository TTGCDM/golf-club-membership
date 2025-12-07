import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../../firebase'
import { validateUserInput } from '../validation/schemas'

/**
 * Secure Firestore Write Operations
 *
 * All writes are validated with Zod schemas before reaching Firestore.
 * Validation failures are logged for security monitoring.
 */

// Security log for monitoring validation failures
const securityLog = []
const MAX_LOG_SIZE = 100

/**
 * Log security event (validation failure)
 * In production, this should send to a logging service
 */
function logSecurityEvent(event) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    ...event,
  }

  // Add to in-memory log (for development)
  securityLog.push(logEntry)
  if (securityLog.length > MAX_LOG_SIZE) {
    securityLog.shift()
  }

  // Console warning for development
  if (import.meta.env.DEV) {
    console.warn('[SECURITY] Validation failure:', logEntry)
  }

  // In production, send to logging service
  // TODO: Integrate with your logging service (e.g., Sentry, LogRocket)
}

/**
 * Get recent security log entries
 * @returns {Array} Recent security events
 */
export function getSecurityLog() {
  return [...securityLog]
}

/**
 * Secure document creation with validation
 * @param {string} collectionName - Firestore collection name
 * @param {Object} data - Document data
 * @param {z.ZodSchema} schema - Zod schema for validation
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Created document with ID
 * @throws {Error} If validation fails or write fails
 */
export async function secureAddDoc(collectionName, data, schema, options = {}) {
  const { userId = null, addTimestamps = true } = options

  // Validate input
  const validation = validateUserInput(data, schema)
  if (!validation.success) {
    logSecurityEvent({
      type: 'VALIDATION_FAILURE',
      operation: 'addDoc',
      collection: collectionName,
      userId,
      error: validation.error,
      fields: validation.errors?.fieldErrors,
    })
    throw new Error(`Validation failed: ${validation.error}`)
  }

  // Prepare document with timestamps
  const docData = {
    ...validation.data,
    ...(addTimestamps && {
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  }

  try {
    const docRef = await addDoc(collection(db, collectionName), docData)
    return { id: docRef.id, ...docData }
  } catch (error) {
    logSecurityEvent({
      type: 'WRITE_FAILURE',
      operation: 'addDoc',
      collection: collectionName,
      userId,
      error: error.message,
    })
    throw error
  }
}

/**
 * Secure document update with validation
 * @param {string} collectionName - Firestore collection name
 * @param {string} docId - Document ID
 * @param {Object} data - Update data
 * @param {z.ZodSchema} schema - Zod schema for validation (can be partial)
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Updated data
 * @throws {Error} If validation fails or write fails
 */
export async function secureUpdateDoc(collectionName, docId, data, schema, options = {}) {
  const { userId = null, addTimestamp = true } = options

  // Validate input
  const validation = validateUserInput(data, schema)
  if (!validation.success) {
    logSecurityEvent({
      type: 'VALIDATION_FAILURE',
      operation: 'updateDoc',
      collection: collectionName,
      documentId: docId,
      userId,
      error: validation.error,
      fields: validation.errors?.fieldErrors,
    })
    throw new Error(`Validation failed: ${validation.error}`)
  }

  // Prepare update with timestamp
  const updateData = {
    ...validation.data,
    ...(addTimestamp && { updatedAt: serverTimestamp() }),
  }

  try {
    const docRef = doc(db, collectionName, docId)
    await updateDoc(docRef, updateData)
    return { id: docId, ...updateData }
  } catch (error) {
    logSecurityEvent({
      type: 'WRITE_FAILURE',
      operation: 'updateDoc',
      collection: collectionName,
      documentId: docId,
      userId,
      error: error.message,
    })
    throw error
  }
}

/**
 * Secure document set (create or overwrite) with validation
 * @param {string} collectionName - Firestore collection name
 * @param {string} docId - Document ID
 * @param {Object} data - Document data
 * @param {z.ZodSchema} schema - Zod schema for validation
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Set data
 * @throws {Error} If validation fails or write fails
 */
export async function secureSetDoc(collectionName, docId, data, schema, options = {}) {
  const { userId = null, merge = false, addTimestamps = true } = options

  // Validate input
  const validation = validateUserInput(data, schema)
  if (!validation.success) {
    logSecurityEvent({
      type: 'VALIDATION_FAILURE',
      operation: 'setDoc',
      collection: collectionName,
      documentId: docId,
      userId,
      error: validation.error,
      fields: validation.errors?.fieldErrors,
    })
    throw new Error(`Validation failed: ${validation.error}`)
  }

  // Prepare document with timestamps
  const docData = {
    ...validation.data,
    ...(addTimestamps && {
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  }

  try {
    const docRef = doc(db, collectionName, docId)
    await setDoc(docRef, docData, { merge })
    return { id: docId, ...docData }
  } catch (error) {
    logSecurityEvent({
      type: 'WRITE_FAILURE',
      operation: 'setDoc',
      collection: collectionName,
      documentId: docId,
      userId,
      error: error.message,
    })
    throw error
  }
}

/**
 * Secure transaction with validation
 * Validates all data before any writes occur
 * @param {Function} transactionFn - Transaction function that receives validated data
 * @param {Array<Object>} validations - Array of { data, schema, name } objects to validate
 * @param {Object} options - Additional options
 * @returns {Promise<any>} Transaction result
 * @throws {Error} If validation fails or transaction fails
 */
export async function secureTransaction(transactionFn, validations, options = {}) {
  const { userId = null } = options

  // Validate all data upfront before starting transaction
  const validatedData = {}
  for (const { data, schema, name } of validations) {
    const validation = validateUserInput(data, schema)
    if (!validation.success) {
      logSecurityEvent({
        type: 'VALIDATION_FAILURE',
        operation: 'transaction',
        validationName: name,
        userId,
        error: validation.error,
        fields: validation.errors?.fieldErrors,
      })
      throw new Error(`Validation failed for ${name}: ${validation.error}`)
    }
    validatedData[name] = validation.data
  }

  try {
    return await runTransaction(db, (transaction) =>
      transactionFn(transaction, validatedData)
    )
  } catch (error) {
    logSecurityEvent({
      type: 'TRANSACTION_FAILURE',
      operation: 'transaction',
      userId,
      error: error.message,
    })
    throw error
  }
}

/**
 * Secure document deletion
 * Logs the deletion for audit trail
 * @param {string} collectionName - Firestore collection name
 * @param {string} docId - Document ID
 * @param {Object} options - Additional options
 * @returns {Promise<void>}
 * @throws {Error} If deletion fails
 */
export async function secureDeleteDoc(collectionName, docId, options = {}) {
  const { userId = null, softDelete = false, softDeleteField = 'status' } = options

  try {
    const docRef = doc(db, collectionName, docId)

    if (softDelete) {
      // Soft delete - set status to inactive/deleted
      await updateDoc(docRef, {
        [softDeleteField]: 'deleted',
        deletedAt: serverTimestamp(),
        deletedBy: userId,
      })
    } else {
      // Hard delete
      await deleteDoc(docRef)
    }

    // Log deletion for audit
    logSecurityEvent({
      type: 'DOCUMENT_DELETED',
      operation: softDelete ? 'softDelete' : 'hardDelete',
      collection: collectionName,
      documentId: docId,
      userId,
    })
  } catch (error) {
    logSecurityEvent({
      type: 'DELETE_FAILURE',
      operation: 'deleteDoc',
      collection: collectionName,
      documentId: docId,
      userId,
      error: error.message,
    })
    throw error
  }
}

/**
 * Validate data against schema without writing
 * Useful for form validation before submission
 * @param {Object} data - Data to validate
 * @param {z.ZodSchema} schema - Zod schema
 * @returns {Object} { success: boolean, data?: validatedData, error?: string }
 */
export function validateOnly(data, schema) {
  return validateUserInput(data, schema)
}

export default {
  secureAddDoc,
  secureUpdateDoc,
  secureSetDoc,
  secureTransaction,
  secureDeleteDoc,
  validateOnly,
  getSecurityLog,
}
