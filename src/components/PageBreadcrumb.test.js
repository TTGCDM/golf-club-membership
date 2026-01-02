import { describe, it, expect } from 'vitest'

/**
 * PageBreadcrumb Component Tests
 *
 * These tests verify the business logic used in breadcrumb navigation:
 * - Item classification (link vs current page)
 * - Dashboard always present as home
 * - Items array processing
 * - Edge cases handling
 */

// Extracted logic for determining if an item is a link or current page
function isLinkItem(item) {
  return Boolean(item.href)
}

// Extracted logic for building breadcrumb structure
function buildBreadcrumbStructure(items = []) {
  const structure = [
    { label: 'Dashboard', href: '/dashboard', type: 'link' }
  ]

  items.forEach((item) => {
    structure.push({
      label: item.label,
      href: item.href || null,
      type: item.href ? 'link' : 'page',
    })
  })

  return structure
}

// Validate breadcrumb items
function validateBreadcrumbItems(items) {
  const errors = []

  if (!Array.isArray(items)) {
    return ['Items must be an array']
  }

  items.forEach((item, index) => {
    if (!item.label) {
      errors.push(`Item at index ${index} is missing a label`)
    }
    if (typeof item.label !== 'string' && item.label !== undefined) {
      errors.push(`Item at index ${index} has non-string label`)
    }
  })

  // Last item should not have href (it's the current page)
  if (items.length > 0 && items[items.length - 1].href) {
    errors.push('Last breadcrumb item should not have href (current page)')
  }

  return errors
}

// Count total breadcrumb items including Dashboard
function countBreadcrumbItems(items = []) {
  return 1 + items.length // Dashboard + provided items
}

describe('PageBreadcrumb - Item Classification', () => {
  describe('isLinkItem', () => {
    it('should return true when item has href', () => {
      const item = { label: 'Members', href: '/members' }
      expect(isLinkItem(item)).toBe(true)
    })

    it('should return false when item has no href', () => {
      const item = { label: 'John Smith' }
      expect(isLinkItem(item)).toBe(false)
    })

    it('should return false when href is empty string', () => {
      const item = { label: 'Current Page', href: '' }
      expect(isLinkItem(item)).toBe(false)
    })

    it('should return false when href is null', () => {
      const item = { label: 'Current Page', href: null }
      expect(isLinkItem(item)).toBe(false)
    })

    it('should return false when href is undefined', () => {
      const item = { label: 'Current Page', href: undefined }
      expect(isLinkItem(item)).toBe(false)
    })
  })
})

describe('PageBreadcrumb - Structure Building', () => {
  describe('buildBreadcrumbStructure', () => {
    it('should always include Dashboard as first item', () => {
      const result = buildBreadcrumbStructure([])

      expect(result[0]).toEqual({
        label: 'Dashboard',
        href: '/dashboard',
        type: 'link',
      })
    })

    it('should return only Dashboard when no items provided', () => {
      const result = buildBreadcrumbStructure([])

      expect(result).toHaveLength(1)
      expect(result[0].label).toBe('Dashboard')
    })

    it('should return only Dashboard when items is undefined', () => {
      const result = buildBreadcrumbStructure(undefined)

      expect(result).toHaveLength(1)
      expect(result[0].label).toBe('Dashboard')
    })

    it('should build structure for single link item', () => {
      const items = [{ label: 'Members', href: '/members' }]
      const result = buildBreadcrumbStructure(items)

      expect(result).toHaveLength(2)
      expect(result[1]).toEqual({
        label: 'Members',
        href: '/members',
        type: 'link',
      })
    })

    it('should build structure for single page item (no href)', () => {
      const items = [{ label: 'John Smith' }]
      const result = buildBreadcrumbStructure(items)

      expect(result).toHaveLength(2)
      expect(result[1]).toEqual({
        label: 'John Smith',
        href: null,
        type: 'page',
      })
    })

    it('should build structure for MemberDetail breadcrumb', () => {
      const items = [
        { label: 'Members', href: '/members' },
        { label: 'John Smith' },
      ]
      const result = buildBreadcrumbStructure(items)

      expect(result).toHaveLength(3)
      expect(result[0].label).toBe('Dashboard')
      expect(result[1]).toEqual({ label: 'Members', href: '/members', type: 'link' })
      expect(result[2]).toEqual({ label: 'John Smith', href: null, type: 'page' })
    })

    it('should build structure for EditMember breadcrumb', () => {
      const items = [
        { label: 'Members', href: '/members' },
        { label: 'John Smith', href: '/members/123' },
        { label: 'Edit' },
      ]
      const result = buildBreadcrumbStructure(items)

      expect(result).toHaveLength(4)
      expect(result[0].label).toBe('Dashboard')
      expect(result[1]).toEqual({ label: 'Members', href: '/members', type: 'link' })
      expect(result[2]).toEqual({ label: 'John Smith', href: '/members/123', type: 'link' })
      expect(result[3]).toEqual({ label: 'Edit', href: null, type: 'page' })
    })

    it('should build structure for ApplicationDetails breadcrumb', () => {
      const items = [
        { label: 'Applications', href: '/applications' },
        { label: 'Jane Doe Application' },
      ]
      const result = buildBreadcrumbStructure(items)

      expect(result).toHaveLength(3)
      expect(result[0].label).toBe('Dashboard')
      expect(result[1]).toEqual({ label: 'Applications', href: '/applications', type: 'link' })
      expect(result[2]).toEqual({ label: 'Jane Doe Application', href: null, type: 'page' })
    })
  })
})

