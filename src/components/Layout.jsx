import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import CommandPalette from './CommandPalette'
import UserMenu from './UserMenu'
import { Button } from '@/components/ui/button'
import { Search, LayoutDashboard, Users, CreditCard, FileText, FileCheck, UserCog, Settings } from 'lucide-react'

const Layout = () => {
  const { checkPermission, ROLES } = useAuth()
  const location = useLocation()

  const canAccessApplications = checkPermission(ROLES.EDIT)
  const canAccessUsers = checkPermission(ROLES.ADMIN)
  const canAccessAdmin = checkPermission(ROLES.SUPER_ADMIN)

  const isActive = (path) => {
    return location.pathname === path
      ? 'bg-club-tan text-club-navy-dark font-semibold shadow-sm'
      : 'text-club-tan-light hover:bg-club-navy-dark hover:text-white'
  }

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, show: true },
    { to: '/members', label: 'Members', icon: Users, show: true },
    { to: '/payments', label: 'Payments', icon: CreditCard, show: true },
    { to: '/reports', label: 'Reports', icon: FileText, show: true },
    { to: '/applications', label: 'Applications', icon: FileCheck, show: canAccessApplications },
    { to: '/users', label: 'Users', icon: UserCog, show: canAccessUsers },
    { to: '/admin', label: 'Admin', icon: Settings, show: canAccessAdmin },
  ]

  return (
    <div className="min-h-screen bg-club-cream flex">
      {/* Command Palette - global, hidden until triggered */}
      <CommandPalette />

      {/* Sidebar */}
      <aside className="w-56 bg-club-navy flex flex-col fixed h-full">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-club-tan/30">
          <h1 className="text-lg font-bold text-white">Tea Tree Golf Club</h1>
          <span className="text-xs text-club-tan opacity-75">v2.4.0</span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ to, label, icon: Icon, show }) =>
            show ? (
              <Link
                key={to}
                to={to}
                className={`${isActive(to)} flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            ) : null
          )}
        </nav>
      </aside>

      {/* Main area */}
      <div className="flex-1 ml-56 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="bg-club-white shadow-sm border-b border-club-tan-light sticky top-0 z-10">
          <div className="flex justify-between items-center h-14 px-6">
            {/* Page context or breadcrumb could go here */}
            <div />

            {/* Right side: Search + User Menu */}
            <div className="flex items-center gap-2">
              {/* Search button with keyboard shortcut hint */}
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 text-club-navy hover:bg-club-tan-light hover:text-club-navy-dark"
                onClick={() => {
                  // Trigger command palette via keyboard event
                  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))
                }}
              >
                <Search className="h-4 w-4" />
                <span className="text-sm">Search</span>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-club-tan bg-club-cream px-1.5 font-mono text-[10px] font-medium text-club-navy">
                  <span className="text-xs">Ctrl</span>K
                </kbd>
              </Button>

              {/* User Menu */}
              <UserMenu />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout
