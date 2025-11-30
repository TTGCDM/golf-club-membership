# Design Guide - Tea Tree Golf Club Style

This document describes the visual design system, UI patterns, and styling conventions used in the Tea Tree Golf Club Membership Management System. Use this guide to create new applications with a consistent look and feel.

---

## Table of Contents

1. [Color Palette](#color-palette)
2. [Typography](#typography)
3. [Layout & Spacing](#layout--spacing)
4. [Component Patterns](#component-patterns)
5. [Navigation](#navigation)
6. [Forms & Inputs](#forms--inputs)
7. [Buttons](#buttons)
8. [Cards & Containers](#cards--containers)
9. [Data Visualization](#data-visualization)
10. [States & Feedback](#states--feedback)
11. [Icons](#icons)
12. [Responsive Design](#responsive-design)

---

## Color Palette

### Primary Colors (Ocean Depths Theme)

The application uses a professional maritime-inspired color palette:

```css
--ocean-navy:    #1a2332   /* Dark blue-gray - Primary dark */
--ocean-teal:    #2d8b8b   /* Professional teal - Primary brand */
--ocean-seafoam: #a8dadc   /* Light blue - Accents */
--ocean-cream:   #f1faee   /* Off-white - Background */
```

### Tailwind Configuration

```javascript
colors: {
  'ocean-navy': '#1a2332',
  'ocean-teal': '#2d8b8b',
  'ocean-seafoam': '#a8dadc',
  'ocean-cream': '#f1faee',

  // Aliases for convenience
  primary: '#1a2332',
  secondary: '#2d8b8b',
  accent: '#a8dadc',
  light: '#f1faee',
}
```

### Semantic Color Usage

| Color | Usage |
|-------|-------|
| **ocean-navy** | Primary text, headings, navigation backgrounds, hover states |
| **ocean-teal** | Primary buttons, links, active states, brand elements, positive highlights |
| **ocean-seafoam** | Light backgrounds, subtle highlights, hover states, icon backgrounds |
| **ocean-cream** | Page background, light surfaces |

### State Colors (Extended Palette)

```css
/* Success/Positive */
.success-bg { background: ocean-seafoam with opacity }
.success-text { color: ocean-teal }
.success-border { border: ocean-teal }

/* Error/Negative */
.error-bg { background: #fee2e2 (red-100) }
.error-text { color: #b91c1c (red-700) }
.error-border { border: #f87171 (red-400) }

/* Warning */
.warning-bg { background: #fef3c7 (yellow-100) }
.warning-text { color: #b45309 (yellow-700) }

/* Info/Neutral */
.info-bg { background: white }
.info-text { color: #4b5563 (gray-600) }
```

### Financial Colors

```css
/* Positive balance / Paid */
.financial-positive { color: ocean-teal }

/* Negative balance / Outstanding */
.financial-negative { color: #dc2626 (red-600) }
```

---

## Typography

### Font Family

```css
font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont,
             'Segoe UI', 'Roboto', 'sans-serif'
```

**Note:** Inter is a clean, professional sans-serif font. Include via CDN or install locally.

### Font Weights

- **Regular (400):** Body text, labels
- **Medium (500):** Subheadings, emphasized text
- **Semibold (600):** Navigation items
- **Bold (700):** Headings, important metrics

### Heading Hierarchy

```jsx
<h1 className="text-3xl font-bold text-gray-900 mb-6">
  Page Title
</h1>

<h2 className="text-lg font-semibold text-gray-900 mb-4">
  Section Heading
</h2>

<h3 className="text-base font-semibold text-gray-900 mb-2">
  Subsection Heading
</h3>
```

### Text Styles

```jsx
// Page description
<p className="text-gray-600 mb-6">
  Descriptive text goes here
</p>

// Small labels
<p className="text-sm font-medium text-gray-600">
  Label text
</p>

// Tiny helper text
<p className="text-xs text-gray-500 mt-1">
  Helper or secondary info
</p>

// Emphasized values
<p className="text-3xl font-bold text-gray-900 mt-2">
  Large metric value
</p>
```

---

## Layout & Spacing

### Container Pattern

```jsx
<div className="min-h-screen bg-ocean-cream">
  <nav className="bg-ocean-teal text-white shadow-lg">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Navigation content */}
    </div>
  </nav>

  <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
    {/* Page content */}
  </main>
</div>
```

### Spacing Scale

- **Tight spacing:** `space-y-2` (0.5rem / 8px)
- **Normal spacing:** `space-y-4` (1rem / 16px)
- **Comfortable spacing:** `space-y-6` (1.5rem / 24px)
- **Section spacing:** `mb-6` (1.5rem / 24px)
- **Page padding:** `p-6` (1.5rem / 24px)

### Grid Layouts

```jsx
// Two columns
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  {/* Items */}
</div>

// Three columns
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  {/* Items */}
</div>

// Two-column form
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {/* Form fields */}
</div>
```

---

## Component Patterns

### Statistics Cards

```jsx
<div className="bg-white shadow rounded-lg p-6">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-gray-600">Label</p>
      <p className="text-3xl font-bold text-gray-900 mt-2">123</p>
      <p className="text-sm text-gray-500 mt-1">
        Secondary info
      </p>
    </div>
    <div className="h-12 w-12 bg-ocean-seafoam bg-opacity-30 rounded-full flex items-center justify-center">
      {/* Icon */}
    </div>
  </div>
</div>
```

### Summary Cards (Colored)

```jsx
// Positive/Success variant
<div className="bg-ocean-seafoam bg-opacity-20 rounded-lg p-4 border border-ocean-teal">
  <div className="flex items-center justify-between mb-2">
    <span className="text-sm font-medium text-ocean-teal">Title</span>
    {/* Icon */}
  </div>
  <p className="text-3xl font-bold text-ocean-teal">Value</p>
  <p className="text-xs text-ocean-teal mt-1">Percentage or detail</p>
</div>

// Error/Warning variant
<div className="bg-red-50 rounded-lg p-4 border border-red-200">
  <div className="flex items-center justify-between mb-2">
    <span className="text-sm font-medium text-red-700">Title</span>
    {/* Icon */}
  </div>
  <p className="text-3xl font-bold text-red-700">Value</p>
  <p className="text-xs text-red-600 mt-1">Percentage or detail</p>
</div>
```

### Section Headers with Actions

```jsx
<div className="flex justify-between items-center mb-4">
  <h2 className="text-lg font-semibold text-gray-900">Section Title</h2>
  <Link to="/path" className="text-sm text-ocean-teal hover:text-ocean-navy">
    View All
  </Link>
</div>
```

---

## Navigation

### Top Navigation Bar

```jsx
<nav className="bg-ocean-teal text-white shadow-lg">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex justify-between h-16">
      <div className="flex">
        {/* Logo/Brand */}
        <div className="flex-shrink-0 flex items-center">
          <h1 className="text-xl font-bold">App Name</h1>
        </div>

        {/* Navigation Links */}
        <div className="hidden sm:ml-8 sm:flex sm:space-x-2">
          <Link className={navLinkClass}>Link</Link>
        </div>
      </div>

      {/* User section */}
      <div className="flex items-center">
        <span className="mr-4 text-sm">user@example.com</span>
        <button className="bg-ocean-navy hover:bg-white hover:text-ocean-navy px-4 py-2 rounded-md text-sm font-medium transition-all duration-200">
          Logout
        </button>
      </div>
    </div>
  </div>
</nav>
```

### Navigation Link States

```jsx
const isActive = (path) => {
  return location.pathname === path
    ? 'bg-white text-ocean-navy'
    : 'bg-ocean-navy bg-opacity-60 text-white'
}

<Link
  to="/path"
  className={`${isActive('/path')} px-4 py-3 rounded-md text-base font-semibold hover:bg-white hover:text-ocean-navy transition-all duration-200`}
>
  Link Text
</Link>
```

---

## Forms & Inputs

### Text Input

```jsx
<div>
  <label htmlFor="field" className="block text-sm font-medium text-gray-700 mb-1">
    Field Label
  </label>
  <input
    type="text"
    id="field"
    name="field"
    value={value}
    onChange={handleChange}
    required
    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ocean-teal"
    placeholder="Optional placeholder"
  />
</div>
```

### Select Dropdown

```jsx
<div>
  <label htmlFor="select" className="block text-sm font-medium text-gray-700 mb-1">
    Select Option
  </label>
  <select
    id="select"
    name="select"
    value={value}
    onChange={handleChange}
    required
    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ocean-teal"
  >
    <option value="">Select...</option>
    <option value="1">Option 1</option>
  </select>
</div>
```

### Form Layout

```jsx
<form onSubmit={handleSubmit} className="space-y-6">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* Form fields */}
  </div>

  <div className="flex gap-2 pt-4">
    <button type="submit" className="primary-button">
      Submit
    </button>
    <button type="button" onClick={onCancel} className="secondary-button">
      Cancel
    </button>
  </div>
</form>
```

---

## Buttons

### Primary Button

```jsx
<button
  type="submit"
  disabled={isLoading}
  className="px-4 py-2 bg-ocean-teal text-white rounded-md hover:bg-ocean-navy disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
>
  {isLoading ? 'Loading...' : 'Button Text'}
</button>
```

### Secondary Button (Gray)

```jsx
<button
  type="button"
  onClick={handleAction}
  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-all duration-200"
>
  Secondary Action
</button>
```

### Outline/Cancel Button

```jsx
<button
  type="button"
  onClick={handleCancel}
  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-all duration-200"
>
  Cancel
</button>
```

### Text Link Button

```jsx
<button
  type="button"
  onClick={handleAction}
  className="text-ocean-teal hover:text-ocean-navy font-medium"
>
  Link Action
</button>
```

### Action Link in Table

```jsx
<button
  onClick={handleEdit}
  className="text-ocean-teal hover:text-ocean-navy mr-4"
>
  Edit
</button>
```

### Full Width Button

```jsx
<button
  type="submit"
  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-ocean-teal hover:bg-ocean-navy focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ocean-teal"
>
  Sign In
</button>
```

---

## Cards & Containers

### Basic Card

```jsx
<div className="bg-white shadow rounded-lg p-6">
  <h2 className="text-lg font-semibold text-gray-900 mb-4">Card Title</h2>
  {/* Card content */}
</div>
```

### Card with Header Action

```jsx
<div className="bg-white shadow rounded-lg p-6">
  <div className="flex justify-between items-center mb-4">
    <h2 className="text-lg font-semibold text-gray-900">Card Title</h2>
    <Link to="/path" className="text-sm text-ocean-teal hover:text-ocean-navy">
      View All
    </Link>
  </div>
  {/* Card content */}
</div>
```

### Login/Auth Card

```jsx
<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ocean-teal to-ocean-navy">
  <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
    <div className="text-center mb-8">
      <h1 className="text-3xl font-bold text-ocean-navy">App Name</h1>
      <p className="text-gray-600 mt-2">Subtitle or tagline</p>
    </div>
    {/* Form content */}
  </div>
</div>
```

---

## Data Visualization

### Progress Bar

```jsx
<div>
  <div className="flex justify-between text-sm mb-1">
    <span className="text-gray-700">Label</span>
    <span className="font-medium text-gray-900">Value</span>
  </div>
  <div className="w-full bg-gray-200 rounded-full h-2">
    <div
      className="bg-ocean-teal h-2 rounded-full"
      style={{ width: `${percentage}%` }}
    ></div>
  </div>
</div>
```

### Horizontal Bar Chart (Split)

```jsx
<div className="w-full h-8 bg-gray-200 rounded-full overflow-hidden flex">
  <div
    className="bg-ocean-teal flex items-center justify-center text-white text-xs font-medium"
    style={{ width: `${percentage1}%` }}
  >
    {percentage1 > 15 && `${percentage1}%`}
  </div>
  <div
    className="bg-red-500 flex items-center justify-center text-white text-xs font-medium"
    style={{ width: `${percentage2}%` }}
  >
    {percentage2 > 15 && `${percentage2}%`}
  </div>
</div>
<div className="flex justify-between mt-2 text-xs text-gray-500">
  <span className="flex items-center">
    <span className="w-3 h-3 bg-ocean-teal rounded-full mr-1"></span>
    Label 1
  </span>
  <span className="flex items-center">
    <span className="w-3 h-3 bg-red-500 rounded-full mr-1"></span>
    Label 2
  </span>
</div>
```

### Metric Display Card

```jsx
<div className="bg-ocean-seafoam bg-opacity-20 rounded-lg p-4 border border-ocean-teal">
  <div className="flex items-center justify-between mb-2">
    <span className="text-sm font-medium text-ocean-teal">Metric Name</span>
    {/* Icon */}
  </div>
  <p className="text-3xl font-bold text-ocean-teal">1,234</p>
  <p className="text-xs text-ocean-teal mt-1">56.7% of total</p>
  <p className="text-sm font-medium text-ocean-teal mt-2">
    $12,345.67 total
  </p>
</div>
```

---

## States & Feedback

### Success Message

```jsx
<div className="mb-4 p-4 bg-ocean-seafoam bg-opacity-20 border border-ocean-teal rounded-md">
  <p className="text-ocean-teal">Operation successful!</p>
</div>
```

### Error Message

```jsx
<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
  Error message text
</div>
```

### Warning Message

```jsx
<div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
  Warning message text
</div>
```

### Loading State

```jsx
<div>
  <h1 className="text-3xl font-bold text-gray-900 mb-6">Page Title</h1>
  <p className="text-gray-600">Loading data...</p>
</div>
```

### Empty State

```jsx
<div className="bg-white shadow rounded-lg p-6">
  <p className="text-gray-600">No items found</p>
</div>
```

---

## Icons

The application uses **Heroicons** (outline style) from the Tailwind team.

### Icon in Card Header

```jsx
<div className="h-12 w-12 bg-ocean-seafoam bg-opacity-30 rounded-full flex items-center justify-center">
  <svg className="h-6 w-6 text-ocean-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
</div>
```

### Icon in Button

```jsx
<button className="flex items-center justify-center px-4 py-3 bg-ocean-teal text-white rounded-lg hover:bg-ocean-navy transition">
  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
  Button Text
</button>
```

### Icon Sizes

- **Small (h-4 w-4):** Inline with text
- **Medium (h-5 w-5):** Buttons, list items
- **Large (h-6 w-6):** Card icons, standalone icons
- **Extra Large (h-8 w-8):** Feature icons

### Common Icons Used

- **Users:** `M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z`
- **Check Circle:** `M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z`
- **Plus:** `M12 4v16m8-8H4`
- **Currency Dollar:** `M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z`
- **Chart Bar:** `M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z`

---

## Responsive Design

### Breakpoints (Tailwind defaults)

- **sm:** 640px
- **md:** 768px
- **lg:** 1024px
- **xl:** 1280px

### Responsive Patterns

```jsx
// Stack on mobile, grid on desktop
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">

// Hide on mobile, show on desktop
<div className="hidden sm:flex sm:space-x-2">

// Full width on mobile, constrained on desktop
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

// Adjust padding responsively
<main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
```

---

## Tables

### Basic Table Structure

```jsx
<div className="bg-white shadow rounded-lg overflow-hidden">
  <table className="min-w-full divide-y divide-gray-200">
    <thead className="bg-gray-50">
      <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Header
        </th>
      </tr>
    </thead>
    <tbody className="bg-white divide-y divide-gray-200">
      <tr className="hover:bg-gray-50">
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          Cell Content
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

### Sortable Table Header

```jsx
<th
  onClick={() => handleSort('field')}
  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
>
  Field Name
  {sortField === 'field' && (
    <svg className="w-4 h-4 text-ocean-teal ml-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d={sortDirection === 'asc' ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
    </svg>
  )}
</th>
```

---

## Design Principles

### 1. Clean & Professional
- Generous white space
- Clear visual hierarchy
- Minimal decoration

### 2. Consistent Interactions
- All buttons have hover states
- Links use consistent colors (ocean-teal → ocean-navy)
- Form inputs have focus rings (ring-ocean-teal)
- Transitions are 200ms for smooth feel

### 3. Accessible
- High contrast text colors
- Clear labels for all inputs
- Semantic HTML structure
- Focus indicators on interactive elements

### 4. Responsive First
- Mobile-friendly layouts
- Touch-friendly button sizes (min 44px)
- Stacks vertically on mobile, grids on desktop

### 5. Financial Data Clarity
- Positive values in ocean-teal (credit/paid)
- Negative values in red (debt/outstanding)
- Large, bold numbers for key metrics
- Supporting context in smaller, gray text

---

## Quick Reference

### Most Common Classes

```css
/* Backgrounds */
.bg-ocean-cream          /* Page background */
.bg-ocean-teal           /* Primary actions, nav */
.bg-ocean-navy           /* Dark accents, hover states */
.bg-white                /* Cards, containers */

/* Text Colors */
.text-ocean-teal         /* Links, highlights */
.text-ocean-navy         /* Headings, emphasis */
.text-gray-900           /* Primary text */
.text-gray-600           /* Secondary text */
.text-gray-500           /* Tertiary text */

/* Buttons */
.bg-ocean-teal.hover:bg-ocean-navy  /* Primary button */
.bg-gray-600.hover:bg-gray-700      /* Secondary button */
.text-ocean-teal.hover:text-ocean-navy  /* Text link */

/* Spacing */
.space-y-6               /* Vertical spacing between sections */
.gap-6                   /* Grid gap */
.px-4.py-2               /* Button padding */
.px-6.py-4               /* Table cell padding */

/* Borders & Shadows */
.rounded-md              /* Standard border radius */
.rounded-lg              /* Larger border radius */
.shadow                  /* Standard shadow */
.shadow-lg               /* Larger shadow */
.border.border-gray-300  /* Standard input border */
```

---

## Implementation Checklist

When creating a new app with this style:

- [ ] Install Tailwind CSS
- [ ] Add custom colors to `tailwind.config.js`
- [ ] Import Inter font (Google Fonts or local)
- [ ] Set body background to `ocean-cream`
- [ ] Create navigation bar with `ocean-teal` background
- [ ] Use consistent button styles (ocean-teal primary, gray secondary)
- [ ] Apply focus rings to all interactive elements (focus:ring-ocean-teal)
- [ ] Use white cards with shadow for content containers
- [ ] Implement consistent spacing (gap-6, space-y-6)
- [ ] Add hover transitions (transition-all duration-200)
- [ ] Use Heroicons for all iconography
- [ ] Test responsive layouts at 640px, 768px, 1024px breakpoints

---

**Design System Version:** 1.3.0
**Last Updated:** November 2025
**Based On:** Tea Tree Golf Club Membership Management System
