
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  runTransaction,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase'
import { getAllMembers } from './membersService'
import { getAllCategories } from './categoryService'

const FEES_COLLECTION = 'fees'

/**
 * Check which members already have fees applied for a specific year
 * @param {number} year - The year to check
 * @returns {Set} Set of member IDs who already have fees applied
 */
export const checkFeesApplied = async (year) => {
  try {
    const q = query(
      collection(db, FEES_COLLECTION),
      where('feeYear', '==', year)
    )
    const snapshot = await getDocs(q)
    const memberIds = new Set()
    snapshot.forEach(doc => {
      memberIds.add(doc.data().memberId)
    })
    return memberIds
  } catch (error) {
    console.error('Error checking applied fees:', error)
    throw error
  }
}

/**
 * Preview what fees will be applied
 * @param {number} year - The year for fees
 * @param {Object} categoryFees - Map of categoryId to fee amount (overrides)
 * @returns {Object} Preview data with member count, total amount, breakdown by category
 */
export const previewFeeApplication = async (year, categoryFees = {}) => {
  try {
    const [members, categories, alreadyApplied] = await Promise.all([
      getAllMembers(),
      getAllCategories(),
      checkFeesApplied(year)
    ])

    // Filter to active members only who don't already have fees for this year
    const eligibleMembers = members.filter(
      m => m.status === 'active' && !alreadyApplied.has(m.id)
    )

    const breakdown = {}
    let totalAmount = 0
    let totalMembers = 0

    // Group by category and calculate totals
    eligibleMembers.forEach(member => {
      const categoryId = member.membershipCategory
      const category = categories.find(c => c.id === categoryId)

      if (!category) return // Skip if category not found

      // Use override fee if provided, otherwise use category's annual fee
      const feeAmount = categoryFees[categoryId] !== undefined
        ? categoryFees[categoryId]
        : category.annualFee

      if (!breakdown[categoryId]) {
        breakdown[categoryId] = {
          categoryName: category.name,
          feeAmount,
          memberCount: 0,
          memberNames: []
        }
      }

      breakdown[categoryId].memberCount++
      breakdown[categoryId].memberNames.push(member.fullName)
      totalAmount += feeAmount
      totalMembers++
    })

    return {
      year,
      totalMembers,
      totalAmount,
      breakdown,
      alreadyAppliedCount: alreadyApplied.size
    }
  } catch (error) {
    console.error('Error previewing fee application:', error)
    throw error
  }
}

/**
 * Apply annual fees to all active members
 * @param {number} year - The year for fees
 * @param {Object} categoryFees - Map of categoryId to fee amount (overrides)
 * @param {string} userId - ID of user applying fees
 * @returns {Object} Results with success/failed counts and details
 */
export const applyAnnualFees = async (year, categoryFees = {}, userId) => {
  try {
    const [members, categories, alreadyApplied] = await Promise.all([
      getAllMembers(),
      getAllCategories(),
      checkFeesApplied(year)
    ])

    const eligibleMembers = members.filter(
      m => m.status === 'active' && !alreadyApplied.has(m.id)
    )

    const results = {
      year,
      successful: 0,
      skipped: 0,
      failed: 0,
      totalAmount: 0,
      details: []
    }

    // Apply fees to each member using transactions
    for (const member of eligibleMembers) {
      const categoryId = member.membershipCategory
      const category = categories.find(c => c.id === categoryId)

      if (!category) {
        results.skipped++
        results.details.push({
          memberId: member.id,
          memberName: member.fullName,
          status: 'skipped',
          reason: 'Category not found'
        })
        continue
      }

      // Use override fee if provided, otherwise use category's annual fee
      const feeAmount = categoryFees[categoryId] !== undefined
        ? categoryFees[categoryId]
        : category.annualFee

      try {
        // Use transaction to ensure atomicity
        await runTransaction(db, async (transaction) => {
          const memberRef = doc(db, 'members', member.id)
          const memberDoc = await transaction.get(memberRef)

          if (!memberDoc.exists()) {
            throw new Error('Member not found')
          }

          const currentBalance = memberDoc.data().accountBalance || 0
          const newBalance = currentBalance - feeAmount // Subtract fee (increases debt or reduces credit)

          // Update member balance
          transaction.update(memberRef, {
            accountBalance: newBalance,
            updatedAt: serverTimestamp()
          })

          // Create fee record
          const feeRef = doc(collection(db, FEES_COLLECTION))
          transaction.set(feeRef, {
            memberId: member.id,
            memberName: member.fullName,
            feeYear: year,
            categoryId: category.id,
            categoryName: category.name,
            amount: feeAmount,
            appliedDate: new Date().toISOString().split('T')[0],
            appliedBy: userId,
            notes: `${year} Annual Membership Fee - ${category.name} `,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          })
        })

        results.successful++
        results.totalAmount += feeAmount
        results.details.push({
          memberId: member.id,
          memberName: member.fullName,
          categoryName: category.name,
          feeAmount,
          status: 'success'
        })
      } catch (error) {
        results.failed++
        results.details.push({
          memberId: member.id,
          memberName: member.fullName,
          status: 'failed',
          reason: error.message
        })
      }
    }

    return results
  } catch (error) {
    console.error('Error applying annual fees:', error)
    throw error
  }
}

