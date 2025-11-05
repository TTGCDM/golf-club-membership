import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Layout = () => {
  const { currentUser, logout, checkPermission, ROLES } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const canAccessUsers = checkPermission(ROLES.ADMIN)
  const canAccessAdmin = checkPermission(ROLES.SUPER_ADMIN)

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Failed to log out:', error)
    }
  }

  const isActive = (path) => {
    return location.pathname === path ? 'bg-green-700' : ''
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-green-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold">Tea Tree Golf Club</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-4">
                <Link
                  to="/dashboard"
                  className={`${isActive('/dashboard')} px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/members"
                  className={`${isActive('/members')} px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition`}
                >
                  Members
                </Link>
                <Link
                  to="/payments"
                  className={`${isActive('/payments')} px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition`}
                >
                  Payments
                </Link>
                <Link
                  to="/reports"
                  className={`${isActive('/reports')} px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition`}
                >
                  Reports
                </Link>
                {canAccessUsers && (
                  <Link
                    to="/users"
                    className={`${isActive('/users')} px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition`}
                  >
                    Users
                  </Link>
                )}
                {canAccessAdmin && (
                  <Link
                    to="/admin"
                    className={`${isActive('/admin')} px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition`}
                  >
                    Admin
                  </Link>
                )}
              </div>
            </div>
            <div className="flex items-center">
              <span className="mr-4 text-sm">{currentUser?.email}</span>
              <button
                onClick={handleLogout}
                className="bg-green-700 hover:bg-green-800 px-4 py-2 rounded-md text-sm font-medium transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
