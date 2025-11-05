/**
 * DEPRECATED: This file now re-exports from categoryService.js
 * Membership categories are now dynamically managed in Firestore
 * Use categoryService.js directly for all category operations
 */

import {
  getAllCategories as getCategories,
  getCategoryById as getCategory,
  determineCategoryByAge as determineCategory,
  calculateProRataFee as calculateFee
} from './categoryService'

// Calculate age from date of birth
export const calculateAge = (dateOfBirth) => {
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }

  return age
}

// Re-export for backward compatibility
export { getCategories as getAllCategories }
export { getCategory as getCategoryById }
export { determineCategory as determineCategoryByAge }
export { calculateFee as calculateProRataFee }
