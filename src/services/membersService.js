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
  Timestamp,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase'
import { determineCategoryByAge } from './membershipCategories'

const MEMBERS_COLLECTION = 'members'

// Create a new member
export const createMember = async (memberData) => {
  try {
    // Provide defaults for optional fields
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

    // Get all categories for lookup
    const { getAllCategories } = await import('./categoryService')
    const categories = await getAllCategories()

    // Auto-determine category based on date of birth if not provided
    let category = memberData.membershipCategory || ''

    if (!category || category.trim() === '') {
      if (memberData.dateOfBirth && memberData.dateOfBirth.trim() !== '') {
        // Determine category from date of birth
        category = await determineCategoryByAge(memberData.dateOfBirth)
      } else {
        // If no DOB provided, get the default "Full Membership" category ID
        const defaultCategory = categories.find(c => c.name.includes('Full Membership'))
        category = defaultCategory ? defaultCategory.id : (categories[0]?.id || '')
      }
    } else {
      // Check if the provided category is a NAME (not an ID)
      // If it's not a valid ID, try to find category by name
      const categoryExists = categories.some(c => c.id === category)

      if (!categoryExists) {
        // Try to find category by name
        const categoryByName = categories.find(c =>
          c.name.toLowerCase() === category.toLowerCase()
        )

        if (categoryByName) {
          category = categoryByName.id
        } else {
          // If no exact match, try partial match
          const partialMatch = categories.find(c =>
            c.name.toLowerCase().includes(category.toLowerCase())
          )
          category = partialMatch ? partialMatch.id : (categories[0]?.id || '')
        }
      }
    }

    const newMember = {
      fullName: memberData.fullName || '',
      email: memberData.email || '',
      phone: memberData.phone || '',
      address: memberData.address || '',
      dateOfBirth: memberData.dateOfBirth || '',
      golfAustraliaId: memberData.golfAustraliaId || '',
      membershipCategory: category,
      accountBalance: memberData.accountBalance || 0,
      status: (memberData.status && memberData.status.trim() !== '') ? memberData.status.toLowerCase() : 'active',
      dateJoined: (memberData.dateJoined && memberData.dateJoined.trim() !== '') ? memberData.dateJoined : today,
      emergencyContact: memberData.emergencyContact || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }

    const docRef = await addDoc(collection(db, MEMBERS_COLLECTION), newMember)
    return { id: docRef.id, ...newMember }
  } catch (error) {
    console.error('Error creating member:', error)
    throw error
  }
}

// Get a single member by ID
export const getMemberById = async (memberId) => {
  try {
    const docRef = doc(db, MEMBERS_COLLECTION, memberId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() }
    } else {
      throw new Error('Member not found')
    }
  } catch (error) {
    console.error('Error getting member:', error)
    throw error
  }
}

// Get all members
export const getAllMembers = async () => {
  try {
    const querySnapshot = await getDocs(
      query(collection(db, MEMBERS_COLLECTION), orderBy('fullName'))
    )

    const members = []
    querySnapshot.forEach((doc) => {
      members.push({ id: doc.id, ...doc.data() })
    })

    return members
  } catch (error) {
    console.error('Error getting members:', error)
    throw error
  }
}

// Get members by status
export const getMembersByStatus = async (status) => {
  try {
    const q = query(
      collection(db, MEMBERS_COLLECTION),
      where('status', '==', status),
      orderBy('fullName')
    )

    const querySnapshot = await getDocs(q)
    const members = []

    querySnapshot.forEach((doc) => {
      members.push({ id: doc.id, ...doc.data() })
    })

    return members
  } catch (error) {
    console.error('Error getting members by status:', error)
    throw error
  }
}

// Get members by category
export const getMembersByCategory = async (category) => {
  try {
    const q = query(
      collection(db, MEMBERS_COLLECTION),
      where('membershipCategory', '==', category),
      orderBy('fullName')
    )

    const querySnapshot = await getDocs(q)
    const members = []

    querySnapshot.forEach((doc) => {
      members.push({ id: doc.id, ...doc.data() })
    })

    return members
  } catch (error) {
    console.error('Error getting members by category:', error)
    throw error
  }
}

// Search members by name, email, or Golf Australia ID
export const searchMembers = async (searchTerm) => {
  try {
    // Get all members and filter on the client side
    // Note: Firestore doesn't support case-insensitive searches or OR queries well
    // For production, consider using Algolia or similar for better search
    const allMembers = await getAllMembers()

    const searchLower = searchTerm.toLowerCase()

    return allMembers.filter(member =>
      member.fullName?.toLowerCase().includes(searchLower) ||
      member.email?.toLowerCase().includes(searchLower) ||
      member.golfAustraliaId?.toLowerCase().includes(searchLower)
    )
  } catch (error) {
    console.error('Error searching members:', error)
    throw error
  }
}

