import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore'
import { z } from 'zod'
import { db } from '../firebase'
import { calculateAge } from '../utils/dateUtils'

const CATEGORIES_COLLECTION = 'membershipCategories'

// Zod schema for category validation
const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  ageMin: z.number().int().min(0).max(150),
  ageMax: z.number().int().min(0).max(999),
  playingRights: z.string().max(100).default('7 days'),
  annualFee: z.number().min(0).max(100000),
  joiningFee: z.number().min(0).max(100000),
  order: z.number().int().min(0).max(1000).default(999),
  isSpecial: z.boolean().default(false),
  joiningFeeMonths: z.array(z.number().int().min(1).max(12)).default([]),
  proRataRates: z.record(z.string(), z.number().min(0)).optional()
})

/**
 * Get all membership categories
 * @returns {Array} Array of category objects
 */
export const getAllCategories = async () => {
  try {
    const q = query(collection(db, CATEGORIES_COLLECTION), orderBy('order', 'asc'))
    const querySnapshot = await getDocs(q)

    const categories = []
    querySnapshot.forEach((doc) => {
      categories.push({ id: doc.id, ...doc.data() })
    })

    return categories
  } catch (error) {
    console.error('Error getting categories:', error)
    throw error
  }
}

/**
 * Get category by ID
 * @param {string} categoryId - Category ID
 * @returns {Object} Category object
 */
export const getCategoryById = async (categoryId) => {
  try {
    const docRef = doc(db, CATEGORIES_COLLECTION, categoryId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() }
    } else {
      throw new Error('Category not found')
    }
  } catch (error) {
    console.error('Error getting category:', error)
    throw error
  }
}

/**
 * Create a new membership category
 * @param {Object} categoryData - Category data
 * @returns {Object} Created category
 */
export const createCategory = async (categoryData) => {
  try {
    // Prepare data for validation
    const dataToValidate = {
      name: categoryData.name,
      ageMin: parseInt(categoryData.ageMin),
      ageMax: parseInt(categoryData.ageMax),
      playingRights: categoryData.playingRights || '7 days',
      annualFee: parseFloat(categoryData.annualFee),
      joiningFee: parseFloat(categoryData.joiningFee),
      order: categoryData.order || 999,
      isSpecial: categoryData.isSpecial || false,
      joiningFeeMonths: categoryData.joiningFeeMonths || [],
      proRataRates: categoryData.proRataRates
    }

    // Validate with Zod
    const validation = categorySchema.safeParse(dataToValidate)
    if (!validation.success) {
      throw new Error(`Invalid category data: ${validation.error.errors[0].message}`)
    }

    const newCategory = {
      ...validation.data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }

    const docRef = await addDoc(collection(db, CATEGORIES_COLLECTION), newCategory)
    return { id: docRef.id, ...newCategory }
  } catch (error) {
    console.error('Error creating category:', error)
    throw error
  }
}

/**
 * Update a membership category
 * @param {string} categoryId - Category ID
 * @param {Object} categoryData - Updated category data
 * @returns {Object} Updated category
 */
export const updateCategory = async (categoryId, categoryData) => {
  try {
    // Prepare data for validation
    const dataToValidate = {
      name: categoryData.name,
      ageMin: parseInt(categoryData.ageMin),
      ageMax: parseInt(categoryData.ageMax),
      playingRights: categoryData.playingRights,
      annualFee: parseFloat(categoryData.annualFee),
      joiningFee: parseFloat(categoryData.joiningFee),
      order: categoryData.order,
      isSpecial: categoryData.isSpecial || false,
      joiningFeeMonths: categoryData.joiningFeeMonths || [],
      proRataRates: categoryData.proRataRates
    }

    // Validate with Zod
    const validation = categorySchema.safeParse(dataToValidate)
    if (!validation.success) {
      throw new Error(`Invalid category data: ${validation.error.errors[0].message}`)
    }

    const docRef = doc(db, CATEGORIES_COLLECTION, categoryId)
    const updatedData = {
      ...validation.data,
      updatedAt: serverTimestamp()
    }

    await updateDoc(docRef, updatedData)
    return { id: categoryId, ...updatedData }
  } catch (error) {
    console.error('Error updating category:', error)
    throw error
  }
}

