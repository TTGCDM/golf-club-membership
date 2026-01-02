import { describe, it, expect } from 'vitest'
import {
  transformApplicationFormData,
  validateApplicationForm,
  applicationFormSchema
} from './application'

/**
 * Application Schema Tests
 *
 * Tests for application form validation and data transformation.
 */

describe('transformApplicationFormData', () => {
  // Base valid form data
  const baseFormData = {
    title: 'Mr',
    fullName: '  John Smith  ',
    streetAddress: '  123 Golf Drive  ',
    suburb: '  Tea Tree  ',
    state: 'TAS',
    postcode: '7017',
    email: '  John.Smith@Example.COM  ',
    phoneHome: '03 6268 1234',
    phoneWork: '',
    phoneMobile: '0412 345 678',
    dateOfBirth: '1985-06-15',
    previousClubs: '  Rosny Golf Club  ',
    golfLinkNumber: '1234567890',
    lastHandicap: '15',
    membershipCategoryId: 'cat-123',
    membershipCategoryName: 'Full Membership',
    agreedToTerms: true
  }

  describe('basic transformation', () => {
    it('should transform form data with all fields', () => {
      const result = transformApplicationFormData(baseFormData)

      expect(result).toHaveProperty('title')
      expect(result).toHaveProperty('fullName')
      expect(result).toHaveProperty('streetAddress')
      expect(result).toHaveProperty('suburb')
      expect(result).toHaveProperty('state')
      expect(result).toHaveProperty('postcode')
      expect(result).toHaveProperty('email')
      expect(result).toHaveProperty('phoneHome')
      expect(result).toHaveProperty('phoneWork')
      expect(result).toHaveProperty('phoneMobile')
      expect(result).toHaveProperty('dateOfBirth')
      expect(result).toHaveProperty('previousClubs')
      expect(result).toHaveProperty('golfLinkNumber')
      expect(result).toHaveProperty('lastHandicap')
      expect(result).toHaveProperty('membershipCategoryId')
      expect(result).toHaveProperty('membershipCategoryName')
    })

    it('should trim whitespace from string fields', () => {
      const result = transformApplicationFormData(baseFormData)

      expect(result.fullName).toBe('John Smith')
      expect(result.streetAddress).toBe('123 Golf Drive')
      expect(result.suburb).toBe('Tea Tree')
      expect(result.previousClubs).toBe('Rosny Golf Club')
    })

    it('should lowercase email address', () => {
      const result = transformApplicationFormData(baseFormData)

      expect(result.email).toBe('john.smith@example.com')
    })

    it('should preserve state value', () => {
      const result = transformApplicationFormData(baseFormData)

      expect(result.state).toBe('TAS')
    })

    it('should preserve date of birth', () => {
      const result = transformApplicationFormData(baseFormData)

      expect(result.dateOfBirth).toBe('1985-06-15')
    })

    it('should preserve membership category info', () => {
      const result = transformApplicationFormData(baseFormData)

      expect(result.membershipCategoryId).toBe('cat-123')
      expect(result.membershipCategoryName).toBe('Full Membership')
    })
  })

  describe('optional fields', () => {
    it('should handle empty optional fields', () => {
      const formData = {
        ...baseFormData,
        phoneHome: '',
        phoneWork: '',
        previousClubs: '',
        golfLinkNumber: '',
        lastHandicap: ''
      }

      const result = transformApplicationFormData(formData)

      expect(result.phoneHome).toBe('')
      expect(result.phoneWork).toBe('')
      expect(result.previousClubs).toBe('')
      expect(result.golfLinkNumber).toBe('')
      expect(result.lastHandicap).toBe('')
    })

    it('should handle undefined optional fields', () => {
      const formData = {
        ...baseFormData,
        phoneHome: undefined,
        phoneWork: undefined,
        previousClubs: undefined,
        golfLinkNumber: undefined,
        lastHandicap: undefined
      }

      const result = transformApplicationFormData(formData)

      expect(result.phoneHome).toBe('')
      expect(result.phoneWork).toBe('')
      expect(result.previousClubs).toBe('')
      expect(result.golfLinkNumber).toBe('')
      expect(result.lastHandicap).toBe('')
    })

    it('should handle null optional fields', () => {
      const formData = {
        ...baseFormData,
        phoneHome: null,
        phoneMobile: null
      }

      const result = transformApplicationFormData(formData)

      expect(result.phoneHome).toBe('')
      expect(result.phoneMobile).toBe('')
    })
  })

  describe('title handling', () => {
    it('should preserve title when provided', () => {
      const result = transformApplicationFormData(baseFormData)
      expect(result.title).toBe('Mr')
    })

    it('should handle empty title', () => {
      const formData = { ...baseFormData, title: '' }
      const result = transformApplicationFormData(formData)
      expect(result.title).toBe('')
    })

    it('should handle undefined title', () => {
      const formData = { ...baseFormData, title: undefined }
      const result = transformApplicationFormData(formData)
      expect(result.title).toBe('')
    })
  })

  describe('cost estimate handling', () => {
    const costEstimate = {
      proRataSubscription: 240,
      joiningFee: 25,
      total: 265
    }

    it('should include cost estimate when provided', () => {
      const result = transformApplicationFormData(baseFormData, costEstimate)

      expect(result.estimatedProRataFee).toBe(240)
      expect(result.estimatedJoiningFee).toBe(25)
      expect(result.estimatedTotalCost).toBe(265)
      expect(result.estimatedCostCalculatedAt).toBeDefined()
    })

    it('should include ISO timestamp for cost calculation', () => {
      const result = transformApplicationFormData(baseFormData, costEstimate)

      // Should be a valid ISO date string
      expect(result.estimatedCostCalculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    it('should NOT include cost fields when estimate is null', () => {
      const result = transformApplicationFormData(baseFormData, null)

      expect(result.estimatedProRataFee).toBeUndefined()
      expect(result.estimatedJoiningFee).toBeUndefined()
      expect(result.estimatedTotalCost).toBeUndefined()
      expect(result.estimatedCostCalculatedAt).toBeUndefined()
    })

    it('should NOT include cost fields when estimate is not provided', () => {
      const result = transformApplicationFormData(baseFormData)

      expect(result.estimatedProRataFee).toBeUndefined()
      expect(result.estimatedJoiningFee).toBeUndefined()
      expect(result.estimatedTotalCost).toBeUndefined()
    })

    it('should handle zero values in cost estimate', () => {
      const zeroCostEstimate = {
        proRataSubscription: 0,
        joiningFee: 0,
        total: 0
      }

      const result = transformApplicationFormData(baseFormData, zeroCostEstimate)

      expect(result.estimatedProRataFee).toBe(0)
      expect(result.estimatedJoiningFee).toBe(0)
      expect(result.estimatedTotalCost).toBe(0)
    })
  })

  describe('membership category name handling', () => {
    it('should include category name when provided', () => {
      const result = transformApplicationFormData(baseFormData)
      expect(result.membershipCategoryName).toBe('Full Membership')
    })

    it('should default to empty string when category name missing', () => {
      const formData = {
        ...baseFormData,
        membershipCategoryName: undefined
      }
      const result = transformApplicationFormData(formData)
      expect(result.membershipCategoryName).toBe('')
    })
  })
})

describe('applicationFormSchema validation', () => {
  // Base valid form data
  const validFormData = {
    title: 'Mr',
    fullName: 'John Smith',
    streetAddress: '123 Golf Drive',
    suburb: 'Tea Tree',
    state: 'TAS',
    postcode: '7017',
    email: 'john@example.com',
    phoneMobile: '0412345678',
    dateOfBirth: '1985-06-15',
    membershipCategoryId: 'cat-123',
    agreedToTerms: true
  }

  describe('valid data', () => {
    it('should accept valid form data', () => {
      const result = applicationFormSchema.safeParse(validFormData)
      expect(result.success).toBe(true)
    })

    it('should accept all Australian states', () => {
      const states = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'NT', 'ACT']

      states.forEach(state => {
        const formData = { ...validFormData, state }
        const result = applicationFormSchema.safeParse(formData)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('required fields', () => {
    it('should reject missing fullName', () => {
      const formData = { ...validFormData, fullName: '' }
      const result = applicationFormSchema.safeParse(formData)
      expect(result.success).toBe(false)
    })

    it('should reject missing streetAddress', () => {
      const formData = { ...validFormData, streetAddress: '' }
      const result = applicationFormSchema.safeParse(formData)
      expect(result.success).toBe(false)
    })

    it('should reject missing suburb', () => {
      const formData = { ...validFormData, suburb: '' }
      const result = applicationFormSchema.safeParse(formData)
      expect(result.success).toBe(false)
    })

    it('should reject missing membershipCategoryId', () => {
      const formData = { ...validFormData, membershipCategoryId: '' }
      const result = applicationFormSchema.safeParse(formData)
      expect(result.success).toBe(false)
    })
  })

  describe('email validation', () => {
    it('should accept valid email', () => {
      const formData = { ...validFormData, email: 'test@example.com' }
      const result = applicationFormSchema.safeParse(formData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email format', () => {
      const formData = { ...validFormData, email: 'invalid-email' }
      const result = applicationFormSchema.safeParse(formData)
      expect(result.success).toBe(false)
    })

    it('should reject email without domain', () => {
      const formData = { ...validFormData, email: 'test@' }
      const result = applicationFormSchema.safeParse(formData)
      expect(result.success).toBe(false)
    })
  })

  describe('postcode validation', () => {
    it('should accept 4-digit postcode', () => {
      const formData = { ...validFormData, postcode: '7000' }
      const result = applicationFormSchema.safeParse(formData)
      expect(result.success).toBe(true)
    })

    it('should reject non-numeric postcode', () => {
      const formData = { ...validFormData, postcode: 'ABCD' }
      const result = applicationFormSchema.safeParse(formData)
      expect(result.success).toBe(false)
    })

    it('should reject 3-digit postcode', () => {
      const formData = { ...validFormData, postcode: '700' }
      const result = applicationFormSchema.safeParse(formData)
      expect(result.success).toBe(false)
    })
  })

  describe('terms agreement', () => {
    it('should accept agreed terms (true)', () => {
      const formData = { ...validFormData, agreedToTerms: true }
      const result = applicationFormSchema.safeParse(formData)
      expect(result.success).toBe(true)
    })

    it('should reject unaccepted terms (false)', () => {
      const formData = { ...validFormData, agreedToTerms: false }
      const result = applicationFormSchema.safeParse(formData)
      expect(result.success).toBe(false)
    })
  })
})

describe('validateApplicationForm', () => {
  it('should return success true for valid data', () => {
    const validData = {
      title: 'Mr',
      fullName: 'John Smith',
      streetAddress: '123 Golf Drive',
      suburb: 'Tea Tree',
      state: 'TAS',
      postcode: '7017',
      email: 'john@example.com',
      dateOfBirth: '1985-06-15',
      membershipCategoryId: 'cat-123',
      agreedToTerms: true
    }

    const result = validateApplicationForm(validData)
    expect(result.success).toBe(true)
  })

  it('should return success false for invalid data', () => {
    const invalidData = {
      fullName: '',
      email: 'invalid'
    }

    const result = validateApplicationForm(invalidData)
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })
})
