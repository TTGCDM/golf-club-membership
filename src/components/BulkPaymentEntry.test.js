import { describe, it, expect } from 'vitest'

/**
 * BulkPaymentEntry Component Tests
 *
 * These tests verify the business logic used in bulk payment entry:
 * - Row validation
 * - Row management (create, add, remove)
 * - Member filtering for search
 * - Payment data preparation
 * - Selection and totals calculation
 */

// Extracted validation logic from BulkPaymentEntry.jsx
function validateRow(row) {
  if (!row.member) return { isValid: false, error: 'Select a member' }
  if (!row.amount || parseFloat(row.amount) <= 0) return { isValid: false, error: 'Enter amount' }
  if (!row.paymentDate) return { isValid: false, error: 'Select date' }
  return { isValid: true, error: null }
}

// Row creation logic
function createEmptyRow() {
  return {
    id: Date.now() + Math.random(),
    member: null,
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'bank_transfer',
    reference: '',
    isValid: false,
    error: null,
  }
}

// Member filtering logic
function filterMembers(activeMembers, searchQuery) {
  if (!searchQuery.trim()) return activeMembers.slice(0, 10)
  const query = searchQuery.toLowerCase()
  return activeMembers
    .filter(m =>
      m.fullName.toLowerCase().includes(query) ||
      m.email?.toLowerCase().includes(query) ||
      m.golfAustraliaId?.toLowerCase().includes(query)
    )
    .slice(0, 10)
}

// Payment data transformation for processing
function preparePaymentsForProcessing(selectedValidRows) {
  return selectedValidRows.map(row => ({
    memberId: row.member.id,
    memberName: row.member.fullName,
    amount: row.amount,
    paymentDate: row.paymentDate,
    paymentMethod: row.paymentMethod,
    reference: row.reference,
  }))
}

// Calculate total amount from selected rows
function calculateTotalAmount(rows) {
  return rows.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0)
}

describe('BulkPaymentEntry - Row Validation', () => {
  describe('validateRow', () => {
    it('should return invalid when member is null', () => {
      const row = {
        member: null,
        amount: '100.00',
        paymentDate: '2025-01-15',
      }

      const result = validateRow(row)

      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Select a member')
    })

    it('should return invalid when amount is empty', () => {
      const row = {
        member: { id: '123', fullName: 'John Doe' },
        amount: '',
        paymentDate: '2025-01-15',
      }

      const result = validateRow(row)

      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Enter amount')
    })

    it('should return invalid when amount is zero', () => {
      const row = {
        member: { id: '123', fullName: 'John Doe' },
        amount: '0',
        paymentDate: '2025-01-15',
      }

      const result = validateRow(row)

      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Enter amount')
    })

    it('should return invalid when amount is negative', () => {
      const row = {
        member: { id: '123', fullName: 'John Doe' },
        amount: '-50',
        paymentDate: '2025-01-15',
      }

      const result = validateRow(row)

      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Enter amount')
    })

    it('should return invalid when paymentDate is empty', () => {
      const row = {
        member: { id: '123', fullName: 'John Doe' },
        amount: '100.00',
        paymentDate: '',
      }

      const result = validateRow(row)

      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Select date')
    })

    it('should return valid when all required fields are present', () => {
      const row = {
        member: { id: '123', fullName: 'John Doe' },
        amount: '150.00',
        paymentDate: '2025-01-15',
      }

      const result = validateRow(row)

      expect(result.isValid).toBe(true)
      expect(result.error).toBe(null)
    })

    it('should accept decimal amounts', () => {
      const row = {
        member: { id: '123', fullName: 'John Doe' },
        amount: '99.99',
        paymentDate: '2025-01-15',
      }

      const result = validateRow(row)

      expect(result.isValid).toBe(true)
    })

    it('should accept very small positive amounts', () => {
      const row = {
        member: { id: '123', fullName: 'John Doe' },
        amount: '0.01',
        paymentDate: '2025-01-15',
      }

      const result = validateRow(row)

      expect(result.isValid).toBe(true)
    })
  })
})

describe('BulkPaymentEntry - Row Management', () => {
  describe('createEmptyRow', () => {
    it('should create a row with null member', () => {
      const row = createEmptyRow()

      expect(row.member).toBe(null)
    })

    it('should create a row with empty amount', () => {
      const row = createEmptyRow()

      expect(row.amount).toBe('')
    })

    it('should create a row with default payment method as bank_transfer', () => {
      const row = createEmptyRow()

      expect(row.paymentMethod).toBe('bank_transfer')
    })

    it('should create a row with empty reference', () => {
      const row = createEmptyRow()

      expect(row.reference).toBe('')
    })

    it('should create a row with isValid as false', () => {
      const row = createEmptyRow()

      expect(row.isValid).toBe(false)
    })

    it('should create a row with today date', () => {
      const row = createEmptyRow()
      const today = new Date().toISOString().split('T')[0]

      expect(row.paymentDate).toBe(today)
    })

    it('should create unique IDs for each row', () => {
      const row1 = createEmptyRow()
      const row2 = createEmptyRow()

      expect(row1.id).not.toBe(row2.id)
    })
  })
})