/**
 * Delete a membership category
 * Only allowed if no members are using this category
 * @param {string} categoryId - Category ID to delete
 * @returns {boolean} Success
 */
export const deleteCategory = async (categoryId) => {
  try {
    // Check if any members are using this category (query directly to avoid circular import)
    const membersQuery = query(
      collection(db, 'members'),
      where('membershipCategory', '==', categoryId)
    )
    const membersSnapshot = await getDocs(membersQuery)

    if (!membersSnapshot.empty) {
      throw new Error(
        `Cannot delete category: ${membersSnapshot.size} member(s) are currently assigned to this category`
      )
    }

    const docRef = doc(db, CATEGORIES_COLLECTION, categoryId)
    await deleteDoc(docRef)
    return true
  } catch (error) {
    console.error('Error deleting category:', error)
    throw error
  }
}

/**
 * Reorder categories
 * @param {Array} categories - Array of category objects with updated order values
 * @returns {boolean} Success
 */
export const reorderCategories = async (categories) => {
  try {
    const batch = writeBatch(db)

    categories.forEach((category, index) => {
      const docRef = doc(db, CATEGORIES_COLLECTION, category.id)
      batch.update(docRef, { order: index + 1, updatedAt: serverTimestamp() })
    })

    await batch.commit()
    return true
  } catch (error) {
    console.error('Error reordering categories:', error)
    throw error
  }
}

/**
 * Seed default membership categories
 * Should only be run once on initial setup
 * @returns {Object} Results with counts
 */
