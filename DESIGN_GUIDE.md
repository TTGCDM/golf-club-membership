# Design Guide - Tea Tree Golf Club Style

This document describes the visual design system, UI patterns, and styling conventions used in the Tea Tree Golf Club Membership Management System.

---

## Table of Contents

1. [Design System Overview](#design-system-overview)
2. [Color Palette](#color-palette)
3. [Typography](#typography)
4. [Component Library](#component-library)
5. [Layout & Spacing](#layout--spacing)
6. [Navigation](#navigation)
7. [Forms & Inputs](#forms--inputs)
8. [Buttons](#buttons)
9. [Cards & Containers](#cards--containers)
10. [States & Feedback](#states--feedback)
11. [Icons](#icons)
12. [Responsive Design](#responsive-design)

---

## Design System Overview

The Tea Tree Golf Club uses a modern component-based design system built on:

- **Shadcn/UI** - Accessible component primitives
- **Tailwind CSS** - Utility-first styling with CSS custom properties
- **Radix UI** - Underlying accessibility primitives
- **Class Variance Authority (CVA)** - Component variants

### Key Utilities

```javascript
// cn() - Class name merge utility
import { cn } from "@/lib/utils"

cn("base-class", condition && "conditional-class", className)
```

---

## Color Palette

### Semantic Color Tokens

The design system uses HSL-based CSS custom properties for theming:

```css
/* Core semantic colors */
--primary: 213 50% 15%;          /* Club Navy - Primary brand */
--primary-foreground: 0 0% 98%;

--secondary: 37 41% 86%;         /* Club Tan - Secondary surfaces */
--secondary-foreground: 213 50% 15%;

--accent: 213 50% 20%;           /* Accent interactions */
--accent-foreground: 0 0% 98%;

--success: 142 76% 36%;          /* Green - Positive states */
--success-foreground: 0 0% 100%;

--destructive: 0 72% 51%;        /* Red - Errors, negative values */
--destructive-foreground: 0 0% 98%;

--muted: 220 15% 96%;            /* Muted backgrounds */
--muted-foreground: 220 9% 46%;

--background: 0 0% 100%;         /* Page background */
--foreground: 224 71% 4%;        /* Text color */
```

### Club Brand Colors

```javascript
// tailwind.config.js
colors: {
  'club-navy': '#1a2744',
  'club-navy-dark': '#0f1729',
  'club-tan': '#d9c9a3',
  'club-tan-light': '#e8dfc9',
  'club-cream': '#f5f0e1',
  'club-red': '#8b2332',
}
```

### Semantic Color Usage

| Token | Usage |
|-------|-------|
| **primary** | Navigation, primary buttons, headings, links |
| **secondary** | Light backgrounds, card accents, subtle highlights |
| **success** | Positive values, paid status, confirmation states |
| **destructive** | Errors, negative balances, delete actions |
| **muted** | Disabled states, placeholder text, secondary info |

### Financial Color Conventions

```jsx
// Positive balance (credit/paid)
<span className="text-success font-medium">$150.00</span>

// Negative balance (owes/outstanding)
<span className="text-destructive font-medium">-$75.00</span>

// Neutral/zero balance
<span className="text-foreground">$0.00</span>
```

---

## Typography

### Font Family

```css
font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont,
             'Segoe UI', 'Roboto', 'sans-serif'
```

### Font Weights

- **Regular (400):** Body text, labels
- **Medium (500):** Subheadings, emphasized text
- **Semibold (600):** Navigation items, table headers
- **Bold (700):** Headings, important metrics

### Heading Hierarchy

```jsx
<h1 className="text-3xl font-bold text-foreground mb-6">
  Page Title
</h1>

<h2 className="text-lg font-semibold text-foreground mb-4">
  Section Heading
</h2>

<h3 className="text-base font-semibold text-foreground mb-2">
  Subsection Heading
</h3>
```

### Text Styles

```jsx
// Description text
<p className="text-muted-foreground mb-6">
  Descriptive text goes here
</p>

// Small labels
<p className="text-sm font-medium text-foreground">
  Label text
</p>

// Helper text
<p className="text-xs text-muted-foreground mt-1">
  Helper or secondary info
</p>
```

---

## Component Library

### Shadcn/UI Components

The project includes 27 pre-built accessible components in `src/components/ui/`:

| Component | Usage |
|-----------|-------|
| `Button` | Primary actions, with variants (default, destructive, outline, ghost) |
| `Input` | Text input fields |
| `Select` | Dropdown selection |
| `Checkbox` | Toggle options |
| `Label` | Form labels |
| `Card` | Content containers |
| `Table` | Data display |
| `Badge` | Status indicators |
| `Tabs` | Tabbed navigation |
| `Dialog` | Modal dialogs |
| `DropdownMenu` | Action menus |
| `Command` | Command palette |

### Using Shadcn Components

```jsx
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" placeholder="you@example.com" />
  <Button type="submit">Submit</Button>
</div>
```

### Custom Form Wrappers

For react-hook-form integration, use the custom wrappers:

```jsx
import { FormField, FormInput, FormSelect } from '@/components/form'

<FormField label="Name" name="name" error={errors.name?.message} required>
  <FormInput {...register('name')} error={errors.name?.message} />
</FormField>
```

---

## Layout & Spacing

### Container Pattern

```jsx
<div className="min-h-screen bg-background">
  <nav className="bg-primary text-primary-foreground shadow-lg">
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

| Usage | Class | Value |
|-------|-------|-------|
| Tight spacing | `space-y-2` | 0.5rem (8px) |
| Normal spacing | `space-y-4` | 1rem (16px) |
| Section spacing | `space-y-6` | 1.5rem (24px) |
| Page padding | `p-6` | 1.5rem (24px) |
| Component gap | `gap-4` or `gap-6` | 1-1.5rem |

### Grid Layouts

```jsx
// Two columns
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">

// Three columns
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">

// Statistics dashboard
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
```

---

## Navigation

### Top Navigation Bar

```jsx
<nav className="bg-primary text-primary-foreground shadow-lg">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex justify-between h-16">
      <div className="flex items-center">
        <h1 className="text-xl font-bold">Tea Tree Golf Club</h1>
      </div>
      <div className="hidden sm:flex sm:space-x-2">
        {/* Navigation links */}
      </div>
    </div>
  </div>
</nav>
```

### Navigation Link States

```jsx
const isActive = (path) => location.pathname === path

<Link
  to="/path"
  className={cn(
    "px-4 py-3 rounded-md text-base font-semibold transition-all duration-200",
    isActive('/path')
      ? 'bg-white text-primary'
      : 'bg-primary/60 text-white hover:bg-white hover:text-primary'
  )}
>
  Link Text
</Link>
```

---

## Forms & Inputs

### Using Form Wrappers

```jsx
import { FormField, FormInput, FormSelect } from '@/components/form'

<form className="space-y-6">
  <FormField
    label="Email Address"
    name="email"
    error={errors.email?.message}
    required
  >
    <FormInput
      type="email"
      {...register('email')}
      error={errors.email?.message}
    />
  </FormField>

  <FormField label="Category" name="category">
    <FormSelect {...register('category')}>
      <option value="">Select...</option>
      <option value="1">Full Member</option>
    </FormSelect>
  </FormField>
</form>
```

### Form Field Styling

Form wrappers use semantic tokens:

- **Normal state:** `border-input`
- **Error state:** `border-destructive`
- **Focus state:** `focus:ring-ring focus:border-ring`
- **Label text:** `text-foreground`
- **Error text:** `text-destructive`
- **Help text:** `text-muted-foreground`

---

## Buttons

### Using Button Component

```jsx
import { Button } from "@/components/ui/button"

// Primary (default)
<Button>Save Changes</Button>

// Destructive
<Button variant="destructive">Delete</Button>

// Outline
<Button variant="outline">Cancel</Button>

// Ghost (text-only)
<Button variant="ghost">Link</Button>

// With loading state
<Button disabled={isLoading}>
  {isLoading ? 'Saving...' : 'Save'}
</Button>
```

### Button Variants

| Variant | Usage |
|---------|-------|
| `default` | Primary actions (save, submit, confirm) |
| `destructive` | Delete, remove, dangerous actions |
| `outline` | Secondary actions (cancel, back) |
| `ghost` | Tertiary actions, links |
| `secondary` | Alternative primary actions |

### Custom Button Patterns

```jsx
// Full width button
<Button className="w-full">Sign In</Button>

// Icon button
<Button size="icon">
  <PlusIcon className="h-4 w-4" />
</Button>

// With icon
<Button>
  <PlusIcon className="h-4 w-4 mr-2" />
  Add Member
</Button>
```

---

## Cards & Containers

### Using Card Component

```jsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Optional description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Main content */}
  </CardContent>
  <CardFooter>
    {/* Actions */}
  </CardFooter>
</Card>
```

### Statistics Card

```jsx
<Card>
  <CardContent className="pt-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Total Members</p>
        <p className="text-3xl font-bold text-foreground mt-2">248</p>
      </div>
      <div className="h-12 w-12 bg-secondary rounded-full flex items-center justify-center">
        <UsersIcon className="h-6 w-6 text-primary" />
      </div>
    </div>
  </CardContent>
</Card>
```

### Success/Positive Card

```jsx
<div className="bg-success/10 border border-success/30 rounded-lg p-4">
  <p className="text-sm font-medium text-success">Title</p>
  <p className="text-3xl font-bold text-success">$12,345</p>
</div>
```

---

## States & Feedback

### Success Message

```jsx
<div className="bg-success/10 border border-success/30 rounded-md p-4">
  <p className="text-success font-medium">Operation completed successfully!</p>
</div>
```

### Error Message

```jsx
<div className="bg-destructive/10 border border-destructive/30 rounded-md p-4">
  <p className="text-destructive">Error message text</p>
</div>
```

### Warning Message

```jsx
<div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
  <p className="text-yellow-800">Warning message text</p>
</div>
```

### Badge Status Indicators

```jsx
import { Badge } from "@/components/ui/badge"

<Badge>Active</Badge>
<Badge variant="destructive">Overdue</Badge>
<Badge variant="outline">Pending</Badge>
<Badge variant="secondary">Inactive</Badge>
```

### Loading State

```jsx
<div className="flex items-center justify-center py-8">
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  <span className="ml-2 text-muted-foreground">Loading...</span>
</div>
```

---

## Icons

The application uses **Heroicons** (outline style).

### Icon in Button

```jsx
<Button>
  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
  Add New
</Button>
```

### Icon Sizes

| Size | Class | Usage |
|------|-------|-------|
| Small | `h-4 w-4` | Inline with text |
| Medium | `h-5 w-5` | Buttons, list items |
| Large | `h-6 w-6` | Card icons |
| Extra Large | `h-8 w-8` | Feature icons |

---

## Responsive Design

### Breakpoints (Tailwind defaults)

| Breakpoint | Width | Usage |
|------------|-------|-------|
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablets |
| `lg` | 1024px | Laptops |
| `xl` | 1280px | Desktops |

### Common Patterns

```jsx
// Stack on mobile, grid on desktop
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">

// Hide on mobile, show on desktop
<div className="hidden sm:flex">

// Responsive padding
<div className="px-4 sm:px-6 lg:px-8">

// Responsive text
<h1 className="text-2xl md:text-3xl lg:text-4xl">
```

---

## Quick Reference

### Common Class Patterns

```css
/* Backgrounds */
.bg-background           /* Page background */
.bg-primary              /* Primary actions, nav */
.bg-secondary            /* Light accents */
.bg-card                 /* Card surfaces */

/* Text Colors */
.text-primary            /* Links, emphasis */
.text-foreground         /* Primary text */
.text-muted-foreground   /* Secondary text */
.text-success            /* Positive values */
.text-destructive        /* Errors, negative */

/* Borders */
.border-input            /* Form inputs */
.border-border           /* Standard borders */
.border-success/30       /* Success state */
.border-destructive/30   /* Error state */

/* Focus */
.focus:ring-ring         /* Focus indicator */
```

---

## Implementation Checklist

When maintaining or extending this design system:

- [ ] Use semantic color tokens (primary, success, destructive) not raw colors
- [ ] Import Shadcn components from `@/components/ui`
- [ ] Use `cn()` utility for conditional classes
- [ ] Apply consistent spacing (gap-4, gap-6, space-y-4)
- [ ] Include hover/focus states on interactive elements
- [ ] Test responsive layouts at all breakpoints
- [ ] Use FormField/FormInput wrappers for forms
- [ ] Follow financial color conventions (success = paid, destructive = owes)

---

**Design System Version:** 2.0.0
**Last Updated:** January 2026
**Based On:** Tea Tree Golf Club Membership Management System
