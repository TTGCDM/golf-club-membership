import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import { Toaster } from '@/components/ui/sonner'

// Core components loaded immediately (needed for initial render)
import Login from './pages/Login'
import Register from './pages/Register'
import PrivateRoute from './components/PrivateRoute'
import Layout from './components/Layout'

// Lazy-loaded pages - split into separate chunks
// These pages are loaded on-demand to reduce initial bundle size

// Dashboard - most common entry point after login
const Dashboard = lazy(() => import('./pages/Dashboard'))

// Member management pages
const Members = lazy(() => import('./pages/Members'))
const AddMember = lazy(() => import('./pages/AddMember'))
const EditMember = lazy(() => import('./pages/EditMember'))
const MemberDetail = lazy(() => import('./pages/MemberDetail'))

// Financial pages (contains jsPDF - large dependency)
const Payments = lazy(() => import('./pages/Payments'))
const Reports = lazy(() => import('./pages/Reports'))

// Application management pages
const Applications = lazy(() => import('./pages/Applications'))
const AddApplication = lazy(() => import('./pages/AddApplication'))
const ApplicationDetails = lazy(() => import('./pages/ApplicationDetails'))

// Public application pages
const ApplyForMembership = lazy(() => import('./pages/ApplyForMembership'))
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'))
const ApplicationConfirmation = lazy(() => import('./pages/ApplicationConfirmation'))

// Admin pages (less frequently accessed)
const Users = lazy(() => import('./pages/Users'))
const Admin = lazy(() => import('./pages/Admin'))

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
      <span className="text-sm text-gray-500">Loading...</span>
    </div>
  </div>
)

// Configure React Query with optimized caching settings
// Balance between data freshness and Firebase read minimization
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // Data is fresh for 5 minutes
      cacheTime: 10 * 60 * 1000, // Cache persists for 10 minutes
      refetchOnWindowFocus: true, // Refetch stale data when tab regains focus
      refetchOnMount: true, // Refetch stale data on component mount
      refetchOnReconnect: true, // Refetch when network reconnects
      retry: 1, // Only retry failed requests once
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/apply" element={<ApplyForMembership />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/application-confirmation" element={<ApplicationConfirmation />} />

              {/* Protected Routes */}
              <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="members" element={<Members />} />
                <Route path="members/add" element={<AddMember />} />
                <Route path="members/:id" element={<MemberDetail />} />
                <Route path="members/:id/edit" element={<EditMember />} />
                <Route path="payments" element={<Payments />} />
                <Route path="reports" element={<Reports />} />
                <Route path="applications" element={<Applications />} />
                <Route path="applications/add" element={<AddApplication />} />
                <Route path="applications/:id" element={<ApplicationDetails />} />
                <Route path="users" element={<Users />} />
                <Route path="admin" element={<Admin />} />
              </Route>
            </Routes>
          </Suspense>
        </Router>
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
