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
  const baseClasses = 'mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-ocean-teal focus:border-ocean-teal sm:text-sm'
  const errorClasses = error
    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
    : 'border-gray-300'

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
