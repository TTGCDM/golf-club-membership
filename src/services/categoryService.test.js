import { describe, it, expect } from 'vitest'
import {
  calculateDefaultProRataRate,
  generateDefaultProRataRates,
  calculateProRataFeeSync,
  findCategoryByAge
} from './categoryService'

/**
 * Category Service Tests - Pro-Rata Rate Calculations
 *
 * These tests verify the pro-rata rate calculation logic.
 * Membership year runs March (month 3) to February (month 2).
 *
 * Pro-rata formula: monthsRemaining / 12 * annualFee
 * - March = 12/12 (full year)
 * - April = 11/12
 * - ...
 * - February = 1/12
 */

describe('Pro-Rata Rate Calculations', () => {
  describe('calculateDefaultProRataRate', () => {
    const annualFee = 480 // Common test value

    describe('membership year start (March)', () => {
      it('should return full fee for March (12/12)', () => {
        const rate = calculateDefaultProRataRate(annualFee, 3)
        expect(rate).toBe(480) // 12/12 * 480 = 480
      })
    })

    describe('membership year progression', () => {
      it('should return 11/12 for April', () => {
        const rate = calculateDefaultProRataRate(annualFee, 4)
        expect(rate).toBe(440) // 11/12 * 480 = 440
      })

      it('should return 10/12 for May', () => {
        const rate = calculateDefaultProRataRate(annualFee, 5)
        expect(rate).toBe(400) // 10/12 * 480 = 400
      })

      it('should return 9/12 for June', () => {
        const rate = calculateDefaultProRataRate(annualFee, 6)
        expect(rate).toBe(360) // 9/12 * 480 = 360
      })

      it('should return 8/12 for July', () => {
        const rate = calculateDefaultProRataRate(annualFee, 7)
        expect(rate).toBe(320) // 8/12 * 480 = 320
      })

      it('should return 7/12 for August', () => {
        const rate = calculateDefaultProRataRate(annualFee, 8)
        expect(rate).toBe(280) // 7/12 * 480 = 280
      })

      it('should return 6/12 for September', () => {
        const rate = calculateDefaultProRataRate(annualFee, 9)
        expect(rate).toBe(240) // 6/12 * 480 = 240
      })

      it('should return 5/12 for October', () => {
        const rate = calculateDefaultProRataRate(annualFee, 10)
        expect(rate).toBe(200) // 5/12 * 480 = 200
      })

      it('should return 4/12 for November', () => {
        const rate = calculateDefaultProRataRate(annualFee, 11)
        expect(rate).toBe(160) // 4/12 * 480 = 160
      })

      it('should return 3/12 for December', () => {
        const rate = calculateDefaultProRataRate(annualFee, 12)
        expect(rate).toBe(120) // 3/12 * 480 = 120
      })
    })

    describe('calendar year months (Jan/Feb)', () => {
      it('should return 2/12 for January', () => {
        const rate = calculateDefaultProRataRate(annualFee, 1)
        expect(rate).toBe(80) // 2/12 * 480 = 80
      })

      it('should return 1/12 for February (end of membership year)', () => {
        const rate = calculateDefaultProRataRate(annualFee, 2)
        expect(rate).toBe(40) // 1/12 * 480 = 40
      })
    })

    describe('rounding behavior', () => {
      it('should round to nearest integer', () => {
        // $100 annual fee: April = 11/12 * 100 = 91.67 -> 92
        const rate = calculateDefaultProRataRate(100, 4)
        expect(rate).toBe(92)
      })

      it('should handle fees that divide evenly by 12', () => {
        // $120 annual fee divides evenly by 12
        const rate = calculateDefaultProRataRate(120, 9) // 6/12 * 120 = 60
        expect(rate).toBe(60)
      })

      it('should round correctly for small fees', () => {
        // $50 annual fee: March = 12/12 * 50 = 50
        const rate = calculateDefaultProRataRate(50, 3)
        expect(rate).toBe(50)
      })
    })

    describe('edge cases', () => {
      it('should return 0 for $0 annual fee', () => {
        const rate = calculateDefaultProRataRate(0, 3)
        expect(rate).toBe(0)
      })

      it('should handle large annual fees', () => {
        const rate = calculateDefaultProRataRate(10000, 3)
        expect(rate).toBe(10000)
      })

      it('should calculate correctly for all real membership categories', () => {
        // Test with actual category fees from the system
        const categories = [
          { fee: 50, marchRate: 50 },     // Junior 10-12
          { fee: 120, marchRate: 120 },   // Junior 13-15
          { fee: 180, marchRate: 180 },   // Junior 16-18
          { fee: 300, marchRate: 300 },   // Colts
          { fee: 480, marchRate: 480 },   // Full Membership
          { fee: 435, marchRate: 435 },   // Senior Full
          { fee: 75, marchRate: 75 },     // Life & Honorary
          { fee: 40, marchRate: 40 }      // Non-playing/Social
        ]

        categories.forEach(({ fee, marchRate }) => {
          expect(calculateDefaultProRataRate(fee, 3)).toBe(marchRate)
        })
      })
    })
  })

  describe('generateDefaultProRataRates', () => {
    it('should generate rates for all 12 months', () => {
      const rates = generateDefaultProRataRates(480)

      expect(Object.keys(rates)).toHaveLength(12)
      expect(rates).toHaveProperty('1')
      expect(rates).toHaveProperty('2')
      expect(rates).toHaveProperty('3')
      expect(rates).toHaveProperty('4')
      expect(rates).toHaveProperty('5')
      expect(rates).toHaveProperty('6')
      expect(rates).toHaveProperty('7')
      expect(rates).toHaveProperty('8')
      expect(rates).toHaveProperty('9')
      expect(rates).toHaveProperty('10')
      expect(rates).toHaveProperty('11')
      expect(rates).toHaveProperty('12')
    })

    it('should use string keys for months', () => {
      const rates = generateDefaultProRataRates(480)

      // Keys should be strings "1" through "12"
      Object.keys(rates).forEach(key => {
        expect(typeof key).toBe('string')
        expect(parseInt(key)).toBeGreaterThanOrEqual(1)
        expect(parseInt(key)).toBeLessThanOrEqual(12)
      })
    })

    it('should generate correct values for $480 annual fee', () => {
      const rates = generateDefaultProRataRates(480)

      // Membership year order (March = 12/12, Feb = 1/12)
      expect(rates['3']).toBe(480)   // March - 12/12
      expect(rates['4']).toBe(440)   // April - 11/12
      expect(rates['5']).toBe(400)   // May - 10/12
      expect(rates['6']).toBe(360)   // June - 9/12
      expect(rates['7']).toBe(320)   // July - 8/12
      expect(rates['8']).toBe(280)   // August - 7/12
      expect(rates['9']).toBe(240)   // September - 6/12
      expect(rates['10']).toBe(200)  // October - 5/12
      expect(rates['11']).toBe(160)  // November - 4/12
      expect(rates['12']).toBe(120)  // December - 3/12
      expect(rates['1']).toBe(80)    // January - 2/12
      expect(rates['2']).toBe(40)    // February - 1/12
    })

    it('should generate correct values for $300 annual fee (Colts)', () => {
      const rates = generateDefaultProRataRates(300)

      expect(rates['3']).toBe(300)   // March - full
      expect(rates['9']).toBe(150)   // September - 6/12
      expect(rates['2']).toBe(25)    // February - 1/12
    })

    it('should handle $0 annual fee', () => {
      const rates = generateDefaultProRataRates(0)

      Object.values(rates).forEach(rate => {
        expect(rate).toBe(0)
      })
    })

    it('should produce decreasing rates from March to February', () => {
      const rates = generateDefaultProRataRates(480)

      // Membership year order
      const membershipYearOrder = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2]

      for (let i = 0; i < membershipYearOrder.length - 1; i++) {
        const currentMonth = String(membershipYearOrder[i])
        const nextMonth = String(membershipYearOrder[i + 1])
        expect(rates[currentMonth]).toBeGreaterThan(rates[nextMonth])
      }
    })

    it('should return numeric values', () => {
      const rates = generateDefaultProRataRates(480)

      Object.values(rates).forEach(rate => {
        expect(typeof rate).toBe('number')
        expect(Number.isInteger(rate)).toBe(true)
      })
    })
  })

  describe('Rate Lookup Logic', () => {
    // These tests verify the logic used in calculateProRataFee
    // without requiring Firebase

    it('should use stored rate when available', () => {
      const storedRates = { '3': 500, '4': 450 } // Custom rates
      const month = 3
      const monthKey = String(month)
      const annualFee = 480

      // Logic from calculateProRataFee
      const rate = storedRates[monthKey] !== undefined
        ? storedRates[monthKey]
        : calculateDefaultProRataRate(annualFee, month)

      expect(rate).toBe(500) // Uses stored rate
    })

    it('should fall back to formula when rate not stored', () => {
      const storedRates = { '3': 500 } // Only March stored
      const month = 4 // April not stored
      const monthKey = String(month)
      const annualFee = 480

      const rate = storedRates[monthKey] !== undefined
        ? storedRates[monthKey]
        : calculateDefaultProRataRate(annualFee, month)

      expect(rate).toBe(440) // Falls back to formula: 11/12 * 480
    })

    it('should fall back to formula when proRataRates is undefined', () => {
      const storedRates = undefined
      const month = 3
      const monthKey = String(month)
      const annualFee = 480

      const rate = storedRates?.[monthKey] !== undefined
        ? storedRates[monthKey]
        : calculateDefaultProRataRate(annualFee, month)

      expect(rate).toBe(480) // Falls back to formula
    })

    it('should fall back to formula when proRataRates is empty', () => {
      const storedRates = {}
      const month = 6
      const monthKey = String(month)
      const annualFee = 480

      const rate = storedRates[monthKey] !== undefined
        ? storedRates[monthKey]
        : calculateDefaultProRataRate(annualFee, month)

      expect(rate).toBe(360) // Falls back to formula: 9/12 * 480
    })

    it('should allow $0 as a valid stored rate', () => {
      const storedRates = { '2': 0 } // Free February joins
      const month = 2
      const monthKey = String(month)
      const annualFee = 480

      const rate = storedRates[monthKey] !== undefined
        ? storedRates[monthKey]
        : calculateDefaultProRataRate(annualFee, month)

      expect(rate).toBe(0) // Uses stored $0 rate
    })
  })

  describe('Annual Fee Application Logic', () => {
    // These tests verify the logic used in feeService for annual renewals

    it('should use March rate for annual fee application', () => {
      const proRataRates = generateDefaultProRataRates(480)
      const annualFee = 480

      // Logic from feeService.js
      const marchRate = proRataRates?.['3'] ?? annualFee

      expect(marchRate).toBe(480)
    })

    it('should use overridden March rate if set', () => {
      const proRataRates = { '3': 500, '4': 450 } // Custom March rate
      const annualFee = 480

      const marchRate = proRataRates?.['3'] ?? annualFee

      expect(marchRate).toBe(500) // Uses custom rate
    })

    it('should fall back to annualFee if proRataRates missing', () => {
      const proRataRates = undefined
      const annualFee = 480

      const marchRate = proRataRates?.['3'] ?? annualFee

      expect(marchRate).toBe(480)
    })

    it('should fall back to annualFee if March rate missing', () => {
      const proRataRates = { '4': 450 } // No March rate
      const annualFee = 480

      const marchRate = proRataRates?.['3'] ?? annualFee

      expect(marchRate).toBe(480)
    })

    it('should allow category fee override', () => {
      const proRataRates = { '3': 480 }
      const annualFee = 480
      const categoryFees = { 'cat1': 450 } // Admin override
      const categoryId = 'cat1'

      const marchRate = proRataRates?.['3'] ?? annualFee
      const feeAmount = categoryFees[categoryId] !== undefined
        ? categoryFees[categoryId]
        : marchRate

      expect(feeAmount).toBe(450) // Uses admin override
    })

    it('should use March rate when no override provided', () => {
      const proRataRates = { '3': 500 } // Custom March rate
      const annualFee = 480
      const categoryFees = {} // No overrides
      const categoryId = 'cat1'

      const marchRate = proRataRates?.['3'] ?? annualFee
      const feeAmount = categoryFees[categoryId] !== undefined
        ? categoryFees[categoryId]
        : marchRate

      expect(feeAmount).toBe(500) // Uses March rate from table
    })
  })

  describe('Total Fee Calculation (Rate + Joining Fee)', () => {
    it('should add joining fee to pro-rata rate', () => {
      const proRataRate = 480
      const joiningFee = 25
      const total = proRataRate + joiningFee

      expect(total).toBe(505)
    })

    it('should handle $0 joining fee', () => {
      const proRataRate = 120 // Junior category
      const joiningFee = 0
      const total = proRataRate + joiningFee

      expect(total).toBe(120)
    })

    it('should calculate correct totals for each month', () => {
      const annualFee = 480
      const joiningFee = 25
      const rates = generateDefaultProRataRates(annualFee)

      // Expected totals (rate + $25 joining fee)
      const expectedTotals = {
        '3': 505,  // 480 + 25
        '4': 465,  // 440 + 25
        '5': 425,  // 400 + 25
        '6': 385,  // 360 + 25
        '7': 345,  // 320 + 25
        '8': 305,  // 280 + 25
        '9': 265,  // 240 + 25
        '10': 225, // 200 + 25
        '11': 185, // 160 + 25
        '12': 145, // 120 + 25
        '1': 105,  // 80 + 25
        '2': 65    // 40 + 25
      }

      Object.entries(expectedTotals).forEach(([month, expectedTotal]) => {
        const total = rates[month] + joiningFee
        expect(total).toBe(expectedTotal)
      })
    })
  })
})