/**
 * Apply a single fee to a specific member
 * @param {Object} feeData - Fee data { memberId, memberName, amount, feeYear, notes }
 * @param {string} userId - ID of user applying the fee
 * @returns {Object} The created fee record
 */
export const applyFeeToMember = async (feeData, userId) => {
  try {
    const { memberId, memberName, amount, feeYear, notes, categoryId, categoryName } = feeData

    // Use transaction to ensure atomicity
    const feeId = await runTransaction(db, async (transaction) => {
      const memberRef = doc(db, 'members', memberId)
      const memberDoc = await transaction.get(memberRef)

      if (!memberDoc.exists()) {
        throw new Error('Member not found')
      }

      const currentBalance = memberDoc.data().accountBalance || 0
      const newBalance = currentBalance - amount // Subtract fee (increases debt or reduces credit)

      // Update member balance
      transaction.update(memberRef, {
        accountBalance: newBalance,
        updatedAt: serverTimestamp()
      })

      // Create fee record
      const feeRef = doc(collection(db, FEES_COLLECTION))
      transaction.set(feeRef, {
        memberId,
        memberName,
        feeYear: feeYear || new Date().getFullYear(),
        categoryId: categoryId || 'manual',
        categoryName: categoryName || 'Manual Fee',
        amount,
        appliedDate: new Date().toISOString().split('T')[0],
        appliedBy: userId,
        notes: notes || `Fee applied - $${amount}`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      return feeRef.id
    })

    return { id: feeId, ...feeData }
  } catch (error) {
    console.error('Error applying fee to member:', error)
    throw error
  }
}

/**
 * Get all fees for a specific member
 * @param {string} memberId - The member ID
 * @returns {Array} Array of fee records
 */
export const getFeesByMember = async (memberId) => {
  try {
    const q = query(
      collection(db, FEES_COLLECTION),
      where('memberId', '==', memberId)
    )
    const snapshot = await getDocs(q)
    const fees = []
    snapshot.forEach(doc => {
      fees.push({ id: doc.id, ...doc.data() })
    })
    // Sort by applied date descending (most recent first)
    return fees.sort((a, b) => b.appliedDate.localeCompare(a.appliedDate))
  } catch (error) {
    console.error('Error fetching member fees:', error)
    throw error
  }
}

/**
 * Get fee statistics for a specific year
 * @param {number} year - The year to get stats for
 * @returns {Object} Statistics object
 */
export const getFeeStats = async (year) => {
  try {
    const q = query(
      collection(db, FEES_COLLECTION),
      where('feeYear', '==', year)
    )
    const snapshot = await getDocs(q)

    let totalAmount = 0
    let totalCount = 0
    const byCategory = {}

    snapshot.forEach(doc => {
      const data = doc.data()
      totalCount++
      totalAmount += data.amount

      if (!byCategory[data.categoryName]) {
        byCategory[data.categoryName] = {
          count: 0,
          amount: 0
        }
      }
      byCategory[data.categoryName].count++
      byCategory[data.categoryName].amount += data.amount
    })

    return {
      year,
      totalCount,
      totalAmount,
      byCategory
    }
  } catch (error) {
    console.error('Error getting fee stats:', error)
    throw error
  }
}
