# Project: Golf Club Membership Management

## Project Overview

This is a web-based application designed to manage the memberships of the Tea Tree Golf Club. It provides a centralized system for tracking member information, payments, and fees. The application is built with a modern frontend stack and utilizes Firebase for backend services.

**Key Technologies:**

*   **Frontend:** React, Vite
*   **Backend:** Firebase (Firestore, Authentication)
*   **Styling:** Tailwind CSS
*   **Routing:** React Router

**Architecture:**

The application is a single-page application (SPA) built with React. It interacts with Firebase for data storage and user authentication. The UI is styled with Tailwind CSS, and client-side routing is handled by React Router.

## Building and Running

### Prerequisites

*   Node.js and npm
*   A Firebase project

### Setup and Execution

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Configure Firebase:**
    *   Create a `.env` file by copying `.env.example`.
    *   Populate the `.env` file with your Firebase project's configuration keys.

3.  **Run the Development Server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173`.

4.  **Build for Production:**
    ```bash
    npm run build
    ```

5.  **Preview Production Build:**
    ```bash
    npm run preview
    ```

## Development Conventions

*   **Component-Based Architecture:** The UI is organized into reusable components located in `src/components`.
*   **State Management:** React Context is used for managing global state, such as authentication (`src/contexts/AuthContext.jsx`).
*   **Routing:** Pages are defined in `src/pages` and routing is managed in `src/App.jsx`.
*   **Firebase Services:** The Firebase configuration and initialization are located in `src/firebase.js`.
*   **Styling:** Utility-first CSS with Tailwind CSS is the standard for styling.
