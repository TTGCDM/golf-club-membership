import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore'
import { z } from 'zod'
import { db } from '../firebase'

const USERS_COLLECTION = 'users'

// Zod schemas for validation
const userRoleSchema = z.enum(['view', 'edit', 'admin', 'super_admin'])
const userStatusSchema = z.enum(['pending', 'active', 'inactive'])

const createUserSchema = z.object({
  email: z.string().email().max(255),
  role: userRoleSchema,
  status: userStatusSchema
})

const updateUserRoleSchema = z.object({
  role: userRoleSchema
})

const updateUserStatusSchema = z.object({
  status: userStatusSchema
})

// Role hierarchy
export const ROLES = {
  VIEW: 'view',
  EDIT: 'edit',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin'
}

// Role display names
export const ROLE_NAMES = {
  [ROLES.VIEW]: 'View',
  [ROLES.EDIT]: 'Edit',
  [ROLES.ADMIN]: 'Admin',
  [ROLES.SUPER_ADMIN]: 'Super Admin'
}

// User status
export const USER_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  INACTIVE: 'inactive'
}

// Check if user has permission based on role hierarchy
export const hasPermission = (userRole, requiredRole) => {
  const hierarchy = {
    [ROLES.VIEW]: 1,
    [ROLES.EDIT]: 2,
    [ROLES.ADMIN]: 3,
    [ROLES.SUPER_ADMIN]: 4
  }

  return hierarchy[userRole] >= hierarchy[requiredRole]
}

// Create or update user document in Firestore
export const createUserDocument = async (uid, email, role = ROLES.VIEW, status = USER_STATUS.PENDING) => {
  try {
    // Validate input
    const validation = createUserSchema.safeParse({ email, role, status })
    if (!validation.success) {
      throw new Error(`Invalid user data: ${validation.error.errors[0].message}`)
    }

    const userRef = doc(db, USERS_COLLECTION, uid)
    const userData = {
      email: validation.data.email,
      role: validation.data.role,
      status: validation.data.status,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }

    await setDoc(userRef, userData)
    return { uid, ...userData }
  } catch (error) {
    console.error('Error creating user document:', error)
    throw error
  }
}

// Get user document from Firestore
export const getUserDocument = async (uid) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid)
    const userSnap = await getDoc(userRef)

    if (userSnap.exists()) {
      return { uid: userSnap.id, ...userSnap.data() }
    }
    return null
  } catch (error) {
    console.error('Error getting user document:', error)
    throw error
  }
}

// Get all users
export const getAllUsers = async () => {
  try {
    const q = query(collection(db, USERS_COLLECTION), orderBy('email'))
    const querySnapshot = await getDocs(q)

    const users = []
    querySnapshot.forEach((doc) => {
      users.push({ uid: doc.id, ...doc.data() })
    })

    return users
  } catch (error) {
    console.error('Error getting all users:', error)
    throw error
  }
}

// Get pending users
export const getPendingUsers = async () => {
  try {
    const q = query(
      collection(db, USERS_COLLECTION),
      where('status', '==', USER_STATUS.PENDING),
      orderBy('createdAt', 'desc')
    )

    const querySnapshot = await getDocs(q)
    const users = []

    querySnapshot.forEach((doc) => {
      users.push({ uid: doc.id, ...doc.data() })
    })

    return users
  } catch (error) {
    console.error('Error getting pending users:', error)
    throw error
  }
}

// Update user role
export const updateUserRole = async (uid, newRole) => {
  try {
    // Validate input
    const validation = updateUserRoleSchema.safeParse({ role: newRole })
    if (!validation.success) {
      throw new Error(`Invalid role: ${validation.error.errors[0].message}`)
    }

    const userRef = doc(db, USERS_COLLECTION, uid)
    await updateDoc(userRef, {
      role: validation.data.role,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error updating user role:', error)
    throw error
  }
}

// Update user status
export const updateUserStatus = async (uid, newStatus) => {
  try {
    // Validate input
    const validation = updateUserStatusSchema.safeParse({ status: newStatus })
    if (!validation.success) {
      throw new Error(`Invalid status: ${validation.error.errors[0].message}`)
    }

    const userRef = doc(db, USERS_COLLECTION, uid)
    await updateDoc(userRef, {
      status: validation.data.status,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error updating user status:', error)
    throw error
  }
}

// Approve pending user
export const approveUser = async (uid, role = ROLES.VIEW) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid)
    await updateDoc(userRef, {
      role,
      status: USER_STATUS.ACTIVE,
      approvedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error approving user:', error)
    throw error
  }
}

// Deactivate user
export const deactivateUser = async (uid) => {
  try {
    await updateUserStatus(uid, USER_STATUS.INACTIVE)
  } catch (error) {
    console.error('Error deactivating user:', error)
    throw error
  }
}

// Reactivate user
export const reactivateUser = async (uid) => {
  try {
    await updateUserStatus(uid, USER_STATUS.ACTIVE)
  } catch (error) {
    console.error('Error reactivating user:', error)
    throw error
  }
}

// Check if user can manage another user
export const canManageUser = (currentUserRole, targetUserRole) => {
  // Super admin can manage everyone
  if (currentUserRole === ROLES.SUPER_ADMIN) {
    return true
  }

  // Admin can only manage View and Edit roles
  if (currentUserRole === ROLES.ADMIN) {
    return targetUserRole === ROLES.VIEW || targetUserRole === ROLES.EDIT
  }

  return false
}

// Get user statistics
export const getUserStats = async () => {
  try {
    const allUsers = await getAllUsers()

    return {
      total: allUsers.length,
      pending: allUsers.filter(u => u.status === USER_STATUS.PENDING).length,
      active: allUsers.filter(u => u.status === USER_STATUS.ACTIVE).length,
      inactive: allUsers.filter(u => u.status === USER_STATUS.INACTIVE).length,
      byRole: {
        [ROLES.VIEW]: allUsers.filter(u => u.role === ROLES.VIEW).length,
        [ROLES.EDIT]: allUsers.filter(u => u.role === ROLES.EDIT).length,
        [ROLES.ADMIN]: allUsers.filter(u => u.role === ROLES.ADMIN).length,
        [ROLES.SUPER_ADMIN]: allUsers.filter(u => u.role === ROLES.SUPER_ADMIN).length
      }
    }
  } catch (error) {
    console.error('Error getting user stats:', error)
    throw error
  }
}
