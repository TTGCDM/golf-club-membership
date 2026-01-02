import { forwardRef } from 'react'

/**
 * FormSelect Component
 * Select element with error styling
 * Use with react-hook-form register
 */

const FormSelect = forwardRef(({
  error,
  className = '',
  children,
  ...props
}, ref) => {
  const baseClasses = 'mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-ring focus:border-ring sm:text-sm'
  const errorClasses = error
    ? 'border-destructive focus:ring-destructive focus:border-destructive'
    : 'border-input'

  return (
    <select
      ref={ref}
      className={`${baseClasses} ${errorClasses} ${className}`}
      {...props}
    >
      {children}
    </select>
  )
})

FormSelect.displayName = 'FormSelect'

export default FormSelect
