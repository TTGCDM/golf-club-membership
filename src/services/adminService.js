import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  writeBatch
} from 'firebase/firestore'
import { db } from '../firebase'

const MEMBERS_COLLECTION = 'members'
const PAYMENTS_COLLECTION = 'payments'
const USERS_COLLECTION = 'users'

/**
 * Clear all data from a specific collection
 * @param {string} collectionName - Name of the collection to clear
 * @param {string[]} excludeIds - Array of document IDs to preserve (e.g., super admin user IDs)
 * @returns {number} Number of documents deleted
 */
export const clearCollection = async (collectionName, excludeIds = []) => {
  try {
    const collectionRef = collection(db, collectionName)
    const snapshot = await getDocs(collectionRef)

    if (snapshot.empty) {
      return 0
    }

    // Firestore batch has limit of 500 operations
    const batchSize = 500
    let deletedCount = 0
    let batch = writeBatch(db)
    let operationCount = 0

    for (const document of snapshot.docs) {
      // Skip excluded documents
      if (excludeIds.includes(document.id)) {
        continue
      }

      batch.delete(doc(db, collectionName, document.id))
      operationCount++
      deletedCount++

      // Commit batch when it reaches limit
      if (operationCount >= batchSize) {
        await batch.commit()
        batch = writeBatch(db)
        operationCount = 0
      }
    }

    // Commit remaining operations
    if (operationCount > 0) {
      await batch.commit()
    }

    return deletedCount
  } catch (error) {
    console.error(`Error clearing collection ${collectionName}:`, error)
    throw error
  }
}

/**
 * Clear all data from the system (members, payments)
 * Preserves super admin users
 * @param {string[]} preserveUserIds - Array of user IDs to preserve (typically super admins)
 * @returns {Object} Object with counts of deleted documents
 */
export const clearAllData = async (preserveUserIds = []) => {
  try {
    const results = {
      members: 0,
      payments: 0,
      users: 0,
      errors: []
    }

    // Clear members
    try {
      results.members = await clearCollection(MEMBERS_COLLECTION)
    } catch (error) {
      results.errors.push(`Failed to clear members: ${error.message}`)
    }

    // Clear payments
    try {
      results.payments = await clearCollection(PAYMENTS_COLLECTION)
    } catch (error) {
      results.errors.push(`Failed to clear payments: ${error.message}`)
    }

    // Clear users (except preserved ones)
    try {
      results.users = await clearCollection(USERS_COLLECTION, preserveUserIds)
    } catch (error) {
      results.errors.push(`Failed to clear users: ${error.message}`)
    }

    return results
  } catch (error) {
    console.error('Error clearing all data:', error)
    throw error
  }
}

/**
 * Get data statistics (counts)
 * @returns {Object} Object with counts of documents in each collection
 */
export const getDataStats = async () => {
  try {
    const [membersSnap, paymentsSnap, usersSnap] = await Promise.all([
      getDocs(collection(db, MEMBERS_COLLECTION)),
      getDocs(collection(db, PAYMENTS_COLLECTION)),
      getDocs(collection(db, USERS_COLLECTION))
    ])

    return {
      members: membersSnap.size,
      payments: paymentsSnap.size,
      users: usersSnap.size
    }
  } catch (error) {
    console.error('Error getting data stats:', error)
    throw error
  }
}
