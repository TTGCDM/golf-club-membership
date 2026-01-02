import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { User, ChevronDown, LogOut } from 'lucide-react'

const UserMenu = () => {
  const { currentUser, userRole, logout, ROLES } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Failed to log out:', error)
    }
  }

  // Role display name mapping
  const roleDisplayNames = {
    [ROLES.VIEW]: 'Viewer',
    [ROLES.EDIT]: 'Editor',
    [ROLES.ADMIN]: 'Admin',
    [ROLES.SUPER_ADMIN]: 'Super Admin'
  }

  // Role badge styling - using custom classes for ocean theme
  const roleBadgeClass = {
    [ROLES.VIEW]: 'bg-gray-500 text-white border-transparent',
    [ROLES.EDIT]: 'bg-club-navy text-white border-transparent',
    [ROLES.ADMIN]: 'bg-club-navy-dark text-white border-transparent',
    [ROLES.SUPER_ADMIN]: 'bg-red-600 text-white border-transparent'
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 text-white hover:bg-club-navy-dark hover:text-white"
        >
          <User className="h-4 w-4" />
          <span className="hidden sm:inline max-w-[150px] truncate text-sm">
            {currentUser?.email}
          </span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <p className="text-sm font-medium leading-none truncate">
              {currentUser?.email}
            </p>
            <Badge className={roleBadgeClass[userRole]}>
              {roleDisplayNames[userRole] || 'Unknown'}
            </Badge>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="text-red-600 focus:text-red-600 cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default UserMenu
