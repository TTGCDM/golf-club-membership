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
    // Auto-determine category based on date of birth if not provided
    const category = memberData.membershipCategory || determineCategoryByAge(memberData.dateOfBirth)

    const newMember = {
      ...memberData,
      membershipCategory: category,
      accountBalance: memberData.accountBalance || 0,
      status: memberData.status || 'active',
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