describe('PageBreadcrumb - Validation', () => {
  describe('validateBreadcrumbItems', () => {
    it('should return no errors for valid items', () => {
      const items = [
        { label: 'Members', href: '/members' },
        { label: 'John Smith' },
      ]
      const errors = validateBreadcrumbItems(items)
      expect(errors).toHaveLength(0)
    })

    it('should return error for non-array items', () => {
      const errors = validateBreadcrumbItems('not an array')
      expect(errors).toContain('Items must be an array')
    })

    it('should return error for item missing label', () => {
      const items = [{ href: '/members' }]
      const errors = validateBreadcrumbItems(items)
      expect(errors).toContain('Item at index 0 is missing a label')
    })

    it('should return error when last item has href', () => {
      const items = [
        { label: 'Members', href: '/members' },
        { label: 'John Smith', href: '/members/123' }, // Last item shouldn't have href
      ]
      const errors = validateBreadcrumbItems(items)
      expect(errors).toContain('Last breadcrumb item should not have href (current page)')
    })

    it('should allow empty items array', () => {
      const errors = validateBreadcrumbItems([])
      expect(errors).toHaveLength(0)
    })

    it('should validate multiple items', () => {
      const items = [
        { label: 'Members', href: '/members' },
        { label: 'John', href: '/members/123' },
        { label: 'Edit' },
      ]
      const errors = validateBreadcrumbItems(items)
      expect(errors).toHaveLength(0)
    })
  })
})

describe('PageBreadcrumb - Item Counting', () => {
  describe('countBreadcrumbItems', () => {
    it('should return 1 for empty items (Dashboard only)', () => {
      expect(countBreadcrumbItems([])).toBe(1)
    })

    it('should return 1 for undefined items', () => {
      expect(countBreadcrumbItems(undefined)).toBe(1)
    })

    it('should return 2 for single item', () => {
      const items = [{ label: 'Members' }]
      expect(countBreadcrumbItems(items)).toBe(2)
    })

    it('should return 3 for two items', () => {
      const items = [
        { label: 'Members', href: '/members' },
        { label: 'John Smith' },
      ]
      expect(countBreadcrumbItems(items)).toBe(3)
    })

    it('should return 4 for three items (EditMember pattern)', () => {
      const items = [
        { label: 'Members', href: '/members' },
        { label: 'John Smith', href: '/members/123' },
        { label: 'Edit' },
      ]
      expect(countBreadcrumbItems(items)).toBe(4)
    })
  })
})

describe('PageBreadcrumb - Edge Cases', () => {
  it('should handle item with very long label', () => {
    const longLabel = 'A'.repeat(200)
    const items = [{ label: longLabel }]
    const result = buildBreadcrumbStructure(items)

    expect(result).toHaveLength(2)
    expect(result[1].label).toBe(longLabel)
  })

  it('should handle item with special characters in label', () => {
    const items = [{ label: "O'Connor & Associates <test>" }]
    const result = buildBreadcrumbStructure(items)

    expect(result).toHaveLength(2)
    expect(result[1].label).toBe("O'Connor & Associates <test>")
  })

  it('should handle item with unicode characters', () => {
    const items = [{ label: '日本語テスト 🏌️' }]
    const result = buildBreadcrumbStructure(items)

    expect(result).toHaveLength(2)
    expect(result[1].label).toBe('日本語テスト 🏌️')
  })

  it('should handle deeply nested breadcrumb (5 levels)', () => {
    const items = [
      { label: 'Level 1', href: '/l1' },
      { label: 'Level 2', href: '/l1/l2' },
      { label: 'Level 3', href: '/l1/l2/l3' },
      { label: 'Level 4', href: '/l1/l2/l3/l4' },
      { label: 'Level 5' },
    ]
    const result = buildBreadcrumbStructure(items)

    expect(result).toHaveLength(6) // Dashboard + 5 levels
    expect(result[5].type).toBe('page')
  })

  it('should handle href with query parameters', () => {
    const items = [{ label: 'Search Results', href: '/search?q=test&page=2' }]
    const result = buildBreadcrumbStructure(items)

    expect(result[1].href).toBe('/search?q=test&page=2')
  })

  it('should handle href with hash fragments', () => {
    const items = [{ label: 'Section', href: '/page#section-1' }]
    const result = buildBreadcrumbStructure(items)

    expect(result[1].href).toBe('/page#section-1')
  })
})

describe('PageBreadcrumb - Common Use Cases', () => {
  it('should support Members list page breadcrumb', () => {
    // From Members page - just shows Dashboard > Members
    const items = [{ label: 'Members' }]
    const result = buildBreadcrumbStructure(items)

    expect(result).toEqual([
      { label: 'Dashboard', href: '/dashboard', type: 'link' },
      { label: 'Members', href: null, type: 'page' },
    ])
  })

  it('should support MemberDetail breadcrumb', () => {
    const items = [
      { label: 'Members', href: '/members' },
      { label: 'John Smith' },
    ]
    const result = buildBreadcrumbStructure(items)

    expect(result[0].type).toBe('link')
    expect(result[1].type).toBe('link')
    expect(result[2].type).toBe('page')
  })

  it('should support EditMember breadcrumb', () => {
    const items = [
      { label: 'Members', href: '/members' },
      { label: 'John Smith', href: '/members/abc123' },
      { label: 'Edit' },
    ]
    const result = buildBreadcrumbStructure(items)

    expect(result).toHaveLength(4)
    expect(result.filter(i => i.type === 'link')).toHaveLength(3)
    expect(result.filter(i => i.type === 'page')).toHaveLength(1)
  })

  it('should support ApplicationDetails breadcrumb', () => {
    const items = [
      { label: 'Applications', href: '/applications' },
      { label: 'Application from Jane Doe' },
    ]
    const result = buildBreadcrumbStructure(items)

    expect(result).toHaveLength(3)
    expect(result[2].label).toBe('Application from Jane Doe')
    expect(result[2].type).toBe('page')
  })
})
