import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import { Toaster } from '@/components/ui/sonner'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Members from './pages/Members'
import AddMember from './pages/AddMember'
import EditMember from './pages/EditMember'
import MemberDetail from './pages/MemberDetail'
import Payments from './pages/Payments'
import Reports from './pages/Reports'
import Applications from './pages/Applications'
import AddApplication from './pages/AddApplication'
import ApplicationDetails from './pages/ApplicationDetails'
import Users from './pages/Users'
import Admin from './pages/Admin'
import ApplyForMembership from './pages/ApplyForMembership'
import VerifyEmail from './pages/VerifyEmail'
import ApplicationConfirmation from './pages/ApplicationConfirmation'
import PrivateRoute from './components/PrivateRoute'
import Layout from './components/Layout'

// Configure React Query with optimized caching settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // Data is fresh for 5 minutes
      cacheTime: 10 * 60 * 1000, // Cache persists for 10 minutes
      refetchOnWindowFocus: false, // Don't refetch when window regains focus
      refetchOnMount: false, // Don't refetch on component mount if data is fresh
      retry: 1, // Only retry failed requests once
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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
        </Router>
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
