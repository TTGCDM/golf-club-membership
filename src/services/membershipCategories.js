// Membership categories and their fee structures for 2025
export const MEMBERSHIP_CATEGORIES = {
  JUNIOR_10_12: {
    id: 'junior_10_12',
    name: 'Junior 10-12 years',
    ageMin: 10,
    ageMax: 12,
    playingRights: '7 days',
    annualFee: 50,
    joiningFee: 0,
    order: 1
  },
  JUNIOR_13_15: {
    id: 'junior_13_15',
    name: 'Junior 13-15 years',
    ageMin: 13,
    ageMax: 15,
    playingRights: '7 days',
    annualFee: 120,
    joiningFee: 0,
    order: 2
  },
  JUNIOR_16_18: {
    id: 'junior_16_18',
    name: 'Junior 16-18 years',
    ageMin: 16,
    ageMax: 18,
    playingRights: '7 days',
    annualFee: 180,
    joiningFee: 0,
    order: 3
  },
  COLTS: {
    id: 'colts',
    name: 'Colts',
    ageMin: 19,
    ageMax: 23,
    playingRights: '7 days',
    annualFee: 300,
    joiningFee: 50, // Only applies Aug-Dec
    joiningFeeMonths: [8, 9, 10, 11, 12], // August to December
    order: 4
  },
  FULL: {
    id: 'full',
    name: 'Full Membership',
    ageMin: 24,
    ageMax: 64,
    playingRights: '7 days',
    annualFee: 480,
    joiningFee: 25,
    order: 5
  },
  SENIOR_FULL: {
    id: 'senior_full',
    name: 'Senior Full Membership',
    ageMin: 65,
    ageMax: 74,
    playingRights: '7 days',
    annualFee: 435,
    joiningFee: 25,
    order: 6
  },
  LIFE_HONORARY: {
    id: 'life_honorary',
    name: 'Life & Honorary Members',
    ageMin: 75,
    ageMax: 999,
    playingRights: '7 days',
    annualFee: 75,
    joiningFee: 0,
    order: 7
  },
  SOCIAL: {
    id: 'social',
    name: 'Non-playing/Social',
    ageMin: 0,
    ageMax: 999,
    playingRights: 'None',
    annualFee: 40,
    joiningFee: 25,
    order: 8,
    isSpecial: true // Requires manual selection, not auto-assigned by age
  }
}

// Calculate age from date of birth
export const calculateAge = (dateOfBirth) => {
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }

  return age
}

// Determine membership category based on age
export const determineCategoryByAge = (dateOfBirth) => {
  const age = calculateAge(dateOfBirth)

  // Find matching category (excluding social which must be manually selected)
  for (const category of Object.values(MEMBERSHIP_CATEGORIES)) {
    if (category.isSpecial) continue

    if (age >= category.ageMin && age <= category.ageMax) {
      return category.id
    }
  }

  return MEMBERSHIP_CATEGORIES.FULL.id // Default fallback
}

// Get category object by ID
export const getCategoryById = (categoryId) => {
  return Object.values(MEMBERSHIP_CATEGORIES).find(cat => cat.id === categoryId)
}

// Calculate pro-rata subscription for new members
export const calculateProRataFee = (categoryId, joiningMonth) => {
  const category = getCategoryById(categoryId)
  if (!category) return 0

  const month = new Date(joiningMonth).getMonth() + 1 // 1-12

  // January/February: joining fee only, no subscription
  if (month === 1 || month === 2) {
    return category.joiningFee
  }

  // August to December: calculate pro-rata
  if (month >= 8 && month <= 12) {
    const monthsRemaining = 13 - month // Months until February
    const proRataSubscription = Math.round((monthsRemaining / 12) * category.annualFee)

    // For Colts, check if joining fee applies (Aug-Dec only)
    let joiningFee = category.joiningFee
    if (category.id === 'colts' && category.joiningFeeMonths.includes(month)) {
      joiningFee = 50
    }

    return proRataSubscription + joiningFee
  }

  // Other months (March-July): Full year subscription + joining fee
  return category.annualFee + category.joiningFee
}

// Get all categories as array (sorted by order)
export const getAllCategories = () => {
  return Object.values(MEMBERSHIP_CATEGORIES).sort((a, b) => a.order - b.order)
}
