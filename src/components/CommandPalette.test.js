import { describe, it, expect } from 'vitest'

/**
 * CommandPalette Component Tests
 *
 * These tests verify the business logic used in command palette:
 * - Member search filtering
 * - Navigation items role filtering
 * - Quick actions role filtering
 * - Search term requirements
 */

// Role hierarchy constants (matching AuthContext)
const ROLES = {
  VIEW: 1,
  EDIT: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4,
}

// Extracted member filtering logic from CommandPalette.jsx
function filterMembers(members, search) {
  if (!search || search.length < 2) return []
  const term = search.toLowerCase()
  return members
    .filter(
      (m) =>
        m.fullName?.toLowerCase().includes(term) ||
        m.email?.toLowerCase().includes(term) ||
        m.memberNumber?.toLowerCase().includes(term)
    )
    .slice(0, 5)
}

// Extracted navigation items filtering logic
function filterNavigationItems(items, checkPermission) {
  return items.filter((item) => !item.minRole || checkPermission(item.minRole))
}

// Extracted quick actions filtering logic
function filterQuickActions(actions, checkPermission) {
  return actions.filter((item) => !item.minRole || checkPermission(item.minRole))
}

// Create a checkPermission function for a given role level
function createCheckPermission(userRoleLevel) {
  return (requiredRole) => userRoleLevel >= requiredRole
}

// Sample navigation items (matching component)
const navigationItems = [
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Members', path: '/members' },
  { name: 'Payments', path: '/payments' },
  { name: 'Reports', path: '/reports' },
  { name: 'Applications', path: '/applications', minRole: ROLES.EDIT },
  { name: 'Users', path: '/users', minRole: ROLES.ADMIN },
  { name: 'Admin', path: '/admin', minRole: ROLES.SUPER_ADMIN },
]

// Sample quick actions (matching component)
const quickActions = [
  { name: 'Add New Member', minRole: ROLES.EDIT },
  { name: 'Record Payment', minRole: ROLES.EDIT },
  { name: 'New Application', minRole: ROLES.EDIT },
]

// Sample member data for testing
const sampleMembers = [
  { id: '1', fullName: 'John Smith', email: 'john@example.com', memberNumber: 'M001' },
  { id: '2', fullName: 'Jane Doe', email: 'jane@example.com', memberNumber: 'M002' },
  { id: '3', fullName: 'Bob Johnson', email: 'bob@example.com', memberNumber: 'M003' },
  { id: '4', fullName: 'Alice Williams', email: 'alice@example.com', memberNumber: 'M004' },
  { id: '5', fullName: 'Charlie Brown', email: 'charlie@example.com', memberNumber: 'M005' },
  { id: '6', fullName: 'Diana Prince', email: 'diana@example.com', memberNumber: 'M006' },
  { id: '7', fullName: 'Johnny Appleseed', email: 'johnny@example.com', memberNumber: 'M007' },
]

describe('CommandPalette - Member Search', () => {
  describe('filterMembers', () => {
    it('should return empty array when search is empty', () => {
      const result = filterMembers(sampleMembers, '')
      expect(result).toEqual([])
    })

    it('should return empty array when search is null', () => {
      const result = filterMembers(sampleMembers, null)
      expect(result).toEqual([])
    })

    it('should return empty array when search is less than 2 characters', () => {
      const result = filterMembers(sampleMembers, 'j')
      expect(result).toEqual([])
    })

    it('should filter by fullName (case-insensitive)', () => {
      const result = filterMembers(sampleMembers, 'john')
      // Matches: John Smith, Bob Johnson, Johnny Appleseed
      expect(result).toHaveLength(3)
      expect(result.map(m => m.fullName)).toContain('John Smith')
      expect(result.map(m => m.fullName)).toContain('Bob Johnson')
      expect(result.map(m => m.fullName)).toContain('Johnny Appleseed')
    })

    it('should filter by email', () => {
      const result = filterMembers(sampleMembers, 'jane@')
      expect(result).toHaveLength(1)
      expect(result[0].fullName).toBe('Jane Doe')
    })

    it('should filter by memberNumber', () => {
      const result = filterMembers(sampleMembers, 'M003')
      expect(result).toHaveLength(1)
      expect(result[0].fullName).toBe('Bob Johnson')
    })

    it('should limit results to 5 members', () => {
      // Search for a common term that matches many members
      const result = filterMembers(sampleMembers, '.com')
      expect(result.length).toBeLessThanOrEqual(5)
    })

    it('should return empty array when no matches found', () => {
      const result = filterMembers(sampleMembers, 'xyz123')
      expect(result).toEqual([])
    })

    it('should handle members with missing fields gracefully', () => {
      const membersWithMissingFields = [
        { id: '1', fullName: 'John Smith' }, // missing email and memberNumber
        { id: '2', email: 'jane@example.com' }, // missing fullName and memberNumber
        { id: '3', memberNumber: 'M003' }, // missing fullName and email
      ]

      // Should not throw errors
      expect(() => filterMembers(membersWithMissingFields, 'john')).not.toThrow()

      const result = filterMembers(membersWithMissingFields, 'john')
      expect(result).toHaveLength(1)
    })

    it('should match partial strings', () => {
      const result = filterMembers(sampleMembers, 'wil')
      expect(result).toHaveLength(1)
      expect(result[0].fullName).toBe('Alice Williams')
    })
  })
})

