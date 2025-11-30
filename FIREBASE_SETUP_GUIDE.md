# Firebase Setup Guide for New Projects

Complete guide for setting up Firebase in a React + Vite application with Authentication, Firestore, and deployment configuration.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Firebase Console Setup](#firebase-console-setup)
3. [Project Files Setup](#project-files-setup)
4. [Environment Variables](#environment-variables)
5. [Firebase Configuration Files](#firebase-configuration-files)
6. [Security Rules](#security-rules)
7. [Firestore Indexes](#firestore-indexes)
8. [Deployment Scripts](#deployment-scripts)
9. [Initial Deployment](#initial-deployment)
10. [Testing](#testing)
11. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

```bash
# Install Node.js (v18+ recommended)
# Download from: https://nodejs.org/

# Install Firebase CLI globally
npm install -g firebase-tools

# Verify installation
firebase --version
```

### Firebase Account

- Create a Firebase account at https://firebase.google.com/
- You'll need a Google account

---

## Firebase Console Setup

### Step 1: Create Firebase Project

1. Go to https://console.firebase.google.com/
2. Click **"Add project"**
3. Enter project name (e.g., `my-app-name`)
4. Enable/disable Google Analytics (optional)
5. Click **"Create project"**

### Step 2: Register Web App

1. In Firebase Console, click the **"Web"** icon (</>) to add a web app
2. Enter app nickname (e.g., `my-app-web`)
3. Check **"Also set up Firebase Hosting"** if you want hosting
4. Click **"Register app"**
5. **COPY THE FIREBASE CONFIG** - you'll need these values:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-app.firebaseapp.com",
  projectId: "your-app",
  storageBucket: "your-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### Step 3: Enable Authentication

1. In Firebase Console, go to **Build → Authentication**
2. Click **"Get Started"**
3. Go to **"Sign-in method"** tab
4. Enable **"Email/Password"** provider
5. Click **"Save"**

### Step 4: Create Firestore Database

1. In Firebase Console, go to **Build → Firestore Database**
2. Click **"Create database"**
3. Choose **"Start in production mode"** (we'll add rules later)
4. Select a location (choose closest to your users)
5. Click **"Enable"**

### Step 5: Set Up Firebase Hosting (Optional)

1. In Firebase Console, go to **Build → Hosting**
2. Click **"Get Started"**
3. Follow the wizard (we'll configure via CLI later)

---

## Project Files Setup

### Step 1: Install Firebase in Your Project

```bash
cd your-project-directory
npm install firebase
```

### Step 2: Create Firebase Configuration File

Create `src/firebase.js`:

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

## Environment Variables

### Step 1: Create `.env` File

In your project root, create `.env` with your Firebase credentials:

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIza...your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123

# Optional: Enable Firebase Emulators for local development
# VITE_USE_EMULATORS=true
```

**IMPORTANT:** Replace the placeholder values with your actual Firebase config values from Step 2 of Firebase Console Setup.

### Step 2: Create `.env.example` Template

Create `.env.example` for team members (safe to commit):

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

### Step 3: Update `.gitignore`

Ensure `.env` is ignored:

```bash
# Environment variables
.env
.env.local

# Firebase
.firebase/
*-debug.log
firebase-debug.*.log
```

---

## Firebase Configuration Files

### Step 1: Login to Firebase CLI

```bash
firebase login
```

This will open a browser for you to authenticate.

### Step 2: Initialize Firebase in Your Project

```bash
firebase init
```

Select the following options:
- ✅ **Firestore** (rules and indexes)
- ✅ **Hosting** (if you want web hosting)
- Use an existing project → Select your project
- **Firestore rules:** Accept default `firestore.rules`
- **Firestore indexes:** Accept default `firestore.indexes.json`
- **Public directory:** Enter `dist` (Vite's build output)
- **Single-page app:** Yes
- **Set up automatic builds with GitHub:** No (or Yes if you want)

### Step 3: Create `.firebaserc`

This file is auto-created by `firebase init`, but you can verify it looks like:

```json
{
  "projects": {
    "default": "your-project-id"
  }
}
```

### Step 4: Create `firebase.json`

Auto-created by `firebase init`. Customize for Vite + React:

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
        "source": "**/*.@(jpg|jpeg|gif|png|svg|webp)",
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

## Security Rules

### Firestore Security Rules

Create/update `firestore.rules`:

#### Basic Rules (Public Read, Authenticated Write)

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function: Check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }

    // Example: Public collection (read-only)
    match /public/{document=**} {
      allow read: if true;
      allow write: if false;
    }

    // Example: User-specific data
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && request.auth.uid == userId;
    }

    // Example: Authenticated users can read/write
    match /items/{itemId} {
      allow read, write: if isAuthenticated();
    }

    // Default: Deny all access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

#### Advanced Rules with Role-Based Access

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
      allow create: if isAuthenticated(); // For registration
      allow update: if isActive() && (
        request.auth.uid == userId || // Own profile
        hasPermission('admin') // Admins can update users
      );
      allow delete: if hasPermission('super_admin');
    }

    // Data collections with role-based access
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

## Firestore Indexes

### Create `firestore.indexes.json`

Start with basic indexes (auto-created by Firebase):

```json
{
  "indexes": [],
  "fieldOverrides": []
}
```

### Common Indexes Examples

```json
{
  "indexes": [
    {
      "collectionGroup": "users",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "items",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "category", "order": "ASCENDING" },
        { "fieldPath": "name", "order": "ASCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

**Note:** Firebase will suggest indexes when you run queries that need them. You can copy the suggested index and add it here.

---

## Deployment Scripts

### Update `package.json` Scripts

Add these scripts to your `package.json`:

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

### Script Descriptions

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build production bundle |
| `npm run deploy` | Build + deploy everything |
| `npm run deploy:hosting` | Deploy hosting only (faster for code changes) |
| `npm run deploy:rules` | Deploy security rules only |
| `npm run deploy:indexes` | Deploy Firestore indexes only |
| `npm run emulator` | Run local Firebase emulators |

---

## Initial Deployment

### Step 1: Build Your App

```bash
npm run build
```

This creates a `dist/` folder with your production build.

### Step 2: Deploy Security Rules First

```bash
npm run deploy:rules
```

**CRITICAL:** This replaces test mode with production rules. Make sure your rules are correct!

### Step 3: Deploy Firestore Indexes

```bash
npm run deploy:indexes
```

Wait for indexes to finish building (can take several minutes).

### Step 4: Deploy Hosting

```bash
npm run deploy:hosting
```

### Step 5: Verify Deployment

After deployment completes, you'll see:

```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/your-project/overview
Hosting URL: https://your-project.web.app
```

Visit your Hosting URL to verify the app works.

---

## Testing

### Test Locally with Emulators

```bash
# Start emulators
npm run emulator

# In another terminal, start your dev server
npm run dev
```

Set `VITE_USE_EMULATORS=true` in `.env` to use emulators.

### Test Production Build Locally

```bash
npm run build
npm run preview
```

Visit http://localhost:4173 to test the production build.

### Test Authentication

1. Create a test user via your registration page
2. Verify user appears in Firebase Console → Authentication
3. Test login/logout flows

### Test Firestore

1. Try creating data in your app
2. Check Firebase Console → Firestore Database
3. Verify security rules work (try unauthorized access)

---

## Troubleshooting

### Common Issues

#### 1. "Permission denied" errors

**Problem:** Security rules are blocking your requests

**Solution:**
- Check Firestore rules in Firebase Console
- Verify user is authenticated
- Check user's role/permissions if using role-based access

#### 2. "Missing indexes" errors

**Problem:** Query requires a composite index

**Solution:**
- Check browser console for index creation link
- Click the link to auto-create the index
- OR manually add to `firestore.indexes.json` and deploy

#### 3. Firebase CLI not found

**Problem:** Firebase CLI not installed globally

**Solution:**
```bash
npm install -g firebase-tools
firebase --version
```

#### 4. Build fails during deployment

**Problem:** Vite build errors

**Solution:**
```bash
# Run build separately to see errors
npm run build
# Fix errors, then deploy
npm run deploy:hosting
```

#### 5. Environment variables not working

**Problem:** Vite can't read .env variables

**Solution:**
- Ensure all variables start with `VITE_`
- Restart dev server after changing .env
- Check variables with `console.log(import.meta.env.VITE_FIREBASE_API_KEY)`

#### 6. 404 errors on deployed app

**Problem:** Firebase Hosting not configured for SPA

**Solution:**
- Check `firebase.json` has the rewrite rule:
```json
"rewrites": [
  {
    "source": "**",
    "destination": "/index.html"
  }
]
```

---

## Production Checklist

Before deploying to production:

- [ ] `.env` is in `.gitignore`
- [ ] Firebase security rules are production-ready (not test mode)
- [ ] All required Firestore indexes are created
- [ ] Environment variables are set correctly
- [ ] App builds successfully (`npm run build`)
- [ ] Test authentication flows
- [ ] Test all CRUD operations
- [ ] Verify security rules block unauthorized access
- [ ] Set up Firebase billing alerts (optional but recommended)
- [ ] Configure automated backups in Firebase Console
- [ ] Test on mobile devices
- [ ] Set up custom domain (optional)

---

## Advanced: Custom Domain Setup

### Step 1: Add Custom Domain

1. Go to Firebase Console → Hosting
2. Click "Add custom domain"
3. Enter your domain name
4. Follow DNS verification steps

### Step 2: Update DNS Records

Add the provided DNS records to your domain registrar:
- A records for apex domain
- TXT record for verification

### Step 3: Wait for SSL Certificate

Firebase automatically provisions an SSL certificate (can take up to 24 hours).

---

## Continuous Deployment with GitHub Actions

Create `.github/workflows/firebase-deploy.yml`:

```yaml
name: Deploy to Firebase

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}

      - name: Deploy to Firebase
        uses: w9jds/firebase-action@master
        with:
          args: deploy --only hosting
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
```

**Setup:**
1. Generate Firebase token: `firebase login:ci`
2. Add token to GitHub Secrets as `FIREBASE_TOKEN`
3. Add all Firebase config values to GitHub Secrets
4. Push to main branch triggers deployment

---

## Monitoring & Analytics

### Firebase Console Monitoring

- **Authentication:** Track user signups, active users
- **Firestore:** Monitor reads, writes, deletes (watch for quota)
- **Hosting:** View traffic, bandwidth usage
- **Performance:** Enable Performance Monitoring SDK

### Set Up Billing Alerts

1. Go to Firebase Console → Project Settings → Usage and Billing
2. Set up budget alerts to avoid surprise charges
3. Spark (free) plan limits:
   - 50K reads/day
   - 20K writes/day
   - 1GB storage
   - 10GB hosting transfer

---

## Resources

- **Firebase Docs:** https://firebase.google.com/docs
- **Firebase CLI Reference:** https://firebase.google.com/docs/cli
- **Vite + Firebase Guide:** https://vitejs.dev/guide/
- **Security Rules Reference:** https://firebase.google.com/docs/rules
- **React + Firebase Tutorial:** https://firebase.google.com/docs/web/setup

---

**Guide Version:** 1.0
**Last Updated:** November 2025
**Compatible With:** React 18 + Vite + Firebase 10+
