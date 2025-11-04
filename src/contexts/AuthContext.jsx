import { createContext, useContext, useState, useEffect } from 'react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth'
import { auth } from '../firebase'
import { getUserDocument, createUserDocument, ROLES, USER_STATUS, hasPermission } from '../services/usersService'

const AuthContext = createContext({})

export const useAuth = () => {
  return useContext(AuthContext)
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [userStatus, setUserStatus] = useState(null)
  const [loading, setLoading] = useState(true)

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password)
  }

  const register = async (email, password) => {
    // Create Firebase Auth account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)

    // Create user document in Firestore with pending status
    await createUserDocument(userCredential.user.uid, email, ROLES.VIEW, USER_STATUS.PENDING)

    return userCredential
  }

  const logout = () => {
    return signOut(auth)
  }

  const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email)
  }

  // Check if user has required permission
  const checkPermission = (requiredRole) => {
    if (!userRole) return false
    return hasPermission(userRole, requiredRole)
  }

  // Check if user is active
  const isActive = () => {
    return userStatus === USER_STATUS.ACTIVE
  }

  // Check if user is pending
  const isPending = () => {
    return userStatus === USER_STATUS.PENDING
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Fetch user document from Firestore
          const userDoc = await getUserDocument(user.uid)

          if (userDoc) {
            setCurrentUser(user)
            setUserRole(userDoc.role)
            setUserStatus(userDoc.status)
          } else {
            // If no user document exists, create one with super admin role
            // This handles the initial admin account
            await createUserDocument(user.uid, user.email, ROLES.SUPER_ADMIN, USER_STATUS.ACTIVE)
            setCurrentUser(user)
            setUserRole(ROLES.SUPER_ADMIN)
            setUserStatus(USER_STATUS.ACTIVE)
          }
        } catch (error) {
          console.error('Error fetching user document:', error)
          setCurrentUser(null)
          setUserRole(null)
          setUserStatus(null)
        }
      } else {
        setCurrentUser(null)
        setUserRole(null)
        setUserStatus(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value = {
    currentUser,
    userRole,
    userStatus,
    login,
    register,
    logout,
    resetPassword,
    checkPermission,
    isActive,
    isPending,
    // Role constants for easy access
    ROLES,
    USER_STATUS
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
