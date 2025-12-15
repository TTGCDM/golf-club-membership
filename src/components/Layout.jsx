import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Layout = () => {
  const { currentUser, logout, checkPermission, ROLES } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const canAccessApplications = checkPermission(ROLES.EDIT)
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
    return location.pathname === path
      ? 'bg-white text-ocean-navy'
      : 'bg-ocean-navy bg-opacity-60 text-white'
  }

  return (
    <div className="min-h-screen bg-ocean-cream">
      {/* Navigation */}
      <nav className="bg-ocean-teal text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold">Tea Tree Golf Club</h1>
                <span className="ml-2 text-xs text-ocean-seafoam opacity-75">v2.2.0</span>
              </div>
              <div className="hidden sm:ml-8 sm:flex sm:space-x-2">
                <Link
                  to="/dashboard"
                  className={`${isActive('/dashboard')} px-4 py-3 rounded-md text-base font-semibold hover:bg-white hover:text-ocean-navy transition-all duration-200`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/members"
                  className={`${isActive('/members')} px-4 py-3 rounded-md text-base font-semibold hover:bg-white hover:text-ocean-navy transition-all duration-200`}
                >
                  Members
                </Link>
                <Link
                  to="/payments"
                  className={`${isActive('/payments')} px-4 py-3 rounded-md text-base font-semibold hover:bg-white hover:text-ocean-navy transition-all duration-200`}
                >
                  Payments
                </Link>
                <Link
                  to="/reports"
                  className={`${isActive('/reports')} px-4 py-3 rounded-md text-base font-semibold hover:bg-white hover:text-ocean-navy transition-all duration-200`}
                >
                  Reports
                </Link>
                {canAccessApplications && (
                  <Link
                    to="/applications"
                    className={`${isActive('/applications')} px-4 py-3 rounded-md text-base font-semibold hover:bg-white hover:text-ocean-navy transition-all duration-200`}
                  >
                    Applications
                  </Link>
                )}
                {canAccessUsers && (
                  <Link
                    to="/users"
                    className={`${isActive('/users')} px-4 py-3 rounded-md text-base font-semibold hover:bg-white hover:text-ocean-navy transition-all duration-200`}
                  >
                    Users
                  </Link>
                )}
                {canAccessAdmin && (
                  <Link
                    to="/admin"
                    className={`${isActive('/admin')} px-4 py-3 rounded-md text-base font-semibold hover:bg-white hover:text-ocean-navy transition-all duration-200`}
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
                className="bg-ocean-navy hover:bg-white hover:text-ocean-navy px-4 py-2 rounded-md text-sm font-medium transition-all duration-200"
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