// Update a member
export const updateMember = async (memberId, memberData) => {
  try {
    const docRef = doc(db, MEMBERS_COLLECTION, memberId)

    const updatedData = {
      ...memberData,
      updatedAt: serverTimestamp()
    }

    await updateDoc(docRef, updatedData)
    return { id: memberId, ...updatedData }
  } catch (error) {
    console.error('Error updating member:', error)
    throw error
  }
}

// Delete a member (soft delete by setting status to inactive)
export const deleteMember = async (memberId) => {
  try {
    const docRef = doc(db, MEMBERS_COLLECTION, memberId)
    await updateDoc(docRef, {
      status: 'inactive',
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error deleting member:', error)
    throw error
  }
}

// Hard delete a member (use with caution)
export const hardDeleteMember = async (memberId) => {
  try {
    const docRef = doc(db, MEMBERS_COLLECTION, memberId)
    await deleteDoc(docRef)
  } catch (error) {
    console.error('Error hard deleting member:', error)
    throw error
  }
}

// Get members with outstanding balances
export const getMembersWithOutstandingBalance = async () => {
  try {
    const allMembers = await getAllMembers()
    // Negative balance = member owes money
    return allMembers.filter(member =>
      member.status === 'active' && member.accountBalance < 0
    )
  } catch (error) {
    console.error('Error getting members with outstanding balance:', error)
    throw error
  }
}

// Get member statistics
export const getMemberStats = async () => {
  try {
    const allMembers = await getAllMembers()

    const stats = {
      total: allMembers.length,
      active: allMembers.filter(m => m.status === 'active').length,
      inactive: allMembers.filter(m => m.status === 'inactive').length,
      // Sum of negative balances (owed money) as positive number
      totalOutstanding: allMembers
        .filter(m => m.status === 'active' && m.accountBalance < 0)
        .reduce((sum, m) => sum + Math.abs(m.accountBalance || 0), 0),
      byCategory: {}
    }

    // Count members by category
    allMembers.forEach(member => {
      const category = member.membershipCategory
      if (!stats.byCategory[category]) {
        stats.byCategory[category] = 0
      }
      stats.byCategory[category]++
    })

    return stats
  } catch (error) {
    console.error('Error getting member stats:', error)
    throw error
  }
}

// Export members to CSV format
export const exportMembersToCSV = (members) => {
  const headers = [
    'Full Name',
    'Email',
    'Phone',
    'Address',
    'Date of Birth',
    'Golf Australia ID',
    'Membership Category',
    'Status',
    'Account Balance',
    'Date Joined',
    'Emergency Contact'
  ]

  const rows = members.map(member => [
    member.fullName || '',
    member.email || '',
    member.phone || '',
    member.address || '',
    member.dateOfBirth || '',
    member.golfAustraliaId || '',
    member.membershipCategory || '',
    member.status || '',
    member.accountBalance || 0,
    member.dateJoined || '',
    member.emergencyContact || ''
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  return csvContent
}

// Download CSV file
export const downloadMembersCSV = (members, filename = 'members.csv') => {
  const csvContent = exportMembersToCSV(members)
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

/**
 * Parse CSV text into array of objects
 * @param {string} csvText - CSV content as string
 * @returns {Array} Array of member objects
 */
const parseCSV = (csvText) => {
  const lines = csvText.split('\n').filter(line => line.trim())
  if (lines.length < 2) {
    throw new Error('CSV file is empty or contains only headers')
  }

  // Parse headers
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())

  // Expected headers
  const expectedHeaders = [
    'Full Name',
    'Email',
    'Phone',
    'Address',
    'Date of Birth',
    'Golf Australia ID',
    'Membership Category',
    'Status',
    'Account Balance',
    'Date Joined',
    'Emergency Contact'
  ]

  // Validate headers match expected format
  if (headers.length !== expectedHeaders.length) {
    throw new Error(`Invalid CSV format. Expected ${expectedHeaders.length} columns, found ${headers.length}`)
  }

  // Parse rows
  const members = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // Simple CSV parsing (handles quoted values)
    const values = []
    let currentValue = ''
    let insideQuotes = false

    for (let j = 0; j < line.length; j++) {
      const char = line[j]

      if (char === '"') {
        insideQuotes = !insideQuotes
      } else if (char === ',' && !insideQuotes) {
        values.push(currentValue.trim())
        currentValue = ''
      } else {
        currentValue += char
      }
    }
    values.push(currentValue.trim()) // Add last value

    if (values.length !== expectedHeaders.length) {
      members.push({
        rowNumber: i + 1,
        error: `Invalid number of columns (expected ${expectedHeaders.length}, found ${values.length})`
      })
      continue
    }

    // Map to member object
    const member = {
      rowNumber: i + 1,
      fullName: values[0] || '',
      email: values[1] || '',
      phone: values[2] || '',
      address: values[3] || '',
      dateOfBirth: values[4] || '',
      golfAustraliaId: values[5] || '',
      membershipCategory: values[6] || '',
      status: values[7] || 'active',
      accountBalance: values[8] ? parseFloat(values[8]) : 0,
      dateJoined: values[9] || '',
      emergencyContact: values[10] || ''
    }

    members.push(member)
  }

  return members
}

/**
 * Validate member data from CSV
 * @param {Object} member - Member object to validate
 * @returns {Object} { valid: boolean, error: string }
 */
const validateMemberData = (member) => {
  // Full Name is required
  if (!member.fullName || member.fullName.trim() === '') {
    return { valid: false, error: 'Full Name is required' }
  }

  // Golf Australia ID is required
  if (!member.golfAustraliaId || member.golfAustraliaId.trim() === '') {
    return { valid: false, error: 'Golf Australia ID is required' }
  }

  // Validate Date of Birth format (YYYY-MM-DD) if provided
  if (member.dateOfBirth && member.dateOfBirth.trim() !== '') {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(member.dateOfBirth)) {
      return { valid: false, error: 'Invalid Date of Birth format (use YYYY-MM-DD)' }
    }
  }

  // Validate status if provided
  if (member.status && member.status.trim() !== '' && !['active', 'inactive'].includes(member.status.toLowerCase())) {
    return { valid: false, error: 'Invalid Status (must be "active" or "inactive")' }
  }

  // Validate account balance if provided
  if (member.accountBalance && isNaN(member.accountBalance)) {
    return { valid: false, error: 'Invalid Account Balance (must be a number)' }
  }

  return { valid: true }
}

/**
 * Import members from CSV file
 * @param {string} csvText - CSV content as string
 * @returns {Object} Import results { successful, skipped, failed, details }
 */
export const importMembersFromCSV = async (csvText) => {
  try {
    // Parse CSV
    const parsedMembers = parseCSV(csvText)

    const results = {
      total: parsedMembers.length,
      successful: 0,
      skipped: 0,
      failed: 0,
      details: []
    }

    // Get existing members to check for duplicates
    const existingMembers = await getAllMembers()
    const existingEmails = new Set(
      existingMembers.map(m => m.email?.toLowerCase()).filter(Boolean)
    )
    const existingGolfIds = new Set(
      existingMembers.map(m => m.golfAustraliaId?.toLowerCase()).filter(Boolean)
    )

    // Process each member
    for (const member of parsedMembers) {
      // Check if row already has error from parsing
      if (member.error) {
        results.failed++
        results.details.push({
          row: member.rowNumber,
          status: 'failed',
          reason: member.error
        })
        continue
      }

      // Validate member data
      const validation = validateMemberData(member)
      if (!validation.valid) {
        results.failed++
        results.details.push({
          row: member.rowNumber,
          name: member.fullName,
          status: 'failed',
          reason: validation.error
        })
        continue
      }

      // Check for duplicate email
      if (member.email && existingEmails.has(member.email.toLowerCase())) {
        results.skipped++
        results.details.push({
          row: member.rowNumber,
          name: member.fullName,
          status: 'skipped',
          reason: 'Duplicate email'
        })
        continue
      }

      // Check for duplicate Golf Australia ID
      if (member.golfAustraliaId && existingGolfIds.has(member.golfAustraliaId.toLowerCase())) {
        results.skipped++
        results.details.push({
          row: member.rowNumber,
          name: member.fullName,
          status: 'skipped',
          reason: 'Duplicate Golf Australia ID'
        })
        continue
      }

      // Create member
      try {
        // Remove rowNumber before creating
        const { rowNumber, ...memberData } = member
        await createMember(memberData)

        results.successful++
        results.details.push({
          row: rowNumber,
          name: member.fullName,
          status: 'success'
        })

        // Add to existing sets to check subsequent duplicates in same file
        if (member.email) existingEmails.add(member.email.toLowerCase())
        if (member.golfAustraliaId) existingGolfIds.add(member.golfAustraliaId.toLowerCase())
      } catch (error) {
        results.failed++
        results.details.push({
          row: member.rowNumber,
          name: member.fullName,
          status: 'failed',
          reason: error.message
        })
      }
    }

    return results
  } catch (error) {
    console.error('Error importing members from CSV:', error)
    throw error
  }
}
