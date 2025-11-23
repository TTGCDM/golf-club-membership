# Tea Tree Golf Club - Membership Management System

A web-based membership management system for Tea Tree Golf Club, built with React and Firebase.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Firebase Setup

#### Create a Firebase Project:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Name it: "tea-tree-golf-club" (or your preferred name)
4. Disable Google Analytics (optional for this project)
5. Click "Create project"

#### Enable Authentication:

1. In your Firebase project, go to **Build** > **Authentication**
2. Click "Get started"
3. Under "Sign-in method" tab, click "Email/Password"
4. Enable it and click "Save"

#### Enable Firestore Database:

1. Go to **Build** > **Firestore Database**
2. Click "Create database"
3. Choose **"Start in test mode"** for now (we'll add security rules later)
4. Select a location (choose closest to Australia, e.g., australia-southeast1)
5. Click "Enable"

#### Get Firebase Configuration:

1. Go to **Project Settings** (gear icon next to "Project Overview")
2. Scroll down to "Your apps" section
3. Click the **Web** icon (`</>`)
4. Register app nickname: "Golf Club Web App"
5. Don't check "Firebase Hosting" yet
6. Click "Register app"
7. Copy the `firebaseConfig` object values

### 3. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   copy .env.example .env
   ```

2. Open `.env` and fill in your Firebase configuration values from the previous step:
   ```
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

### 4. Create First Admin User

1. In Firebase Console, go to **Authentication** > **Users**
2. Click "Add user"
3. Enter email: `admin@teatreegolf.com` (or your preferred email)
4. Enter a secure password
5. Click "Add user"

### 5. Run the Development Server

```bash
npm run dev
```

The app will open at `http://localhost:5173`

### 6. Login

Use the email and password you created in step 4 to login.

### 7. Development Commands

Run linter to check code quality:
```bash
npm run lint
```

Run unit tests:
```bash
npm run test
```

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── Layout.jsx   # Main layout with navigation
│   └── PrivateRoute.jsx  # Protected route wrapper
├── contexts/        # React contexts
│   └── AuthContext.jsx   # Authentication context
├── pages/          # Page components
│   ├── Login.jsx
│   ├── Dashboard.jsx
│   ├── Members.jsx
│   ├── MemberDetail.jsx
│   ├── Payments.jsx
│   └── Reports.jsx
├── firebase.js     # Firebase configuration
├── App.jsx        # Main app component
└── main.jsx       # Entry point
```

## Next Steps

After completing the initial setup, we'll build:
1. Database schema and security rules
2. Member management (CRUD operations)
3. Payment recording system
4. Annual fee application
5. Reports and dashboard
6. CSV export
7. Deployment

## Tech Stack

- **Frontend**: React 18 + Vite
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Auth + Firestore)
- **Hosting**: Firebase Hosting (to be configured)
