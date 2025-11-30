# Firebase Setup Templates - Copy & Paste Ready

Quick reference with all essential files and code snippets for setting up Firebase in a new React + Vite project.

---

## 📋 Quick Start Checklist

```bash
# 1. Install dependencies
npm install firebase

# 2. Install Firebase CLI globally
npm install -g firebase-tools

# 3. Login to Firebase
firebase login

# 4. Initialize Firebase in your project
firebase init
# Select: Firestore, Hosting
# Public directory: dist
# Single-page app: Yes

# 5. Create .env file with your Firebase config
# (see template below)

# 6. Deploy
npm run build
firebase deploy
```

---

## 📁 File Templates

### 1. `src/firebase.js`

```javascript
import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase services
export const auth = getAuth(app)
export const db = getFirestore(app)

// Connect to emulators in development (optional)
if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATORS === 'true') {
  try {
    connectFirestoreEmulator(db, 'localhost', 8080)
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })
    console.log('🔧 Connected to Firebase Emulators')
  } catch (error) {
    console.warn('Failed to connect to emulators:', error.message)
  }
}

export default app
```

---

### 2. `.env` (Your Actual Credentials)

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIza...your_actual_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123def456

# Optional: Enable Firebase Emulators for local development
# VITE_USE_EMULATORS=true
```

**⚠️ IMPORTANT:** Add `.env` to `.gitignore`!

---

### 3. `.env.example` (Template for Team)

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Optional: Enable Firebase Emulators
# VITE_USE_EMULATORS=true
```

---

### 4. `.gitignore` (Add These Lines)

```bash
# Environment variables
.env
.env.local
.env.*.local

# Firebase
.firebase/
*-debug.log
firebase-debug.*.log
ui-debug.log

# Build
dist/
dist-ssr/
```

---

### 5. `firebase.json`

```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(jpg|jpeg|gif|png|svg|webp|ico)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      },
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  }
}
```

---

### 6. `.firebaserc`

```json
{
  "projects": {
    "default": "your-project-id"
  }
}
```

Replace `your-project-id` with your actual Firebase project ID.

---

### 7. `firestore.rules` (Basic - Authenticated Users)

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function
    function isAuthenticated() {
      return request.auth != null;
    }

    // Users collection - users can read/write their own data
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && request.auth.uid == userId;
    }

    // Example: Items collection - authenticated users can read/write
    match /items/{itemId} {
      allow read, write: if isAuthenticated();
    }

    // Default: Deny all
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

### 8. `firestore.rules` (Advanced - Role-Based Access)

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function getUserData() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }

    function isActive() {
      return isAuthenticated() && getUserData().status == 'active';
    }

    function getUserRole() {
      return isActive() ? getUserData().role : 'none';
    }

    function getRoleLevel(role) {
      return role == 'super_admin' ? 4 :
             role == 'admin' ? 3 :
             role == 'edit' ? 2 :
             role == 'view' ? 1 : 0;
    }

    function hasPermission(requiredRole) {
      return getRoleLevel(getUserRole()) >= getRoleLevel(requiredRole);
    }

    // Users collection
    match /users/{userId} {
      allow read: if isActive();
      allow create: if isAuthenticated();
      allow update: if isActive() && (
        request.auth.uid == userId ||
        hasPermission('admin')
      );
      allow delete: if hasPermission('super_admin');
    }

    // Your collections with role-based access
    match /items/{itemId} {
      allow read: if hasPermission('view');
      allow create, update: if hasPermission('edit');
      allow delete: if hasPermission('admin');
    }

    // Default: Deny all
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

### 9. `firestore.indexes.json`

```json
{
  "indexes": [],
  "fieldOverrides": []
}
```

**Note:** Start with empty indexes. Firebase will suggest indexes when you run queries that need them.

---

### 10. `package.json` Scripts

Add these to your `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "deploy": "npm run build && firebase deploy",
    "deploy:hosting": "npm run build && firebase deploy --only hosting",
    "deploy:rules": "firebase deploy --only firestore:rules",
    "deploy:indexes": "firebase deploy --only firestore:indexes",
    "emulator": "firebase emulators:start --only firestore,auth",
    "emulator:firestore": "firebase emulators:start --only firestore"
  }
}
```

---

## 🔐 Authentication Context Template

### `src/contexts/AuthContext.jsx`

```javascript
import { createContext, useContext, useState, useEffect } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)

  // Role hierarchy
  const ROLES = {
    VIEW: 'view',
    EDIT: 'edit',
    ADMIN: 'admin',
    SUPER_ADMIN: 'super_admin'
  }

  const ROLE_LEVELS = {
    view: 1,
    edit: 2,
    admin: 3,
    super_admin: 4
  }

  // Sign up new user
  const signup = async (email, password) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    // Create user document in Firestore
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      email: email,
      role: ROLES.VIEW,
      status: 'pending', // Requires admin approval
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    return userCredential
  }

  // Login user
  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password)
  }

  // Logout user
  const logout = () => {
    return signOut(auth)
  }

  // Reset password
  const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email)
  }

  // Check if user has required permission
  const checkPermission = (requiredRole) => {
    if (!userRole) return false
    return ROLE_LEVELS[userRole] >= ROLE_LEVELS[requiredRole]
  }

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user)

      if (user) {
        // Fetch user role from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid))
          if (userDoc.exists()) {
            const userData = userDoc.data()
            setUserRole(userData.role)
          } else {
            // First user - auto-create as super_admin
            await setDoc(doc(db, 'users', user.uid), {
              email: user.email,
              role: ROLES.SUPER_ADMIN,
              status: 'active',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            })
            setUserRole(ROLES.SUPER_ADMIN)
          }
        } catch (error) {
          console.error('Error fetching user role:', error)
          setUserRole(null)
        }
      } else {
        setUserRole(null)
      }

      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value = {
    currentUser,
    userRole,
    signup,
    login,
    logout,
    resetPassword,
    checkPermission,
    ROLES
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
```