/**
 * Sync Helper Function Tests
 *
 * These tests verify the synchronous helper functions used in public forms
 * where categories are pre-loaded and no database access is needed.
 */
describe('calculateProRataFeeSync', () => {
  // Sample category for testing (Full Membership)
  const fullMembershipCategory = {
    id: 'full-membership',
    name: 'Full Membership',
    annualFee: 480,
    joiningFee: 25,
    joiningFeeMonths: [], // Applies year-round
    proRataRates: generateDefaultProRataRates(480)
  }

  // Colts category with conditional joining fee
  const coltsCategory = {
    id: 'colts',
    name: 'Colts',
    annualFee: 300,
    joiningFee: 50,
    joiningFeeMonths: [8, 9, 10, 11, 12], // Aug-Dec only
    proRataRates: generateDefaultProRataRates(300)
  }

  // Junior category with no joining fee
  const juniorCategory = {
    id: 'junior',
    name: 'Junior 10-12 years',
    annualFee: 50,
    joiningFee: 0,
    joiningFeeMonths: [],
    proRataRates: generateDefaultProRataRates(50)
  }

  describe('returns correct structure', () => {
    it('should return all expected properties', () => {
      const result = calculateProRataFeeSync(fullMembershipCategory, new Date(2024, 2, 15)) // March

      expect(result).toHaveProperty('proRataSubscription')
      expect(result).toHaveProperty('joiningFee')
      expect(result).toHaveProperty('total')
      expect(result).toHaveProperty('monthsRemaining')
      expect(result).toHaveProperty('currentMonth')
    })

    it('should return numeric values', () => {
      const result = calculateProRataFeeSync(fullMembershipCategory, new Date(2024, 2, 15))

      expect(typeof result.proRataSubscription).toBe('number')
      expect(typeof result.joiningFee).toBe('number')
      expect(typeof result.total).toBe('number')
      expect(typeof result.monthsRemaining).toBe('number')
      expect(typeof result.currentMonth).toBe('number')
    })
  })

  describe('pro-rata subscription calculations', () => {
    it('should calculate full fee for March (12/12)', () => {
      const result = calculateProRataFeeSync(fullMembershipCategory, new Date(2024, 2, 15)) // March
      expect(result.proRataSubscription).toBe(480)
      expect(result.monthsRemaining).toBe(12)
      expect(result.currentMonth).toBe(3)
    })

    it('should calculate correctly for mid-year (September = 6/12)', () => {
      const result = calculateProRataFeeSync(fullMembershipCategory, new Date(2024, 8, 15)) // September
      expect(result.proRataSubscription).toBe(240)
      expect(result.monthsRemaining).toBe(6)
      expect(result.currentMonth).toBe(9)
    })

    it('should calculate minimum for February (1/12)', () => {
      const result = calculateProRataFeeSync(fullMembershipCategory, new Date(2024, 1, 15)) // February
      expect(result.proRataSubscription).toBe(40)
      expect(result.monthsRemaining).toBe(1)
      expect(result.currentMonth).toBe(2)
    })

    it('should calculate for January (2/12)', () => {
      const result = calculateProRataFeeSync(fullMembershipCategory, new Date(2024, 0, 15)) // January
      expect(result.proRataSubscription).toBe(80)
      expect(result.monthsRemaining).toBe(2)
      expect(result.currentMonth).toBe(1)
    })
  })

  describe('joining fee logic', () => {
    it('should include joining fee when applies year-round', () => {
      const result = calculateProRataFeeSync(fullMembershipCategory, new Date(2024, 2, 15)) // March
      expect(result.joiningFee).toBe(25)
      expect(result.total).toBe(505) // 480 + 25
    })

    it('should not include joining fee for junior categories', () => {
      const result = calculateProRataFeeSync(juniorCategory, new Date(2024, 2, 15)) // March
      expect(result.joiningFee).toBe(0)
      expect(result.total).toBe(50)
    })

    it('should include joining fee for Colts in August (within months)', () => {
      const result = calculateProRataFeeSync(coltsCategory, new Date(2024, 7, 15)) // August
      expect(result.joiningFee).toBe(50)
      expect(result.proRataSubscription).toBe(175) // 7/12 * 300
      expect(result.total).toBe(225)
    })

    it('should NOT include joining fee for Colts in March (outside months)', () => {
      const result = calculateProRataFeeSync(coltsCategory, new Date(2024, 2, 15)) // March
      expect(result.joiningFee).toBe(0)
      expect(result.proRataSubscription).toBe(300)
      expect(result.total).toBe(300) // No joining fee
    })

    it('should include joining fee for Colts in December (within months)', () => {
      const result = calculateProRataFeeSync(coltsCategory, new Date(2024, 11, 15)) // December
      expect(result.joiningFee).toBe(50)
      expect(result.proRataSubscription).toBe(75) // 3/12 * 300
      expect(result.total).toBe(125)
    })
  })

  describe('edge cases', () => {
    it('should return zeros for null category', () => {
      const result = calculateProRataFeeSync(null)
      expect(result.proRataSubscription).toBe(0)
      expect(result.joiningFee).toBe(0)
      expect(result.total).toBe(0)
      expect(result.monthsRemaining).toBe(0)
      expect(result.currentMonth).toBe(0)
    })

    it('should return zeros for undefined category', () => {
      const result = calculateProRataFeeSync(undefined)
      expect(result.proRataSubscription).toBe(0)
      expect(result.joiningFee).toBe(0)
      expect(result.total).toBe(0)
    })

    it('should use default date (today) when no date provided', () => {
      const result = calculateProRataFeeSync(fullMembershipCategory)
      const currentMonth = new Date().getMonth() + 1
      expect(result.currentMonth).toBe(currentMonth)
    })

    it('should fall back to formula when proRataRates missing', () => {
      const categoryWithoutRates = {
        ...fullMembershipCategory,
        proRataRates: undefined
      }
      const result = calculateProRataFeeSync(categoryWithoutRates, new Date(2024, 2, 15)) // March
      expect(result.proRataSubscription).toBe(480) // Formula: 12/12 * 480
    })

    it('should fall back to formula when specific month rate missing', () => {
      const categoryWithPartialRates = {
        ...fullMembershipCategory,
        proRataRates: { '3': 500 } // Only March defined
      }
      const result = calculateProRataFeeSync(categoryWithPartialRates, new Date(2024, 3, 15)) // April
      expect(result.proRataSubscription).toBe(440) // Formula: 11/12 * 480
    })

    it('should use stored rate when available', () => {
      const categoryWithCustomRate = {
        ...fullMembershipCategory,
        proRataRates: { '3': 500, '4': 450 } // Custom rates
      }
      const result = calculateProRataFeeSync(categoryWithCustomRate, new Date(2024, 2, 15)) // March
      expect(result.proRataSubscription).toBe(500) // Uses stored rate
    })

    it('should allow $0 as valid stored rate', () => {
      const categoryWithZeroRate = {
        ...fullMembershipCategory,
        proRataRates: { '2': 0 } // Free February joins
      }
      const result = calculateProRataFeeSync(categoryWithZeroRate, new Date(2024, 1, 15)) // February
      expect(result.proRataSubscription).toBe(0)
    })
  })

  describe('total calculation', () => {
    it('should correctly sum subscription and joining fee', () => {
      const result = calculateProRataFeeSync(fullMembershipCategory, new Date(2024, 8, 15)) // September
      expect(result.total).toBe(result.proRataSubscription + result.joiningFee)
      expect(result.total).toBe(265) // 240 + 25
    })
  })
})

