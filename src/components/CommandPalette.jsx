import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useMembers } from '../hooks/useMembers'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command'
import {
  LayoutDashboard,
  Users,
  CreditCard,
  FileText,
  ClipboardList,
  UserCog,
  Settings,
  User,
  UserPlus,
  DollarSign,
  FilePlus,
} from 'lucide-react'

const CommandPalette = () => {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
  const { checkPermission, ROLES } = useAuth()

  // Fetch members for search (only when palette is open)
  const { data: members = [] } = useMembers({
    enabled: open,
  })

  // Filter members by search term
  const filteredMembers = useMemo(() => {
    if (!search || search.length < 2) return []
    const term = search.toLowerCase()
    return members
      .filter(
        (m) =>
          m.fullName?.toLowerCase().includes(term) ||
          m.email?.toLowerCase().includes(term) ||
          m.memberNumber?.toLowerCase().includes(term)
      )
      .slice(0, 5) // Limit results
  }, [members, search])

  // Keyboard shortcut listener (Cmd+K / Ctrl+K)
  useEffect(() => {
    const down = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  // Handle dialog open state change
  const handleOpenChange = (newOpen) => {
    setOpen(newOpen)
    // Reset search when dialog closes
    if (!newOpen) {
      setSearch('')
    }
  }

  // Navigation items (role-filtered)
  const navigationItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Members', path: '/members', icon: Users },
    { name: 'Payments', path: '/payments', icon: CreditCard },
    { name: 'Reports', path: '/reports', icon: FileText },
    { name: 'Applications', path: '/applications', icon: ClipboardList, minRole: ROLES.EDIT },
    { name: 'Users', path: '/users', icon: UserCog, minRole: ROLES.ADMIN },
    { name: 'Admin', path: '/admin', icon: Settings, minRole: ROLES.SUPER_ADMIN },
  ]

  // Quick actions (role-filtered)
  const quickActions = [
    {
      name: 'Add New Member',
      action: () => navigate('/members/add'),
      icon: UserPlus,
      minRole: ROLES.EDIT,
    },
    {
      name: 'Record Payment',
      action: () => navigate('/payments'),
      icon: DollarSign,
      minRole: ROLES.EDIT,
    },
    {
      name: 'New Application',
      action: () => navigate('/applications/add'),
      icon: FilePlus,
      minRole: ROLES.EDIT,
    },
  ]

  const handleSelect = (callback) => {
    setSearch('')
    setOpen(false)
    callback()
  }

  return (
    <CommandDialog open={open} onOpenChange={handleOpenChange}>
      <CommandInput
        placeholder="Search members, pages, or actions..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Member search results */}
        {filteredMembers.length > 0 && (
          <CommandGroup heading="Members">
            {filteredMembers.map((member) => (
              <CommandItem
                key={member.id}
                value={`member-${member.id}-${member.fullName}`}
                onSelect={() => handleSelect(() => navigate(`/members/${member.id}`))}
              >
                <User className="mr-2 h-4 w-4" />
                <span>{member.fullName}</span>
                {member.memberNumber && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    #{member.memberNumber}
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Navigation */}
        <CommandGroup heading="Navigation">
          {navigationItems
            .filter((item) => !item.minRole || checkPermission(item.minRole))
            .map((item) => (
              <CommandItem
                key={item.path}
                value={`nav-${item.name}`}
                onSelect={() => handleSelect(() => navigate(item.path))}
              >
                <item.icon className="mr-2 h-4 w-4" />
                <span>{item.name}</span>
              </CommandItem>
            ))}
        </CommandGroup>

        <CommandSeparator />

        {/* Quick Actions */}
        <CommandGroup heading="Quick Actions">
          {quickActions
            .filter((item) => !item.minRole || checkPermission(item.minRole))
            .map((item) => (
              <CommandItem
                key={item.name}
                value={`action-${item.name}`}
                onSelect={() => handleSelect(item.action)}
              >
                <item.icon className="mr-2 h-4 w-4" />
                <span>{item.name}</span>
              </CommandItem>
            ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}

export default CommandPalette