describe('CommandPalette - Navigation Items', () => {
  describe('filterNavigationItems for VIEW role', () => {
    const checkPermission = createCheckPermission(ROLES.VIEW)

    it('should show only public navigation items', () => {
      const result = filterNavigationItems(navigationItems, checkPermission)

      expect(result).toHaveLength(4)
      expect(result.map(i => i.name)).toEqual(['Dashboard', 'Members', 'Payments', 'Reports'])
    })

    it('should hide Applications (requires EDIT)', () => {
      const result = filterNavigationItems(navigationItems, checkPermission)
      expect(result.map(i => i.name)).not.toContain('Applications')
    })

    it('should hide Users (requires ADMIN)', () => {
      const result = filterNavigationItems(navigationItems, checkPermission)
      expect(result.map(i => i.name)).not.toContain('Users')
    })

    it('should hide Admin (requires SUPER_ADMIN)', () => {
      const result = filterNavigationItems(navigationItems, checkPermission)
      expect(result.map(i => i.name)).not.toContain('Admin')
    })
  })

  describe('filterNavigationItems for EDIT role', () => {
    const checkPermission = createCheckPermission(ROLES.EDIT)

    it('should show public items plus Applications', () => {
      const result = filterNavigationItems(navigationItems, checkPermission)

      expect(result).toHaveLength(5)
      expect(result.map(i => i.name)).toContain('Applications')
    })

    it('should still hide Users and Admin', () => {
      const result = filterNavigationItems(navigationItems, checkPermission)
      expect(result.map(i => i.name)).not.toContain('Users')
      expect(result.map(i => i.name)).not.toContain('Admin')
    })
  })

  describe('filterNavigationItems for ADMIN role', () => {
    const checkPermission = createCheckPermission(ROLES.ADMIN)

    it('should show public items, Applications, and Users', () => {
      const result = filterNavigationItems(navigationItems, checkPermission)

      expect(result).toHaveLength(6)
      expect(result.map(i => i.name)).toContain('Applications')
      expect(result.map(i => i.name)).toContain('Users')
    })

    it('should still hide Admin', () => {
      const result = filterNavigationItems(navigationItems, checkPermission)
      expect(result.map(i => i.name)).not.toContain('Admin')
    })
  })

  describe('filterNavigationItems for SUPER_ADMIN role', () => {
    const checkPermission = createCheckPermission(ROLES.SUPER_ADMIN)

    it('should show all navigation items', () => {
      const result = filterNavigationItems(navigationItems, checkPermission)

      expect(result).toHaveLength(7)
      expect(result.map(i => i.name)).toEqual([
        'Dashboard', 'Members', 'Payments', 'Reports',
        'Applications', 'Users', 'Admin'
      ])
    })
  })
})

describe('CommandPalette - Quick Actions', () => {
  describe('filterQuickActions for VIEW role', () => {
    const checkPermission = createCheckPermission(ROLES.VIEW)

    it('should return no quick actions for VIEW role', () => {
      const result = filterQuickActions(quickActions, checkPermission)
      expect(result).toHaveLength(0)
    })
  })

  describe('filterQuickActions for EDIT role', () => {
    const checkPermission = createCheckPermission(ROLES.EDIT)

    it('should return all quick actions for EDIT role', () => {
      const result = filterQuickActions(quickActions, checkPermission)

      expect(result).toHaveLength(3)
      expect(result.map(a => a.name)).toEqual([
        'Add New Member',
        'Record Payment',
        'New Application',
      ])
    })
  })

  describe('filterQuickActions for ADMIN role', () => {
    const checkPermission = createCheckPermission(ROLES.ADMIN)

    it('should return all quick actions for ADMIN role', () => {
      const result = filterQuickActions(quickActions, checkPermission)
      expect(result).toHaveLength(3)
    })
  })

  describe('filterQuickActions for SUPER_ADMIN role', () => {
    const checkPermission = createCheckPermission(ROLES.SUPER_ADMIN)

    it('should return all quick actions for SUPER_ADMIN role', () => {
      const result = filterQuickActions(quickActions, checkPermission)
      expect(result).toHaveLength(3)
    })
  })
})

describe('CommandPalette - Search Behavior', () => {
  it('should require minimum 2 characters to search', () => {
    expect(filterMembers(sampleMembers, '')).toHaveLength(0)
    expect(filterMembers(sampleMembers, 'a')).toHaveLength(0)
    expect(filterMembers(sampleMembers, 'al')).toHaveLength(1) // Matches 'Alice'
  })

  it('should search across multiple fields simultaneously', () => {
    const members = [
      { id: '1', fullName: 'Test User', email: 'john@example.com', memberNumber: 'X001' },
    ]

    // Should find by name
    expect(filterMembers(members, 'test')).toHaveLength(1)
    // Should find by email
    expect(filterMembers(members, 'john')).toHaveLength(1)
    // Should find by member number
    expect(filterMembers(members, 'X001')).toHaveLength(1)
  })
})
