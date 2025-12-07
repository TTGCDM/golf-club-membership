import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  runTransaction,
  onSnapshot
} from 'firebase/firestore'
import { db } from '../firebase'
import { getMemberById } from './membersService'
import jsPDF from 'jspdf'
import { paymentFormSchema, transformPaymentFormData } from '../schemas'
import { ValidationError } from '../utils/ValidationError'

const PAYMENTS_COLLECTION = 'payments'
const RECEIPT_COUNTER_COLLECTION = 'receipt_counters'

// ... (existing code)

// Subscribe to all payments (Real-time updates)
export const subscribeToPayments = (callback) => {
  const q = query(
    collection(db, PAYMENTS_COLLECTION),
    orderBy('paymentDate', 'desc')
  )

  return onSnapshot(q, (querySnapshot) => {
    const payments = []
    querySnapshot.forEach((doc) => {
      payments.push({ id: doc.id, ...doc.data() })
    })
    callback(payments)
  }, (error) => {
    console.error('Error subscribing to payments:', error)
  })
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



// Initialize counter for a year (call once per year, or if counter doesn't exist)
// This is safe to call multiple times - it won't overwrite existing counter
export const initializeReceiptCounter = async (year = new Date().getFullYear()) => {
  try {
    const counterDocRef = doc(db, RECEIPT_COUNTER_COLLECTION, String(year))
    const counterDoc = await getDoc(counterDocRef)

    if (!counterDoc.exists()) {
      // Initialize with 0 - first receipt will be 001
      await setDoc(counterDocRef, {
        lastNumber: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      console.log(`Receipt counter initialized for year ${year}`)
    }

    return true
  } catch (error) {
    console.error('Error initializing receipt counter:', error)
    throw error
  }
}

// Legacy function for backwards compatibility (non-atomic, use with caution)
// Prefer using the transaction-based approach in recordPayment
export const generateReceiptNumber = async (year = new Date().getFullYear()) => {
  try {
    const counterDocRef = doc(db, RECEIPT_COUNTER_COLLECTION, String(year))
    const counterDoc = await getDoc(counterDocRef)

    let nextNumber = 1

    if (counterDoc.exists()) {
      nextNumber = (counterDoc.data().lastNumber || 0) + 1
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
    // Validate with Zod schema (if data is in form format)
    if (typeof paymentData.amount === 'string') {
      const validation = paymentFormSchema.safeParse(paymentData)
      if (!validation.success) {
        throw new ValidationError(validation.error.flatten())
      }
      // Transform form data to payment format
      paymentData = transformPaymentFormData(paymentData)
    }

    // Use transaction to ensure ALL operations are atomic:
    // 1. Generate receipt number
    // 2. Record payment
    // 3. Update member balance
    // IMPORTANT: All reads MUST happen before any writes in Firestore transactions
    const result = await runTransaction(db, async (transaction) => {
      // === ALL READS FIRST ===
      const year = new Date().getFullYear()
      const counterDocRef = doc(db, RECEIPT_COUNTER_COLLECTION, String(year))
      const counterDoc = await transaction.get(counterDocRef)

      const memberRef = doc(db, 'members', paymentData.memberId)
      const memberDoc = await transaction.get(memberRef)

      if (!memberDoc.exists()) {
        throw new Error('Member not found')
      }

      // === PROCESS DATA ===
      // Generate receipt number
      let nextNumber = 1
      if (counterDoc.exists()) {
        nextNumber = (counterDoc.data().lastNumber || 0) + 1
      }
      const receiptNumber = `R${year}-${String(nextNumber).padStart(3, '0')}`

      const currentBalance = memberDoc.data().accountBalance || 0
      const newBalance = currentBalance + parseFloat(paymentData.amount)

      const newPayment = {
        memberId: paymentData.memberId,
        memberName: paymentData.memberName,
        amount: parseFloat(paymentData.amount),
        paymentDate: paymentData.paymentDate,
        paymentMethod: paymentData.paymentMethod,
        reference: paymentData.reference || '',
        notes: paymentData.notes || '',
        receiptNumber,
        recordedBy: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      // === ALL WRITES AFTER READS ===
      // Update receipt counter
      transaction.set(counterDocRef, {
        lastNumber: nextNumber,
        updatedAt: serverTimestamp()
      }, { merge: true })

      // Add payment
      const paymentRef = doc(collection(db, PAYMENTS_COLLECTION))
      transaction.set(paymentRef, newPayment)

      // Update member balance
      transaction.update(memberRef, {
        accountBalance: newBalance,
        updatedAt: serverTimestamp()
      })

      return { paymentRef, newPayment }
    })

    return { id: result.paymentRef.id, ...result.newPayment }
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

// Generate PDF receipt for a payment
export const generatePDFReceipt = async (payment) => {
  try {
    // Get member details
    const member = await getMemberById(payment.memberId)

    // Create new PDF document
    const doc = new jsPDF()

    // Set up colors and fonts
    const primaryColor = [41, 128, 185] // Blue
    const textColor = [44, 62, 80] // Dark gray

    // Header - Club Name
    doc.setFontSize(24)
    doc.setTextColor(...primaryColor)
    doc.text('Tea Tree Golf Club', 105, 20, { align: 'center' })

    // Subtitle
    doc.setFontSize(12)
    doc.setTextColor(...textColor)
    doc.text('Payment Receipt', 105, 30, { align: 'center' })

    // Horizontal line
    doc.setDrawColor(...primaryColor)
    doc.setLineWidth(0.5)
    doc.line(20, 35, 190, 35)

    // Receipt Details Header
    doc.setFontSize(16)
    doc.setTextColor(...primaryColor)
    doc.text('Receipt Details', 20, 50)

    // Receipt information
    doc.setFontSize(11)
    doc.setTextColor(...textColor)

    let yPos = 60
    const lineHeight = 7

    // Receipt Number
    doc.setFont(undefined, 'bold')
    doc.text('Receipt Number:', 20, yPos)
    doc.setFont(undefined, 'normal')
    doc.text(payment.receiptNumber || 'N/A', 70, yPos)

    yPos += lineHeight

    // Payment Date
    doc.setFont(undefined, 'bold')
    doc.text('Payment Date:', 20, yPos)
    doc.setFont(undefined, 'normal')
    doc.text(payment.paymentDate, 70, yPos)

    yPos += lineHeight

    // Payment Method
    doc.setFont(undefined, 'bold')
    doc.text('Payment Method:', 20, yPos)
    doc.setFont(undefined, 'normal')
    doc.text(formatPaymentMethod(payment.paymentMethod), 70, yPos)

    yPos += lineHeight

    // Reference
    if (payment.reference) {
      doc.setFont(undefined, 'bold')
      doc.text('Reference:', 20, yPos)
      doc.setFont(undefined, 'normal')
      doc.text(payment.reference, 70, yPos)
      yPos += lineHeight
    }

    // Amount - Highlighted
    yPos += 5
    doc.setFillColor(240, 248, 255) // Light blue background
    doc.roundedRect(20, yPos - 5, 170, 12, 2, 2, 'F')
    doc.setFontSize(14)
    doc.setFont(undefined, 'bold')
    doc.text('Amount Paid:', 25, yPos + 3)
    doc.setTextColor(46, 125, 50) // Green for amount
    doc.text(`$${payment.amount.toFixed(2)}`, 70, yPos + 3)
    doc.setTextColor(...textColor)

    // Member Details Header
    yPos += 25
    doc.setFontSize(16)
    doc.setTextColor(...primaryColor)
    doc.text('Member Information', 20, yPos)

    yPos += 10
    doc.setFontSize(11)
    doc.setTextColor(...textColor)

    // Member Name
    doc.setFont(undefined, 'bold')
    doc.text('Name:', 20, yPos)
    doc.setFont(undefined, 'normal')
    doc.text(payment.memberName || member.fullName, 70, yPos)

    yPos += lineHeight

    // Email
    doc.setFont(undefined, 'bold')
    doc.text('Email:', 20, yPos)
    doc.setFont(undefined, 'normal')
    doc.text(member.email || 'N/A', 70, yPos)

    yPos += lineHeight

    // Phone
    if (member.phone) {
      doc.setFont(undefined, 'bold')
      doc.text('Phone:', 20, yPos)
      doc.setFont(undefined, 'normal')
      doc.text(member.phone, 70, yPos)
      yPos += lineHeight
    }

    // Golf Australia ID
    if (member.golfAustraliaId) {
      doc.setFont(undefined, 'bold')
      doc.text('Golf Australia ID:', 20, yPos)
      doc.setFont(undefined, 'normal')
      doc.text(member.golfAustraliaId, 70, yPos)
      yPos += lineHeight
    }

    // Membership Category
    doc.setFont(undefined, 'bold')
    doc.text('Membership:', 20, yPos)
    doc.setFont(undefined, 'normal')
    doc.text(member.membershipCategory || 'N/A', 70, yPos)

    yPos += lineHeight

    // Current Balance
    doc.setFont(undefined, 'bold')
    doc.text('Current Balance:', 20, yPos)
    doc.setFont(undefined, 'normal')
    const balanceColor = member.accountBalance >= 0 ? [46, 125, 50] : [211, 47, 47]
    doc.setTextColor(...balanceColor)
    doc.text(`$${(member.accountBalance || 0).toFixed(2)}`, 70, yPos)
    doc.setTextColor(...textColor)

    // Notes section
    if (payment.notes) {
      yPos += 15
      doc.setFontSize(16)
      doc.setTextColor(...primaryColor)
      doc.text('Notes', 20, yPos)

      yPos += 10
      doc.setFontSize(11)
      doc.setTextColor(...textColor)
      doc.setFont(undefined, 'normal')

      // Split notes into multiple lines if too long
      const notesLines = doc.splitTextToSize(payment.notes, 170)
      doc.text(notesLines, 20, yPos)
      yPos += notesLines.length * lineHeight
    }

    // Footer
    const footerY = 270
    doc.setDrawColor(...primaryColor)
    doc.setLineWidth(0.5)
    doc.line(20, footerY, 190, footerY)

    doc.setFontSize(9)
    doc.setTextColor(128, 128, 128)
    doc.text('Tea Tree Golf Club', 105, footerY + 7, { align: 'center' })
    doc.text('Thank you for your payment!', 105, footerY + 12, { align: 'center' })

    // Add timestamp
    const now = new Date()
    const timestamp = `Generated: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`
    doc.setFontSize(8)
    doc.text(timestamp, 105, footerY + 20, { align: 'center' })

    // Save the PDF
    const fileName = `Receipt-${payment.receiptNumber || payment.id}.pdf`
    doc.save(fileName)

    return true
  } catch (error) {
    console.error('Error generating PDF receipt:', error)
    throw error
  }
}