describe('findCategoryByAge', () => {
  // Sample categories array
  const sampleCategories = [
    { id: 'junior-10-12', name: 'Junior 10-12 years', ageMin: 10, ageMax: 12, isSpecial: false },
    { id: 'junior-13-15', name: 'Junior 13-15 years', ageMin: 13, ageMax: 15, isSpecial: false },
    { id: 'junior-16-18', name: 'Junior 16-18 years', ageMin: 16, ageMax: 18, isSpecial: false },
    { id: 'colts', name: 'Colts', ageMin: 19, ageMax: 23, isSpecial: false },
    { id: 'full', name: 'Full Membership', ageMin: 24, ageMax: 64, isSpecial: false },
    { id: 'senior', name: 'Senior Full Membership', ageMin: 65, ageMax: 74, isSpecial: false },
    { id: 'life', name: 'Life & Honorary Members', ageMin: 75, ageMax: 999, isSpecial: false },
    { id: 'social', name: 'Non-playing/Social', ageMin: 0, ageMax: 999, isSpecial: true }
  ]

  describe('finds correct category by age', () => {
    it('should find Junior 10-12 for age 10', () => {
      const result = findCategoryByAge(sampleCategories, 10)
      expect(result?.id).toBe('junior-10-12')
    })

    it('should find Junior 10-12 for age 12 (upper bound)', () => {
      const result = findCategoryByAge(sampleCategories, 12)
      expect(result?.id).toBe('junior-10-12')
    })

    it('should find Junior 13-15 for age 13 (lower bound)', () => {
      const result = findCategoryByAge(sampleCategories, 13)
      expect(result?.id).toBe('junior-13-15')
    })

    it('should find Colts for age 19', () => {
      const result = findCategoryByAge(sampleCategories, 19)
      expect(result?.id).toBe('colts')
    })

    it('should find Colts for age 23 (upper bound)', () => {
      const result = findCategoryByAge(sampleCategories, 23)
      expect(result?.id).toBe('colts')
    })

    it('should find Full Membership for age 24 (lower bound)', () => {
      const result = findCategoryByAge(sampleCategories, 24)
      expect(result?.id).toBe('full')
    })

    it('should find Full Membership for age 40', () => {
      const result = findCategoryByAge(sampleCategories, 40)
      expect(result?.id).toBe('full')
    })

    it('should find Full Membership for age 64 (upper bound)', () => {
      const result = findCategoryByAge(sampleCategories, 64)
      expect(result?.id).toBe('full')
    })

    it('should find Senior for age 65', () => {
      const result = findCategoryByAge(sampleCategories, 65)
      expect(result?.id).toBe('senior')
    })

    it('should find Life & Honorary for age 75', () => {
      const result = findCategoryByAge(sampleCategories, 75)
      expect(result?.id).toBe('life')
    })

    it('should find Life & Honorary for age 90', () => {
      const result = findCategoryByAge(sampleCategories, 90)
      expect(result?.id).toBe('life')
    })
  })

  describe('excludes special categories', () => {
    it('should NOT return Non-playing/Social even for age 0', () => {
      // Social category has ageMin: 0, ageMax: 999, but is special
      // Should return null since age 0 doesn't match any non-special category
      const result = findCategoryByAge(sampleCategories, 0)
      expect(result).toBeNull()
    })

    it('should NOT return Non-playing/Social for age 50', () => {
      // Should return Full Membership, not Social
      const result = findCategoryByAge(sampleCategories, 50)
      expect(result?.id).toBe('full')
      expect(result?.isSpecial).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('should return null for null categories', () => {
      const result = findCategoryByAge(null, 30)
      expect(result).toBeNull()
    })

    it('should return null for undefined categories', () => {
      const result = findCategoryByAge(undefined, 30)
      expect(result).toBeNull()
    })

    it('should return null for empty categories array', () => {
      const result = findCategoryByAge([], 30)
      expect(result).toBeNull()
    })

    it('should return null for null age', () => {
      const result = findCategoryByAge(sampleCategories, null)
      expect(result).toBeNull()
    })

    it('should return null for undefined age', () => {
      const result = findCategoryByAge(sampleCategories, undefined)
      expect(result).toBeNull()
    })

    it('should return null for age below all non-special categories', () => {
      const result = findCategoryByAge(sampleCategories, 5)
      expect(result).toBeNull()
    })

    it('should handle age 0 correctly', () => {
      // No non-special category starts at age 0
      const result = findCategoryByAge(sampleCategories, 0)
      expect(result).toBeNull()
    })

    it('should find first matching category when multiple could match', () => {
      // Categories should be in order, first match wins
      const categoriesWithOverlap = [
        { id: 'first', name: 'First', ageMin: 20, ageMax: 30, isSpecial: false },
        { id: 'second', name: 'Second', ageMin: 25, ageMax: 35, isSpecial: false }
      ]
      const result = findCategoryByAge(categoriesWithOverlap, 27)
      expect(result?.id).toBe('first') // First matching category wins
    })
  })

  describe('boundary testing', () => {
    it('should correctly handle exact ageMin boundary', () => {
      const result = findCategoryByAge(sampleCategories, 16)
      expect(result?.id).toBe('junior-16-18')
    })

    it('should correctly handle exact ageMax boundary', () => {
      const result = findCategoryByAge(sampleCategories, 18)
      expect(result?.id).toBe('junior-16-18')
    })

    it('should correctly transition between categories', () => {
      // Age 18 = Junior 16-18, Age 19 = Colts
      const at18 = findCategoryByAge(sampleCategories, 18)
      const at19 = findCategoryByAge(sampleCategories, 19)

      expect(at18?.id).toBe('junior-16-18')
      expect(at19?.id).toBe('colts')
    })
  })
})
