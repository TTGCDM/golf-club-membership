import { describe, it, expect } from 'vitest'
import { memberFormSchema, memberSchema, memberCSVRowSchema } from '../schemas'

/**
 * Member Service Tests
 *
 * These tests verify member validation logic without requiring Firebase.
 * For full integration tests, use Firebase emulators.
 */

describe('Member Schema Validation', () => {
  describe('memberFormSchema', () => {
    it('should validate a complete member form', () => {
      const validMember = {
        fullName: 'John Doe',
        email: 'john@example.com',
        phone: '0412345678',
        address: '123 Main St, Sydney NSW 2000',
        dateOfBirth: '1985-06-15',
        emergencyContact: 'Jane Doe - 0498765432',
        golfAustraliaId: '12345678',
        dateJoined: '2025-01-01',
        membershipCategory: 'full-membership',
        status: 'active'
      }

      const result = memberFormSchema.safeParse(validMember)
      expect(result.success).toBe(true)
    })

    it('should require fullName', () => {
      const invalidMember = {
        fullName: '',
        dateJoined: '2025-01-01',
        membershipCategory: 'full-membership'
      }

      const result = memberFormSchema.safeParse(invalidMember)
      expect(result.success).toBe(false)
      const fullNameError = result.error.issues?.find(i => i.path.includes('fullName'))
      expect(fullNameError).toBeDefined()
    })

    it('should require dateJoined', () => {
      const invalidMember = {
        fullName: 'John Doe',
        dateJoined: '',
        membershipCategory: 'full-membership'
      }

      const result = memberFormSchema.safeParse(invalidMember)
      expect(result.success).toBe(false)
      const dateJoinedError = result.error.issues?.find(i => i.path.includes('dateJoined'))
      expect(dateJoinedError).toBeDefined()
    })

    // Critical test: membershipCategory should be optional
    // This covers the bug where application approval failed because
    // membershipCategory was required but auto-determined from DOB
    it('should allow empty membershipCategory (auto-determined from DOB)', () => {
      const memberWithoutCategory = {
        fullName: 'Mitchell Mansfield',
        email: 'mitchell@example.com',
        phone: '0483890674',
        address: '23 Box Hill Road, Claremont, TAS 7011',
        dateOfBirth: '2010-01-01',
        golfAustraliaId: '',
        dateJoined: '2025-12-12',
        // membershipCategory intentionally omitted - should be auto-determined
        status: 'active'
      }

      const result = memberFormSchema.safeParse(memberWithoutCategory)
      expect(result.success).toBe(true)
      // Verify it defaults to empty string
      expect(result.data.membershipCategory).toBe('')
    })

    it('should allow undefined membershipCategory', () => {
      const memberWithUndefinedCategory = {
        fullName: 'Jane Doe',
        dateJoined: '2025-01-01',
        membershipCategory: undefined
      }

      const result = memberFormSchema.safeParse(memberWithUndefinedCategory)
      expect(result.success).toBe(true)
      expect(result.data.membershipCategory).toBe('')
    })

    it('should accept explicit membershipCategory when provided', () => {
      const memberWithCategory = {
        fullName: 'John Doe',
        dateJoined: '2025-01-01',
        membershipCategory: 'junior-13-15'
      }

      const result = memberFormSchema.safeParse(memberWithCategory)
      expect(result.success).toBe(true)
      expect(result.data.membershipCategory).toBe('junior-13-15')
    })

    it('should default optional fields to empty strings', () => {
      const minimalMember = {
        fullName: 'John Doe',
        dateJoined: '2025-01-01'
      }

      const result = memberFormSchema.safeParse(minimalMember)
      expect(result.success).toBe(true)
      expect(result.data.email).toBe('')
      expect(result.data.phone).toBe('')
      expect(result.data.address).toBe('')
      expect(result.data.dateOfBirth).toBe('')
      expect(result.data.emergencyContact).toBe('')
      expect(result.data.golfAustraliaId).toBe('')
      expect(result.data.membershipCategory).toBe('')
    })

    it('should default status to active', () => {
      const memberWithoutStatus = {
        fullName: 'John Doe',
        dateJoined: '2025-01-01'
      }

      const result = memberFormSchema.safeParse(memberWithoutStatus)
      expect(result.success).toBe(true)
      expect(result.data.status).toBe('active')
    })
  })

  describe('memberSchema (Firestore document)', () => {
    it('should require membershipCategory for Firestore documents', () => {
      // Note: memberSchema (for Firestore docs) requires membershipCategory
      // because by the time we save to Firestore, it should be determined
      const invalidDoc = {
        fullName: 'John Doe',
        dateJoined: '2025-01-01',
        membershipCategory: '' // Empty not allowed in Firestore schema
      }

      const result = memberSchema.safeParse(invalidDoc)
      expect(result.success).toBe(false)
    })

    it('should validate a complete Firestore member document', () => {
      const validDoc = {
        fullName: 'John Doe',
        email: 'john@example.com',
        phone: '0412345678',
        address: '123 Main St',
        dateOfBirth: '1985-06-15',
        emergencyContact: 'Jane - 0498765432',
        golfAustraliaId: '12345678',
        dateJoined: '2025-01-01',
        membershipCategory: 'full-membership',
        status: 'active',
        accountBalance: 0
      }

      const result = memberSchema.safeParse(validDoc)
      expect(result.success).toBe(true)
    })
  })

  describe('memberCSVRowSchema', () => {
    it('should validate a complete CSV row', () => {
      const validRow = {
        fullName: 'John Doe',
        golfAustraliaId: '12345678',
        email: 'john@example.com',
        phone: '0412345678',
        address: '123 Main St',
        dateOfBirth: '1985-06-15',
        status: 'active'
      }

      const result = memberCSVRowSchema.safeParse(validRow)
      expect(result.success).toBe(true)
    })

    it('should require fullName in CSV import', () => {
      const invalidRow = {
        fullName: '',
        golfAustraliaId: '12345678'
      }

      const result = memberCSVRowSchema.safeParse(invalidRow)
      expect(result.success).toBe(false)
    })

    it('should require golfAustraliaId in CSV import', () => {
      const invalidRow = {
        fullName: 'John Doe',
        golfAustraliaId: ''
      }

      const result = memberCSVRowSchema.safeParse(invalidRow)
      expect(result.success).toBe(false)
    })

    it('should validate date of birth format (YYYY-MM-DD)', () => {
      const invalidDateRow = {
        fullName: 'John Doe',
        golfAustraliaId: '12345678',
        dateOfBirth: '15/06/1985' // Wrong format
      }

      const result = memberCSVRowSchema.safeParse(invalidDateRow)
      expect(result.success).toBe(false)
    })

    it('should accept valid date of birth format', () => {
      const validDateRow = {
        fullName: 'John Doe',
        golfAustraliaId: '12345678',
        dateOfBirth: '1985-06-15'
      }

      const result = memberCSVRowSchema.safeParse(validDateRow)
      expect(result.success).toBe(true)
    })

    it('should validate status values', () => {
      const invalidStatusRow = {
        fullName: 'John Doe',
        golfAustraliaId: '12345678',
        status: 'pending' // Invalid - must be active or inactive
      }

      const result = memberCSVRowSchema.safeParse(invalidStatusRow)
      expect(result.success).toBe(false)
    })

    it('should accept case-insensitive status values', () => {
      const activeRow = {
        fullName: 'John Doe',
        golfAustraliaId: '12345678',
        status: 'ACTIVE'
      }

      const inactiveRow = {
        fullName: 'Jane Doe',
        golfAustraliaId: '87654321',
        status: 'Inactive'
      }

      expect(memberCSVRowSchema.safeParse(activeRow).success).toBe(true)
      expect(memberCSVRowSchema.safeParse(inactiveRow).success).toBe(true)
    })

    it('should validate account balance is numeric', () => {
      const invalidBalanceRow = {
        fullName: 'John Doe',
        golfAustraliaId: '12345678',
        accountBalance: 'not-a-number'
      }

      const result = memberCSVRowSchema.safeParse(invalidBalanceRow)
      expect(result.success).toBe(false)
    })

    it('should accept numeric account balance as string', () => {
      const validBalanceRow = {
        fullName: 'John Doe',
        golfAustraliaId: '12345678',
        accountBalance: '-150.50'
      }

      const result = memberCSVRowSchema.safeParse(validBalanceRow)
      expect(result.success).toBe(true)
    })
  })
})