describe('BulkPaymentEntry - Member Filtering', () => {
  const mockMembers = [
    { id: '1', fullName: 'John Smith', email: 'john@example.com', golfAustraliaId: 'GA001' },
    { id: '2', fullName: 'Jane Doe', email: 'jane@example.com', golfAustraliaId: 'GA002' },
    { id: '3', fullName: 'Bob Johnson', email: 'bob@test.com', golfAustraliaId: 'GA003' },
    { id: '4', fullName: 'Alice Smith', email: 'alice@example.com', golfAustraliaId: 'GA004' },
    { id: '5', fullName: 'Charlie Brown', email: 'charlie@test.com', golfAustraliaId: 'GA005' },
  ]

  describe('filterMembers', () => {
    it('should return first 10 members when search query is empty', () => {
      const result = filterMembers(mockMembers, '')

      expect(result.length).toBe(5) // Only 5 in mock
    })

    it('should return first 10 members when search query is only whitespace', () => {
      const result = filterMembers(mockMembers, '   ')

      expect(result.length).toBe(5)
    })

    it('should filter by fullName (case insensitive)', () => {
      const result = filterMembers(mockMembers, 'smith')

      expect(result.length).toBe(2)
      expect(result.map(m => m.fullName)).toContain('John Smith')
      expect(result.map(m => m.fullName)).toContain('Alice Smith')
    })

    it('should filter by email', () => {
      const result = filterMembers(mockMembers, '@test.com')

      expect(result.length).toBe(2)
      expect(result.map(m => m.fullName)).toContain('Bob Johnson')
      expect(result.map(m => m.fullName)).toContain('Charlie Brown')
    })

    it('should filter by golfAustraliaId', () => {
      const result = filterMembers(mockMembers, 'GA003')

      expect(result.length).toBe(1)
      expect(result[0].fullName).toBe('Bob Johnson')
    })

    it('should return empty array when no matches', () => {
      const result = filterMembers(mockMembers, 'xyz123nonexistent')

      expect(result.length).toBe(0)
    })

    it('should handle members with null email', () => {
      const membersWithNullEmail = [
        { id: '1', fullName: 'John Smith', email: null, golfAustraliaId: 'GA001' },
      ]

      const result = filterMembers(membersWithNullEmail, 'john')

      expect(result.length).toBe(1)
    })

    it('should limit results to 10 members', () => {
      const manyMembers = Array.from({ length: 20 }, (_, i) => ({
        id: String(i),
        fullName: `Member ${i}`,
        email: `member${i}@example.com`,
        golfAustraliaId: `GA${i}`,
      }))

      const result = filterMembers(manyMembers, 'member')

      expect(result.length).toBe(10)
    })
  })
})

describe('BulkPaymentEntry - Payment Preparation', () => {
  describe('preparePaymentsForProcessing', () => {
    it('should transform rows into payment data', () => {
      const rows = [
        {
          member: { id: 'mem1', fullName: 'John Doe' },
          amount: '150.00',
          paymentDate: '2025-01-15',
          paymentMethod: 'bank_transfer',
          reference: 'REF001',
        },
      ]

      const result = preparePaymentsForProcessing(rows)

      expect(result.length).toBe(1)
      expect(result[0]).toEqual({
        memberId: 'mem1',
        memberName: 'John Doe',
        amount: '150.00',
        paymentDate: '2025-01-15',
        paymentMethod: 'bank_transfer',
        reference: 'REF001',
      })
    })

    it('should handle multiple rows', () => {
      const rows = [
        {
          member: { id: 'mem1', fullName: 'John Doe' },
          amount: '100.00',
          paymentDate: '2025-01-15',
          paymentMethod: 'bank_transfer',
          reference: 'REF001',
        },
        {
          member: { id: 'mem2', fullName: 'Jane Smith' },
          amount: '200.00',
          paymentDate: '2025-01-16',
          paymentMethod: 'cash',
          reference: 'CASH001',
        },
      ]

      const result = preparePaymentsForProcessing(rows)

      expect(result.length).toBe(2)
      expect(result[0].memberId).toBe('mem1')
      expect(result[1].memberId).toBe('mem2')
    })

    it('should handle empty reference', () => {
      const rows = [
        {
          member: { id: 'mem1', fullName: 'John Doe' },
          amount: '100.00',
          paymentDate: '2025-01-15',
          paymentMethod: 'cash',
          reference: '',
        },
      ]

      const result = preparePaymentsForProcessing(rows)

      expect(result[0].reference).toBe('')
    })

    it('should return empty array for empty input', () => {
      const result = preparePaymentsForProcessing([])

      expect(result).toEqual([])
    })
  })
})