export const seedDefaultCategories = async () => {
  try {
    // Check if categories already exist
    const existing = await getAllCategories()
    if (existing.length > 0) {
      return {
        success: false,
        message: 'Categories already exist',
        count: existing.length
      }
    }

    const defaultCategories = [
      {
        name: 'Junior 10-12 years',
        ageMin: 10,
        ageMax: 12,
        playingRights: '7 days',
        annualFee: 50,
        joiningFee: 0,
        order: 1,
        isSpecial: false,
        joiningFeeMonths: [],
        proRataRates: generateDefaultProRataRates(50)
      },
      {
        name: 'Junior 13-15 years',
        ageMin: 13,
        ageMax: 15,
        playingRights: '7 days',
        annualFee: 120,
        joiningFee: 0,
        order: 2,
        isSpecial: false,
        joiningFeeMonths: [],
        proRataRates: generateDefaultProRataRates(120)
      },
      {
        name: 'Junior 16-18 years',
        ageMin: 16,
        ageMax: 18,
        playingRights: '7 days',
        annualFee: 180,
        joiningFee: 0,
        order: 3,
        isSpecial: false,
        joiningFeeMonths: [],
        proRataRates: generateDefaultProRataRates(180)
      },
      {
        name: 'Colts',
        ageMin: 19,
        ageMax: 23,
        playingRights: '7 days',
        annualFee: 300,
        joiningFee: 50,
        order: 4,
        isSpecial: false,
        joiningFeeMonths: [8, 9, 10, 11, 12],
        proRataRates: generateDefaultProRataRates(300)
      },
      {
        name: 'Full Membership',
        ageMin: 24,
        ageMax: 64,
        playingRights: '7 days',
        annualFee: 480,
        joiningFee: 25,
        order: 5,
        isSpecial: false,
        joiningFeeMonths: [],
        proRataRates: generateDefaultProRataRates(480)
      },
      {
        name: 'Senior Full Membership',
        ageMin: 65,
        ageMax: 74,
        playingRights: '7 days',
        annualFee: 435,
        joiningFee: 25,
        order: 6,
        isSpecial: false,
        joiningFeeMonths: [],
        proRataRates: generateDefaultProRataRates(435)
      },
      {
        name: 'Life & Honorary Members',
        ageMin: 75,
        ageMax: 999,
        playingRights: '7 days',
        annualFee: 75,
        joiningFee: 0,
        order: 7,
        isSpecial: false,
        joiningFeeMonths: [],
        proRataRates: generateDefaultProRataRates(75)
      },
      {
        name: 'Non-playing/Social',
        ageMin: 0,
        ageMax: 999,
        playingRights: 'None',
        annualFee: 40,
        joiningFee: 25,
        order: 8,
        isSpecial: true,
        joiningFeeMonths: [],
        proRataRates: generateDefaultProRataRates(40)
      }
    ]

    const batch = writeBatch(db)
    let count = 0

    defaultCategories.forEach((category) => {
      const docRef = doc(collection(db, CATEGORIES_COLLECTION))
      batch.set(docRef, {
        ...category,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      count++
    })

    await batch.commit()

    return {
      success: true,
      message: `Successfully seeded ${count} default categories`,
      count
    }
  } catch (error) {
    console.error('Error seeding categories:', error)
    throw error
  }
}

/**
 * Determine membership category based on age
 * Finds the appropriate category for given date of birth
 * @param {string} dateOfBirth - Date of birth in YYYY-MM-DD format
 * @returns {string} Category ID
 */
export const determineCategoryByAge = async (dateOfBirth) => {
  try {
    // Calculate age using utility function
    const age = calculateAge(dateOfBirth)

    // Get all categories (excluding special ones)
    const categories = await getAllCategories()

    // Find matching category
    for (const category of categories) {
      if (category.isSpecial) continue

      if (age >= category.ageMin && age <= category.ageMax) {
        return category.id
      }
    }

    // Fallback: return Full Membership category
    const fullCategory = categories.find(c => c.name.includes('Full Membership'))
    return fullCategory ? fullCategory.id : categories[0]?.id
  } catch (error) {
    console.error('Error determining category:', error)
    throw error
  }
}

/**
 * Calculate the default pro-rata rate for a given month using formula
 * Membership year: March (3) = 12 months, February (2) = 1 month
 * @param {number} annualFee - Annual fee amount
 * @param {number} month - Calendar month (1-12)
 * @returns {number} Calculated rate
 */
export const calculateDefaultProRataRate = (annualFee, month) => {
  // March=12 months, April=11, ..., Feb=1
  const monthsRemaining = month <= 2
    ? 3 - month  // Jan=2, Feb=1
    : 15 - month // Mar=12, Apr=11, May=10, Jun=9, Jul=8, Aug=7, Sep=6, Oct=5, Nov=4, Dec=3
  return Math.round((monthsRemaining / 12) * annualFee)
}

/**
 * Generate default pro-rata rates for all 12 months
 * @param {number} annualFee - Annual fee amount
 * @returns {Object} Object with month keys (1-12) and calculated rates
 */
export const generateDefaultProRataRates = (annualFee) => {
  const rates = {}
  for (let month = 1; month <= 12; month++) {
    rates[String(month)] = calculateDefaultProRataRate(annualFee, month)
  }
  return rates
}

/**
 * Update pro-rata rates for a category
 * @param {string} categoryId - Category ID
 * @param {Object} proRataRates - Object with month keys (1-12) and rate values
 * @returns {Object} Updated rates
 */
export const updateProRataRates = async (categoryId, proRataRates) => {
  try {
    // Validate and clean rates
    const validatedRates = {}
    for (let month = 1; month <= 12; month++) {
      const key = String(month)
      if (proRataRates[key] !== undefined) {
        const rate = parseFloat(proRataRates[key])
        if (!isNaN(rate) && rate >= 0) {
          validatedRates[key] = rate
        }
      }
    }

    const docRef = doc(db, CATEGORIES_COLLECTION, categoryId)
    await updateDoc(docRef, {
      proRataRates: validatedRates,
      updatedAt: serverTimestamp()
    })

    return { id: categoryId, proRataRates: validatedRates }
  } catch (error) {
    console.error('Error updating pro-rata rates:', error)
    throw error
  }
}

/**
 * Reset pro-rata rates to calculated defaults for a category
 * @param {string} categoryId - Category ID
 * @returns {Object} Generated default rates
 */
export const resetProRataRates = async (categoryId) => {
  try {
    const category = await getCategoryById(categoryId)
    if (!category) throw new Error('Category not found')

    const defaultRates = generateDefaultProRataRates(category.annualFee)
    await updateProRataRates(categoryId, defaultRates)
    return defaultRates
  } catch (error) {
    console.error('Error resetting pro-rata rates:', error)
    throw error
  }
}

/**
 * Calculate pro-rata fee synchronously without database lookup
 * For use in public forms where categories are already loaded
 * @param {Object} category - Category object with proRataRates and joiningFee
 * @param {Date} joiningDate - Date for calculation (defaults to today)
 * @returns {Object} { proRataSubscription, joiningFee, total, monthsRemaining, currentMonth }
 */
export const calculateProRataFeeSync = (category, joiningDate = new Date()) => {
  if (!category) {
    return { proRataSubscription: 0, joiningFee: 0, total: 0, monthsRemaining: 0, currentMonth: 0 }
  }

  const month = joiningDate.getMonth() + 1 // 1-12
  const monthKey = String(month)

  // Calculate months remaining in membership year (March-February)
  const monthsRemaining = month <= 2 ? 3 - month : 15 - month

  // Get pro-rata subscription from stored rates or calculate
  let proRataSubscription
  if (category.proRataRates?.[monthKey] !== undefined) {
    proRataSubscription = category.proRataRates[monthKey]
  } else {
    proRataSubscription = calculateDefaultProRataRate(category.annualFee, month)
  }

  // Check if joining fee applies this month
  let joiningFee = 0
  if (category.joiningFee > 0) {
    if (category.joiningFeeMonths?.length > 0) {
      // Only apply if current month is in the list
      joiningFee = category.joiningFeeMonths.includes(month) ? category.joiningFee : 0
    } else {
      // No month restrictions = applies year-round
      joiningFee = category.joiningFee
    }
  }

  return {
    proRataSubscription,
    joiningFee,
    total: proRataSubscription + joiningFee,
    monthsRemaining,
    currentMonth: month
  }
}

/**
 * Find suggested category by age from loaded categories array
 * Synchronous version for use in forms
 * @param {Array} categories - Array of loaded category objects
 * @param {number} age - Applicant's age
 * @returns {Object|null} Suggested category or null
 */
export const findCategoryByAge = (categories, age) => {
  if (!categories || !Array.isArray(categories) || age === null || age === undefined) {
    return null
  }

  // Find first non-special category matching age range
  return categories.find(cat =>
    !cat.isSpecial &&
    age >= cat.ageMin &&
    age <= cat.ageMax
  ) || null
}

/**
 * Calculate pro-rata subscription for new members
 * Uses stored rates if available, falls back to formula
 * @param {string} categoryId - Category ID
 * @param {string} joiningDate - Joining date
 * @returns {number} Calculated fee (subscription + joining fee)
 */
export const calculateProRataFee = async (categoryId, joiningDate) => {
  try {
    const category = await getCategoryById(categoryId)
    if (!category) return 0

    const month = new Date(joiningDate).getMonth() + 1 // 1-12
    const monthKey = String(month)

    // Lookup rate from stored proRataRates, fallback to formula
    let proRataSubscription
    if (category.proRataRates?.[monthKey] !== undefined) {
      proRataSubscription = category.proRataRates[monthKey]
    } else {
      proRataSubscription = calculateDefaultProRataRate(category.annualFee, month)
    }

    // Add flat joining fee
    return proRataSubscription + (category.joiningFee || 0)
  } catch (error) {
    console.error('Error calculating pro-rata fee:', error)
    return 0
  }
}
