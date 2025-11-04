import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  runTransaction
} from 'firebase/firestore'
import { db } from '../firebase'
import { updateMember, getMemberById } from './membersService'

const PAYMENTS_COLLECTION = 'payments'
const SETTINGS_COLLECTION = 'systemSettings'

// Generate receipt number (format: R2025-001)
export const generateReceiptNumber = async (year = new Date().getFullYear()) => {
  try {
    // Get the last payment for the year
    const q = query(
      collection(db, PAYMENTS_COLLECTION),
      where('receiptNumber', '>=', `R${year}-`),
      where('receiptNumber', '<', `R${year + 1}-`),
      orderBy('receiptNumber', 'desc'),
      limit(1)
    )

    const querySnapshot = await getDocs(q)

    let nextNumber = 1

    if (!querySnapshot.empty) {
      const lastReceipt = querySnapshot.docs[0].data().receiptNumber
      const lastNumber = parseInt(lastReceipt.split('-')[1])
      nextNumber = lastNumber + 1
    }

    // Format: R2025-001
    return `R${year}-${String(nextNumber).padStart(3, '0')}`
  } catch (error) {
    console.error('Error generating receipt number:', error)
    // Fallback to timestamp-based receipt number
    return `R${year}-${Date.now()}`
  }
}

// Record a payment
export const recordPayment = async (paymentData, userId) => {
  try {
    const receiptNumber = await generateReceiptNumber()

    const newPayment = {
      memberId: paymentData.memberId,
      memberName: paymentData.memberName, // Store for quick reference
      amount: parseFloat(paymentData.amount),
      paymentDate: paymentData.paymentDate,
      paymentMethod: paymentData.paymentMethod, // 'bank_transfer' or 'cash'
      reference: paymentData.reference || '',
      notes: paymentData.notes || '',
      receiptNumber,
      recordedBy: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }

    // Use transaction to ensure payment is recorded and balance is updated atomically
    const paymentDocRef = await runTransaction(db, async (transaction) => {
      // Get current member data
      const memberRef = doc(db, 'members', paymentData.memberId)
      const memberDoc = await transaction.get(memberRef)

      if (!memberDoc.exists()) {
        throw new Error('Member not found')
      }

      const currentBalance = memberDoc.data().accountBalance || 0
      // Positive balance = credit, so adding payment increases balance (more positive)
      const newBalance = currentBalance + parseFloat(paymentData.amount)

      // Add payment
      const paymentRef = doc(collection(db, PAYMENTS_COLLECTION))
      transaction.set(paymentRef, newPayment)

      // Update member balance
      transaction.update(memberRef, {
        accountBalance: newBalance,
        updatedAt: serverTimestamp()
      })

      return paymentRef
    })

    return { id: paymentDocRef.id, ...newPayment }
  } catch (error) {
    console.error('Error recording payment:', error)
    throw error
  }
}

// Get payment by ID
export const getPaymentById = async (paymentId) => {
  try {
    const docRef = doc(db, PAYMENTS_COLLECTION, paymentId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() }
    } else {
      throw new Error('Payment not found')
    }
  } catch (error) {
    console.error('Error getting payment:', error)
    throw error
  }
}

// Get all payments
export const getAllPayments = async () => {
  try {
    const q = query(
      collection(db, PAYMENTS_COLLECTION),
      orderBy('paymentDate', 'desc')
    )

    const querySnapshot = await getDocs(q)
    const payments = []

    querySnapshot.forEach((doc) => {
      payments.push({ id: doc.id, ...doc.data() })
    })

    return payments
  } catch (error) {
    console.error('Error getting payments:', error)
    throw error
  }
}

// Get payments for a specific member
export const getPaymentsByMember = async (memberId) => {
  try {
    const q = query(
      collection(db, PAYMENTS_COLLECTION),
      where('memberId', '==', memberId),
      orderBy('paymentDate', 'desc')
    )

    const querySnapshot = await getDocs(q)
    const payments = []

    querySnapshot.forEach((doc) => {
      payments.push({ id: doc.id, ...doc.data() })
    })

    return payments
  } catch (error) {
    console.error('Error getting member payments:', error)
    throw error
  }
}

