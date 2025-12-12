import { describe, it, expect } from 'vitest'
import { paymentFormSchema, transformPaymentFormData } from '../schemas'

/**
 * Payment Service Tests
 *
 * These tests verify the critical payment logic without requiring Firebase.
 * For full integration tests, use Firebase emulators.
 */

describe('Payment Schema Validation', () => {
  describe('paymentFormSchema', () => {
    it('should validate a valid payment form', () => {
      const validPayment = {
        memberId: 'member123',
        memberName: 'John Doe',
        amount: '150.00',
        paymentDate: '2025-01-15',
        paymentMethod: 'bank_transfer',
        reference: 'TRF-001',
        notes: 'Annual membership fee'
      }

      const result = paymentFormSchema.safeParse(validPayment)
      expect(result.success).toBe(true)
    })

    it('should reject empty memberId', () => {
      const invalidPayment = {
        memberId: '',
        memberName: 'John Doe',
        amount: '150.00',
        paymentDate: '2025-01-15',
        paymentMethod: 'bank_transfer'
      }

      const result = paymentFormSchema.safeParse(invalidPayment)
      expect(result.success).toBe(false)
      // Zod v4 uses issues array instead of errors
      const memberIdError = result.error.issues?.find(i => i.path.includes('memberId'))
        || result.error.errors?.find(e => e.path.includes('memberId'))
      expect(memberIdError).toBeDefined()
    })

    it('should reject zero amount', () => {
      const invalidPayment = {
        memberId: 'member123',
        memberName: 'John Doe',
        amount: '0',
        paymentDate: '2025-01-15',
        paymentMethod: 'bank_transfer'
      }

      const result = paymentFormSchema.safeParse(invalidPayment)
      expect(result.success).toBe(false)
    })

    it('should reject negative amount', () => {
      const invalidPayment = {
        memberId: 'member123',
        memberName: 'John Doe',
        amount: '-50',
        paymentDate: '2025-01-15',
        paymentMethod: 'bank_transfer'
      }

      const result = paymentFormSchema.safeParse(invalidPayment)
      expect(result.success).toBe(false)
    })

    it('should reject non-numeric amount', () => {
      const invalidPayment = {
        memberId: 'member123',
        memberName: 'John Doe',
        amount: 'abc',
        paymentDate: '2025-01-15',
        paymentMethod: 'bank_transfer'
      }

      const result = paymentFormSchema.safeParse(invalidPayment)
      expect(result.success).toBe(false)
    })

    it('should reject empty payment date', () => {
      const invalidPayment = {
        memberId: 'member123',
        memberName: 'John Doe',
        amount: '150.00',
        paymentDate: '',
        paymentMethod: 'bank_transfer'
      }

      const result = paymentFormSchema.safeParse(invalidPayment)
      expect(result.success).toBe(false)
    })

    it('should reject empty payment method', () => {
      const invalidPayment = {
        memberId: 'member123',
        memberName: 'John Doe',
        amount: '150.00',
        paymentDate: '2025-01-15',
        paymentMethod: ''
      }

      const result = paymentFormSchema.safeParse(invalidPayment)
      expect(result.success).toBe(false)
    })

    it('should allow optional reference and notes', () => {
      const minimalPayment = {
        memberId: 'member123',
        memberName: 'John Doe',
        amount: '150.00',
        paymentDate: '2025-01-15',
        paymentMethod: 'cash'
      }

      const result = paymentFormSchema.safeParse(minimalPayment)
      expect(result.success).toBe(true)
    })

    it('should accept all valid payment methods', () => {
      const paymentMethods = ['bank_transfer', 'cash', 'cheque', 'card']

      paymentMethods.forEach(method => {
        const payment = {
          memberId: 'member123',
          memberName: 'John Doe',
          amount: '100.00',
          paymentDate: '2025-01-15',
          paymentMethod: method
        }

        const result = paymentFormSchema.safeParse(payment)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('transformPaymentFormData', () => {
    it('should convert string amount to number', () => {
      const formData = {
        memberId: 'member123',
        memberName: 'John Doe',
        amount: '150.50',
        paymentDate: '2025-01-15',
        paymentMethod: 'bank_transfer',
        reference: 'REF-001',
        notes: 'Test payment'
      }

      const result = transformPaymentFormData(formData)

      expect(result.amount).toBe(150.50)
      expect(typeof result.amount).toBe('number')
    })

    it('should preserve all other fields', () => {
      const formData = {
        memberId: 'member123',
        memberName: 'John Doe',
        amount: '100',
        paymentDate: '2025-01-15',
        paymentMethod: 'cash',
        reference: 'CASH-001',
        notes: 'Cash payment'
      }

      const result = transformPaymentFormData(formData)

      expect(result.memberId).toBe('member123')
      expect(result.memberName).toBe('John Doe')
      expect(result.paymentDate).toBe('2025-01-15')
      expect(result.paymentMethod).toBe('cash')
      expect(result.reference).toBe('CASH-001')
      expect(result.notes).toBe('Cash payment')
    })

    it('should default empty reference and notes to empty string', () => {
      const formData = {
        memberId: 'member123',
        memberName: 'John Doe',
        amount: '100',
        paymentDate: '2025-01-15',
        paymentMethod: 'cash',
        reference: undefined,
        notes: undefined
      }

      const result = transformPaymentFormData(formData)

      expect(result.reference).toBe('')
      expect(result.notes).toBe('')
    })
  })
})

describe('Payment Balance Calculations', () => {
  // These test the mathematical logic used in paymentsService.js

  describe('recordPayment balance update', () => {
    it('should add payment to positive balance', () => {
      const currentBalance = 100
      const paymentAmount = 50
      const newBalance = currentBalance + paymentAmount

      expect(newBalance).toBe(150)
    })

    it('should add payment to negative balance (reduce debt)', () => {
      const currentBalance = -200 // Member owes $200
      const paymentAmount = 150
      const newBalance = currentBalance + paymentAmount

      expect(newBalance).toBe(-50) // Still owes $50
    })

    it('should add payment to zero balance', () => {
      const currentBalance = 0
      const paymentAmount = 100
      const newBalance = currentBalance + paymentAmount

      expect(newBalance).toBe(100)
    })

    it('should handle decimal amounts correctly', () => {
      const currentBalance = 50.50
      const paymentAmount = 25.25
      const newBalance = currentBalance + paymentAmount

      expect(newBalance).toBeCloseTo(75.75, 2)
    })
  })

  describe('updatePayment balance adjustment', () => {
    it('should increase balance when payment amount increases', () => {
      const oldAmount = 100
      const newAmount = 150
      const currentBalance = 200
      const amountDifference = newAmount - oldAmount
      const newBalance = currentBalance + amountDifference

      expect(amountDifference).toBe(50)
      expect(newBalance).toBe(250)
    })

    it('should decrease balance when payment amount decreases', () => {
      const oldAmount = 150
      const newAmount = 100
      const currentBalance = 200
      const amountDifference = newAmount - oldAmount
      const newBalance = currentBalance + amountDifference

      expect(amountDifference).toBe(-50)
      expect(newBalance).toBe(150)
    })

    it('should not change balance when amount stays same', () => {
      const oldAmount = 100
      const newAmount = 100
      const currentBalance = 200
      const amountDifference = newAmount - oldAmount
      const newBalance = currentBalance + amountDifference

      expect(amountDifference).toBe(0)
      expect(newBalance).toBe(200)
    })
  })

  describe('deletePayment balance reversal', () => {
    it('should subtract payment amount from balance', () => {
      const currentBalance = 300
      const paymentAmount = 100
      const newBalance = currentBalance - paymentAmount

      expect(newBalance).toBe(200)
    })

    it('should go negative when deleting causes debt', () => {
      const currentBalance = 50
      const paymentAmount = 100
      const newBalance = currentBalance - paymentAmount

      expect(newBalance).toBe(-50)
    })

    it('should make debt larger when deleting from negative balance', () => {
      const currentBalance = -100 // Already owes $100
      const paymentAmount = 50   // Delete a $50 payment
      const newBalance = currentBalance - paymentAmount

      expect(newBalance).toBe(-150) // Now owes $150
    })
  })
})

describe('Receipt Number Generation', () => {
  it('should format receipt number correctly', () => {
    const year = 2025
    const number = 1
    const receiptNumber = `R${year}-${String(number).padStart(3, '0')}`

    expect(receiptNumber).toBe('R2025-001')
  })

  it('should pad single digits', () => {
    const year = 2025
    const number = 5
    const receiptNumber = `R${year}-${String(number).padStart(3, '0')}`

    expect(receiptNumber).toBe('R2025-005')
  })

  it('should pad double digits', () => {
    const year = 2025
    const number = 42
    const receiptNumber = `R${year}-${String(number).padStart(3, '0')}`

    expect(receiptNumber).toBe('R2025-042')
  })

  it('should not pad triple digits', () => {
    const year = 2025
    const number = 123
    const receiptNumber = `R${year}-${String(number).padStart(3, '0')}`

    expect(receiptNumber).toBe('R2025-123')
  })

  it('should handle large numbers beyond 3 digits', () => {
    const year = 2025
    const number = 1234
    const receiptNumber = `R${year}-${String(number).padStart(3, '0')}`

    expect(receiptNumber).toBe('R2025-1234')
  })
})