---

## 🛡️ Protected Route Component

### `src/components/PrivateRoute.jsx`

```javascript
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const PrivateRoute = ({ children }) => {
  const { currentUser } = useAuth()

  if (!currentUser) {
    return <Navigate to="/login" />
  }

  return children
}

export default PrivateRoute
```

---

## 📊 Firestore Service Examples

### `src/services/itemsService.js`

```javascript
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
  serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase'

const COLLECTION_NAME = 'items'

// Create item
export const createItem = async (itemData) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...itemData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    return docRef.id
  } catch (error) {
    console.error('Error creating item:', error)
    throw error
  }
}

// Get all items
export const getAllItems = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME))
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('Error getting items:', error)
    throw error
  }
}

// Get item by ID
export const getItemById = async (itemId) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, itemId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() }
    } else {
      throw new Error('Item not found')
    }
  } catch (error) {
    console.error('Error getting item:', error)
    throw error
  }
}

// Update item
export const updateItem = async (itemId, itemData) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, itemId)
    await updateDoc(docRef, {
      ...itemData,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error updating item:', error)
    throw error
  }
}

// Delete item
export const deleteItem = async (itemId) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, itemId)
    await deleteDoc(docRef)
  } catch (error) {
    console.error('Error deleting item:', error)
    throw error
  }
}

// Query with filter
export const getItemsByStatus = async (status) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('Error querying items:', error)
    throw error
  }
}

// Real-time subscription
export const subscribeToItems = (callback) => {
  const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'))

  return onSnapshot(q, (querySnapshot) => {
    const items = []
    querySnapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() })
    })
    callback(items)
  }, (error) => {
    console.error('Error subscribing to items:', error)
  })
}
```

---

## 🚀 Deployment Commands

```bash
# First time deployment (everything)
npm run build
firebase deploy

# Deploy hosting only (faster for code updates)
npm run deploy:hosting

# Deploy security rules only
npm run deploy:rules

# Deploy indexes only
npm run deploy:indexes

# Full deploy (using npm script)
npm run deploy
```

---

## 🧪 Testing with Emulators

### Start Emulators

```bash
npm run emulator
```

### Use Emulators in Development

In your `.env`:

```bash
VITE_USE_EMULATORS=true
```

### Emulator Ports

- **Firestore:** http://localhost:8080
- **Auth:** http://localhost:9099
- **UI:** http://localhost:4000

---

## 📌 Common Firestore Patterns

### Batch Write (Multiple Operations)

```javascript
import { writeBatch, doc } from 'firebase/firestore'

const batchUpdate = async () => {
  const batch = writeBatch(db)

  batch.set(doc(db, 'items', 'item1'), { name: 'Item 1' })
  batch.update(doc(db, 'items', 'item2'), { status: 'active' })
  batch.delete(doc(db, 'items', 'item3'))

  await batch.commit()
}
```

### Transaction (Atomic Operation)

```javascript
import { runTransaction, doc } from 'firebase/firestore'

const transferBalance = async (fromId, toId, amount) => {
  const fromRef = doc(db, 'accounts', fromId)
  const toRef = doc(db, 'accounts', toId)

  await runTransaction(db, async (transaction) => {
    const fromDoc = await transaction.get(fromRef)
    const toDoc = await transaction.get(toRef)

    const newFromBalance = fromDoc.data().balance - amount
    const newToBalance = toDoc.data().balance + amount

    transaction.update(fromRef, { balance: newFromBalance })
    transaction.update(toRef, { balance: newToBalance })
  })
}
```

---

## 🎯 Quick Copy Checklist

For a new project, copy these files:

1. ✅ `src/firebase.js` - Firebase initialization
2. ✅ `.env.example` - Environment template
3. ✅ `firebase.json` - Firebase config
4. ✅ `firestore.rules` - Security rules
5. ✅ `firestore.indexes.json` - Database indexes
6. ✅ `.firebaserc` - Project config
7. ✅ `package.json` scripts - Deployment commands
8. ✅ `src/contexts/AuthContext.jsx` - Auth context
9. ✅ `src/components/PrivateRoute.jsx` - Protected routes

Then:
1. Create Firebase project in console
2. Copy config to `.env`
3. Run `firebase login`
4. Run `firebase init`
5. Run `npm run deploy`

---

**Templates Version:** 1.0
**Last Updated:** November 2025
**Compatible With:** React 18 + Vite + Firebase 10+
