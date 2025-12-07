import { toast } from 'sonner'

/**
 * Centralized error handling utility
 * Maps various error types to user-friendly messages and shows toast notifications
 */

// Error type constants
export const ErrorTypes = {
  VALIDATION: 'validation',
  PERMISSION: 'permission',
  NOT_FOUND: 'not_found',
  NETWORK: 'network',
  FIREBASE: 'firebase',
  UNKNOWN: 'unknown'
}

/**
 * Parse an error and return a structured error object
 * @param {Error} error - The error to parse
 * @returns {{ type: string, message: string, details?: object }}
 */
export const parseError = (error) => {
  // Handle ValidationError from Zod schemas
  if (error.name === 'ValidationError') {
    const firstMessage = error.getFirstMessage?.() || 'Validation failed'
    return {
      type: ErrorTypes.VALIDATION,
      message: firstMessage,
      details: error.errors
    }
  }

  // Handle Firebase errors
  if (error.code) {
    switch (error.code) {
      case 'permission-denied':
        return {
          type: ErrorTypes.PERMISSION,
          message: 'You do not have permission to perform this action'
        }
      case 'not-found':
        return {
          type: ErrorTypes.NOT_FOUND,
          message: 'The requested resource was not found'
        }
      case 'unavailable':
      case 'network-request-failed':
        return {
          type: ErrorTypes.NETWORK,
          message: 'Network error. Please check your connection and try again'
        }
      case 'unauthenticated':
        return {
          type: ErrorTypes.PERMISSION,
          message: 'Please sign in to continue'
        }
      case 'already-exists':
        return {
          type: ErrorTypes.VALIDATION,
          message: 'This record already exists'
        }
      case 'failed-precondition':
        return {
          type: ErrorTypes.FIREBASE,
          message: 'Operation failed. The data may have been modified by another user'
        }
      case 'aborted':
        return {
          type: ErrorTypes.FIREBASE,
          message: 'Operation was cancelled. Please try again'
        }
      default:
        // Other Firebase errors
        return {
          type: ErrorTypes.FIREBASE,
          message: error.message || 'An error occurred'
        }
    }
  }

  // Handle standard JavaScript errors
  if (error.message) {
    // Check for common error patterns
    if (error.message.includes('Member not found')) {
      return {
        type: ErrorTypes.NOT_FOUND,
        message: 'Member not found'
      }
    }
    if (error.message.includes('Payment not found')) {
      return {
        type: ErrorTypes.NOT_FOUND,
        message: 'Payment not found'
      }
    }
    if (error.message.includes('network') || error.message.includes('Network')) {
      return {
        type: ErrorTypes.NETWORK,
        message: 'Network error. Please check your connection'
      }
    }

    return {
      type: ErrorTypes.UNKNOWN,
      message: error.message
    }
  }

  // Fallback for unknown errors
  return {
    type: ErrorTypes.UNKNOWN,
    message: 'An unexpected error occurred'
  }
}

/**
 * Handle an error by parsing it and showing a toast notification
 * @param {Error} error - The error to handle
 * @param {string} [context] - Optional context to prepend to error message
 * @returns {{ type: string, message: string }}
 */
export const handleError = (error, context) => {
  const parsed = parseError(error)

  // Log error for debugging (in development)
  if (import.meta.env.DEV) {
    console.error(`[${parsed.type}]`, context || '', error)
  }

  // Show toast notification
  const message = context ? `${context}: ${parsed.message}` : parsed.message

  switch (parsed.type) {
    case ErrorTypes.VALIDATION:
      toast.error(message, { duration: 5000 })
      break
    case ErrorTypes.PERMISSION:
      toast.error(message, { duration: 5000 })
      break
    case ErrorTypes.NOT_FOUND:
      toast.error(message, { duration: 4000 })
      break
    case ErrorTypes.NETWORK:
      toast.error(message, {
        duration: 6000,
        action: {
          label: 'Retry',
          onClick: () => window.location.reload()
        }
      })
      break
    default:
      toast.error(message, { duration: 4000 })
  }

  return parsed
}

/**
 * Show a success toast notification
 * @param {string} message - The success message
 */
export const showSuccess = (message) => {
  toast.success(message, { duration: 3000 })
}

/**
 * Show an info toast notification
 * @param {string} message - The info message
 */
export const showInfo = (message) => {
  toast.info(message, { duration: 3000 })
}

/**
 * Show a warning toast notification
 * @param {string} message - The warning message
 */
export const showWarning = (message) => {
  toast.warning(message, { duration: 4000 })
}

/**
 * Show a loading toast that can be updated
 * @param {string} message - The loading message
 * @returns {string|number} Toast ID for updating
 */
export const showLoading = (message) => {
  return toast.loading(message)
}

/**
 * Dismiss a toast by ID
 * @param {string|number} toastId - The toast ID to dismiss
 */
export const dismissToast = (toastId) => {
  toast.dismiss(toastId)
}

/**
 * Update a loading toast to success
 * @param {string|number} toastId - The toast ID to update
 * @param {string} message - The success message
 */
export const updateToastSuccess = (toastId, message) => {
  toast.success(message, { id: toastId, duration: 3000 })
}

/**
 * Update a loading toast to error
 * @param {string|number} toastId - The toast ID to update
 * @param {string} message - The error message
 */
export const updateToastError = (toastId, message) => {
  toast.error(message, { id: toastId, duration: 4000 })
}

export default {
  parseError,
  handleError,
  showSuccess,
  showInfo,
  showWarning,
  showLoading,
  dismissToast,
  updateToastSuccess,
  updateToastError,
  ErrorTypes
}