describe('BulkPaymentEntry - Amount Calculations', () => {
  describe('calculateTotalAmount', () => {
    it('should sum amounts from multiple rows', () => {
      const rows = [
        { amount: '100.00' },
        { amount: '50.00' },
        { amount: '75.50' },
      ]

      const result = calculateTotalAmount(rows)

      expect(result).toBeCloseTo(225.50, 2)
    })

    it('should return 0 for empty array', () => {
      const result = calculateTotalAmount([])

      expect(result).toBe(0)
    })

    it('should handle single row', () => {
      const rows = [{ amount: '150.00' }]

      const result = calculateTotalAmount(rows)

      expect(result).toBe(150)
    })

    it('should treat empty amount as 0', () => {
      const rows = [
        { amount: '100.00' },
        { amount: '' },
        { amount: '50.00' },
      ]

      const result = calculateTotalAmount(rows)

      expect(result).toBe(150)
    })

    it('should handle decimal precision', () => {
      const rows = [
        { amount: '0.01' },
        { amount: '0.02' },
        { amount: '0.03' },
      ]

      const result = calculateTotalAmount(rows)

      expect(result).toBeCloseTo(0.06, 2)
    })

    it('should handle large amounts', () => {
      const rows = [
        { amount: '1000.00' },
        { amount: '5000.00' },
        { amount: '10000.00' },
      ]

      const result = calculateTotalAmount(rows)

      expect(result).toBe(16000)
    })
  })
})

describe('BulkPaymentEntry - Selection Logic', () => {
  describe('Row Selection', () => {
    it('should identify valid rows for selection', () => {
      const rows = [
        { isValid: true, member: { id: '1' }, amount: '100' },
        { isValid: false, member: null, amount: '' },
        { isValid: true, member: { id: '2' }, amount: '200' },
      ]

      const validRows = rows.filter(r => r.isValid)

      expect(validRows.length).toBe(2)
    })

    it('should filter selected valid rows', () => {
      const rows = [
        { isValid: true, member: { id: '1' }, amount: '100' },
        { isValid: false, member: null, amount: '' },
        { isValid: true, member: { id: '2' }, amount: '200' },
      ]
      const selectedIndices = new Set([0, 2])

      const selectedValidRows = rows.filter((r, i) => r.isValid && selectedIndices.has(i))

      expect(selectedValidRows.length).toBe(2)
    })

    it('should not include invalid selected rows', () => {
      const rows = [
        { isValid: true, member: { id: '1' }, amount: '100' },
        { isValid: false, member: null, amount: '' },
        { isValid: true, member: { id: '2' }, amount: '200' },
      ]
      const selectedIndices = new Set([0, 1, 2]) // Index 1 is invalid

      const selectedValidRows = rows.filter((r, i) => r.isValid && selectedIndices.has(i))

      expect(selectedValidRows.length).toBe(2)
      expect(selectedValidRows.every(r => r.isValid)).toBe(true)
    })
  })
})

describe('BulkPaymentEntry - Member Amount Suggestion', () => {
  describe('Amount auto-fill based on balance', () => {
    it('should suggest outstanding amount for member with negative balance', () => {
      const member = { id: '1', fullName: 'John Doe', accountBalance: -150.50 }

      const suggestedAmount = member.accountBalance < 0
        ? Math.abs(member.accountBalance).toFixed(2)
        : ''

      expect(suggestedAmount).toBe('150.50')
    })

    it('should not suggest amount for member with positive balance', () => {
      const member = { id: '1', fullName: 'John Doe', accountBalance: 50.00 }

      const suggestedAmount = member.accountBalance < 0
        ? Math.abs(member.accountBalance).toFixed(2)
        : ''

      expect(suggestedAmount).toBe('')
    })

    it('should not suggest amount for member with zero balance', () => {
      const member = { id: '1', fullName: 'John Doe', accountBalance: 0 }

      const suggestedAmount = member.accountBalance < 0
        ? Math.abs(member.accountBalance).toFixed(2)
        : ''

      expect(suggestedAmount).toBe('')
    })
  })
})
