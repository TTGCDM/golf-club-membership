/**
 * DEPRECATED: This file now re-exports from categoryService.js
 * Membership categories are now dynamically managed in Firestore
 * Use categoryService.js directly for all category operations
 *
 * For calculateAge, use src/utils/dateUtils.js directly
 */

import {
  getAllCategories as getCategories,
  getCategoryById as getCategory,
  determineCategoryByAge as determineCategory,
  calculateProRataFee as calculateFee
} from './categoryService'

// Re-export calculateAge from dateUtils for backward compatibility
export { calculateAge } from '../utils/dateUtils'

// Re-export for backward compatibility
export { getCategories as getAllCategories }
export { getCategory as getCategoryById }
export { determineCategory as determineCategoryByAge }
export { calculateFee as calculateProRataFee }
