import { describe, it, expect } from 'vitest'

/**
 * Welcome Letter Service Tests
 *
 * These tests verify the edge cases in name parsing and balance calculations
 * used in PDF generation without actually generating PDFs (which requires jsPDF).
 */

describe('Name Parsing Logic', () => {
  // This replicates the name parsing logic from welcomeLetterService.js

  const parseName = (fullName) => {
    let displayName = fullName
    let firstName = fullName

    if (fullName && fullName.includes(',')) {
      // Handle "Last name, First name" format
      const parts = fullName.split(',').map(p => p.trim())
      const lastName = parts[0]
      firstName = parts[1] || lastName
      displayName = `${firstName} ${lastName}`
    } else if (fullName && fullName.includes(' ')) {
      // Handle "First Last" format - first name is first word
      firstName = fullName.split(' ')[0]
    }

    return { displayName, firstName }
  }

  describe('Last, First format', () => {
    it('should parse "Smith, John" correctly', () => {
      const result = parseName('Smith, John')
      expect(result.displayName).toBe('John Smith')
      expect(result.firstName).toBe('John')
    })

    it('should parse "O\'Brien, Mary" correctly', () => {
      const result = parseName("O'Brien, Mary")
      expect(result.displayName).toBe("Mary O'Brien")
      expect(result.firstName).toBe('Mary')
    })

    it('should handle extra spaces "Smith,  John" ', () => {
      const result = parseName('Smith,  John')
      expect(result.displayName).toBe('John Smith')
      expect(result.firstName).toBe('John')
    })

    it('should handle "Last," with no first name', () => {
      const result = parseName('Smith,')
      // When no first name after comma, firstName falls back to lastName
      expect(result.firstName).toBe('Smith')
      // displayName becomes "firstName lastName" = "Smith Smith"
      expect(result.displayName).toBe('Smith Smith')
    })

    it('should handle "Last, First Middle" (multiple first names)', () => {
      const result = parseName('Smith, Mary Jane')
      expect(result.displayName).toBe('Mary Jane Smith')
      expect(result.firstName).toBe('Mary Jane')
    })
  })

  describe('First Last format', () => {
    it('should parse "John Smith" correctly', () => {
      const result = parseName('John Smith')
      expect(result.displayName).toBe('John Smith')
      expect(result.firstName).toBe('John')
    })

    it('should parse "Mary Jane Smith" (3 parts) correctly', () => {
      const result = parseName('Mary Jane Smith')
      expect(result.displayName).toBe('Mary Jane Smith')
      expect(result.firstName).toBe('Mary')
    })

    it('should handle single name (no space)', () => {
      const result = parseName('Madonna')
      expect(result.displayName).toBe('Madonna')
      expect(result.firstName).toBe('Madonna')
    })
  })

  describe('Edge cases', () => {
    it('should handle empty string', () => {
      const result = parseName('')
      expect(result.displayName).toBe('')
      expect(result.firstName).toBe('')
    })

    it('should handle undefined (returns undefined)', () => {
      const result = parseName(undefined)
      expect(result.displayName).toBe(undefined)
      expect(result.firstName).toBe(undefined)
    })

    it('should handle name with only spaces', () => {
      const result = parseName('   ')
      expect(result.displayName).toBe('   ')
      expect(result.firstName).toBe('') // First word after split
    })
  })
})

