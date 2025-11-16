import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'

// Your Firebase configuration will go here
// We'll add this after you create your Firebase project
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

// Connect to emulators in development mode (only if VITE_USE_EMULATORS is set)
if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATORS === 'true') {
  try {
    // Connect to Firestore emulator
    connectFirestoreEmulator(db, 'localhost', 8080)

    // Connect to Auth emulator
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })

    console.log('🔧 Connected to Firebase Emulators')
    console.log('📊 Firestore: http://localhost:8080')
    console.log('🔐 Auth: http://localhost:9099')
  } catch (error) {
    console.warn('Failed to connect to emulators, using production:', error.message)
  }
} else if (import.meta.env.DEV) {
  console.log('🌐 Development mode: Connected to PRODUCTION Firebase')
  console.log('   (Set VITE_USE_EMULATORS=true in .env to use local emulators)')
}

export default app
