import { forwardRef } from 'react'

/**
 * FormInput Component
 * Input element with error styling
 * Use with react-hook-form register
 */

const FormInput = forwardRef(({
  type = 'text',
  error,
  className = '',
  ...props
}, ref) => {
  const baseClasses = 'mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-ring focus:border-ring sm:text-sm'
  const errorClasses = error
    ? 'border-destructive focus:ring-destructive focus:border-destructive'
    : 'border-input'

  return (
    <input
      ref={ref}
      type={type}
      className={`${baseClasses} ${errorClasses} ${className}`}
      {...props}
    />
  )
})

FormInput.displayName = 'FormInput'

export default FormInput