// Get payments by date range
export const getPaymentsByDateRange = async (startDate, endDate) => {
  try {
    const q = query(
      collection(db, PAYMENTS_COLLECTION),
      where('paymentDate', '>=', startDate),
      where('paymentDate', '<=', endDate),
      orderBy('paymentDate', 'desc')
    )

    const querySnapshot = await getDocs(q)
    const payments = []

    querySnapshot.forEach((doc) => {
      payments.push({ id: doc.id, ...doc.data() })
    })

    return payments
  } catch (error) {
    console.error('Error getting payments by date range:', error)
    throw error
  }
}

// Update a payment
export const updatePayment = async (paymentId, paymentData, userId) => {
  try {
    // Get the old payment data
    const oldPayment = await getPaymentById(paymentId)
    const oldAmount = oldPayment.amount
    const newAmount = parseFloat(paymentData.amount)
    const amountDifference = newAmount - oldAmount

    // Use transaction to update payment and adjust member balance
    await runTransaction(db, async (transaction) => {
      const paymentRef = doc(db, PAYMENTS_COLLECTION, paymentId)
      const memberRef = doc(db, 'members', oldPayment.memberId)

      const memberDoc = await transaction.get(memberRef)

      if (!memberDoc.exists()) {
        throw new Error('Member not found')
      }

      const currentBalance = memberDoc.data().accountBalance || 0
      // If amount increased, balance should increase (more credit)
      // If amount decreased, balance should decrease (less credit)
      const newBalance = currentBalance + amountDifference

      // Update payment
      const updatedPayment = {
        amount: newAmount,
        paymentDate: paymentData.paymentDate,
        paymentMethod: paymentData.paymentMethod,
        reference: paymentData.reference || '',
        notes: paymentData.notes || '',
        updatedBy: userId,
        updatedAt: serverTimestamp()
      }

      transaction.update(paymentRef, updatedPayment)

      // Update member balance
      transaction.update(memberRef, {
        accountBalance: newBalance,
        updatedAt: serverTimestamp()
      })
    })

    return { id: paymentId, ...paymentData }
  } catch (error) {
    console.error('Error updating payment:', error)
    throw error
  }
}

// Delete a payment (and adjust member balance)
export const deletePayment = async (paymentId) => {
  try {
    const payment = await getPaymentById(paymentId)

    // Use transaction to delete payment and adjust member balance
    await runTransaction(db, async (transaction) => {
      const paymentRef = doc(db, PAYMENTS_COLLECTION, paymentId)
      const memberRef = doc(db, 'members', payment.memberId)

      const memberDoc = await transaction.get(memberRef)

      if (!memberDoc.exists()) {
        throw new Error('Member not found')
      }

      const currentBalance = memberDoc.data().accountBalance || 0
      // Subtract the payment amount from balance (removing the credit from deleting payment)
      const newBalance = currentBalance - payment.amount

      // Delete payment
      transaction.delete(paymentRef)

      // Update member balance
      transaction.update(memberRef, {
        accountBalance: newBalance,
        updatedAt: serverTimestamp()
      })
    })
  } catch (error) {
    console.error('Error deleting payment:', error)
    throw error
  }
}

// Get payment statistics
export const getPaymentStats = async (year = new Date().getFullYear()) => {
  try {
    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`

    const payments = await getPaymentsByDateRange(startDate, endDate)

    const stats = {
      totalAmount: 0,
      totalCount: payments.length,
      byMethod: {
        bank_transfer: 0,
        cash: 0
      },
      byMonth: {}
    }

    payments.forEach(payment => {
      stats.totalAmount += payment.amount

      // Count by method
      if (payment.paymentMethod === 'bank_transfer') {
        stats.byMethod.bank_transfer += payment.amount
      } else if (payment.paymentMethod === 'cash') {
        stats.byMethod.cash += payment.amount
      }

      // Count by month
      const month = payment.paymentDate.substring(0, 7) // YYYY-MM
      if (!stats.byMonth[month]) {
        stats.byMonth[month] = 0
      }
      stats.byMonth[month] += payment.amount
    })

    return stats
  } catch (error) {
    console.error('Error getting payment stats:', error)
    throw error
  }
}

// Format payment method for display
export const formatPaymentMethod = (method) => {
  const methods = {
    bank_transfer: 'Bank Transfer',
    cash: 'Cash'
  }
  return methods[method] || method
}