describe('Balance Calculations for PDF', () => {
  // This replicates the balance calculation logic from welcomeLetterService.js

  const calculateAmounts = (accountBalance) => {
    const amountOwing = accountBalance < 0 ? Math.abs(accountBalance) : 0
    const amountPaid = accountBalance >= 0 ? accountBalance : 0
    return { amountOwing, amountPaid }
  }

  describe('Negative balance (member owes money)', () => {
    it('should calculate amountOwing for -500 balance', () => {
      const result = calculateAmounts(-500)
      expect(result.amountOwing).toBe(500)
      expect(result.amountPaid).toBe(0)
    })

    it('should calculate amountOwing for -0.01 balance', () => {
      const result = calculateAmounts(-0.01)
      expect(result.amountOwing).toBeCloseTo(0.01, 2)
      expect(result.amountPaid).toBe(0)
    })

    it('should handle large negative balance', () => {
      const result = calculateAmounts(-99999.99)
      expect(result.amountOwing).toBeCloseTo(99999.99, 2)
      expect(result.amountPaid).toBe(0)
    })
  })

  describe('Zero balance', () => {
    it('should return 0 for both amounts at zero balance', () => {
      const result = calculateAmounts(0)
      expect(result.amountOwing).toBe(0)
      expect(result.amountPaid).toBe(0)
    })
  })

  describe('Positive balance (member has credit)', () => {
    it('should calculate amountPaid for 500 balance', () => {
      const result = calculateAmounts(500)
      expect(result.amountOwing).toBe(0)
      expect(result.amountPaid).toBe(500)
    })

    it('should calculate amountPaid for small credit', () => {
      const result = calculateAmounts(0.50)
      expect(result.amountOwing).toBe(0)
      expect(result.amountPaid).toBeCloseTo(0.50, 2)
    })
  })
})

describe('Member Filtering for Bulk Operations', () => {
  // Replicates the filter logic from getMembersWithOutstandingBalance

  const filterMembersWithOutstandingBalance = (members) => {
    return members
      .filter(m => m.status === 'active' && m.accountBalance < 0)
      .sort((a, b) => a.accountBalance - b.accountBalance) // Most owing first
  }

  it('should filter out inactive members', () => {
    const members = [
      { id: '1', status: 'active', accountBalance: -100 },
      { id: '2', status: 'inactive', accountBalance: -200 },
      { id: '3', status: 'active', accountBalance: -50 }
    ]

    const result = filterMembersWithOutstandingBalance(members)
    expect(result).toHaveLength(2)
    expect(result.find(m => m.id === '2')).toBeUndefined()
  })

  it('should filter out members with positive balance', () => {
    const members = [
      { id: '1', status: 'active', accountBalance: -100 },
      { id: '2', status: 'active', accountBalance: 200 },
      { id: '3', status: 'active', accountBalance: 0 }
    ]

    const result = filterMembersWithOutstandingBalance(members)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })

  it('should sort by amount owing (most first)', () => {
    const members = [
      { id: '1', status: 'active', accountBalance: -100, fullName: 'Small' },
      { id: '2', status: 'active', accountBalance: -500, fullName: 'Large' },
      { id: '3', status: 'active', accountBalance: -250, fullName: 'Medium' }
    ]

    const result = filterMembersWithOutstandingBalance(members)
    expect(result[0].fullName).toBe('Large')   // -500 (most negative)
    expect(result[1].fullName).toBe('Medium')  // -250
    expect(result[2].fullName).toBe('Small')   // -100
  })

  it('should return empty array when no members owe money', () => {
    const members = [
      { id: '1', status: 'active', accountBalance: 100 },
      { id: '2', status: 'active', accountBalance: 0 },
      { id: '3', status: 'inactive', accountBalance: -100 }
    ]

    const result = filterMembersWithOutstandingBalance(members)
    expect(result).toHaveLength(0)
  })
})

describe('PDF Filename Sanitization', () => {
  const sanitizeFilename = (name) => {
    return name.replace(/\s+/g, '-')
  }

  it('should replace single space with hyphen', () => {
    expect(sanitizeFilename('John Smith')).toBe('John-Smith')
  })

  it('should replace multiple spaces with single hyphen', () => {
    expect(sanitizeFilename('John  Smith')).toBe('John-Smith')
  })

  it('should handle multiple words', () => {
    expect(sanitizeFilename('Mary Jane Smith')).toBe('Mary-Jane-Smith')
  })

  it('should handle leading/trailing spaces', () => {
    expect(sanitizeFilename(' John Smith ')).toBe('-John-Smith-')
  })

  it('should handle no spaces', () => {
    expect(sanitizeFilename('Madonna')).toBe('Madonna')
  })
})

describe('Date Formatting for Letters', () => {
  it('should format date in Australian format', () => {
    // Testing the format pattern used in the service
    const date = new Date('2025-12-25')
    const formatted = date.toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })

    // Should be "25 December 2025" format
    expect(formatted).toMatch(/25/)
    expect(formatted).toMatch(/December/)
    expect(formatted).toMatch(/2025/)
  })
})
