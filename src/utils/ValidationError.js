/**
 * ValidationError
 * Custom error class for Zod validation failures
 * Used in service layer to provide consistent error handling
 */

export class ValidationError extends Error {
  constructor(zodError) {
    super('Validation failed')
    this.name = 'ValidationError'

    // Flatten Zod error for easier access
    if (zodError && typeof zodError === 'object') {
      // Handle ZodError.flatten() format
      if (zodError.fieldErrors) {
        this.fieldErrors = zodError.fieldErrors
        this.formErrors = zodError.formErrors || []
      }
      // Handle raw ZodError
      else if (zodError.errors) {
        this.fieldErrors = {}
        this.formErrors = []

        zodError.errors.forEach((err) => {
          if (err.path && err.path.length > 0) {
            const field = err.path.join('.')
            if (!this.fieldErrors[field]) {
              this.fieldErrors[field] = []
            }
            this.fieldErrors[field].push(err.message)
          } else {
            this.formErrors.push(err.message)
          }
        })
      }
      // Handle already flattened format
      else {
        this.fieldErrors = zodError
        this.formErrors = []
      }
    } else {
      this.fieldErrors = {}
      this.formErrors = []
    }
  }

  /**
   * Get all error messages as a flat array
   */
  getAllMessages() {
    const messages = [...this.formErrors]
    Object.values(this.fieldErrors).forEach((fieldMessages) => {
      messages.push(...fieldMessages)
    })
    return messages
  }

  /**
   * Get first error message (useful for simple error display)
   */
  getFirstMessage() {
    if (this.formErrors.length > 0) {
      return this.formErrors[0]
    }
    const firstField = Object.keys(this.fieldErrors)[0]
    if (firstField && this.fieldErrors[firstField].length > 0) {
      return this.fieldErrors[firstField][0]
    }
    return 'Validation failed'
  }

  /**
   * Get error for a specific field
   */
  getFieldError(fieldName) {
    return this.fieldErrors[fieldName]?.[0] || null
  }

  /**
   * Check if a specific field has an error
   */
  hasFieldError(fieldName) {
    return this.fieldErrors[fieldName]?.length > 0
  }

  /**
   * Convert to plain object for JSON serialization
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      fieldErrors: this.fieldErrors,
      formErrors: this.formErrors,
    }
  }
}

/**
 * Helper to check if an error is a ValidationError
 */
export const isValidationError = (error) => {
  return error instanceof ValidationError || error?.name === 'ValidationError'
}

/**
 * Helper to create ValidationError from Zod safeParse result
 */
export const createValidationError = (result) => {
  if (result.success) {
    return null
  }
  return new ValidationError(result.error.flatten())
}
